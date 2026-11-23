"""📸 The add-on's own Telegram bot (5.16.0, the owner's choice 2026-11-17): CallMeBot can only send text to Telegram, a bot of one's own
(made once with @BotFather) sends text and pictures straight from the add-on. The key of the bot stays in the add-on (notify.json); the
chats are found by what was written to the bot (getUpdates): the owner writes "Hallo" to it once, the add-on lists that chat.

5.32.1 (the owner, 2026-11-23: "kann man da den Schlüssel des Bots nicht richtig einfügen"): the key is found inside whatever was pasted
(the whole message of BotFather, invisible marks of the copy); "Chat finden" names why Telegram said no (a wrong key, the bot already read
by another program such as Home Assistant's Telegram integration).

The base of the API is TELEGRAM_API (server.py; the browser test's stand-in). check_token is pure (unit test: tests/test_tgbot.py)."""
import re

import aiohttp

TOKEN = re.compile(r"^[0-9]{5,12}:[A-Za-z0-9_-]{30,64}$")
IN_TEXT = re.compile(r"(?<![0-9A-Za-z_-])([0-9]{5,12}:[A-Za-z0-9_-]{30,64})(?![A-Za-z0-9_-])")   # the key inside a pasted message
INVISIBLE = re.compile("[\u00ad\u200b-\u200f\u2028-\u202f\u2060-\u2064\ufeff]")           # marks a copy can carry
CHAT = re.compile(r"^-?[0-9]{1,20}$|^@[A-Za-z0-9_]{5,32}$")
CAPTION = 1000        # Telegram takes up to 1024 characters under a picture


def check_token(v) -> str:
    """the key of a bot ("123456:ABC…"), also found inside a longer pasted text (BotFather's whole message), '' when there is none"""
    v = INVISIBLE.sub("", v).strip() if isinstance(v, str) else ""
    if TOKEN.match(v):
        return v
    m = IN_TEXT.findall(v)
    return m[0] if len(m) == 1 else ""


def why_not(err: str) -> str:
    """what Telegram's answer means, as a short word the page explains: 'unauthorized' (no such key), 'conflict' (another program reads
    the bot's messages, e.g. Home Assistant's Telegram integration), else the answer itself"""
    e = str(err or "")
    if re.search(r"Telegram (401|404)\b|Unauthorized|Not Found", e):
        return "unauthorized"
    if re.search(r"Telegram 409\b|Conflict", e):
        return "conflict"
    return e


def chats_of(v) -> list:
    """the chats to send to: [{id, name}], each once, at most 5"""
    out = []
    for c in v if isinstance(v, list) else []:
        cid = str(c.get("id") if isinstance(c, dict) else c).strip()
        if CHAT.match(cid) and cid not in [x["id"] for x in out]:
            name = str(c.get("name") or "")[:60] if isinstance(c, dict) else ""
            out.append({"id": cid, "name": name})
    return out[:5]


def updates_chats(result) -> list:
    """the chats in the answer of getUpdates (who wrote to the bot, or a group it was added to): [{id, name}], newest first"""
    out = []
    for u in reversed(result if isinstance(result, list) else []):
        if not isinstance(u, dict):
            continue
        for key in ("message", "my_chat_member", "channel_post", "edited_message"):
            chat = (u.get(key) or {}).get("chat") if isinstance(u.get(key), dict) else None
            if isinstance(chat, dict) and chat.get("id") is not None:
                name = chat.get("title") or " ".join(x for x in (chat.get("first_name"), chat.get("last_name")) if x) or chat.get("username") or ""
                cid = str(chat["id"])
                if cid not in [x["id"] for x in out]:
                    out.append({"id": cid, "name": str(name)[:60]})
    return out[:10]


async def _call(s, base, token, method, data=None, form=None):
    url = f"{base}/bot{token}/{method}"
    async with s.post(url, data=form, json=None if form is not None else (data or {})) as r:
        try:
            body = await r.json(content_type=None)
        except ValueError:
            body = {}
        if r.status == 200 and isinstance(body, dict) and body.get("ok"):
            return True, body.get("result")
        why = body.get("description") if isinstance(body, dict) else None
        return False, f"Telegram {r.status}: {why or 'error'}"


async def send(base, token, chats, text, photos=()):
    """the message to every chat: with pictures the first carries the text under it; (ok, error)"""
    bad = []
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as s:
        for c in chats:
            if photos:
                for i, png in enumerate(photos):
                    form = aiohttp.FormData()
                    form.add_field("chat_id", c["id"])
                    if i == 0:
                        form.add_field("caption", text[:CAPTION])
                    form.add_field("photo", png, filename=f"alarm{i + 1}.{'jpg' if png[:2] == b'\xff\xd8' else 'png'}",
                                   content_type="image/jpeg" if png[:2] == b"\xff\xd8" else "image/png")
                    ok, err = await _call(s, base, token, "sendPhoto", form=form)
                    if not ok:
                        bad.append(f"{c['name'] or c['id']}: {err}")
                        if i == 0:                              # the picture did not go: the text alone
                            ok, err = await _call(s, base, token, "sendMessage", {"chat_id": c["id"], "text": text})
                        break
            else:
                ok, err = await _call(s, base, token, "sendMessage", {"chat_id": c["id"], "text": text})
                if not ok:
                    bad.append(f"{c['name'] or c['id']}: {err}")
    return (False, "; ".join(bad)) if bad else (True, None)


async def find_chats(base, token) -> tuple:
    """(chats who wrote to the bot, error): the bot's name too ({"bot": "@name"})"""
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as s:
        ok, me = await _call(s, base, token, "getMe")
        if not ok:
            return None, why_not(me)
        bot = f"@{me.get('username')}" if isinstance(me, dict) and me.get("username") else ""
        ok, res = await _call(s, base, token, "getUpdates", {"allowed_updates": ["message", "my_chat_member", "channel_post"]})
        if not ok:
            return {"bot": bot, "chats": [], "error": why_not(res)}, None   # the key is right; the chat can still be typed
        return {"bot": bot, "chats": updates_chats(res)}, None
