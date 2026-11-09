/* 🌙 The moon in the sky behind the 3D view (the owner, 2026-10-27: "den Mondzyklus reinmachen, dass man sieht, was gerade für ein
 * Mondzyklus ist, ob Vollmond oder Halbmond abnehmend … dass da irgendwo der Mond ist"): where it stands for the home (zone.home, without
 * it latitude 50° and the time zone's longitude, as the sun in sky.js), how much of it is lit and which phase that is, and where it goes on
 * the screen. Low-precision formulas of the Astronomical Almanac (a degree, an hour: plenty for a picture). Pure (no DOM): unit test
 * tests/moon.test.mjs; skyui.js draws it. */

const RAD = Math.PI / 180, DAY = 864e5, J2000 = Date.UTC(2000, 0, 1, 12), OBL = 23.4397 * RAD, AU = 149598000;
const { sin, cos, asin, atan2, acos, tan } = Math;
const days = (date) => (date.getTime() - J2000) / DAY;
const raDec = (l, b) => ({ ra: atan2(sin(l) * cos(OBL) - tan(b) * sin(OBL), cos(l)), dec: asin(sin(b) * cos(OBL) + cos(b) * sin(OBL) * sin(l)) });

function sunAt(d) {
  const M = (357.5291 + 0.98560028 * d) * RAD;
  const L = M + (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)) * RAD + 102.9372 * RAD + Math.PI;
  return raDec(L, 0);
}

function moonAt(d) {
  const L = (218.316 + 13.176396 * d) * RAD, M = (134.963 + 13.064993 * d) * RAD, F = (93.272 + 13.22935 * d) * RAD;
  return { ...raDec(L + 6.289 * RAD * sin(M), 5.128 * RAD * sin(F)), dist: 385001 - 20905 * cos(M) };
}

/** the time zone's longitude without summer time (15° an hour), when Home Assistant does not say where home is */
const zoneLon = (date) => {
  const y = date.getFullYear();
  return -Math.max(new Date(y, 0, 1).getTimezoneOffset(), new Date(y, 6, 1).getTimezoneOffset()) / 4;
};

/** where home is: zone.home of Home Assistant (the add-on sends `geo: { lat, lon }`, rounded), else latitude 50° and the time zone */
export function homeGeo(states, date) {
  const g = states?.['zone.home']?.geo;
  if (g && Number.isFinite(g.lat) && Number.isFinite(g.lon)) return { lat: g.lat, lon: g.lon };
  return { lat: 50, lon: zoneLon(date) };
}

/** where the moon stands: { alt (degrees over the horizon, seen from the earth's surface), az (degrees from north, clockwise) } */
export function moonPosition(date, lat, lon) {
  const d = days(date), m = moonAt(d), phi = lat * RAD;
  const H = (280.16 + 360.9856235 * d + lon) * RAD - m.ra;
  let alt = asin(sin(phi) * sin(m.dec) + cos(phi) * cos(m.dec) * cos(H));
  alt -= asin(6371 / m.dist) * cos(alt);                                  // seen from the surface: up to a degree lower (parallax)
  const az = atan2(sin(H), cos(H) * sin(phi) - tan(m.dec) * cos(phi)) / RAD + 180;
  return { alt: alt / RAD, az: ((az % 360) + 360) % 360 };
}

export const PHASES = ['new', 'waxingCrescent', 'firstQuarter', 'waxingGibbous', 'full', 'waningGibbous', 'lastQuarter', 'waningCrescent'];
export const PHASE_EMOJI = { new: '🌑', waxingCrescent: '🌒', firstQuarter: '🌓', waxingGibbous: '🌔', full: '🌕', waningGibbous: '🌖', lastQuarter: '🌗', waningCrescent: '🌘' };
const NEAR = 1 / 29.53;                                                   // a day of the cycle: new, quarter and full moon last a day each side

/** how the moon looks: { fraction (0..1 lit), cycle (0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter), waxing, key (PHASES) } */
export function moonPhase(date) {
  const d = days(date), s = sunAt(d), m = moonAt(d);
  const phi = acos(Math.max(-1, Math.min(1, sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra))));
  const inc = atan2(AU * sin(phi), m.dist - AU * cos(phi));
  const side = atan2(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));
  const cycle = (0.5 + (0.5 * inc * (side < 0 ? -1 : 1)) / Math.PI) % 1;
  const near = (x) => Math.abs(cycle - x) < NEAR;
  const key = near(0) || near(1) ? 'new' : near(0.25) ? 'firstQuarter' : near(0.5) ? 'full' : near(0.75) ? 'lastQuarter'
    : cycle < 0.25 ? 'waxingCrescent' : cycle < 0.5 ? 'waxingGibbous' : cycle < 0.75 ? 'waningGibbous' : 'waningCrescent';
  return { fraction: (1 + cos(inc)) / 2, cycle, waxing: cycle < 0.5, key };
}

/**
 * Where the moon goes on the screen (the sky is a picture behind the house, it does not turn with the camera): looking south (north on
 * the southern half of the earth), east on the left, rising on one side, highest in the middle, setting on the other; high over the
 * horizon near the top. { x, y (percent of the picture), show (over the horizon), right (its lit side is the right one: waxing in the
 * north, waning in the south) }
 */
export function moonSpot(pos, phase, lat) {
  const south = lat < 0, signed = ((pos.az + 180) % 360) - 180;           // -180..180, 0 = north
  const off = south ? signed : ((pos.az % 360) + 360) % 360 - 180;        // 0 straight ahead
  const x = Math.max(15, Math.min(85, 50 + (off / 90) * 35));            // not under the floors on the left or the chips on the right
  const y = 14 + (1 - Math.max(0, Math.min(90, pos.alt)) / 90) * 18;      // under the bar at the top
  return { x: +x.toFixed(1), y: +y.toFixed(1), show: pos.alt > -0.5, right: phase.waxing !== south };
}

/**
 * How clearly the moon shows (0..1): bright at night, pale by day (sun elevation `elev`), behind clouds less (`cloud` 0..1), hidden
 * behind an overcast sky; a thin crescent near the new moon is faint.
 */
export function moonAlpha(elev, cloud = 0, fraction = 1) {
  const night = Math.max(0, Math.min(1, (-elev + 2) / 10));               // 0 by day (sun 2° up), 1 from 8° under the horizon
  const a = (0.42 + 0.58 * night) * (1 - Math.max(0, Math.min(1, cloud)) ** 1.5) * Math.min(1, 0.35 + fraction * 4);
  return a < 0.08 ? 0 : +a.toFixed(2);
}

/** the moon as a line: "🌖 Abnehmender Mond · 86 %" (t: the texts) */
export function moonText(phase, t) {
  return `${PHASE_EMOJI[phase.key]} ${t(`moon.${phase.key}`)} · ${Math.round(phase.fraction * 100)} %`;
}
