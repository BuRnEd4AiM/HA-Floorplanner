// Unit tests for notifyui.js (the message on alarm; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const N = await import(`${process.env.STATIC_DIR || '/tmp/static'}/notifyui.js`);

test('a notify service of Home Assistant gets a sign for what it probably is (#456)', () => {
  assert.equal(N.serviceLabel('mobile_app_pixel_7'), '📱 mobile_app_pixel_7');
  assert.equal(N.serviceLabel('telegram_familie'), '✈️ telegram_familie');
  assert.equal(N.serviceLabel('whatsapp'), '💬 whatsapp');
  assert.equal(N.serviceLabel('signal_flo'), '🔵 signal_flo');
  assert.equal(N.serviceLabel('smtp_gmail'), '✉️ smtp_gmail');
  assert.equal(N.serviceLabel('alexa_media_echo'), '🔊 alexa_media_echo');
  assert.equal(N.serviceLabel('pushover'), '🔔 pushover');
});

test('the integration a notify entity belongs to has a readable name (#460)', () => {
  assert.equal(N.platformName('telegram_bot'), 'Telegram-Bot');
  assert.equal(N.platformName('mobile_app'), 'Home Assistant App');
  assert.equal(N.platformName('my_custom_thing'), 'my custom thing');
  assert.equal(N.platformName(''), '');
  assert.equal(N.platformName(undefined), '');
});

test('what to send through is grouped by where it comes from, ticked ones that are gone are kept (#460)', () => {
  const available = [
    { id: 'mobile_app_pixel', name: 'mobile_app_pixel', origin: 'app', platform: '' },
    { id: 'notify.telegram_bot_familie', name: 'Familie', origin: 'integration', platform: 'telegram_bot' },
    { id: 'telegram_alt', name: 'telegram_alt', origin: 'yaml', platform: '' },
  ];
  const g = N.targetGroups(available, ['telegram_alt', 'notify.old_chat', 'mobile_app_tablet', 'signal_weg']);
  assert.deepEqual(g.map((x) => x.origin), N.ORIGINS);
  assert.deepEqual(g.map((x) => x.items.map((i) => i.id)), [['mobile_app_pixel', 'mobile_app_tablet'], ['notify.telegram_bot_familie', 'notify.old_chat'],
    ['telegram_alt', 'signal_weg']]);
  assert.deepEqual(N.targetGroups([], []), []);
  assert.deepEqual(N.targetGroups(undefined, ['notify.x']).map((x) => x.origin), ['integration']);
  assert.deepEqual(N.targetGroups([{ id: 'whatsapp', name: 'whatsapp', origin: 'yaml', platform: '' }]).map((x) => x.origin), ['yaml']);
});
