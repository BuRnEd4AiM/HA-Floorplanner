/* Beispielbilder für docs/ideen-5.30 (2026-11-22, #779: Frank „Mach … die Möglichkeit für den JSON Import prominenter“):
 * malt die Ideen nur fürs Foto in die echte Demo (make_pictures.py spielt diese Datei ein). Nichts davon ist gebaut. */
/* eslint-disable no-unused-vars */
const el = (tag, css, text) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (text != null) e.textContent = text; return e; };
const AI_BTN = 'display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;padding:12px 16px;border-radius:12px;'
  + 'background:var(--ok);border:1px solid var(--ok);color:#fff;font-size:15px;font-weight:700;';
const TAG = 'display:inline-block;margin-left:8px;padding:1px 8px;border-radius:999px;background:#fff;color:#1f7a45;font-size:11px;font-weight:800;vertical-align:2px';

/** ② das Willkommen-Fenster: der Weg mit der KI zuerst und groß, darunter zeichnen und Beispielhaus */
function mockWelcome() {
  const box = document.getElementById('welcome'), btns = box.querySelector('.welBtns');
  box.style.width = 'min(520px, calc(100% - 32px))';
  const ai = el('button', AI_BTN);
  ai.type = 'button';
  const top = el('span', '', '🤖 Haus aus dem Bauplan bauen lassen'); top.append(el('span', TAG, 'am schnellsten'));
  ai.append(top, el('span', 'font-weight:400;font-size:13px;opacity:.95',
    'Foto oder PDF deines Grundrisses mit einem fertigen Text an eine KI geben (Claude, ChatGPT, Gemini). Nach ein paar Minuten steht das ganze Haus.'));
  const draw = document.getElementById('welDraw'), ex = document.getElementById('welExample'), imp = document.getElementById('welImport');
  draw.classList.remove('primary'); draw.textContent = '✏️ Wände selbst zeichnen';
  imp.textContent = '📥 Fertige JSON-Datei importieren';
  btns.replaceChildren(ai, draw, ex, imp);
}

/** ③ Erste Schritte, Schritt 1: ein dritter Knopf „Aus dem Bauplan per KI“, vorne */
function mockFirstSteps() {
  const row = document.querySelector('#firstSteps .fsStep[data-step=draw]');
  if (!row) return;
  const name = row.querySelector('.fsName'); name.textContent = name.textContent.replace(/Grundriss zeichnen oder Vorlage/, 'Grundriss: per KI, zeichnen oder Vorlage');
  const d = row.querySelector('.fsDetail'), p = d.querySelector('p');
  p.textContent = 'Am schnellsten: Eine KI baut dein Haus aus dem Bauplan (Foto oder PDF). Oder zeichne die Wände selbst, oder probiere erst das Beispielhaus.';
  const ai = el('button', '', '🤖 Aus dem Bauplan per KI'); ai.type = 'button'; ai.className = 'bdBtn primary';
  const draw = d.querySelector('[data-act=draw]'); draw.classList.remove('primary');
  p.after(ai);
}

/** ④ das Import-Fenster: oben drei Schritte mit der KI, Beispiele und Datei darunter als „Oder“ */
function mockImport() {
  const dlg = document.getElementById('importDialog');
  dlg.querySelector('h2').textContent = 'Haus aus dem Bauplan bauen (mit KI) oder aus JSON';
  const hint = dlg.querySelector('p.sub'); hint.style.display = 'none';
  const box = el('div', 'margin:6px 0 12px;padding:12px 14px;border-radius:12px;border:1px solid var(--ok);background:color-mix(in srgb, var(--ok) 14%, var(--panel))');
  box.append(el('div', 'font-weight:800;font-size:15px;margin-bottom:8px', '🤖 In drei Schritten mit einer KI'));
  const step = (n, ...kids) => {
    const r = el('div', 'display:flex;gap:10px;align-items:flex-start;margin:7px 0');
    const num = el('span', 'flex:none;width:24px;height:24px;border-radius:50%;background:var(--ok);color:#fff;font-weight:800;display:grid;place-items:center;font-size:13px', String(n));
    const body = el('div', 'flex:1;font-size:13.5px;line-height:1.4'); body.append(...kids);
    r.append(num, body); return r;
  };
  const copy = el('button', '', '📋 KI-Text kopieren'); copy.type = 'button'; copy.className = 'bdBtn primary small';
  box.append(
    step(1, copy, el('span', 'margin-left:8px;color:var(--muted)', 'ein fertiger Text, der der KI das Format erklärt')),
    step(2, el('span', '', 'In '), el('b', '', 'Claude, ChatGPT oder Gemini'), el('span', '', ' einfügen und ein '), el('b', '', 'Foto oder PDF deines Bauplans'),
      el('span', '', ' anhängen (Maße helfen). Die KI braucht ein paar Minuten.')),
    step(3, el('span', '', 'Ihre Antwort (das JSON) hier unten einfügen → '), el('b', '', 'Prüfen'), el('span', '', ' → '), el('b', '', 'Importieren'),
      el('span', '', '. Es entsteht immer ein neues Haus, nichts wird überschrieben.')),
    el('div', 'margin-top:8px;font-size:12.5px;color:var(--muted)', 'Danach: Räume und Geräte mit Home Assistant verbinden (🧭 Erste Schritte).'));
  hint.after(box);
  const bar = dlg.querySelector('.impBar');
  document.getElementById('importPrompt').style.display = 'none';
  bar.prepend(el('span', 'align-self:center;color:var(--muted);font-size:13px;margin-right:4px', 'Oder:'));
  document.getElementById('importText').placeholder = 'Antwort der KI (JSON) hier einfügen …';
}
