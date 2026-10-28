/* =========================================================
   Usajili na Kuingia kwa Watumiaji (email + password)
   ---------------------------------------------------------
   TAHADHARI: Mfumo huu unafanya kazi kwenye kivinjari tu
   (localStorage). Nenosiri huhifadhiwa kwa njia ya "hash"
   (PBKDF2 + salt), lakini hii HAIKUKUSUDIWA kuwa usalama
   kamili wa seva. Kwa usalama wa kweli tumia backend.
   ========================================================= */
const UKEY = 'mfumo_shule_users_v1';
const SKEY = 'mfumo_shule_session_v1';
const ROLES = { admin: 'Msimamizi', mwalimu: 'Mwalimu' };
let U = loadUsers();
let ME = null;
let fails = 0, lockUntil = 0;

function loadUsers() { try { return JSON.parse(localStorage.getItem(UKEY)) || []; } catch (e) { return []; } }
function saveUsers() { try { localStorage.setItem(UKEY, JSON.stringify(U)); } catch (e) { alert('Imeshindikana kuhifadhi watumiaji.'); } }
function isAdmin() { return !!ME && ME.role === 'admin'; }
const $ = id => document.getElementById(id);
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

function randSalt() {
  const a = new Uint8Array(16);
  (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = Math.floor(Math.random() * 256));
  return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
}
async function hashPw(pw, salt) {
  if (window.crypto && crypto.subtle) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
    return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, '0')).join('');
  }
  // Mbadala dhaifu endapo kivinjari hakina crypto.subtle
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57; const s = salt + pw;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'f' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}
function checkPw(pw, pw2) {
  if (pw.length < 6) return 'Nenosiri lazima liwe na herufi 6 au zaidi.';
  if (pw2 !== undefined && pw !== pw2) return 'Manenosiri hayafanani.';
  return '';
}
function setMsg(id, text, ok) {
  const el = $(id); if (!el) return;
  el.textContent = text || ''; el.className = 'msg' + (text ? (ok ? ' ok' : ' err') : '');
}

/* ---------- Mtiririko wa skrini ---------- */
function authInit() {
  const sid = sessionStorage.getItem(SKEY) || localStorage.getItem(SKEY);
  const u = sid && U.find(x => x.id === sid);
  if (u) { ME = u; enterApp(); return; }
  showAuth(U.length ? 'login' : 'setup');
}
function showAuth(mode) {
  $('appView').classList.add('hidden');
  $('authView').classList.remove('hidden');
  ['login', 'setup'].forEach(m => $('au-' + m).classList.toggle('hidden', m !== mode));
  document.body.dataset.sec = 'auth';
  setMsg('loginMsg', ''); setMsg('setupMsg', '');
  const f = $(mode === 'login' ? 'lEmail' : 'sName'); if (f) f.focus();
}
function enterApp() {
  $('authView').classList.add('hidden');
  $('appView').classList.remove('hidden');
  $('meName').textContent = ME.name || ME.email;
  $('meRole').textContent = ROLES[ME.role] || ME.role;
  document.querySelectorAll('.adminOnly').forEach(el => el.classList.toggle('hidden', !isAdmin()));
  startApp();
}

/* ---------- Usajili wa Msimamizi wa kwanza ---------- */
async function doSetup(ev) {
  ev.preventDefault();
  const name = $('sName').value.trim(), email = $('sEmail').value.trim().toLowerCase();
  const pw = $('sPw').value, pw2 = $('sPw2').value;
  if (!name) return setMsg('setupMsg', 'Andika jina lako.');
  if (!validEmail(email)) return setMsg('setupMsg', 'Email si sahihi.');
  const e = checkPw(pw, pw2); if (e) return setMsg('setupMsg', e);
  const salt = randSalt();
  const u = { id: uid(), name, email, role: 'admin', salt, hash: await hashPw(pw, salt), created: Date.now() };
  U.push(u); saveUsers();
  ME = u; sessionStorage.setItem(SKEY, u.id);
  $('setupForm').reset(); enterApp();
}

/* ---------- Kuingia / Kutoka ---------- */
async function doLogin(ev) {
  ev.preventDefault();
  const wait = Math.ceil((lockUntil - Date.now()) / 1000);
  if (wait > 0) return setMsg('loginMsg', 'Jaribio nyingi mno. Subiri sekunde ' + wait + '.');
  const email = $('lEmail').value.trim().toLowerCase(), pw = $('lPw').value;
  const u = U.find(x => x.email === email);
  const ok = u && (await hashPw(pw, u.salt)) === u.hash;
  if (!ok) {
    if (++fails >= 5) { lockUntil = Date.now() + 30000; fails = 0; }
    return setMsg('loginMsg', 'Email au nenosiri si sahihi.');
  }
  fails = 0; ME = u;
  sessionStorage.removeItem(SKEY); localStorage.removeItem(SKEY);
  (($('lRemember').checked) ? localStorage : sessionStorage).setItem(SKEY, u.id);
  $('loginForm').reset(); enterApp();
}
function logout() {
  sessionStorage.removeItem(SKEY); localStorage.removeItem(SKEY);
  ME = null; showAuth(U.length ? 'login' : 'setup');
}
function togglePw(id, btn) {
  const i = $(id); const show = i.type === 'password';
  i.type = show ? 'text' : 'password'; btn.textContent = show ? '🙈' : '👁';
}

/* ---------- Menyu ya WATUMIAJI (Msimamizi tu) ---------- */
function renderUsers() {
  if (!isAdmin()) return;
  $('uList').innerHTML = `<table><tr><th>#</th><th>Jina</th><th>Email</th><th>Jukumu</th><th>Vitendo</th></tr>` +
    U.map((u, i) => `<tr><td>${i + 1}</td><td class="l">${esc(u.name)}${u.id === ME.id ? ' <span class="badge">wewe</span>' : ''}</td>
    <td class="l">${esc(u.email)}</td><td>${ROLES[u.role] || u.role}</td>
    <td><button class="btn blue sm" onclick="resetPw('${u.id}')">Badili Nenosiri</button>
    ${u.id === ME.id ? '' : `<button class="btn red sm" onclick="delUser('${u.id}')">Futa</button>`}</td></tr>`).join('') + `</table>`;
  $('uCount').textContent = 'Jumla ya watumiaji: ' + U.length;
}
async function addUser(ev) {
  ev.preventDefault();
  const name = $('uName').value.trim(), email = $('uEmail').value.trim().toLowerCase();
  const pw = $('uPw').value, role = $('uRole').value;
  if (!name) return setMsg('uMsg', 'Andika jina la mtumiaji.');
  if (!validEmail(email)) return setMsg('uMsg', 'Email si sahihi.');
  if (U.some(x => x.email === email)) return setMsg('uMsg', 'Email hii tayari imesajiliwa.');
  const e = checkPw(pw); if (e) return setMsg('uMsg', e);
  const salt = randSalt();
  U.push({ id: uid(), name, email, role, salt, hash: await hashPw(pw, salt), created: Date.now() });
  saveUsers(); $('userForm').reset();
  setMsg('uMsg', 'Mtumiaji ' + name + ' amesajiliwa. Mpe email na nenosiri lake.', true);
  renderUsers();
}
async function resetPw(id) {
  const u = U.find(x => x.id === id); if (!u) return;
  const pw = prompt('Nenosiri jipya la ' + u.email + ' (angalau herufi 6):');
  if (pw === null) return;
  const e = checkPw(pw); if (e) { alert(e); return; }
  u.salt = randSalt(); u.hash = await hashPw(pw, u.salt); saveUsers();
  alert('Nenosiri limebadilishwa.');
}
function delUser(id) {
  const u = U.find(x => x.id === id); if (!u || u.id === ME.id) return;
  if (u.role === 'admin' && U.filter(x => x.role === 'admin').length < 2) { alert('Haiwezekani kufuta Msimamizi wa mwisho.'); return; }
  if (!confirm('Futa mtumiaji ' + u.email + '?')) return;
  U = U.filter(x => x.id !== id); saveUsers(); renderUsers();
}
async function changeMyPw() {
  const old = prompt('Nenosiri la sasa:'); if (old === null) return;
  if ((await hashPw(old, ME.salt)) !== ME.hash) { alert('Nenosiri la sasa si sahihi.'); return; }
  const pw = prompt('Nenosiri jipya (angalau herufi 6):'); if (pw === null) return;
  const e = checkPw(pw); if (e) { alert(e); return; }
  ME.salt = randSalt(); ME.hash = await hashPw(pw, ME.salt); saveUsers();
  alert('Nenosiri limebadilishwa.');
}

document.addEventListener('DOMContentLoaded', authInit);
