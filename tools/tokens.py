#!/usr/bin/env python3
"""Counts the tokens Claude used for this project, in git, whichever account a session runs on.

Every Claude Code session gets its own file docs/tokens/<session>.json, so parallel sessions never conflict. The hook in
.claude/settings.json runs this script before every `git commit` Claude makes: it adds up the usage in the session's
transcript (with its helpers) and stages the file, so the count rides along in that commit. Tokens used after a session's
last commit are not counted. After every merge, the workflow .github/workflows/tokens.yml adds all files up into
docs/TOKENS.md.

    python3 tools/tokens.py --hook   # used by the hook: reads the hook input (JSON) from stdin
    python3 tools/tokens.py --now    # count the running session by hand and stage its file
    python3 tools/tokens.py          # rewrite docs/TOKENS.md from docs/tokens/*.json (the workflow does this on main)
"""
import datetime
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIR = ROOT / "docs" / "tokens"
SUMMARY = ROOT / "docs" / "TOKENS.md"
FIELDS = ("input", "cache_write", "cache_read", "output")
USAGE_KEYS = {"input": "input_tokens", "cache_write": "cache_creation_input_tokens",
              "cache_read": "cache_read_input_tokens", "output": "output_tokens"}
COMMIT = re.compile(r"(?:^|[\s;&|(])git\s+(?:-[Cc]\s+\S+\s+|--?[\w-]+(?:=\S+)?\s+)*commit(?![\w-])")
SOURCES = {"counted": "gezählt", "session list": "Sitzungsliste", "estimate": "geschätzt"}


def is_commit(command):
    return bool(COMMIT.search(command or ""))


def total(rec):
    return sum(rec.get(f, 0) for f in FIELDS)


def count(lines):
    """Usage of transcript lines: (totals, {model: totals}, first timestamp). A reply is logged once per content block,
    always with the same usage, so every message id counts once."""
    seen, first = {}, None
    for line in lines:
        try:
            d = json.loads(line)
        except ValueError:
            continue
        first = first or d.get("timestamp")
        msg = d.get("message")
        if d.get("type") != "assistant" or not isinstance(msg, dict) or not isinstance(msg.get("usage"), dict):
            continue
        model = msg.get("model") or "?"
        if model == "<synthetic>":
            continue
        key = msg.get("id") or d.get("requestId") or d.get("uuid")
        u = {f: int(msg["usage"].get(k) or 0) for f, k in USAGE_KEYS.items()}
        old = seen.get(key)
        seen[key] = (model, {f: max(u[f], old[1][f]) for f in FIELDS} if old else u)
    totals, models = dict.fromkeys(FIELDS, 0), {}
    for model, u in seen.values():
        m = models.setdefault(model, dict.fromkeys(FIELDS, 0) | {"requests": 0})
        m["requests"] += 1
        for f in FIELDS:
            totals[f] += u[f]
            m[f] += u[f]
    return totals, models, first


def transcripts(path):
    """The session's transcript and those of its helpers (subagents), which are kept next to it."""
    path = Path(path)
    return [path] + sorted((path.parent / path.stem).rglob("*.jsonl"))


def session_name(hook_session=None):
    remote = os.environ.get("CLAUDE_CODE_REMOTE_SESSION_ID", "")
    if remote.startswith("cse_"):          # cloud session: the same name as in the "Claude-Session:" lines of the commits
        return "session_" + remote[4:]
    return hook_session or os.environ.get("CLAUDE_CODE_SESSION_ID") or "unknown"


def branch():
    r = subprocess.run(["git", "-C", str(ROOT), "branch", "--show-current"], capture_output=True, text=True)
    return r.stdout.strip()


def record(name, transcript, now=None):
    """Write docs/tokens/<name>.json for the session and return its path. A count never goes down (after a restart the
    transcript can be shorter than what an earlier commit already counted)."""
    lines = []
    for p in transcripts(transcript):
        lines += p.read_text(encoding="utf-8", errors="replace").splitlines()
    totals, models, first = count(lines)
    path = DIR / f"{name}.json"
    old = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    if total(old) > total(totals):
        return path
    rec = {"session": name, "start": (old.get("start") or first or "")[:10],
           "updated": now or datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "branch": branch() or old.get("branch", ""), "source": "counted", **totals, "models": models}
    if old.get("title"):
        rec["title"] = old["title"]
    DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(rec, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    return path


def stage(path):
    subprocess.run(["git", "-C", str(ROOT), "add", str(path.relative_to(ROOT))], capture_output=True)


def hook(data):
    if data.get("tool_name") != "Bash" or not is_commit((data.get("tool_input") or {}).get("command")):
        return
    cwd = Path(data.get("cwd") or ROOT).resolve()
    if cwd != ROOT and ROOT not in cwd.parents:   # a commit in another repository
        return
    if data.get("transcript_path") and Path(data["transcript_path"]).exists():
        stage(record(session_name(data.get("session_id")), data["transcript_path"]))


def find_transcript():
    projects = Path.home() / ".claude" / "projects"
    sid = os.environ.get("CLAUDE_CODE_SESSION_ID")
    hits = sorted(projects.glob(f"*/{sid}.jsonl")) if sid else []
    if not hits:
        hits = sorted(projects.glob(re.sub(r"[^A-Za-z0-9]", "-", str(ROOT)) + "/*.jsonl"), key=lambda p: p.stat().st_mtime)
    return hits[-1] if hits else None


def fmt(n):
    for size, unit, digits in ((1e9, "Mrd.", 2), (1e6, "Mio.", 1), (1e3, "Tsd.", 0)):
        if n >= size:   # German style: 1.234,5
            return f"{n / size:,.{digits}f}".replace(",", "_").replace(".", ",").replace("_", ".") + " " + unit
    return str(n)


def load(folder=DIR):
    return [json.loads(p.read_text(encoding="utf-8")) for p in sorted(Path(folder).glob("*.json"))]


def summary(recs, today=None):
    today = today or datetime.date.today().isoformat()
    sessions = sum(r.get("sessions", 1) for r in recs)
    sums = {f: sum(r.get(f, 0) for r in recs) for f in FIELDS}
    guessed = sum(total(r) for r in recs if r.get("source") == "estimate")
    out = ["# Token-Verbrauch von Claude", "",
           "<!-- Wird von tools/tokens.py erzeugt (Workflow „Token count“ nach jedem Merge). Nicht von Hand ändern. -->", "",
           f"Stand: {today} · {sessions} Sitzungen", "",
           f"**Insgesamt: {fmt(sum(sums.values()))} Tokens**" + (f" (davon {fmt(guessed)} geschätzt)" if guessed else ""), "",
           "| | Tokens | Was ist das? |", "|---|---:|---|",
           f"| Geschrieben | {fmt(sums['output'])} | Text, Code und Nachdenken, das Claude neu geschrieben hat |",
           f"| Neu gelesen | {fmt(sums['input'] + sums['cache_write'])} | Nachrichten, Dateien und Ausgaben, die zum ersten Mal ins Gespräch kamen |",
           f"| Wieder gelesen | {fmt(sums['cache_read'])} | das bisherige Gespräch, das Claude bei jedem Schritt noch einmal liest (die meisten Tokens, aber billig) |",
           "", "Jede Sitzung schreibt ihre Zahlen bei jedem `git commit` in `docs/tokens/` (egal mit welchem Zugang). "
           "Was nach dem letzten Commit einer Sitzung noch verbraucht wird, fehlt; die Zahl ist also eher zu klein.", "",
           "## Pro Monat", "", "| Monat | Sitzungen | Tokens | davon geschrieben |", "|---|---:|---:|---:|"]
    months = {}
    for r in recs:
        m = months.setdefault("geschätzt" if r.get("source") == "estimate" else (r.get("start") or "?")[:7], [0, 0, 0])
        m[0] += r.get("sessions", 1)
        m[1] += total(r)
        m[2] += r.get("output", 0)
    out += [f"| {k} | {n} | {fmt(t)} | {fmt(o)} |" for k, (n, t, o) in sorted(months.items(), key=lambda kv: (kv[0][0].isdigit(), kv[0]), reverse=True)]
    out += ["", "## Pro Sitzung (neueste zuerst)", "", "| Beginn | Sitzung | Worum es ging | Tokens | davon geschrieben | Quelle |",
            "|---|---|---|---:|---:|---|"]
    for r in sorted(recs, key=lambda r: (r.get("start", ""), r.get("updated", "")), reverse=True):
        s = r["session"]
        link = f"[{s[8:16]}…](https://claude.ai/code/{s})" if s.startswith("session_") else s
        what = (r.get("title") or r.get("branch") or "").replace("|", "/")
        if r.get("sessions", 1) > 1:
            what = f"{r['sessions']} Sitzungen: {what}"
        out.append(f"| {r.get('start', '')} | {link} | {what} | {fmt(total(r))} | {fmt(r.get('output', 0))} | "
                   f"{SOURCES.get(r.get('source'), r.get('source', ''))} |")
    return "\n".join(out) + "\n"


def main(args):
    if "--hook" in args:
        try:
            hook(json.load(sys.stdin))
        except Exception as e:  # never stop a commit because of the count
            print(f"tokens.py: {e}", file=sys.stderr)
        return 0
    if "--now" in args:
        t = find_transcript()
        if not t:
            print("no transcript found", file=sys.stderr)
            return 1
        path = record(session_name(), t)
        stage(path)
        rec = json.loads(path.read_text(encoding="utf-8"))
        print(f"{path.relative_to(ROOT)}: {fmt(total(rec))} Tokens, davon {fmt(rec['output'])} geschrieben")
        return 0
    SUMMARY.write_text(summary(load()), encoding="utf-8")
    print(f"{SUMMARY.relative_to(ROOT)} written")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
