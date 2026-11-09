/* The add-on without Home Assistant's Supervisor (Home Assistant as a Docker container, #489): whoever opens the page logged in with
 * Home Assistant (server.py login_gate, halogin.py). Shows "Abmelden" in the top bar; when the login has run out, a request of the page
 * gets 401 with "X-Login" and the page goes to the login again. In the add-on (Ingress) nothing of this: api/me says login: false. */

/** me: api/me; t: i18n */
export function initLogin(me, t) {
  const b = document.getElementById('logoutBtn');
  if (!me?.login || !b) return;
  b.hidden = false;
  b.title = t('login.outTip', { name: me.user || '?' });
  b.addEventListener('click', () => { location.href = 'auth/logout'; });
  const ask = window.fetch.bind(window);
  let away = false;
  window.fetch = async (...args) => {
    const r = await ask(...args);
    if (r.status === 401 && r.headers.get('X-Login') === '1' && !away) { away = true; location.href = 'auth/login'; }
    return r;
  };
}
