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

## Update

HACS offers every new version. **Container and integration belong together** (same version): update both, the container with `docker compose pull && docker compose up -d` and the integration in HACS (then restart Home Assistant). If they differ, **Settings → Repairs** says which one to update, and the page's version pill (✓ v… at the top) shows both.

**Beta:** with the beta container (`ghcr.io/burned4aim/floorplan3d:beta`) switch on the pre-releases of this integration in HACS: Settings → Devices & services → HACS → the entity **Pre-release** of *3D Floorplan Connector* → on.

## Remove

Settings → Devices & services → 3D Floorplan (Container) → Delete, then remove it in HACS and restart Home Assistant. Remove the card from your dashboards first.

License: GPL-3.0-or-later, like HA-Floorplanner. The integration was written by [@aixmoyu](https://github.com/aixmoyu) (#601).
