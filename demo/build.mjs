// Bundles the editor + demo backend + three.js into ONE html file that runs by double-click (no server needed).
//   npm install && npm run build   ->   floorplan3d-demo.html
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const staticDir = join(here, '..', 'floorplan3d', 'rootfs', 'app', 'static');

const result = await build({
  entryPoints: [join(here, 'entry.js')],
  bundle: true, minify: true, format: 'iife', write: false, target: 'es2020',
  define: { __DEMO_VERSION__: JSON.stringify((readFileSync(join(here, '..', 'floorplan3d', 'config.yaml'), 'utf8').match(/^version:\s*"?([\d.]+)/m) || [])[1] || 'demo') },
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync(join(staticDir, 'style.css'), 'utf8') + `
.demo-badge{position:fixed;left:12px;bottom:12px;z-index:5;padding:5px 10px;border-radius:999px;font-size:12px;
background:var(--panel);border:1px solid var(--line);color:var(--muted);pointer-events:none;animation:demoBadge 6s forwards}
@keyframes demoBadge{80%{opacity:1}100%{opacity:0;visibility:hidden}}`;   /* fades out after a few seconds: on phones it covered the buttons at the bottom */

let html = readFileSync(join(staticDir, 'index.html'), 'utf8');
html = html
  .replace('<link rel="stylesheet" href="style.css">', () => `<style>${css}</style>`)
  .replace('<script src="bootguard.js"></script>\n', '')            // the demo is one file: nothing can be stale
  .replace('<script type="module" src="app.js"></script>',
    () => `<div class="demo-badge">Demo · changes are not saved</div>\n<script>${js}</script>`);

const out = join(here, 'floorplan3d-demo.html');          // committed, so it can be downloaded straight from GitHub
writeFileSync(out, html);
console.log(`wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);
