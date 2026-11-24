"""🖼 Pictures in a notification of the Home Assistant app (5.35.0, the owner 2026-11-24: "bau das in HA nach, dass man, wenn man HA
betreibt, es auch über HA-Benachrichtigungen bekommen kann … weil nicht jeder hat Telegram"): the add-on puts the picture (a picture card)
into Home Assistant's media folder (media_source upload, POST /api/media_source/local_source/upload, as an administrator), and sends the
notify service of the Companion app (notify.mobile_app_…) `data: {image: /media/local/3d-floorplan/<file>}`. The app loads it with its
own login (not public; see the Companion docs "Notification attachments"). Only the last few pictures stay in the folder.

The pure part (names, which to remove); server.py does the uploading and the websocket (ha_media_put, ha_media_tidy). Unit test:
tests/test_hamedia.py."""
FOLDER = "3d-floorplan"                                          # media/local/3d-floorplan
FOLDER_ID = f"media-source://media_source/local/{FOLDER}"
KEEP = 12                                                        # the pictures kept in the folder (a phone may load one a little later)
PREFIX = "karte-"


def app_service(svc: str) -> bool:
    """a notify service of the Companion app: the only kind that shows a picture"""
    return isinstance(svc, str) and svc.startswith("mobile_app_")


def file_name(now: float, jpg: bool = False) -> str:
    """a new picture's name: the time in milliseconds (sorts by age), karte-1764000000000.png"""
    return f"{PREFIX}{int(now * 1000)}.{'jpg' if jpg else 'png'}"


def url(name: str) -> str:
    """what the app is given: Home Assistant's own address of the file (the app adds its login)"""
    return f"/media/local/{FOLDER}/{name}"   # an address of Home Assistant, not a folder of the add-on


def old(children, keep: int = KEEP) -> list:
    """the media ids to remove from what media_source/browse_media lists for the folder: the add-on's own pictures but the newest `keep`"""
    ours = sorted((c.get("media_content_id") for c in children or [] if isinstance(c, dict)
                   and str(c.get("media_content_id") or "").startswith(f"{FOLDER_ID}/{PREFIX}")), reverse=True)
    return ours[keep:]
