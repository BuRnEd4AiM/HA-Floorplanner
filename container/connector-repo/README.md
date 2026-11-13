# 3D Floorplan Connector (for Home Assistant Container)

The Home Assistant integration **3D Floorplan (Container)** for [3D Floorplan](https://github.com/BuRnEd4AiM/HA-Floorplanner) when Home Assistant runs as a plain Docker container ("Home Assistant Container", no add-on store). It serves the 3D Floorplan container on Home Assistant's own address (`http://<Home Assistant>:8123/floorplan/`) without a second login, and brings the dashboard card `custom:floorplan3d-container-card`.

Home Assistant OS and Supervised do **not** need this: they use the add-on and its card (in HACS: *3D Floorplan Card*).

This repository is only the package for HACS. It is filled automatically from every release of [HA-Floorplanner](https://github.com/BuRnEd4AiM/HA-Floorplanner/releases), with the same version number; the code, the issues and the full guide are there.

## Install

1. **The container first:** set up 3D Floorplan as a Docker container and check that its own page works at `http://<computer>:8100` ([guide](https://github.com/BuRnEd4AiM/HA-Floorplanner/blob/main/container/README.md); the image is ready-made: `ghcr.io/burned4aim/floorplan3d`).
2. **HACS:** HACS → ⋮ → **Custom repositories** → `https://github.com/BuRnEd4AiM/HA-Floorplanner-Connector`, type **Integration** → **Add**. Then search for **3D Floorplan Connector** → **Download**.
3. **Restart Home Assistant** once.
4. **Settings → Devices & services → Add integration → 3D Floorplan (Container)**. Enter the container's address as Home Assistant reaches it, for example `http://192.168.1.10:8100`.
5. Open `http://<Home Assistant>:8123/floorplan/`, or add the card to a dashboard: `type: custom:floorplan3d-container-card`.

Without HACS: every [release of HA-Floorplanner](https://github.com/BuRnEd4AiM/HA-Floorplanner/releases) has `floorplan3d-connector.zip` (and its SHA-256): unpack it in Home Assistant's configuration folder, so that `config/custom_components/floorplan3d/` exists, then go on with step 3.

## Example: Home Assistant and 3D Floorplan in one compose file

Both containers in one `docker-compose.yml`, nothing to build; `docker compose pull && docker compose up -d` updates both. Replace `192.168.1.10` with the address of the computer that runs Docker (Home Assistant runs in the host network, so the 3D Floorplan container reaches it there), and enter `http://192.168.1.10:8100` in step 4 above. All settings: [guide](https://github.com/BuRnEd4AiM/HA-Floorplanner/blob/main/container/README.md#settings-environment-variables).

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

## Update

HACS offers every new version. **Container and integration belong together** (same version): update both, the container with `docker compose pull && docker compose up -d` and the integration in HACS (then restart Home Assistant). If they differ, **Settings → Repairs** says which one to update, and the page's version pill (✓ v… at the top) shows both.

**Beta:** with the beta container (`ghcr.io/burned4aim/floorplan3d:beta`) switch on the pre-releases of this integration in HACS: Settings → Devices & services → HACS → the entity **Pre-release** of *3D Floorplan Connector* → on.

## Remove

Settings → Devices & services → 3D Floorplan (Container) → Delete, then remove it in HACS and restart Home Assistant. Remove the card from your dashboards first.

License: GPL-3.0-or-later, like HA-Floorplanner. The integration was written by [@aixmoyu](https://github.com/aixmoyu) (#601).
