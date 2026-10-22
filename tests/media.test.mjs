// Unit tests for media.js (the page 🎵 Musik & TV of the tab bar, #490; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const M = await import(`${process.env.STATIC_DIR || '/tmp/static'}/media.js`);
const G = M.F.GROUPING, P = M.F.PLAY_MEDIA;
const states = {
  'media_player.kueche': { state: 'off', ctl: { sf: 0x3FFFF } },
  'media_player.sonos_wz': { state: 'playing', ctl: { title: 'Feel It Still', artist: 'Portugal. The Man', vol: 35, sf: 1 | 4 | 16 | 32 | G | P, pic: 'pabc', grp: ['media_player.sonos_wz', 'media_player.bad'] } },
  'media_player.bad': { state: 'playing', ctl: { title: 'Feel It Still', sf: 1 | 4 | G, grp: ['media_player.sonos_wz', 'media_player.bad'] } },
  'media_player.tv': { state: 'on', app: 'Netflix', ctl: { sf: 128 | 256 | 2048 | 4, sources: ['HDMI 1', 'Netflix'], source: 'Netflix', vol: 22 } },
  'media_player.kinder': { state: 'paused', ctl: { title: 'Folge 214', artist: 'Die drei ???', sf: 16384 | 4096 } },
  'media_player.alt': { state: 'unavailable' },
  'light.x': { state: 'on' },
};
const names = { 'media_player.sonos_wz': 'Sonos', 'media_player.tv': 'Fernseher' };
const rooms = { 'media_player.sonos_wz': 'Wohnzimmer', 'media_player.bad': 'Bad', 'media_player.tv': 'Wohnzimmer', 'media_player.kueche': 'Küche' };

test('the players: playing first, then paused, on, off and gone; by room and name within', () => {
  const list = M.players(states, { names, roomOf: (e) => rooms[e] });
  assert.deepEqual(list.map((p) => p.entity), ['media_player.bad', 'media_player.sonos_wz', 'media_player.kinder', 'media_player.tv', 'media_player.kueche', 'media_player.alt']);
  const s = list[1];
  assert.equal(s.name, 'Sonos'); assert.equal(s.room, 'Wohnzimmer'); assert.equal(s.title, 'Feel It Still'); assert.equal(s.sub, 'Portugal. The Man');
  assert.deepEqual(s.plan.buttons.map((b) => b.svc), ['media_previous_track', 'media_play_pause', 'media_next_track']);
  assert.equal(s.plan.volume.value, 35); assert.equal(s.canGroup, true); assert.equal(s.canPlay, true); assert.equal(s.pic, 'pabc');
  const tv = list.find((p) => p.entity === 'media_player.tv');
  assert.equal(tv.title, 'Netflix'); assert.equal(tv.sub, ''); assert.deepEqual(tv.plan.sources, { list: ['HDMI 1', 'Netflix'], value: 'Netflix' });
  assert.equal(tv.canGroup, false); assert.equal(tv.canPlay, false);
  const off = list.find((p) => p.entity === 'media_player.kueche');
  assert.equal(off.on, false); assert.equal(off.title, ''); assert.deepEqual(off.plan.buttons.map((b) => b.svc), ['turn_on']);
  assert.equal(M.player('media_player.demo', { state: 'idle' }, 'Demo').canPlay, true);        // no features reported: a station may be tried
  assert.equal(list.at(-1).canPlay, false);                                                     // gone: none
  assert.equal(M.hasMedia(states), true); assert.equal(M.hasMedia({ 'light.x': {} }), false); assert.equal(M.hasMedia(null), false);
});

test('"Alles stopp": a pause for what can pause, else stop, nothing for what plays without either', () => {
  const list = M.players({ ...states, 'media_player.kinder': { state: 'playing', ctl: { sf: 16384 | 4096 } }, 'media_player.tv': { state: 'playing', ctl: { sf: 256 } },
    'media_player.x': { state: 'playing', ctl: { sf: 4 } } });
  assert.deepEqual(M.stopCalls(list), [{ entity: 'media_player.bad', service: 'media_pause' }, { entity: 'media_player.kinder', service: 'media_stop' },
    { entity: 'media_player.sonos_wz', service: 'media_pause' }, { entity: 'media_player.tv', service: 'turn_off' }]);
});

test('rooms together: the groups now, the call that joins (never the leader itself, each once)', () => {
  const list = M.players(states, { roomOf: (e) => rooms[e] });
  assert.deepEqual(M.groupsOf(list), [{ leader: 'media_player.sonos_wz', members: ['media_player.sonos_wz', 'media_player.bad'] }]);
  assert.deepEqual(M.joinCall('media_player.sonos_wz', ['media_player.sonos_wz', 'media_player.kueche', 'media_player.kueche', 'light.x']),
    { entity: 'media_player.sonos_wz', service: 'join', data: { group_members: ['media_player.kueche'] } });
  assert.equal(M.joinCall('media_player.a', ['media_player.a']), null);
  assert.equal(M.joinCall('', ['media_player.a']), null);
});

test('radio stations: only streams and Home Assistant media, each once, at most 20; the call; pictures', () => {
  assert.deepEqual(M.cleanStations([{ name: ' SWR3 ', url: 'https://swr.example/swr3.mp3' }, { name: 'twice', url: 'https://swr.example/swr3.mp3' },
    { url: 'media-source://radio_browser/abc' }, { name: 'x', url: 'javascript:alert(1)' }, { name: 'y', url: 'https://a b' }, null, 'junk']),
  [{ name: 'SWR3', url: 'https://swr.example/swr3.mp3' }, { name: 'media-source://radio_browser/abc', url: 'media-source://radio_browser/abc' }]);
  assert.equal(M.cleanStations(Array.from({ length: 30 }, (_, i) => ({ name: `S${i}`, url: `https://s.example/${i}` }))).length, M.MAX_STATIONS);
  assert.deepEqual(M.cleanStations(null), []);
  assert.deepEqual(M.stationCall('media_player.kueche', { url: 'https://swr.example/swr3.mp3' }),
    { entity: 'media_player.kueche', service: 'play_media', data: { media_content_id: 'https://swr.example/swr3.mp3', media_content_type: 'music' } });
  assert.equal(M.picUrl('media_player.tv', 'p123'), 'api/media/media_player.tv/picture?v=p123');
  assert.equal(M.picUrl('media_player.tv', 'https://i.example/a.jpg'), 'https://i.example/a.jpg');
  assert.equal(M.picUrl('media_player.tv', null), null);
  assert.equal(M.tone('media_player.tv'), M.tone('media_player.tv'));
  assert.ok(M.tone('media_player.tv') >= 0 && M.tone('media_player.tv') < 5);
});
