"""The Docker version without the Supervisor (container/, #489) keeps working when the add-on changes: the owner asked that it is never
forgotten. Each check names what a change in the add-on must also do for Docker; the CI job "container" builds and starts the image."""
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
APP = ROOT / "floorplan3d" / "rootfs" / "app"
SERVER = (APP / "server.py").read_text("utf-8")


def packages(dockerfile: Path) -> set:
    return {p for line in re.findall(r"apk add --no-cache ([^\n]+)", dockerfile.read_text("utf-8")) for p in line.split()}


def test_the_container_has_every_package_of_the_add_on():
    """a package added to floorplan3d/Dockerfile must go into container/Dockerfile too"""
    missing = packages(ROOT / "floorplan3d" / "Dockerfile") - packages(ROOT / "container" / "Dockerfile")
    assert not missing, f"add {missing} to container/Dockerfile"


def test_the_container_sets_what_run_sh_sets():
    """run.sh (the add-on's start, with bashio) is not used in Docker: what it exports must be an ENV of container/Dockerfile"""
    exported = set(re.findall(r"^export (\w+)=", (ROOT / "floorplan3d" / "rootfs" / "run.sh").read_text("utf-8"), re.M))
    env = (ROOT / "container" / "Dockerfile").read_text("utf-8")
    missing = {v for v in exported if not re.search(rf"\b{v}=", env)}
    assert not missing, f"set {missing} in container/Dockerfile (ENV)"
    assert "COPY floorplan3d/rootfs/app /app" in env


def test_every_option_of_the_add_on_has_a_variable_in_docker():
    """Docker has no add-on options (options.json): every option needs an environment variable of the same name in capitals, read by
    the server and explained in container/README.md"""
    block = re.search(r"^options:\n((?:[ \t]+.*\n)*)", (ROOT / "floorplan3d" / "config.yaml").read_text("utf-8"), re.M).group(1)
    options = re.findall(r"^  (\w+):", block, re.M)
    assert options, "no options found in config.yaml"
    readme = (ROOT / "container" / "README.md").read_text("utf-8")
    code = "\n".join(p.read_text("utf-8") for p in APP.glob("*.py"))
    for key in options:
        var = key.upper()
        assert f"`{var}`" in readme, f"explain the variable {var} (option {key}) in container/README.md"
        assert f'"{var}"' in code, f"read the variable {var} (option {key}) in the server, e.g. os.environ.get(\"{var}\")"


def test_who_is_looking_comes_only_from_current_user():
    """the Ingress headers (X-Remote-User-*) are read in current_user() only: in Docker anybody could send them, there the login
    cookie says who it is"""
    body = re.search(r"\ndef current_user\(.*?\n(?=\S)", SERVER, re.S).group(0)
    assert SERVER.count("X-Remote-User") == body.count("X-Remote-User")
    for p in APP.glob("*.py"):
        if p.name != "server.py":
            assert "X-Remote-User" not in p.read_text("utf-8"), f"{p.name}: use server.current_user(request)"


def test_home_assistant_is_reached_the_same_way_in_both():
    """Home Assistant's websocket only through ha_ws_url() (Supervisor: /core/websocket, Docker: /api/websocket), its REST API only
    through HA_API, and nothing of the Supervisor's own API (http://supervisor/…, there is none in Docker)"""
    for p in APP.glob("*.py"):
        text = p.read_text("utf-8")
        assert not re.search(r"ws_connect\((?!ha_ws_url\(\))", text), f"{p.name}: connect with ws_connect(ha_ws_url(), …)"
        found = re.findall(r"http://supervisor[^\s\"']*", text)
        assert found == (["http://supervisor/core/api"] if p.name == "server.py" else []), f"{p.name}: {found}"


def test_data_only_in_the_folders_of_make_app():
    """files only under DATA_DIR or the config folder of make_app (in Docker /config does not exist, it is /data/addon_config there)"""
    for p in APP.glob("*.py"):
        lines = [ln for ln in p.read_text("utf-8").splitlines() if re.search(r"[\"'](/config|/share|/media|/addon_configs)\b", ln)]
        allowed = [ln for ln in lines if "app[KEY_CONFIG] = " in ln]
        assert lines == allowed, f"{p.name}: a fixed folder, use data_dir(request) or request.app[KEY_CONFIG]: {lines}"
