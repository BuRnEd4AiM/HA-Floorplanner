# 3D Floorplan for Home Assistant Container (Docker, without the Supervisor)

Home Assistant OS and Supervised install 3D Floorplan from the add-on (app) store. **Home Assistant Container** (Home Assistant as a plain Docker container) has no add-on store, so 3D Floorplan runs as a second container next to it (#489). The program is the same, with three differences:

- It has **its own address** (for example `http://192.168.1.10:8100`) instead of a page in Home Assistant's sidebar. You can add it to the sidebar as a *Webpage* dashboard (see below).
- Whoever opens it **logs in with their Home Assistant user** (Home Assistant's own login page). Home Assistant administrators may edit, plus the users named in `EDITORS`; everybody else gets the live view, as in the add-on. The login lasts 30 days, and every visit extends it, so a wall tablet stays logged in.
- The dashboard card `custom:floorplan3d-card` needs the Supervisor and does not work with this version. Instead, use the optional integration **3D Floorplan (Container)** ([`custom_components/floorplan3d`](custom_components/floorplan3d/README.md), #601; in HACS: *3D Floorplan Connector*): it serves the page on Home Assistant's own address (`http://<Home Assistant>:8123/floorplan/`) without a second login and brings its own card `custom:floorplan3d-container-card`. Or use a *Webpage* dashboard or a *Webpage* card with the page's address (`?kiosk=1` at the end hides the editing tools).

Both are ready-made with every release (#744): the **image** `ghcr.io/burned4aim/floorplan3d` (for amd64, arm64 and arm/v7: PCs, NAS boxes, Raspberry Pi), nothing to build, and the **integration** through HACS or as `floorplan3d-connector.zip` on the [release page](https://github.com/BuRnEd4AiM/HA-Floorplanner/releases). Both carry the same version number.

## Set it up

1. **Make a token.** In Home Assistant, log in as an **administrator**, open your profile (your name at the bottom left), go to **Security** and under **Long-lived access tokens** press **Create token**. Copy the token: Home Assistant shows it only once.
   The add-on works with this token. Use an administrator's token, because with it the add-on can read who the administrators are and can make counters (helpers) for the energy page.
2. **Get the compose file.** Copy [`docker-compose.yml`](docker-compose.yml) to a folder on the computer that runs Docker. Set `HA_URL` to your Home Assistant address and `HA_TOKEN` to the token. Set `TZ` to your time zone.
3. **Start it:**
   ```sh
   docker compose up -d
   ```
   Docker fetches the ready-made image `ghcr.io/burned4aim/floorplan3d:latest` (a few seconds; nothing is built).
4. **Open it.** Go to `http://<this computer>:8100`. Home Assistant's login page opens. Log in, and you are back at the floor plan.
5. **In the sidebar (optional).** In Home Assistant go to **Settings → Dashboards → Add dashboard → Webpage**. Enter the same address (`http://<this computer>:8100`).
6. **On Home Assistant's own address and as a dashboard card (optional).** Install the integration: in HACS → ⋮ → **Custom repositories** → `https://github.com/BuRnEd4AiM/HA-Floorplanner-Connector`, type **Integration**, then **3D Floorplan Connector** → **Download**; or unpack `floorplan3d-connector.zip` of the [release](https://github.com/BuRnEd4AiM/HA-Floorplanner/releases/latest) in Home Assistant's configuration folder. Restart Home Assistant once and add it under Settings → Devices & services ([all steps](custom_components/floorplan3d/README.md)). Then the page is at `http://<Home Assistant>:8123/floorplan/`, and as a Webpage dashboard use that address.

Without compose:

```sh
docker run -d --name floorplan3d --restart unless-stopped -p 8100:8099 \
  -e HA_URL=http://192.168.1.10:8123 -e HA_TOKEN=<token> -e TZ=Europe/Berlin \
  -v floorplan3d-data:/data ghcr.io/burned4aim/floorplan3d:latest
```

**Home Assistant in the same compose file** (#744, tested by aixmoyu on a real setup): one file for both, nothing to build, `docker compose pull && docker compose up -d` updates both. `192.168.1.10` is the address of the computer that runs Docker: Home Assistant runs in the host network, so the 3D Floorplan container reaches it there (not at `http://homeassistant:8123`). In the integration, enter `http://192.168.1.10:8100`.

```yaml
services:
  homeassistant:
    container_name: homeassistant
    image: ghcr.io/home-assistant/home-assistant:stable
    volumes:
      - ./homeassistant:/config
      - /etc/localtime:/etc/localtime:ro
      - /run/dbus:/run/dbus:ro
    restart: unless-stopped
    privileged: true
    network_mode: host

  floorplan3d:
    container_name: floorplan3d
    image: ghcr.io/burned4aim/floorplan3d:latest   # ":beta" for every new version at once
    restart: unless-stopped
    ports:
      - "8100:8099"
    environment:
      HA_URL: "http://192.168.1.10:8123"   # this computer's address (Home Assistant uses the host network)
      HA_TOKEN: "paste-your-token-here"    # long-lived access token of an administrator
      TZ: "Europe/Berlin"
    volumes:
      - ./floorplan3d-data:/data
```

**Build it yourself** (instead of the ready-made image): in `docker-compose.yml` put a `#` in front of `image:` and remove the ones in front of `build:`, `context:` and `dockerfile:`, then `docker compose up -d --build`. Or `git clone https://github.com/BuRnEd4AiM/HA-Floorplanner.git`, `cd HA-Floorplanner` and `docker build -f container/Dockerfile -t floorplan3d .` (a minute or two).

## Update

- **The container:** `docker compose pull && docker compose up -d` (with `docker run`: `docker pull ghcr.io/burned4aim/floorplan3d:latest`, then remove the container and start it again as above; your data stays in the volume). The version pill in the top bar shows when a new version is out.
- **The integration** (if you use it): HACS offers the update by itself; then restart Home Assistant. Without HACS: unpack the new `floorplan3d-connector.zip` over the old folder and restart Home Assistant.
- **Both belong together:** the container and the integration come out of the same release and have the same version. When they differ, Home Assistant says which one to update under **Settings → Repairs** (and in its log), and the version pill of the page opened through `/floorplan/` shows ⚠ with both versions. A login that fails or an error 502 right after an update is most often this.

**Which version (image tags):** `latest` is the normal version, `5.9.0` stays at that version, `5.9` gets the fixes of 5.9 only. A compose file with `latest` gets every released version with `docker compose pull`; an automatic updater (for example Watchtower) works with it too.

**Checksums:** every release has `floorplan3d-connector.zip.sha256` next to the zip: `sha256sum -c floorplan3d-connector.zip.sha256` checks the download. The page itself shows its version and the checksum of its files in the version pill (✓ v… · abc1234, tap it), and compares them with GitHub.

**Normal or Beta (5.2.0):** the image `latest` is the normal version: a new version comes only when it has been tested and released. To get every new version at once (to try new things early), use the beta: `image: ghcr.io/burned4aim/floorplan3d:beta` (or build it with `CHANNEL: beta` under `args:`). The top bar then says "Beta". With the integration from HACS, switch on its pre-releases too (Settings → Devices & services → HACS → the entity **Pre-release** of *3D Floorplan Connector*), so both stay at the same version. While a normal 3D Floorplan runs with the same Home Assistant (an add-on or another container), the beta switches nothing by itself (no heating rules, routines or messages) and shows **⏸ Beta paused**. Give a beta its own data folder (volume), not the one of the normal version.

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

- **Settings → Repairs says "3D Floorplan: update the container" or "… update the integration":** the two have different versions; see [Update](#update).
- **Home Assistant's login says "Invalid redirect URI" or "Invalid client id":** Home Assistant only sends the login back to the address the page was opened with. Behind a reverse proxy, set `APP_URL` to the address the browser uses.
- **The login keeps starting again inside the Webpage dashboard:** the browser does not hand the login to the embedded page when Home Assistant and the page are on different hosts (for example `homeassistant.local` and an IP address). Open Home Assistant and the page under the same host name. Opening the page once in its own browser tab can also help.
- **Home Assistant uses `https` and the page uses `http`:** the browser blocks the page inside the dashboard. Put the page behind the same reverse proxy with `https` and set `APP_URL`.
- **Nobody may edit:** the token is not an administrator's. Make a new one as an administrator, or name the users in `EDITORS`.

**Security:** the token gives full control over Home Assistant. Keep the compose file private, and do not expose the page's port to the internet without `https`.
