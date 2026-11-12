"""The release's floorplan3d-connector.zip (#744, tools/connector_package.py): what is in it, that it is the same every time, and that
an older commit (whose integration had its own version numbers) gets none."""
import hashlib
import io
import json
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import connector_package as cp  # noqa: E402

PKG = ROOT / "container" / "custom_components" / "floorplan3d"


def test_the_zip_holds_the_folder_to_unpack_in_the_config_folder(tmp_path):
    version = json.loads((PKG / "manifest.json").read_text("utf-8"))["version"]
    assert cp.main(["--out", str(tmp_path), "--version", version]) == 0
    data = (tmp_path / cp.ZIP_NAME).read_bytes()
    names = zipfile.ZipFile(io.BytesIO(data)).namelist()
    assert names == sorted(names)
    assert "custom_components/floorplan3d/__init__.py" in names and "custom_components/floorplan3d/manifest.json" in names
    assert "custom_components/floorplan3d/frontend/floorplan3d-container-card.js" in names
    assert "custom_components/floorplan3d/translations/de.json" in names
    assert all(n.startswith("custom_components/floorplan3d/") for n in names)
    assert not any("__pycache__" in n or n.endswith(".pyc") for n in names)
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        assert json.loads(z.read("custom_components/floorplan3d/manifest.json"))["version"] == version
    line = (tmp_path / f"{cp.ZIP_NAME}.sha256").read_text("utf-8")
    assert line == f"{hashlib.sha256(data).hexdigest()}  {cp.ZIP_NAME}\n"            # what `sha256sum -c` reads


def test_the_same_files_give_the_same_bytes():
    files = {"b.py": b"two", "a.py": b"one", "frontend/c.js": b"three"}
    assert cp.build(files, 1_700_000_000) == cp.build(dict(reversed(list(files.items()))), 1_700_000_000)
    assert cp.build(files, 1_700_000_000) != cp.build({**files, "a.py": b"ONE"}, 1_700_000_000)


def test_a_commit_is_packed_from_git(tmp_path):
    head = subprocess.run(["git", "-C", str(ROOT), "rev-parse", "HEAD"], capture_output=True, text=True, check=True).stdout.strip()
    files, stamp = cp.files_at(head)
    assert "__init__.py" in files and "manifest.json" in files and stamp > 1_600_000_000
    assert cp.build(files, stamp) == cp.build(*cp.files_at(head))                   # built again: the same checksum


def test_another_version_gets_no_package(tmp_path):
    assert cp.main(["--out", str(tmp_path), "--version", "0.0.1"]) == 1
    assert not (tmp_path / cp.ZIP_NAME).exists()
    assert cp.main(["--out", str(tmp_path), "--ref", "no-such-commit-here"]) == 1
