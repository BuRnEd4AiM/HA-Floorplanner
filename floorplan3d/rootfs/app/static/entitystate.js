/* What the app keeps of an entity of Home Assistant (#137, step 23): its state, unit, colour ... as one small object. Home Assistant reports
 * only the NAME of a light effect (Nanoleaf scene, WLED ...), never its colours, and the light's own colour is stale/white while an effect runs,
 * so the colour shown comes from the colour the user gave that effect, else from a colour word in its name. Pure (unit test: tests/entitystate.test.mjs). */

const FX_WORDS = [[/(rot|red|feuer|fire|lava)/i, [255, 40, 30]], [/(orange|sunset|sonnenunter|amber)/i, [255, 130, 20]], [/(gelb|yellow|gold|sun)/i, [255, 214, 40]],
  [/(gr[üu]n|green|forest|wald|matrix|nature)/i, [40, 220, 90]], [/(cyan|t[üu]rkis|turquoise|aqua|ocean|meer|ice|eis)/i, [35, 224, 255]], [/(blau|blue|sky|himmel|water|wasser)/i, [30, 110, 255]],
  [/(lila|violett|purple|violet|gaming)/i, [170, 80, 255]], [/(pink|rosa|magenta|love|romantic)/i, [255, 60, 160]], [/(warm|kerze|candle|cozy|gem[üu]tlich)/i, [255, 170, 80]]];

/** the colour of a light effect [r, g, b]: the colour the user gave it (effectColors: { name: '#rrggbb' }), else a colour word in its name; null for none */
export function fxRgb(name, effectColors) {
  if (!name || /^(none|off|aus|keine?r?)$/i.test(name)) return null;
  const c = effectColors?.[name];
  if (c && /^#[0-9a-f]{6}$/i.test(c)) return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  return FX_WORDS.find(([re]) => re.test(name))?.[1] || null;
}
/** the colour to show for an entity: its running effect's colour, else its own */
export const effRgb = (e, effectColors) => fxRgb(e.fxc, effectColors) || e.rgb;

/** the state the app keeps of an entity of the add-on's list (rgbRaw: the light's own colour, rgb: the one to show) */
export const toState = (e, effectColors) => ({ since: e.since, state: e.state, unit: e.unit, brightness: e.brightness, position: e.position, rgb: effRgb(e, effectColors), rgbRaw: e.rgb,
  dc: e.dc, ct: e.ct, hvac: e.hvac, tt: e.tt, tmin: e.tmin, tmax: e.tmax, tstep: e.tstep, modes: e.modes, ch: e.ch, fx: e.fx, fxc: e.fxc, members: e.members });
