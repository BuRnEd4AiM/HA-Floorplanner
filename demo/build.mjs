// Bundles the editor + demo backend + three.js into ONE html file that runs by double-click (no server needed).
//   npm install && npm run build   ->   floorplan3d-demo.html (the beta's code, floorplan3d/: the videos, the timeline photos)
//   node build.mjs /tmp/x.html     ->   somewhere else (tools/timeline_photo.py: the committed file stays as it is)
//   node build.mjs <out> --stable  ->   the normal add-on's code (floorplan3d-stable/, the released version): the demo on GitHub Pages
//                                       and in the latest release; the version window says "normal add-on"
//   node build.mjs <out> --beta    ->   the beta's code, saying so (pill "Beta", badge "Beta demo"): GitHub Pages /beta/ (5.3.1)
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), stable = args.includes('--stable'), beta = args.includes('--beta'), outArg = args.find((a) => !a.startsWith('--'));
const app = stable ? 'floorplan3d-stable' : 'floorplan3d';   // whose code: the normal add-on's or the beta's
const channel = stable ? 'stable' : beta ? 'beta' : '';      // what the version pill and window say ('' as before: nothing)
const staticDir = join(here, '..', app, 'rootfs', 'app', 'static');
/** --stable: the demo's own imports of ../floorplan3d/… (the app, its examples, a few pure modules) come from floorplan3d-stable/ */
const appDir = { name: 'app-dir', setup(b) {
  if (app === 'floorplan3d') return;
  b.onResolve({ filter: /^\.\.\/floorplan3d\// }, (a) => ({ path: join(here, '..', app, a.path.slice('../floorplan3d/'.length)) }));
} };

const result = await build({
  entryPoints: [join(here, 'entry.js')],
  bundle: true, minify: true, format: 'iife', write: false, target: 'es2020', plugins: [appDir],
  define: { __DEMO_VERSION__: JSON.stringify((readFileSync(join(here, '..', app, 'config.yaml'), 'utf8').match(/^version:\s*"?([\d.]+)/m) || [])[1] || 'demo'),
    __DEMO_CHANNEL__: JSON.stringify(channel) },
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
    () => `<div class="demo-badge">${beta ? 'Beta demo' : 'Demo'} · changes are not saved</div>\n<script>${js}</script>`);

const out = outArg ? resolve(outArg) : join(here, 'floorplan3d-demo.html');   // committed, so it can be downloaded straight from GitHub
mkdirSync(dirname(out), { recursive: true });                                    // a new folder (the workflows: _demo/stable/, _demo/beta/)
writeFileSync(out, html);
console.log(`wrote ${out} (${(html.length / 1024).toFixed(0)} KB, ${app}${channel ? `, ${channel}` : ''})`);
