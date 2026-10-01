"""All UI languages must have exactly the keys of the German original and keep every {placeholder}."""
import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

STATIC = Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app" / "static"
pytestmark = pytest.mark.skipif(not shutil.which("node"), reason="node not installed")

SCRIPT = """
import fs from 'fs';
const src = fs.readFileSync(process.argv[1] + '/i18n.js', 'utf8');
const head = src.slice(0, src.indexOf('DICT.fr ='));
const body = head.replace(/^import .*$/gm, '').replace(/export /g, '').replace('const DICT', 'var DICT');
const out = {};
const DICT = new Function(body + ';return DICT;')();
out.de = DICT.de; out.en = DICT.en;
for (const l of ['fr', 'es', 'it', 'nl', 'pl']) out[l] = (await import(process.argv[1] + '/lang/' + l + '.js')).default;
console.log(JSON.stringify(out));
"""


@pytest.fixture(scope="module")
def dicts():
    r = subprocess.run(["node", "--input-type=module", "-e", SCRIPT, str(STATIC)], capture_output=True, text=True, check=True)
    return json.loads(r.stdout)


def test_every_language_has_the_german_keys(dicts):
    de = set(dicts["de"])
    for lang, d in dicts.items():
        assert set(d) == de, (lang, sorted(de ^ set(d))[:10])


def test_values_are_filled_and_keep_placeholders(dicts):
    ph = lambda s: sorted(re.findall(r"\{\w+\}", s))
    for lang, d in dicts.items():
        for k, v in d.items():
            assert isinstance(v, str) and v.strip(), (lang, k)
            assert ph(v) == ph(dicts["en"][k]), (lang, k, v)


def test_index_html_offers_every_language():
    html = (STATIC / "index.html").read_text(encoding="utf-8")
    for code in ("auto", "de", "en", "fr", "es", "it", "nl", "pl"):
        assert f'<option value="{code}">' in html
