# 3D Floorplan for Home Assistant Container (Docker, without the Supervisor)

Home Assistant OS and Supervised install 3D Floorplan from the add-on (app) store. **Home Assistant Container** (Home Assistant as a plain Docker container) has no add-on store, so 3D Floorplan runs as a second container next to it (#489). The program is the same, with three differences:

- It has **its own address** (for example `http://192.168.1.10:8100`) instead of a page in Home Assistant's sidebar. You can add it to the sidebar as a *Webpage* dashboard (see below).
- Whoever opens it **logs in with their Home Assistant user** (Home Assistant's own login page). Home Assistant administrators may edit, plus the users named in `EDITORS`; everybody else gets the live view, as in the add-on. The login lasts 30 days, and every visit extends it, so a wall tablet stays logged in.
- The dashboard card `custom:floorplan3d-card` needs the Supervisor and does not work with this version. Use a *Webpage* dashboard or a *Webpage* card with the page's address instead (`?kiosk=1` at the end hides the editing tools).

## Set it up

1. **Make a token.** In Home Assistant, log in as an **administrator**, open your profile (your name at the bottom left), go to **Security** and under **Long-lived access tokens** press **Create token**. Copy the token: Home Assistant shows it only once.
   The add-on works with this token. Use an administrator's token, because with it the add-on can read who the administrators are and can make counters (helpers) for the energy page.
2. **Get the compose file.** Copy [`docker-compose.yml`](docker-compose.yml) to a folder on the computer that runs Docker. Set `HA_URL` to your Home Assistant address and `HA_TOKEN` to the token. Set `TZ` to your time zone.
3. **Start it:**
   ```sh
   docker compose up -d --build
   ```
   Docker builds the image from this repository (a minute or two the first time).
4. **Open it.** Go to `http://<this computer>:8100`. Home Assistant's login page opens. Log in, and you are back at the floor plan.
5. **In the sidebar (optional).** In Home Assistant go to **Settings → Dashboards → Add dashboard → Webpage**. Enter the same address (`http://<this computer>:8100`).

Without compose:

```sh
git clone https://github.com/BuRnEd4AiM/HA-Floorplanner.git
cd HA-Floorplanner
docker build -f container/Dockerfile -t floorplan3d .
docker run -d --name floorplan3d --restart unless-stopped -p 8100:8099 \
  -e HA_URL=http://192.168.1.10:8123 -e HA_TOKEN=<token> -e TZ=Europe/Berlin \
  -v floorplan3d-data:/data floorplan3d
```

**Update:** `docker compose build --pull && docker compose up -d`. With `docker run`, run `git pull`, then build and start it again. The version pill in the top bar shows when a new version is out.

## Settings (environment variables)

| Variable | What for | Example |
| --- | --- | --- |
| `HA_URL` | Home Assistant's address, as this container reaches it (required) | `http://192.168.1.10:8123`, `http://homeassistant:8123` |
| `HA_TOKEN` | a long-lived access token of an administrator (required) | |
| `TZ` | your time zone (for the timeline and the calendar) | `Europe/Berlin` |
| `EDITORS` | who may edit besides the administrators: login names, separated by commas | `anna,ben` |
| `HA_PUBLIC_URL` | Home Assistant's address for the browser, only if it differs from `HA_URL` and is not just the same computer under another name | `https://ha.example.org` |
| `APP_URL` | this page's address, only behind a reverse proxy or in a sub-folder | `https://plan.example.org/` |
| `LOG_LEVEL` | how much goes into the log | `info` (default), `debug` |
| `PORT` | the port inside the container | `8099` (default) |

If `HA_URL` is a name that only Docker knows (`http://homeassistant:8123`, `http://localhost:8123`), the browser is sent to Home Assistant's login on the computer it opened the page with, at Home Assistant's port. In that case the browser must reach Home Assistant at `http://<that computer>:8123`. If it does not, set `HA_PUBLIC_URL`.

Everything the add-on keeps is in the volume `/data`: plans, settings, models, pictures, and the automatic backups (`/data/addon_config/backups`). Home Assistant's own backups do not include it, so back up this folder too, or download a backup in the app (⚙ → *Backup & security*).

## When it does not work

- **Home Assistant's login says "Invalid redirect URI" or "Invalid client id":** Home Assistant only sends the login back to the address the page was opened with. Behind a reverse proxy, set `APP_URL` to the address the browser uses.
- **The login keeps starting again inside the Webpage dashboard:** the browser does not hand the login to the embedded page when Home Assistant and the page are on different hosts (for example `homeassistant.local` and an IP address). Open Home Assistant and the page under the same host name. Opening the page once in its own browser tab can also help.
- **Home Assistant uses `https` and the page uses `http`:** the browser blocks the page inside the dashboard. Put the page behind the same reverse proxy with `https` and set `APP_URL`.
- **Nobody may edit:** the token is not an administrator's. Make a new one as an administrator, or name the users in `EDITORS`.

**Security:** the token gives full control over Home Assistant. Keep the compose file private, and do not expose the page's port to the internet without `https`.
