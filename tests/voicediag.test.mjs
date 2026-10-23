// Unit tests for voicediag.js (the microphone test of the voice search, #511; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const D = await import(`${process.env.STATIC_DIR || '/tmp/static'}/voicediag.js`);

const UA = {
  chromeWin: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  edgeWin: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.2849.56',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
  safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
  safariIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.58 Safari/537.36',
  webview: 'Mozilla/5.0 (Linux; Android 11; Lenovo TB-X606F Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.6045.163 Safari/537.36',
  haAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 7; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.58 Mobile Safari/537.36 Home Assistant/2024.10.1-full',
  haIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Home Assistant/2024.10 (io.robbie.HomeAssistant; build:2024.1010; iOS 17.6.1)',
  iosApp: 'Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  samsung: 'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
};

test('browserKind: the browser, the system and whether it is an app with a built-in browser', () => {
  assert.deepEqual(D.browserKind(UA.chromeWin), { name: 'Chrome 130', app: '', os: 'windows', fully: false });
  assert.equal(D.browserKind(UA.edgeWin).name, 'Edge 130');
  assert.equal(D.browserKind(UA.firefox).name, 'Firefox 131');
  assert.deepEqual(D.browserKind(UA.safariMac), { name: 'Safari 17', app: '', os: 'mac', fully: false });
  assert.deepEqual(D.browserKind(UA.safariIphone), { name: 'Safari 17', app: '', os: 'ios', fully: false });
  assert.deepEqual(D.browserKind(UA.chromeAndroid), { name: 'Chrome 130', app: '', os: 'android', fully: false });
  assert.equal(D.browserKind(UA.samsung).name, 'Samsung Internet 26');
  assert.equal(D.browserKind(UA.samsung).app, '');
  assert.equal(D.browserKind(UA.webview).app, 'webview');               // Fully Kiosk and other kiosk apps: Android's WebView
  assert.equal(D.browserKind(UA.haAndroid).app, 'ha');
  assert.equal(D.browserKind(UA.haIos).app, 'ha');
  assert.equal(D.browserKind(UA.haIos).os, 'ios');
  assert.equal(D.browserKind(UA.iosApp).app, 'ios');
  assert.equal(D.browserKind(`${UA.webview} FullyKiosk/1.55`).fully, true);
  assert.deepEqual(D.browserKind(''), { name: 'Browser', app: '', os: '', fully: false });
});

test('browserRecognition: none, broken in an app, what this device found out wins', () => {
  assert.equal(D.browserRecognition(false, '', ''), 'none');
  assert.equal(D.browserRecognition(false, 'webview', 'ok'), 'none');
  assert.equal(D.browserRecognition(true, '', ''), 'ok');
  assert.equal(D.browserRecognition(true, 'webview', ''), 'broken');   // Chrome's recognition in a WebView does nothing
  assert.equal(D.browserRecognition(true, 'ha', ''), 'broken');
  assert.equal(D.browserRecognition(true, 'webview', 'ok'), 'ok');     // the microphone test heard words here
  assert.equal(D.browserRecognition(true, '', 'broken'), 'broken');    // it did not start before
  assert.ok(D.BROKEN.every((c) => D.FALL_BACK.includes(c)));
  assert.ok(!D.FALL_BACK.includes('no-speech') && !D.FALL_BACK.includes('aborted'));
});

test('whyNot: why the 🎤 cannot listen', () => {
  const ok = { has: true, browser: true, app: '', secure: true, policy: true, mic: true, assist: false };
  assert.equal(D.whyNot('auto', ok), '');
  assert.equal(D.whyNot('off', ok), 'off');
  assert.equal(D.whyNot('auto', { ...ok, secure: false, browser: false, mic: false }), 'insecure');   // http://: nothing at all
  assert.equal(D.whyNot('auto', { ...ok, policy: false, browser: false, mic: false }), 'policy');
  assert.equal(D.whyNot('auto', { ...ok, browser: false, app: 'webview' }), 'app');                // the tablet without Assist
  assert.equal(D.whyNot('auto', { ...ok, browser: false, app: 'webview', assist: true }), '');      // ... with Assist
  assert.equal(D.whyNot('auto', { ...ok, browser: false }), 'broken');
  assert.equal(D.whyNot('auto', { ...ok, has: false, browser: false }), 'noBrowser');              // Firefox without Assist
  assert.equal(D.whyNot('auto', { ...ok, has: false, browser: false, assist: true, mic: false }), 'noMic');
  assert.equal(D.whyNot('assist', ok), 'noAssist');
  assert.equal(D.whyNot('assist', { ...ok, assist: true }), '');
  assert.equal(D.whyNot('browser', { ...ok, browser: false, app: 'ha', assist: true }), 'app');
  assert.equal(D.whyNot('browser', { ...ok, has: false, browser: false }), 'noBrowser');
});

test('micProblem: the error of getUserMedia and the permission', () => {
  assert.equal(D.micProblem('NotAllowedError', { secure: false }), 'insecure');
  assert.equal(D.micProblem('NotAllowedError', { permission: 'denied' }), 'denied');
  assert.equal(D.micProblem('NotAllowedError', { permission: '' }), 'denied');
  assert.equal(D.micProblem('NotAllowedError', { permission: 'prompt' }), 'dismissed');
  assert.equal(D.micProblem('NotAllowedError', { permission: 'granted' }), 'blocked');   // Windows or the app does not give it
  assert.equal(D.micProblem('NotFoundError'), 'noDevice');
  assert.equal(D.micProblem('NotReadableError'), 'busy');
  assert.equal(D.micProblem('unsupported'), 'unsupported');
  assert.equal(D.micProblem('WeirdError'), 'other');
});

test('advice: what to do, for this kind of device', () => {
  const win = D.browserKind(UA.chromeWin), fully = D.browserKind(`${UA.webview} FullyKiosk/1.55`), ha = D.browserKind(UA.haAndroid);
  assert.deepEqual(D.advice('insecure', win), ['https', 'flag']);
  assert.deepEqual(D.advice('insecure', ha), ['https']);                 // no flags in an app
  assert.deepEqual(D.advice('denied', win), ['site', 'windows']);
  assert.deepEqual(D.advice('denied', fully), ['fully', 'android']);
  assert.deepEqual(D.advice('denied', ha), ['haApp']);
  assert.deepEqual(D.advice('blocked', win), ['windows']);
  assert.deepEqual(D.advice('app', D.browserKind(UA.webview)), ['assist', 'chrome']);
  assert.deepEqual(D.advice('noBrowser', D.browserKind(UA.firefox)), ['assist', 'otherBrowser']);
  assert.deepEqual(D.advice('silent', win), ['wrongMic', 'windows']);
  assert.deepEqual(D.advice('nothing-known', win), []);
});

test('levelVerdict, meter and recProblem', () => {
  assert.equal(D.levelVerdict(0), 'silent');
  assert.equal(D.levelVerdict(0.005), 'quiet');
  assert.equal(D.levelVerdict(0.08), 'ok');
  assert.equal(D.meter(0), 0);
  assert.equal(D.meter(1), 1);
  assert.ok(D.meter(0.02) > 0.25 && D.meter(0.02) < 0.4);
  assert.equal(D.recProblem('no-speech'), 'noSpeech');
  assert.equal(D.recProblem('stt-no-text-recognized'), 'noSpeech');
  assert.equal(D.recProblem('not-allowed'), 'mic');
  assert.equal(D.recProblem('dead'), 'dead');
  assert.equal(D.recProblem('no-audio'), 'silent');
  assert.equal(D.recProblem('no_assist'), 'noAssist');
  assert.equal(D.recProblem('http 500'), 'other');
});
