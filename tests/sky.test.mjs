// Unit tests for sky.js (sky by the time of day #418, weather in the sky #419; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const S = await import(`${dir}/sky.js`);
const t = (k, p = {}) => k + (Object.keys(p).length ? JSON.stringify(p) : '');

test('the sun from the clock: high at noon in summer, below the horizon at midnight, morning and afternoon', () => {
  const lat = 50, lon = 10;
  const noon = S.approxSun(new Date(Date.UTC(2026, 5, 21, 11, 20)), lat, lon);
  assert.ok(noon.elev > 60 && noon.elev < 64, `noon ${noon.elev}`);       // 90 - 50 + 23.4
  const night = S.approxSun(new Date(Date.UTC(2026, 5, 21, 23, 20)), lat, lon);
  assert.ok(night.elev < -10, `night ${night.elev}`);
  assert.equal(S.approxSun(new Date(Date.UTC(2026, 5, 21, 7, 0)), lat, lon).rising, true);
  assert.equal(S.approxSun(new Date(Date.UTC(2026, 5, 21, 15, 0)), lat, lon).rising, false);
  const winter = S.approxSun(new Date(Date.UTC(2026, 11, 21, 11, 20)), lat, lon);
  assert.ok(winter.elev > 14 && winter.elev < 18, `winter ${winter.elev}`);
});

test('the next sunrise and sunset are in the future and about where they belong', () => {
  const now = new Date(Date.UTC(2026, 5, 21, 12, 0));
  const s = S.approxSun(now, 50, 10);
  assert.ok(s.set > now && s.rise > now);
  assert.ok(s.set - now < 12 * 36e5, 'sunset the same evening');
  assert.ok(s.rise - now > 12 * 36e5, 'sunrise the next morning');
  const setUtc = s.set.getUTCHours() + s.set.getUTCMinutes() / 60;
  assert.ok(setUtc > 18.8 && setUtc < 20.2, `sunset ${setUtc} UTC`);      // about 21:20 summer time in the middle of Germany
  const polar = S.approxSun(new Date(Date.UTC(2026, 5, 21, 12, 0)), 80, 10);
  assert.equal(polar.set, null);
  assert.equal(polar.rise, null);
});

test("Home Assistant's sun.sun wins over the clock", () => {
  const states = { 'sun.sun': { state: 'above_horizon', sun: { elev: 3.5, rising: false, rise: '2026-10-18T05:30:00+00:00', set: '2026-10-17T16:20:00+00:00' } } };
  const s = S.sunNow(states, new Date(Date.UTC(2026, 9, 17, 12)));
  assert.equal(s.elev, 3.5);
  assert.equal(s.rising, false);
  assert.equal(s.set.toISOString(), '2026-10-17T16:20:00.000Z');
  const noSun = S.sunNow({ 'sun.sun': { state: 'above_horizon' } }, new Date(Date.UTC(2026, 5, 21, 11, 20)));
  assert.ok(noSun.elev > 50, 'without the elevation the clock decides');
  assert.equal(S.sunNow({ 'sun.sun': { sun: { elev: 1, rise: 'x' } } }, new Date()).rise, null);
});

test('the phases of the day', () => {
  assert.equal(S.skyPhase(-20, false), 'night');
  assert.equal(S.skyPhase(-3, true), 'dawn');
  assert.equal(S.skyPhase(-3, false), 'dusk');
  assert.equal(S.skyPhase(4, true), 'morning');
  assert.equal(S.skyPhase(4, false), 'evening');
  assert.equal(S.skyPhase(30, false), 'day');
  ['night', 'dawn', 'dusk', 'morning', 'evening', 'day'].forEach((p) => assert.ok(S.PHASE_ICON[p]));
});

test('sky colours: dark at night, blue by day, warm at the horizon at sunset, grey under clouds', () => {
  const lum = (h) => { const [r, g, b] = S.hexRgb(h); return 0.3 * r + 0.59 * g + 0.11 * b; };
  const night = S.skyColors(-20), day = S.skyColors(30), sunset = S.skyColors(0.5);
  assert.ok(lum(night.top) < 20 && lum(night.low) < 60);
  const [r, g, b] = S.hexRgb(day.mid);
  assert.ok(b > r && b > g, 'blue by day');
  const [sr, , sb] = S.hexRgb(sunset.low);
  assert.ok(sr > sb, 'orange at the horizon');
  const cloudy = S.skyColors(30, false, 1), [cr, , cb] = S.hexRgb(cloudy.mid);
  assert.ok(Math.abs(cb - cr) < Math.abs(b - r), 'clouds take the blue out');
  assert.ok(lum(cloudy.mid) < lum(day.mid), 'and make it darker');
  Object.values(S.skyColors(-5, true)).forEach((h) => assert.match(h, /^#[0-9a-f]{6}$/));
  assert.notEqual(S.skyColors(1, true).low, S.skyColors(1, false).low, 'the morning is pinker than the evening');
});

test('stars only at night and under a clear sky; the lawn darker at night and warmer at sunset', () => {
  assert.equal(S.starAlpha(5), 0);
  assert.equal(S.starAlpha(-20), 1);
  assert.equal(S.starAlpha(-20, 1), 0, 'overcast: none');
  const cloudy = S.starAlpha(-20, 0.75), some = S.starAlpha(-20, 0.35);
  assert.ok(cloudy > 0.3 && cloudy < 0.5 && some > 0.8 && some < 1, 'cloudy: some still shine through');
  assert.equal(S.milkyWay(0.2), null, 'no Milky Way while the stars are faint');
  const band = S.milkyWay(1);
  assert.match(band, /linear-gradient\(152deg/);
  assert.equal(band.match(/radial-gradient/g).length, 3);
  assert.ok(!/NaN|undefined/.test(band + S.milkyWay(0.6)));
  assert.deepEqual(S.groundTint(40), [1, 1, 1]);
  const n = S.groundTint(-20), e = S.groundTint(5);
  assert.ok(n[0] < 0.5 && n[2] > n[0], 'night: dark and blue');
  assert.ok(e[0] > e[2], 'sunset: warm');
  assert.ok(S.groundTint(40, 1)[1] < 1, 'clouds: a little darker');
});

test('the CSS of the sky has the gradient last, extra layers in front', () => {
  const css = S.skyCss({ top: '#000001', mid: '#000002', low: '#000003' }, ['url(x)']);
  assert.ok(css.startsWith('url(x), linear-gradient(to top, #000003 0%, #000002 45%, #000001 100%)'));
});

test('weather: which entity, how it looks, the line of text', () => {
  const states = { 'light.a': { state: 'on' }, 'weather.home': { state: 'rainy', wx: { t: 11.4, tu: '°C', w: 23.6, wu: 'km/h' } }, 'weather.other': { state: 'sunny' } };
  assert.equal(S.weatherId(states), 'weather.home');
  assert.equal(S.weatherId(states, 'weather.other'), 'weather.other');
  assert.equal(S.weatherId(states, 'weather.gone'), null);
  assert.equal(S.weatherId({ 'light.a': {} }), null);
  assert.deepEqual(S.weatherLook('rainy'), { key: 'rainy', cloud: 0.8, fall: 'rain', heavy: false, icon: '🌧️' });
  assert.equal(S.weatherLook('snowy').fall, 'snow');
  assert.equal(S.weatherLook('pouring').heavy, true);
  assert.equal(S.weatherLook('sunny').fall, null);
  assert.equal(S.weatherLook('unavailable'), null);
  assert.equal(S.weatherText(states['weather.home'], t), '🌧️ wx.rainy · 11 °C · wx.wind{"v":"24 km/h"}');
  assert.equal(S.weatherText({ state: 'cloudy' }, t), '☁️ wx.cloudy');
  assert.equal(S.weatherText({ state: 'unknown' }, t), null);
  S.WEATHER_STATES.forEach((k) => assert.ok(S.weatherLook(k).icon));
});

test('the line of the time chip: the sunset while the sun is up, else the sunrise', () => {
  const now = new Date(2026, 9, 17, 18, 45);
  const up = { elev: 2, rising: false, rise: new Date(2026, 9, 18, 7, 12), set: new Date(2026, 9, 17, 18, 52) };
  assert.equal(S.sunText(up, now, t), '🌇 sky.evening · 18:45 · sky.set{"t":"18:52"}');
  assert.equal(S.sunText({ ...up, elev: -20 }, now, t), '🌙 sky.night · 18:45 · sky.rise{"t":"07:12"}');
  assert.equal(S.sunText({ elev: 30, rising: true, rise: null, set: null }, now, t), '☀️ sky.day · 18:45');
  assert.equal(S.sunText({ ...up, elev: -20 }, now, t, '🌖'), '🌖 sky.night · 18:45 · sky.rise{"t":"07:12"}', 'at night the moon as it is');
  assert.equal(S.sunText(up, now, t, '🌖'), '🌇 sky.evening · 18:45 · sky.set{"t":"18:52"}', 'by day not');
});

test('the short line on phones (#445): the time and the weather, without weather the sunset', () => {
  const now = new Date(2026, 9, 17, 12, 24);
  const day = { elev: 30, rising: false, rise: new Date(2026, 9, 18, 7, 12), set: new Date(2026, 9, 17, 17, 58) };
  assert.equal(S.shortSkyText(day, now, { state: 'partlycloudy', wx: { t: 14.4, tu: '°C', w: 12 } }, t), '☀️ 12:24 · ⛅ wx.partlycloudy · 14 °C');
  assert.equal(S.shortSkyText(day, now, { state: 'rainy' }, t), '☀️ 12:24 · 🌧️ wx.rainy', 'no temperature: left out');
  assert.equal(S.shortSkyText(day, now, null, t), '☀️ 12:24 · sky.set{"t":"17:58"}', 'no weather entity: the sunset');
  assert.equal(S.shortSkyText({ ...day, elev: -20 }, now, { state: 'unknown' }, t), '🌙 12:24 · sky.rise{"t":"07:12"}', 'at night: the sunrise');
  assert.equal(S.shortSkyText({ elev: 30, rising: true, rise: null, set: null }, now, null, t), '☀️ 12:24');
  assert.equal(S.shortSkyText({ ...day, elev: -20 }, now, null, t, '🌒'), '🌒 12:24 · sky.rise{"t":"07:12"}', 'the moon at night');
});

test('?skytime=HH:MM sets the clock of the sky for trying it out', () => {
  const today = new Date(2026, 9, 17, 10, 0);
  const d = S.skyTimeOf('21:30', today);
  assert.equal(d.getHours(), 21);
  assert.equal(d.getMinutes(), 30);
  assert.equal(d.getDate(), 17);
  assert.equal(S.skyTimeOf('25:00', today), null);
  assert.equal(S.skyTimeOf('', today), null);
  const day = S.skyDateOf('2026-11-01', new Date(2026, 9, 27, 21, 30));       // ?skydate= to try the moon out: that day, the same time
  assert.ok(day.getFullYear() === 2026 && day.getMonth() === 10 && day.getDate() === 1 && day.getHours() === 21);
  assert.equal(S.skyDateOf('2026-02-31', today), null);
  assert.equal(S.skyDateOf('morgen', today), null);
  assert.equal(S.skyTimeOf('abends', today), null);
});
