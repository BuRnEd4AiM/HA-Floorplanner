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
