# Security policy

## Supported versions

Only the latest release receives fixes.

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Use GitHub's private reporting instead:
**Security → Report a vulnerability** in this repository. You will get an answer within a few days.

## How the add-on protects your Home Assistant

- The panel runs behind Home Assistant Ingress; there is no extra port or login.
- Only Home Assistant administrators (and users listed in `editors`) can edit; everybody else gets a read-only view, enforced in the backend (HTTP 403).
- The backend only forwards a fixed whitelist of services (`light`, `switch`, `cover`, `fan`, `media_player`, `climate`, `lock`, `scene`, `script`, `input_boolean`) with validated data.
- Camera pictures are fetched only for `camera.*` entities, only as jpeg / png / gif / webp (max. 8 MB), are never cached, and can be switched off in the settings.
- The only request to the outside is the check for a new version: the public `manifest.json` of this repository on GitHub is downloaded (in the edit mode every 5 minutes, and when you press *Check now*). Nothing about you or your house is sent; it can be switched off in ⚙.
- Backups (automatic or by hand) are plain JSON files in the add-on configuration folder, **not encrypted**; they contain your houses and settings, not your Home Assistant login.
- Uploaded 3D models are limited to 20 MB and are only ever served as data, never executed.
