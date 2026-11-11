// The checker for the JavaScript (idea list 2026-11-11, step 4): only what is a real mistake. CI job "test" runs it:
//   npm ci --prefix tools/lint && tools/lint/node_modules/.bin/eslint
// The packages are in tools/lint (package.json there), so the top of the repository needs no package.json.
import { createRequire } from 'node:module';

const require = createRequire(new URL('./tools/lint/package.json', import.meta.url));
const js = require('@eslint/js');
const globals = require('globals');

export default [
  { files: ['floorplan3d/rootfs/app/static/**/*.js', 'dist/**/*.js'] },
  { ignores: ['**/vendor/**', 'floorplan3d-stable/**', '**/node_modules/**', 'graphify-out/**'] },
  {
    files: ['floorplan3d/rootfs/app/static/**/*.js', 'dist/**/*.js'],
    ...js.configs.recommended,
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: { ...globals.browser } },
  },
  {
    files: ['floorplan3d/rootfs/app/static/**/*.js', 'dist/**/*.js'],
    rules: {
      'no-control-regex': 'off',                  // on purpose: names and texts from Home Assistant lose their control characters
      'no-unused-vars': ['error', { caughtErrors: 'none', ignoreRestSiblings: true }],   // catch (e) {} and ({ rooms, ...rest }) are fine
    },
  },
  { files: ['**/bootguard.js'], languageOptions: { sourceType: 'script' } },
];
