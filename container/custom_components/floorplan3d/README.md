# 3D Floorplan (Container): the floor plan on Home Assistant's own address

For **Home Assistant Container** (Docker, without the Supervisor) only. Home Assistant OS and Supervised use the add-on and its card `custom:floorplan3d-card`; they do not need this.

The 3D Floorplan container ([`container/README.md`](../../README.md)) normally runs on its own address (`http://<computer>:8100`) with its own login. This optional Home Assistant integration (written by @aixmoyu, #601) serves it on Home Assistant's own address instead:

```text
http://<Home Assistant>:8123/floorplan/
```

- **No second login:** the integration signs the browser in with the Home Assistant user who is already logged in.
- **A dashboard card that comes with it:** `custom:floorplan3d-container-card`, with the same options as the add-on's card (title, house, floor, room, view, theme, quality, walls, labels, heatmap, night, alerts, idle_return, room_panel, show_nav, show_bar, tabs, kiosk, height, fill) and a visual editor.
- It works at every address Home Assistant itself is reachable at (LAN, reverse proxy, Nabu Casa, Tailscale), and always on the same origin as the dashboard, so there are no iframe, cookie or mixed-content problems.

## Install

1. Set up the container first and check that its own login works at `http://<computer>:8100` ([`container/README.md`](../../README.md); it needs `HA_TOKEN`).
2. Copy this folder to Home Assistant's configuration folder, so that it is `config/custom_components/floorplan3d/` (with `__init__.py` directly inside). HACS cannot install it: the repository's HACS entry is the dashboard card.
3. Restart Home Assistant once (so it finds the new folder).
4. **Settings → Devices & services → Add integration → 3D Floorplan (Container)**. Enter the container's address as Home Assistant can reach it, for example `http://192.168.1.10:8100`. The dialog checks the address against the container's login.
5. Open `http://<Home Assistant>:8123/floorplan/`, or add the card to a dashboard (it is in the card picker; nothing to copy to `config/www`, no resource to add):

   ```yaml
   type: custom:floorplan3d-container-card
   ```

To change the address later: the integration's ⋮ menu → **Reconfigure**.

## Good to know

- **Opening `/floorplan/` directly** (not in the card) signs in with the token Home Assistant's frontend keeps in this browser. That token is only kept when **"Keep me logged in"** was ticked at Home Assistant's login. Otherwise the page says "Not signed in to Home Assistant": use the card, or log in to Home Assistant again with the tick.
- **`APP_URL` in the container:** leave it empty, or set it to the address Home Assistant uses for the container. Otherwise the container's login announces another address and the integration refuses it.
- **Who may see and edit** stays as in the container: every Home Assistant user may look; administrators and the users in `EDITORS` may edit.
- **Security:** `/floorplan/` is reachable for everybody who can reach Home Assistant (also from the internet, if Home Assistant is). It is protected twice: the integration passes nothing to the container without the container's login cookie, and the container checks that cookie itself. The Home Assistant token of the browser never goes to the container. The container already holds an administrator's token (`HA_TOKEN`), so only use a container you trust.
- The integration uses Home Assistant's internal function `auth.create_auth_code`. If a future Home Assistant changes it, the sign-in says so in Home Assistant's log ("did not create an authorization code"); please open an issue.
- The address `/floorplan` is fixed, and one container per Home Assistant.

## Remove

Settings → Devices & services → 3D Floorplan (Container) → Delete, then delete `config/custom_components/floorplan3d/` and restart Home Assistant. The card disappears with it; remove it from your dashboards first.
