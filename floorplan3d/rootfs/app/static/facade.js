/* The look of the outside (#428): the colour of the window frames, white as always or anthracite; with anthracite frames the walls are a
 * little lighter, the modern look. The door frames keep their colour. Pure (unit test: tests/facade.test.mjs); floorbuild.js and walls.js
 * use the colours. */

/** setting windowFrames -> { frame (window frames), wall (walls) } */
export const FACADES = {
  white: { frame: '#f4f4f4', wall: '#d9d4cc' },
  anthracite: { frame: '#2e3338', wall: '#f4f0ea' },
};
export const FACADE_KEYS = Object.keys(FACADES);

/** the colours for the settings (an unknown value: white, as always) */
export const facadeOf = (settings) => FACADES[settings?.windowFrames] || FACADES.white;
