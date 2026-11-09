/* The look of the outside (#428): the colour of the window frames, white as always or anthracite; with anthracite frames the walls are a
 * little lighter, the modern look. The door frames keep their colour. And the finish of the facade (#448): plaster, brick, wood, slate ...
 * on the outer faces of the walls (setting facade, its colour facadeColor), drawn by wallskin.js. Pure (unit test: tests/facade.test.mjs);
 * floorbuild.js and walls.js use the colours. */
import { cleanFinish } from './finishes.js';

/** setting windowFrames -> { frame (window frames), wall (walls) } */
export const FACADES = {
  white: { frame: '#f4f4f4', wall: '#d9d4cc' },
  anthracite: { frame: '#2e3338', wall: '#f4f0ea' },
};
export const FACADE_KEYS = Object.keys(FACADES);

/** the colours for the settings (an unknown value: white, as always) */
export const facadeOf = (settings) => FACADES[settings?.windowFrames] || FACADES.white;

/** the finish of the outside of the walls (settings facade: a pattern offered for the facade, facadeColor: its colour or '' for its own),
 *  null: the walls keep their colour, as always */
export const facadeFinish = (settings) => cleanFinish({ pattern: settings?.facade, color: settings?.facadeColor || undefined }, 'facade') || null;
