// Bundles the editor + demo backend + three.js into ONE html file that runs by double-click (no server needed).
//   npm install && npm run build   ->   dist/floorplan3d-demo.html
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const staticDir = join(here, '..', 'floorplan3d', 'rootfs', 'app', 'static');

const result = await build({
  entryPoints: [join(here, 'entry.js')],
  bundle: true, minify: true, format: 'iife', write: false, target: 'es2020',
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync(join(staticDir, 'style.css'), 'utf8') + `
.demo-badge{position:fixed;left:12px;bottom:12px;z-index:5;padding:5px 10px;border-radius:999px;font-size:12px;
background:var(--panel);border:1px solid var(--line);color:var(--muted);pointer-events:none}`;

let html = readFileSync(join(staticDir, 'index.html'), 'utf8');
html = html
  .replace('<link rel="stylesheet" href="style.css">', () => `<style>${css}</style>`)
  .replace('<script type="module" src="app.js"></script>',
    () => `<div class="demo-badge">Demo · Änderungen werden nicht gespeichert</div>\n<script>${js}</script>`);

mkdirSync(join(here, 'dist'), { recursive: true });
const out = join(here, 'dist', 'floorplan3d-demo.html');
writeFileSync(out, html);
console.log(`wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);
