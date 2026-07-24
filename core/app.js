/* ============ EdenRise app — router, state, player, tutor ============ */

/* ---------- state ---------- */
let S;
try { S = Object.assign({}, structuredClone(DEFAULT_STATE), JSON.parse(localStorage.getItem('edenrise-state-v2') || '{}')); }
catch { S = structuredClone(DEFAULT_STATE); }
const save = () => { localStorage.setItem('edenrise-state-v2', JSON.stringify(S)); if (window.EdenCloud && window.EdenCloud.push) window.EdenCloud.push(S); };

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const courseById = id => CATALOG.find(c => c.id === id);
const prog = id => S.progress[id];
const coursePct = id => { const p = prog(id); return p ? (p.done ? 100 : (p.pct || 0)) : 0; };
const isDone = id => !!(prog(id) && prog(id).done);
const inPath = id => S.path.includes(id);
const courseMins = c => c.moduleDurations ? c.moduleDurations.reduce((a, b) => a + (b || 12), 0) : c.modules.length * 12;
const moduleDur = (c, i) => (c.moduleDurations && c.moduleDurations[i]) ? c.moduleDurations[i] + 'm' : '12m';
/* studio meta (admin-managed, loaded from Firestore courses/__meta) */
let studioMeta = null;
const ORIG_COURSES = {};
const liveList = () => (studioMeta && Array.isArray(studioMeta.live) && studioMeta.live.length) ? studioMeta.live : LIVE_SESSIONS;
const fmtMins = m => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? (m % 60) + 'm' : ''}`.trim() : `${m}m`;
/* '2026-07' → 'Jul 2026' / 'jul 2026' — content-freshness dates (hand-rolled: locale data isn't guaranteed) */
const fmtYm = ym => { const [y, m] = String(ym).split('-'); const M = _lang() === 'pt' ? ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return (M[+m - 1] || m) + ' ' + y; };
const courseStale = c => !c.updated || (Date.now() - new Date(c.updated + '-01T12:00:00').getTime() > 366 * 864e5);
const vidFor = (id, mod) => VIDS[(id.length * 7 + mod * 3) % VIDS.length];
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
/* active white-label brand (from brandkit.js); EdenRise values are the fallback */
const BRAND = (typeof window !== 'undefined' && window.BRAND) || {};
const brandName = () => BRAND.name || 'EdenRise';
const brandAcademy = () => BRAND.academy || 'EdenRise Academy';
const brandEthos = () => BRAND.ethos || 'EdenRise, a regenerative-living farm and school in the Baixo Alentejo, Portugal. Its ethos: where nature leads, the land heals, and stewardship shapes everything. The courses teach regenerative living — soil, water, food forests, native flora, foraging, natural building, fire stewardship and nature connection.';
/* short descriptor used inside AI prompts ("… for {academy} — {shortDesc}") */
const brandShortDesc = () => BRAND.shortDesc || 'a regenerative-living school in the Baixo Alentejo, Portugal';
/* the real-world context AI quizzes/scenarios are grounded in (the client's world) */
const brandRealm = () => BRAND.realm || 'the Alentejo reality (heat, drought, fire season, cork-oak montado, clay soils, water scarcity, working as a team)';
/* location line for certificates / footers */
const brandLocation = () => BRAND.location || 'Baixo Alentejo, Portugal';

/* ================= R2-9 · Evidence ledger — proven learning, append-only =================
   One immutable, hash-chained stream of learning events per learner. Everything else
   (Verified-Competency %, certificates, compliance packs) is DERIVED from it; the ledger
   itself is never edited — any change breaks the chain, which is what makes an export
   defensible to an auditor. Designed to migrate 1:1 into Firestore (create-only rules). */
async function _ledgerSha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
}
let _ledgerChain = Promise.resolve();   /* serializes appends so the hash chain stays ordered */
function ledgerAppend(type, data = {}) {
  _ledgerChain = _ledgerChain.then(async () => {
    try {
      const L = (S.ledger = S.ledger || []);
      /* idempotent event kinds — never double-record the same fact */
      if (type === 'module_complete' && L.some(e => e.type === type && e.courseId === data.courseId && e.mod === data.mod)) return;
      if (type === 'course_complete' && L.some(e => e.type === type && e.courseId === data.courseId)) return;
      if (type === 'consent_given' && L.some(e => e.type === type)) return;
      if (type === 'pretest' && L.some(e => e.type === type && e.courseId === data.courseId)) return;
      const core = Object.assign({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        brandId: BRAND.id || 'edenrise',
        type,
        at: new Date().toISOString(),
        prevHash: L.length ? L[L.length - 1].hash : 'genesis'
      }, data);
      const hash = await _ledgerSha(JSON.stringify(core));
      L.push(Object.assign(core, { hash }));
      save();
    } catch (e) { /* the ledger must never break the app */ }
  });
  return _ledgerChain;
}
/* walk the chain recomputing every hash — any tamper breaks it */
/* ---- error beacon -----------------------------------------------------
   Breakage currently reaches us via a team member's WhatsApp screenshot. This
   captures runtime errors into a small ring buffer on the learner's state, so
   it rides the EXISTING cloud sync (no new endpoint, no rules change) and an
   admin reading member state sees what actually broke, on which brand/version.
   Capped and deduped — a render-loop error must not flood anyone's state doc. */
(function () {
  function logErr(kind, msg, src) {
    try {
      if (typeof S === 'undefined' || !S) return;
      const rec = { k: kind, m: String(msg).slice(0, 300), s: String(src || '').slice(0, 120),
                    at: new Date().toISOString(), v: (window.BRAND && BRAND.id) || '?' };
      const E = (S._errs = S._errs || []);
      const last = E[E.length - 1];
      if (last && last.m === rec.m) { last.n = (last.n || 1) + 1; last.at = rec.at; }
      else { E.push(rec); if (E.length > 15) E.splice(0, E.length - 15); }
      save();
    } catch (e) { /* the beacon must never itself break the app */ }
  }
  window.addEventListener('error', e => logErr('err', e.message, (e.filename || '') + ':' + (e.lineno || '')));
  window.addEventListener('unhandledrejection', e => logErr('rej', (e.reason && (e.reason.message || e.reason)) || 'unhandled rejection', ''));
})();

async function ledgerVerify(L = S.ledger || []) {
  let prev = 'genesis';
  for (const ev of L) {
    if (ev.prevHash !== prev) return { ok: false, at: ev.id };
    const { hash, ...core } = ev;
    if (await _ledgerSha(JSON.stringify(core)) !== hash) return { ok: false, at: ev.id };
    prev = hash;
  }
  return { ok: true, events: L.length };
}

/* ---- Bitcoin anchoring (OpenTimestamps) ------------------------------
   The chain proves internal consistency; the server pins it to OUR clock.
   Neither stops us, in principle, from having written the whole thing today.
   An OpenTimestamps proof closes that: the head hash is committed into a
   Bitcoin block, so the record is provably NOT back-dated — checkable by
   anyone, against the blockchain, with us switched off. Free, keyless.

   We stamp AT MOST ONCE A DAY, not once per anchor: the chain is linked, so
   one proof of the head proves every event behind it existed by then. Events
   after the newest stamp rest on server time until the next one. That is a
   deliberate, disclosed limit — cheap for us, and courteous to calendars that
   are run as a public good.

   Works for signed-out learners too: this needs no account, only the chain. */
const OTS_EVERY = 24 * 3600e3;      /* stamp the head at most daily        */
const OTS_RIPE  = 2 * 3600e3;       /* a calendar needs a block first (~1-2h) */
const b64 = b => btoa(String.fromCharCode.apply(null, b));
const unb64 = s => new Uint8Array(atob(s).split('').map(c => c.charCodeAt(0)));

async function otsMaintain() {
  if (!window.OTS || !navigator.onLine) return false;
  const L = S.ledger || []; if (!L.length) return false;
  const head = L[L.length - 1]; if (!head || !head.hash) return false;
  const recs = (S.ots = S.ots || []);
  let changed = false;

  /* 1 · upgrade anything still waiting on a block */
  for (const rec of recs) {
    if (rec.status === 'confirmed') continue;
    if (Date.now() - new Date(rec.at).getTime() < OTS_RIPE) continue;
    try {
      const { digest, tree } = OTS.parseFile(unb64(rec.ots));
      const up = await OTS.upgrade(tree, digest);
      if (!up.changed) continue;
      rec.ots = b64(OTS.fileBytes(digest, tree));
      if (up.info.complete) { rec.status = 'confirmed'; rec.height = up.info.bitcoin[0].height; }
      changed = true;
    } catch (e) { /* calendar down / not in a block yet — retry next time */ }
  }

  /* 2 · stamp the current head if it has moved and the day has turned */
  const newest = recs[recs.length - 1];
  const due = !newest || (newest.head !== head.hash && Date.now() - new Date(newest.at).getTime() > OTS_EVERY);
  if (due) {
    try {
      const digest = OTS.unhex(head.hash);
      const { tree, calendars } = await OTS.stamp(digest);
      recs.push({ head: head.hash, count: L.length, at: new Date().toISOString(), ots: b64(OTS.fileBytes(digest, tree)), status: 'pending', calendars });
      changed = true;
    } catch (e) { /* offline or every calendar down — try again later */ }
  }

  /* 3 · keep it small: the newest confirmed proof already covers everything
     behind it, so old confirmed proofs are redundant. Keep the last confirmed
     plus any still-pending ones. */
  if (recs.length > 6) {
    const lastConfirmed = recs.filter(r => r.status === 'confirmed').pop();
    S.ots = recs.filter(r => r.status !== 'confirmed' || r === lastConfirmed).slice(-6);
    changed = true;
  }
  if (changed) save();
  return changed;
}
/* the newest proof, preferring a confirmed one */
function otsBest() {
  const r = S.ots || [];
  return r.filter(x => x.status === 'confirmed').pop() || r[r.length - 1] || null;
}

/* ---- R2-5 · Verified-Competency — the metric above raw completion ----
   A course is VERIFIED only when the ledger holds: completion AND a passed
   scenario/application item AND a delayed (≥7 days) retrieval pass. */
function courseVerified(courseId, st = S) {
  const p = (st.progress || {})[courseId];
  if (!(p && p.done)) return false;
  const L = st.ledger || [];
  const doneAt = p.doneAt || 0;
  const scenario = L.some(e => e.type === 'application_item_pass' && e.courseId === courseId);
  const delayed = L.some(e => e.type === 'delayed_retrieval_pass' && e.courseId === courseId
    && (new Date(e.at).getTime() - doneAt) >= 7 * 864e5);
  return scenario && delayed;
}
function verifiedCompetency(st = S) {
  const done = CATALOG.filter(c => { const p = (st.progress || {})[c.id]; return p && p.done; });
  const v = done.filter(c => courseVerified(c.id, st));
  return { done: done.length, verified: v.length, pct: done.length ? Math.round(v.length / done.length * 100) : 0 };
}
/* identity — real profile name once signed in → their @username → email handle → warm generic.
   NEVER a hardcoded person: every user must see their own name. */
const displayName = () => (S.profile && S.profile.name)
  || (S.profile && S.profile.username)
  || (S.profile && S.profile.email ? S.profile.email.split('@')[0] : '')
  || (_lang() === 'pt' ? 'amigo' : 'friend');
const firstName = () => displayName().trim().split(/\s+/)[0];
const userHandle = () => (S.profile && S.profile.username) || '';
const userInitials = () => displayName().trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '🌱';
const slugHandle = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 20);
const suggestHandle = () => { const p = S.profile || {}; return slugHandle(p.username) || slugHandle(p.name) || slugHandle((p.email || '').split('@')[0]) || 'learner'; };
/* admin access — only these accounts see Analytics + Admin */
const ADMIN_EMAILS = ['admin@edenrise.com', 'info@edenrise.com', 'john@edenrise.com'];
const myEmail = () => ((S.profile && S.profile.email) || '').trim().toLowerCase();
const isSuperAdmin = () => ADMIN_EMAILS.includes(myEmail());
/* tenant admin: superadmin OR listed on the company doc */
const isAdmin = () => isSuperAdmin() || ((window.EdenCompany && EdenCompany.adminEmails) || []).map(e => (e || '').toLowerCase()).includes(myEmail());
const companyName = () => (window.EdenCompany && EdenCompany.name) || 'EdenRise';
const companyNif = () => (window.EdenCompany && EdenCompany.nif) || '';

function toast(msg, icon = '✨') {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  $('#toasts').appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 350); }, 2600);
}

/* ---------- EdenRise line-icon set (hand-drawn, single stroke) ---------- */
const ICONS = {
  leaf: '<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z"/><path d="M5 19C9 15 13 11 17 9"/>',
  sprout: '<path d="M12 21v-7"/><path d="M12 14c-4 0-6-2.5-6-6 4 0 6 2.5 6 6z"/><path d="M12 12c0-3 2-5 5-5 0 3-2 5-5 5z"/>',
  tree: '<circle cx="12" cy="8.5" r="5.4"/><path d="M12 13.9V21"/><path d="M12 21c-1.4 0-2.5-.6-3-1.6M12 21c1.4 0 2.5-.6 3-1.6"/>',
  sun: '<circle cx="12" cy="12" r="4.1"/><path d="M12 2.4v2.6M12 19v2.6M2.4 12H5M19 12h2.6M5 5l1.8 1.8M17.2 17.2L19 19M19 5l-1.8 1.8M6.8 17.2L5 19"/>',
  drop: '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/><path d="M9.5 14.5a2.6 2.6 0 0 0 2.5 2.4"/>',
  waves: '<path d="M2 8c2 0 2 1.8 4 1.8S8 8 10 8s2 1.8 4 1.8S16 8 18 8s2 1.8 4 1.8"/><path d="M2 13c2 0 2 1.8 4 1.8S8 13 10 13s2 1.8 4 1.8 2-1.8 4-1.8 2 1.8 4 1.8"/><path d="M2 18c2 0 2 1.8 4 1.8S8 18 10 18s2 1.8 4 1.8 2-1.8 4-1.8 2 1.8 4 1.8"/>',
  mountain: '<path d="M3 19l6-10 4 6 2-3.2 6 7.2z"/><circle cx="16.5" cy="6.5" r="1.6"/>',
  seed: '<path d="M12 4c3.4 2.4 5 6 5 9a5 5 0 0 1-10 0c0-3 1.6-6.6 5-9z"/><path d="M9.6 13.4c1 1.5 3.8 1.5 4.8 0"/>',
  hands: '<path d="M4 13c0-2 2-3 4-3M20 13c0-2-2-3-4-3"/><path d="M4 13c0 4.5 3.5 7 8 7s8-2.5 8-7"/><path d="M12 11V5M10 7l2-2 2 2"/>',
  heart: '<path d="M12 20s-7-4.4-9-8.6C1.6 7.6 4 4.6 7 5.1c2 .3 3.5 2 5 3.6 1.5-1.6 3-3.3 5-3.6 3-.5 5.4 2.5 4 6.3-2 4.2-9 8.6-9 8.6z"/>',
  people: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.3"/><path d="M3 20c0-3.4 2.7-6 6-6s6 2.6 6 6"/><path d="M15.5 14.2c3 0 5.5 2.2 5.5 5.8"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z"/>',
  flower: '<circle cx="12" cy="6.6" r="2.4"/><circle cx="17" cy="10.2" r="2.4"/><circle cx="15.1" cy="16" r="2.4"/><circle cx="8.9" cy="16" r="2.4"/><circle cx="7" cy="10.2" r="2.4"/><circle cx="12" cy="11.6" r="2.1"/>',
  bird: '<path d="M21 7c-3 0-5 2.2-8 2.2S9 7 6.3 7C4.5 7 3 8 3 9.8c4 0 5 4.4 9 4.4s6.5-3.2 6.5-7.4"/><circle cx="18" cy="6.4" r=".5"/>',
  fire: '<path d="M12 3s5 3.6 5 9a5 5 0 0 1-10 0c0-2.6 1.6-4.1 2.6-5 .2 1.5 1.4 2 1.4 2C11 7 11 4.6 12 3z"/>',
  moon: '<path d="M20 13.6A8 8 0 1 1 10.4 4 6.2 6.2 0 0 0 20 13.6z"/>',
  basket: '<path d="M4 9h16l-1.5 9.4a2 2 0 0 1-2 1.6H7.5a2 2 0 0 1-2-1.6z"/><path d="M8.2 9 11 4M15.8 9 13 4"/>'
};
function svgIcon(name, cls) {
  const body = ICONS[name] || ICONS.leaf;
  return `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

/* ---------- gamification engine ---------- */
function levelFor(xp) {
  let idx = 0;
  LEVELS.forEach((l, i) => { if (xp >= l.xp) idx = i; });
  const cur = LEVELS[idx], next = LEVELS[idx + 1];
  return { idx, name: cur.name, base: cur.xp, next: next ? next.xp : null,
    toNext: next ? next.xp - xp : 0,
    pct: next ? Math.round((xp - cur.xp) / (next.xp - cur.xp) * 100) : 100 };
}
function seedXp() {
  let xp = 0;
  CATALOG.forEach(c => { const p = prog(c.id); if (!p) return; if (p.done) xp += XP.course + (p.cert ? XP.cert : 0); else xp += (p.mod || 0) * XP.module; });
  xp += (S.quizzesPassed || 0) * XP.quiz;
  return xp;
}
const weekKey = () => { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d.toISOString().slice(0, 10); };
function touchWeekXp() { const wk = weekKey(); if (S.weekStart !== wk) { S.weekStart = wk; S.weekBaseXp = S.xp || 0; } }
function awardXp(n, reason) {
  touchWeekXp();
  const before = levelFor(S.xp).idx;
  S.xp += n;
  const after = levelFor(S.xp).idx;
  save(); updateXpChip();
  toast(`+${n} XP${reason ? ' · ' + reason : ''}`, '✦');
  if (after > before) setTimeout(() => celebrateLevel(after), 700);
}
/* restrained level-up moment — one breath of celebration, never confetti-noise */
function celebrateLevel(idx) {
  if (document.querySelector('.levelup')) return;
  const el = document.createElement('div');
  el.className = 'levelup';
  el.innerHTML = `<div class="levelup-card"><div class="levelup-ring">🌿</div><div class="levelup-eyebrow">${_lang() === 'pt' ? 'Novo nível' : 'Level up'}</div><div class="levelup-name">${tlevel(idx)}</div></div>`;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('leave'), 2300);
  setTimeout(() => el.remove(), 2900);
}
function badgeEarned(id) {
  const done = CATALOG.filter(c => isDone(c.id));
  const cats = new Set(CATALOG.filter(c => coursePct(c.id) > 0).map(c => c.cat));
  switch (id) {
    case 'first-steps': return Object.values(S.progress).some(p => p.done || (p.mod || 0) > 0);
    case 'rooted': return done.length >= 1;
    case 'quiz-ace': return (S.quizzesPassed || 0) >= 1;
    case 'grove': return done.length >= 3;
    case 'streak-7': return (S.streak || 0) >= 7;
    case 'pathfinder': return S.path.length > 0 && S.path.every(isDone);
    case 'curious': return cats.size >= 3;
    case 'certified': return done.some(c => prog(c.id).cert);
  }
  return false;
}
function checkBadges(silent) {
  let earned = [];
  BADGES.forEach(b => { if (!S.badges.includes(b.id) && badgeEarned(b.id)) { S.badges.push(b.id); earned.push(b); } });
  if (earned.length) { save(); if (!silent) earned.forEach((b, i) => setTimeout(() => toast(`Badge earned — ${b.title} 🏅`, '🏅'), 500 + i * 900)); }
}
let boardCache = null;   /* real members, from the leaderboard collection */
let boardScope = 'all';
function leaderboard() {
  touchWeekXp();
  const wk = weekKey();
  const weekly = r => (r.weekStart === wk ? Math.max(0, (r.xp || 0) - (r.weekBaseXp || 0)) : 0);
  const meRow = { uid: myUid(), name: displayName(), initials: userInitials(), grad: 3, xp: S.xp || 0, streak: S.streak || 0, me: true, dept: (S.profile && S.profile.dept) || null, weekStart: S.weekStart, weekBaseXp: S.weekBaseXp || 0 };
  let others = (boardCache || []).filter(r => r.uid && r.uid !== meRow.uid).map(r => Object.assign({ grad: 3 }, r, { me: false }));
  if (boardScope === 'dept' && meRow.dept) others = others.filter(r => r.dept === meRow.dept);
  let rows = [meRow, ...others];
  if (boardScope === 'week') rows = rows.map(r => Object.assign({}, r, { xp: weekly(r) }));
  return rows.sort((a, b) => b.xp - a.xp);
}
function initBoard(retries) {
  if (!(window.EdenCloud && EdenCloud.listBoard)) {
    if ((retries || 0) < 16) setTimeout(() => initBoard((retries || 0) + 1), 400);
    return;
  }
  EdenCloud.listBoard().then(rows => {
    boardCache = rows;
    if (location.hash.indexOf('#/progress') === 0) render();
  }).catch(() => {});
}
function myRank() {
  const b = leaderboard();
  const i = b.findIndex(r => r.me);
  return { rank: i + 1, total: b.length, ahead: i > 0 ? b[i - 1] : null };
}
function updateXpChip() {
  const lv = levelFor(S.xp);
  const html = `${svgIcon('sprout')}<span>${lv.name} · ${S.xp} XP</span>`;
  [$('#xpChip'), $('#xpChipMobile')].forEach(c => { if (c) c.innerHTML = html; });
}

/* ---------- card builder ---------- */
function cardHTML(c, opts = {}) {
  const pct = coursePct(c.id);
  const p = prog(c.id);
  const chips = [];
  if (opts.rank) chips.push(`<span class="chip">#${opts.rank} ${t('this_week_rank')}</span>`);
  if (c.ai) chips.push(`<span class="chip ai">${t('ai_path_chip')}</span>`);
  if (c.required) chips.push(`<span class="chip">${t('assigned_tag')}</span>`);
  else if (inPath(c.id)) chips.push(`<span class="chip choice">${t('chosen_tag')}</span>`);
  if (c.teamGoal) chips.push(`<span class="chip">${t('team_goal')}</span>`);
  if (c.isNew) chips.push(`<span class="chip">${t('new')}</span>`);
  if (p && !p.done) chips.push(`<span class="chip">${t('module')} ${(p.mod || 0) + 1}/${c.modules.length}</span>`);
  let foot = '';
  if (pct > 0 && pct < 100) foot = `<div class="card-progress"><div class="fill" style="width:${pct}%"></div></div>`;
  if (isDone(c.id)) foot = `<span class="due ok">✓ ${t('completed')}${p.cert ? ' · ' + t('cert_issued') : ` · ${p.score || 90}%`}</span>`;
  else if (c.due) foot += `<span class="due">⏰ ${c.due}</span>`;
  return `
  <article class="card" data-action="open-course" data-id="${c.id}">
    <div class="card-actions">
      <button class="icon-btn" data-action="play" data-id="${c.id}" aria-label="Play ${ctitle(c)}" title="Play">▶</button>
      <button class="icon-btn ${inPath(c.id) ? 'in-path' : ''}" data-action="toggle-path" data-id="${c.id}" aria-label="${inPath(c.id) ? 'Remove from your path' : 'Add to your path'}" title="${inPath(c.id) ? 'In your path' : 'Add to path'}">${inPath(c.id) ? '✓' : '＋'}</button>
    </div>
    <div class="thumb t-grad-${c.grad} ${c.poster ? 'has-poster' : ''}"${c.poster ? ` data-bg="${c.poster}"` : ''}>${c.poster ? '' : `<span class="big-icon">${svgIcon(c.icon)}</span>`}<div class="chip-row">${chips.join('')}</div></div>
    <div class="card-body">
      <h3>${ctitle(c)}</h3>
      <p class="card-hook">${chook(c)}</p>
      <div class="meta"><span>${tcat(c.cat)}</span><span class="dot"></span><span>${fmtMins(courseMins(c))}</span><span class="dot"></span><span>★ ${c.rating}</span></div>
      ${foot}
    </div>
  </article>`;
}

function railHTML(title, hint, cards, seeAllRoute) {
  if (!cards.length) return '';
  return `
  <section class="rail-section">
    <div class="rail-head">
      <h2>${title}</h2><span class="hint">${hint}</span>
      <button class="see-all" data-action="goto" data-route="${seeAllRoute || '#/library'}">${t('see_all')}</button>
    </div>
    <div class="rail-wrap">
      <button class="rail-arrow prev" data-action="rail" data-dir="-1" aria-label="Scroll left">‹</button>
      <div class="rail">${cards.join('')}</div>
      <button class="rail-arrow next" data-action="rail" data-dir="1" aria-label="Scroll right">›</button>
    </div>
  </section>`;
}

/* ---------- path helpers ---------- */
function pathStatus(id) {
  if (isDone(id)) return 'done';
  const firstIncomplete = S.path.find(x => !isDone(x));
  return id === firstIncomplete ? 'current' : 'locked';
}
function pathStepperHTML() {
  return `<div class="stepper">${S.path.map(id => {
    const c = courseById(id); if (!c) return '';
    const st = pathStatus(id); const p = prog(id);
    const node = st === 'done' ? '✓' : st === 'current' ? '▶' : svgIcon(c.icon);
    const sub = st === 'done' ? `${t('completed')}${p && p.score ? ' · ' + p.score + '%' : ''}` : st === 'current' ? `${t('in_progress')} · ${coursePct(id)}%` : (S.path.indexOf(id) === S.path.findIndex(x => !isDone(x)) + 1 ? t('next_up') : t('locked'));
    return `<div class="seg ${st}" data-action="open-course" data-id="${id}"><div class="snode">${node}</div><div class="sl">${ctitle(c)}</div><div class="sd">${sub}</div></div>`;
  }).join('')}</div>`;
}

/* ---------- pages ---------- */
function renderHome() {
  const featured = S.path.map(courseById).filter(Boolean).find(c => !isDone(c.id))   /* real, existing, not-done path course */
    || CATALOG.find(c => c.featured && !isDone(c.id)) || CATALOG.find(c => !isDone(c.id))
    || CATALOG.find(c => c.featured) || CATALOG[0];                                    /* always a real course */
  const featuredCourses = CATALOG.filter(c => c.featured);
  const fp = prog(featured.id);
  const continuing = CATALOG.filter(c => coursePct(c.id) > 0 && !isDone(c.id));
  const adminAssigned = S.assignments
    .map(a => { const c = courseById(a.courseId); return c ? Object.assign({}, c, { due: `Due ${a.due}`, required: true }) : null; })
    .filter(Boolean);
  const assigned = [...adminAssigned, ...CATALOG.filter(c => (c.required || c.teamGoal || c.id === 'new-manager') && !adminAssigned.some(a => a.id === c.id))];
  const trending = [...CATALOG].sort((a, b) => (a.trending || 99) - (b.trending || 99)).slice(0, 6);
  const recs = CATALOG.filter(c => c.cat === 'Analytics' && !isDone(c.id) && coursePct(c.id) === 0).slice(0, 5);
  const heroSide = S.path.slice(0, 5).map(id => {
    const c = courseById(id); const st = pathStatus(id); const p = prog(id);
    const nodeCls = st === 'done' ? 'node-done' : st === 'current' ? 'node-active' : 'node-locked';
    const node = st === 'done' ? '✓' : st === 'current' ? '▶' : S.path.indexOf(id) + 1;
    const sub = st === 'done' ? `${t('completed')}${p && p.note ? ' · ' + tnote(p.note) : p && p.score ? ' · ' + t('scored') + ' ' + p.score + '%' : ''}` : st === 'current' ? `${t('in_progress')} · ${t('adapted_today')}` : t('unlocks_after');
    return `<div class="path-step ${st === 'current' ? 'step-active' : ''}" data-action="open-course" data-id="${id}">
      <div class="step-node ${nodeCls}">${node}</div>
      <div class="step-info"><div class="t">${ctitle(c)}</div><div class="s">${sub}</div></div></div>`;
  }).join('');
  const words = ctitle(featured).split(' ');
  const lastWord = words.pop();

  return `<div class="page">
  <header class="hero">
    <div class="hero-bg"></div><div class="hero-grid"></div>
    ${featured.poster ? `<div class="hero-art" style="background-image:url('${featured.poster}')"></div>` : ''}
    <div class="orb orb-1"></div><div class="orb orb-2"></div><div class="hero-fade"></div>
    <div class="hero-content">
      <span class="hero-eyebrow"><span class="pulse-dot"></span>${t('featured_eyebrow')}</span>
      <h1>${words.join(' ')} <span class="grad-text">${lastWord}</span></h1>
      <div class="hero-meta">
        <span class="match">✦ ${t('match_goal')} · ${tgoal(S.goal)}</span><span class="sep"></span>
        <span>${featured.modules.length} ${t('modules')}</span><span class="sep"></span>
        <span>${fmtMins(courseMins(featured))}</span><span class="sep"></span>
        <span>${t(featured.level) || featured.level}</span>
        <span class="badge-hd">${t('certified')}</span>
      </div>
      <p class="desc"><span class="hook-line">${chook(featured)}</span> ${chooksub(featured)}</p>
      <div class="hero-actions">
        <button class="btn btn-primary" data-action="play" data-id="${featured.id}">▶&nbsp; ${fp && fp.mod != null ? `${t('resume_module')} ${fp.mod + 1}` : t('start_learning')}</button>
        <button class="btn btn-glass" data-action="ai-overview" data-id="${featured.id}">✦&nbsp; ${t('ai_overview')}</button>
        <button class="btn btn-glass" data-action="toggle-path" data-id="${featured.id}">${inPath(featured.id) ? t('in_my_path') : t('my_path')}</button>
      </div>
      <div class="hero-progress">
        <div class="track"><div class="fill" style="width:${coursePct(featured.id)}%"></div></div>
        <span>${coursePct(featured.id)}% ${t('complete')} · ${t('est')} ${fmtMins(Math.round(courseMins(featured) * (100 - coursePct(featured.id)) / 100))} ${t('left')}</span>
      </div>
      <button class="link-quiet" data-action="ai-missing">${t('missing_ask')}</button>
    </div>
    <aside class="hero-side">
      <h4><span class="ai-spark">✦</span> ${t('your_ai_path')}</h4>
      ${heroSide}
    </aside>
  </header>
  <div class="hero-divider" aria-hidden="true"></div>
  ${featuredCourses.length ? railHTML(t('featured_h'), t('featured_sub'), featuredCourses.map(c => cardHTML(c))) : ''}
  ${dailyDropHTML()}
  ${assignmentCardsHTML()}
  ${askBarHTML()}
  ${digestsSectionHTML()}
  ${railHTML(t('continue_learning'), t('synced_devices'), continuing.map(c => cardHTML(c)))}
  ${railHTML(t('assigned_you'), t('from_stewardship'), assigned.map(c => cardHTML(c)))}
  <section class="path-banner">
    <div class="shimmer"></div>
    <div class="path-banner-head">
      <div class="left">
        <span class="ai-tag">${t('generated_by_ai')}</span>
        <h2>${t('your_path_to')} ${tgoal(S.goal)}</h2>
        <p class="sub">${t('path_intro')}</p>
      </div>
      <button class="btn btn-glass" data-action="regen-path" id="regenBtn">${t('regenerate_path')}</button>
    </div>
    ${pathStepperHTML()}
    <div class="path-banner-foot">
      <div class="why">💡 <span><b>${t('why_order')}</b>&nbsp; ${PATH_RATIONALES[S.rationaleIdx % PATH_RATIONALES.length]}</span></div>
    </div>
  </section>
  <section class="stats">
    <div class="stat"><div class="num">${S.streak || 0}d</div><div class="lbl">${t('learning_streak')}</div><div class="delta">${(S.streak || 0) > 0 && S.streak >= (S.bestStreak || 0) ? t('personal_best') : (S.bestStreak ? `${t('stats_best')} ${S.bestStreak}d` : t('no_data'))}</div></div>
    <div class="stat"><div class="num">${fmtMins(weekMinutes())}</div><div class="lbl">${t('this_week')}</div><div class="delta">${minutesLast7()[6].v ? `▲ ${minutesLast7()[6].v}m ${t('stats_today')}` : t('no_data')}</div></div>
    <div class="stat"><div class="num">${Object.values(S.progress).filter(p => p.done).length + S.quizzesPassed}</div><div class="lbl">${t('skills_verified')}</div><div class="delta">${S.quizzesPassed ? `▲ ${S.quizzesPassed} ${t('from_quizzes')}` : t('no_data')}</div></div>
    <div class="stat"><div class="num">${avgQuizScore() != null ? avgQuizScore() + '%' : t('no_data')}</div><div class="lbl">${t('avg_score')}</div><div class="delta">${(S.quizScores || []).length ? (S.quizScores.length + ' ' + t('stats_quizzes')) : t('earn_first')}</div></div>
  </section>
  ${railHTML(t('trending'), t('community_learning'), trending.map((c, i) => cardHTML(c, { rank: c.trending })))}
  ${railHTML(`${t('because_completed')} “${_lang() === 'pt' ? 'Solo Vivo' : 'Living Soil'}”`, t('ai_recommendations'), recs.map(c => cardHTML(c)))}
  ${footerHTML()}</div>`;
}

let libFilter = 'All', libQuery = '';
function renderLibrary() {
  const cats = ['All', ...new Set(CATALOG.map(c => c.cat))];
  let list = CATALOG.filter(c => (libFilter === 'All' || c.cat === libFilter) &&
    (!libQuery || (c.title + ' ' + c.cat + ' ' + c.desc + ' ' + ctitle(c) + ' ' + cdesc(c) + ' ' + tcat(c.cat)).toLowerCase().includes(libQuery.toLowerCase())));
  return `<div class="page"><div class="page-pad">
    <h1 class="page-title">${t('library_title')}</h1>
    <p class="page-sub">${CATALOG.length} ${t('courses_tended')}</p>
    <div class="lib-search">⌕ <input id="libSearch" placeholder="${t('filter_library')}" value="${esc(libQuery)}"></div>
    <div class="filter-row">${cats.map(c => `<button class="filter-chip ${c === libFilter ? 'active' : ''}" data-action="lib-filter" data-cat="${c}">${c === 'All' ? t('all') : tcat(c)}</button>`).join('')}</div>
    <div class="grid">${list.map(c => cardHTML(c)).join('')}</div>
    ${list.length ? '' : `<p class="empty-note">${t('nothing_matches')}</p>`}
  </div>${footerHTML()}</div>`;
}

function renderPaths() {
  const doneCount = S.path.filter(isDone).length;
  return `<div class="page"><div class="page-pad">
    <h1 class="page-title">Learning Paths</h1>
    <p class="page-sub">Adaptive sequences toward a goal. Finish a step and the AI re-plans the rest around what you proved you know.</p>
  </div>
  <section class="path-banner">
    <div class="shimmer"></div>
    <div class="path-banner-head">
      <div class="left">
        <span class="ai-tag">✦ Active path · ${doneCount}/${S.path.length} complete</span>
        <h2>Your path to ${S.goal}</h2>
        <p class="sub">${PATH_RATIONALES[S.rationaleIdx % PATH_RATIONALES.length]}</p>
      </div>
      <button class="btn btn-glass" data-action="regen-path" id="regenBtn">Regenerate path ↺</button>
    </div>
    ${pathStepperHTML()}
  </section>
  <div class="page-pad" style="padding-top:26px;">${journeysSectionHTML()}</div>
  ${railHTML('Courses in this path', 'In AI-planned order', S.path.map(id => courseById(id)).filter(Boolean).map(c => cardHTML(c)))}
  ${railHTML('Suggested next paths', 'Based on your goal & org needs', ['regen-design', 'capstone-land', 'community-land', 'seasonal-rhythm'].map(id => courseById(id)).filter(Boolean).map(c => cardHTML(c)))}
  ${footerHTML()}</div>`;
}

function renderLive() {
  return `<div class="page"><div class="page-pad">
    <h1 class="page-title">${t('live_title')}</h1>
    <p class="page-sub">${t('live_sub')}</p>
    ${liveList().map(s => `
      <div class="live-card">
        <div class="live-thumb t-grad-${s.grad}">${svgIcon(s.icon)}${s.live ? '<span class="live-badge">● LIVE</span>' : ''}</div>
        <div class="live-info">
          <h3>${s.title}</h3><div class="host">${s.host}</div><div class="d">${s.desc}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:12px;">
          <span class="live-when">${s.live ? `🔴 ${s.viewers} ${t('watching')}` : s.when}</span>
          ${s.live
            ? `<button class="btn btn-primary btn-sm" data-action="join-live" data-id="${s.id}">${t('join_now')}</button>`
            : `<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:12px;color:var(--text-faint);font-weight:600;">${t('remind_me')}</span><div class="toggle ${S.reminders.includes(s.id) ? 'on' : ''}" data-action="remind" data-id="${s.id}"></div></div>${s.date ? `<button class="btn btn-glass btn-sm" data-action="cal-ics" data-id="${s.id}">📅 ${t('cal_add')}</button>` : ''}`}
        </div>
      </div>`).join('')}
  </div>${footerHTML()}</div>`;
}

function renderAnalytics() {
  const week = minutesLast7();
  const max = Math.max(...week.map(w => w.v), 1);
  /* real skill picture: completion per category the learner has touched */
  const cats = [...new Set(CATALOG.map(c => c.cat))].map(cat => {
    const all = CATALOG.filter(c => c.cat === cat);
    const touched = all.filter(c => coursePct(c.id) > 0);
    if (!touched.length) return null;
    return [tcat(cat), Math.round(all.reduce((a, c) => a + coursePct(c.id), 0) / all.length)];
  }).filter(Boolean).sort((a, b) => b[1] - a[1]);
  const certs = CATALOG.filter(c => isDone(c.id));
  return `<div class="page"><div class="page-pad">
    <h1 class="page-title">Analytics</h1>
    <p class="page-sub">Your learning, measured — every number here is real.</p>
    <section class="stats" style="margin:28px 0 0;">
      <div class="stat"><div class="num">${S.streak || 0}d</div><div class="lbl">${t('learning_streak')}</div><div class="delta">${S.bestStreak ? t('stats_best') + ' ' + S.bestStreak + 'd' : t('no_data')}</div></div>
      <div class="stat"><div class="num">${fmtMins(weekMinutes())}</div><div class="lbl">${t('this_week')}</div><div class="delta">${week[6].v ? '▲ ' + week[6].v + 'm ' + t('stats_today') : t('no_data')}</div></div>
      <div class="stat"><div class="num">${certs.length}</div><div class="lbl">Certificates</div><div class="delta">${certs.length ? '▲' : t('no_data')}</div></div>
      <div class="stat"><div class="num">${S.quizzesPassed}</div><div class="lbl">Quizzes passed</div><div class="delta">${avgQuizScore() != null ? 'avg ' + avgQuizScore() + '%' : t('no_data')}</div></div>
    </section>
    <div class="two-col" style="margin-top:18px;">
      <div class="chart-card">
        <h3>Minutes learned · last 7 days</h3>
        <div class="bars">${week.map((w, i) => `
          <div class="bar-col">
            <span class="bv">${w.v || ''}</span>
            <div class="bar ${i === 6 ? 'today' : ''}" style="height:${Math.max(4, w.v / max * 100)}%"></div>
            <span class="bl">${w.label}</span>
          </div>`).join('')}
        </div>
      </div>
      <div class="chart-card">
        <h3>Certificates</h3>
        ${certs.map(c => `<div class="cert-row"><span class="ci">${svgIcon(c.icon)}</span><span class="ct">${ctitle(c)}</span><span class="cd">★ verified</span></div>`).join('') || '<p class="empty-note">Complete a course to earn your first certificate.</p>'}
      </div>
    </div>
    <div class="chart-card">
      <h3>Category progress · from your real activity</h3>
      ${cats.map(([n, v]) => `<div class="skill-row"><span class="sn">${n}</span><div class="track"><div class="fill" style="width:${v}%"></div></div><span class="sv">${v}%</span></div>`).join('') || '<p class="empty-note">Start a course and your picture builds here.</p>'}
    </div>
  </div>${footerHTML()}</div>`;
}

function renderCourse(id) {
  const c = courseById(id);
  if (!c) { location.hash = '#/home'; return ''; }
  if (myMissions === null && S.profile && S.profile.uid && window.EdenMissions) { myMissions = []; loadMyMissions(); }
  const p = prog(id);
  const cur = p && !p.done ? (p.mod || 0) : -1;
  const modules = c.modules.map((m, i) => {
    const mm = modMedia(c, i);
    const soon = mm && mm.type === 'soon';
    const done = isDone(id) || (p && !p.done && i < (p.mod || 0));
    const isCur = i === cur && !soon;
    const review = S.review[id] === i;
    const seqLocked = c.sequential && i > 0 && !done && !isDone(id) && !(p && i <= (p.mod || 0));
    if (seqLocked && !soon) {
      return `<div class="module-row locked" data-action="seq-locked">
        <div class="m-num">🔒</div>
        <div class="m-title">${cmods(c)[i] || m}</div>
        <span class="m-dur">${moduleDur(c, i)}</span>
      </div>`;
    }
    if (soon) {
      return `<div class="module-row soon">
        <div class="m-num">🔒</div>
        <div class="m-title">${t('coming_soon')}</div>
        <span class="m-dur">${t('coming_soon')}</span>
      </div>`;
    }
    return `<div class="module-row ${done ? 'done' : ''} ${isCur ? 'current' : ''}" data-action="play" data-id="${id}" data-mod="${i}">
      <div class="m-num">${done ? '✓' : isCur ? '▶' : i + 1}</div>
      <div class="m-title">${cmods(c)[i] || m}${review ? ' &nbsp;<span class="review-flag">↺ AI re-queued for review</span>' : ''}</div>
      <span class="m-dur">${moduleDur(c, i)}</span>
      <button class="m-play">▶</button>
    </div>`;
  }).join('');
  return `<div class="page">
    <div class="course-hero">
      <div class="bg t-grad-${c.grad}"${c.poster ? ` style="background-image:url('${c.poster}');background-size:cover;background-position:center"` : ''}></div>
      <div class="course-hero-inner">
        ${c.poster ? `<div class="course-poster has-poster" style="background-image:url('${c.poster}')"></div>` : `<div class="course-poster t-grad-${c.grad}">${svgIcon(c.icon)}</div>`}
        <div class="course-info">
          <div class="hero-meta">
            <span class="match">${c.ai ? t('in_ai_rotation') : tcat(c.cat)}</span><span class="sep"></span>
            <span>${c.modules.length} ${t('modules')}</span><span class="sep"></span>
            <span>${fmtMins(courseMins(c))}</span><span class="sep"></span><span>${t(c.level) || c.level}</span>
            <span class="sep"></span><span>★ ${c.rating} · ${c.learners} ${t('learners')}</span>
            ${c.updated ? `<span class="sep"></span><span class="fresh-tag">${t('updated_lbl')} ${fmtYm(c.updated)}</span>` : ''}
          </div>
          <h1>${ctitle(c)}</h1>
          <p class="course-hook">${chook(c)}</p>
          <p class="desc">${chooksub(c)} ${cdesc(c)}</p>
          <div class="hero-actions">
            <button class="btn btn-primary" data-action="play" data-id="${id}">▶&nbsp; ${isDone(id) ? t('rewatch') : p ? `${t('resume_module')} ${(p.mod || 0) + 1}` : t('start_course')}</button>
            <button class="btn btn-glass" data-action="quiz" data-id="${id}">🎯&nbsp; ${t('quiz_me')}</button>
            <button class="btn btn-glass" data-action="ai-overview" data-id="${id}">✦&nbsp; ${t('ai_overview')}</button>
            <button class="btn btn-glass" data-action="toggle-path" data-id="${id}">${inPath(id) ? t('in_my_path') : t('my_path')}</button>
          </div>
          ${coursePct(id) > 0 && !isDone(id) ? `<div class="hero-progress"><div class="track"><div class="fill" style="width:${coursePct(id)}%"></div></div><span>${coursePct(id)}% ${t('complete')}</span></div>` : ''}
          ${isDone(id) ? (() => { const rs = recertState(c); return `<div class="hero-progress"><span class="due ${rs && rs.st !== 'ok' ? '' : 'ok'}" style="margin:0;">${rs && rs.st === 'expired' ? '🛡 ' + t('comp_expired') + ' — ' + t('comp_renew').toLowerCase() : rs && rs.st === 'expiring' ? '🛡 ' + t('comp_expiring') + ' (' + rs.days + 'd)' : '✓ ' + t('completed') + (p.score ? ' · ' + t('scored') + ' ' + p.score + '%' : '')}</span></div>`; })() : ''}
        </div>
      </div>
    </div>
    <div class="rail-head" style="margin-top:14px;"><h2>${t('modules_h')}</h2><span class="hint">${t('tap_module')}</span></div>
    <div class="module-list">${modules}</div>
    <div class="page-pad" style="padding-top:0;">
      ${resourcesHTML(c)}
      ${missionCardHTML(c)}
      ${coachCardHTML(c)}
    </div>
    ${railHTML(t('more_in') + ' ' + tcat(c.cat), t('related_courses'), CATALOG.filter(x => x.cat === c.cat && x.id !== id).map(x => cardHTML(x)))}
    ${footerHTML()}</div>`;
}

const footerHTML = () => `
<footer>
  <div class="logo"><span class="logo-mark"><svg class="er-mark" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 37.5V15a11 11 0 0 1 22 0v22.5" stroke="rgba(166,195,165,.5)" stroke-width="1"/><g transform="translate(15 0)"><path d="M0 33V13" stroke="#b27a52" stroke-width="1.1" stroke-linecap="round"/><g fill="#b27a52"><path d="M0 0C-3.4-3-3.4-9 0-12 3.4-9 3.4-3 0 0Z" transform="translate(0 13)"/><path d="M0 0C-3.1-2.6-3.1-8 0-11 3.1-8 3.1-2.6 0 0Z" transform="translate(0 18) rotate(36)"/><path d="M0 0C-3.1-2.6-3.1-8 0-11 3.1-8 3.1-2.6 0 0Z" transform="translate(0 18) rotate(-36)"/><path d="M0 0C-2.9-2.4-2.9-7.4 0-10 2.9-7.4 2.9-2.4 0 0Z" transform="translate(0 23) rotate(60)"/><path d="M0 0C-2.9-2.4-2.9-7.4 0-10 2.9-7.4 2.9-2.4 0 0Z" transform="translate(0 23) rotate(-60)"/><path d="M0 0C-2.6-2.1-2.6-6.6 0-9 2.6-6.6 2.6-2.1 0 0Z" transform="translate(0 28) rotate(104)"/><path d="M0 0C-2.6-2.1-2.6-6.6 0-9 2.6-6.6 2.6-2.1 0 0Z" transform="translate(0 28) rotate(-104)"/></g></g></svg></span><span class="logo-word"><span class="er-name">${brandName().toUpperCase()}</span><span class="er-sub">${BRAND.wordSub || 'Academy'}</span></span></div>
  <span>${t('footer_tag')}</span>
  <div class="links">
    <button data-action="goto" data-route="#/admin" data-admin>Admin console</button>
    <button data-action="ai-open">Help</button>
    <button data-action="tour-start">${t('tour_replay')}</button>
    <button data-action="privacy-note">Privacy</button>
    <button data-action="reset-demo">Reset demo</button>
  </div>
</footer>`;

/* ---------- email nudge delivery (Apps Script webhook) ---------- */
const mailReady = () => !!(typeof MAIL !== 'undefined' && MAIL.webhook);
async function sendMail(payload) {
  /* plain-text body = CORS "simple request" — Apps Script has no preflight handler */
  const res = await fetch(MAIL.webhook, { method: 'POST', body: JSON.stringify(Object.assign({ secret: MAIL.secret }, payload)) });
  return res.json();
}
function titleInLang(courseId, lang) {
  const c = courseById(courseId); if (!c) return courseId;
  return (lang === 'pt' && COURSE_PT[c.id] && COURSE_PT[c.id].title) || c.title;
}
function composeMemberNudge(m) {
  /* warm, progress-first copy in the MEMBER's language — never guilt */
  const st = m.state || {};
  const lang = st.lang === 'pt' ? 'pt' : 'en';
  const name = ((m.profile && m.profile.name) || 'there').split(' ')[0];
  const path = st.path || [], prg = st.progress || {};
  const nextId = path.find(id => !(prg[id] && prg[id].done));
  const doneCount = path.filter(id => prg[id] && prg[id].done).length;
  const pct = path.length ? Math.round(doneCount / path.length * 100) : 0;
  if (nextId) {
    const course = titleInLang(nextId, lang);
    return lang === 'pt'
      ? { lang, title: `Está a crescer bem, ${name} 🌿`, body: `Já completou ${pct}% do seu percurso — um passo de cada vez, como a terra gosta. O próximo capítulo é <b>${course}</b>. Dez minutos tranquilos chegam.` }
      : { lang, title: `You're growing well, ${name} 🌿`, body: `You're ${pct}% of the way along your path — one step at a time, the way the land likes it. Your next chapter is <b>${course}</b>. Ten quiet minutes is all it takes.` };
  }
  return lang === 'pt'
    ? { lang, title: `O bosque sente a sua falta, ${name} 🌿`, body: `O seu percurso está à sua espera, sem pressa. Quando tiver dez minutos, há sempre algo novo a crescer na ${brandAcademy()}.` }
    : { lang, title: `The grove misses you, ${name} 🌿`, body: `Your path is waiting, no rush at all. Whenever you have ten minutes, there's always something new growing at ${brandAcademy()}.` };
}
async function emailNudgeMember(uid, btn) {
  if (!mailReady()) return toast(t('mail_not_connected'), 'ℹ️');
  const m = (adminMembers || []).find(x => x.uid === uid);
  if (!m) return;
  const email = (m.profile && m.profile.email) || '';
  const sp = (m.state && m.state.profile) || {};
  const first = ((m.profile && m.profile.name) || email).split(/[@\s]/)[0];
  if (!email) return toast(t('mail_no_email'), 'ℹ️');
  if (!(sp.notify && sp.notify.email)) return toast(`${first} ${t('mail_not_opted')}`, 'ℹ️');
  if (btn) { btn.disabled = true; btn.textContent = '…'; }
  try {
    const n = composeMemberNudge(m);
    const r = await sendMail({ kind: 'nudge', to: email, name: (m.profile && m.profile.name) || '', lang: n.lang, title: n.title, body: n.body });
    if (r.ok) toast(t('mail_sent'), '🌿');
    else if (r.error === 'rate-limited') toast(t('mail_rate_limited'), '🌿');
    else toast(t('mail_failed'), '⚠️');
  } catch (e) { toast(t('mail_failed'), '⚠️'); }
  if (btn) { btn.disabled = false; btn.textContent = 'Nudge'; }
}

/* ---------- Leader's Cockpit (real member data) ---------- */
let adminMembers = null;
function memberSummary(m) {
  const st = m.state || {}, pf = m.profile || {};
  const compHours = trainingHours(st.trainingLog || []), compTarget = complianceTarget(pf) || 40;
  const name = pf.name || (pf.email ? pf.email.split('@')[0] : 'Learner');
  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'ER';
  const path = st.path || [], prg = st.progress || {};
  const doneInPath = path.filter(id => prg[id] && prg[id].done).length;
  const pathPct = path.length ? Math.round(doneInPath / path.length * 100) : 0;
  const coursesDone = Object.values(prg).filter(p => p && p.done).length;
  const xp = st.xp || 0, lvl = levelFor(xp);
  const days = m.updatedAt ? Math.floor((Date.now() - m.updatedAt) / 86400000) : null;
  const atRisk = pathPct < 35 || (days != null && days > 10);
    const _rr = roleReadiness(m.state || {});
  return { compHours, compTarget, ready: _rr ? _rr.overall : null, uid: m.uid, name, initials, email: pf.email || '', username: pf.username || '', role: st.role || pf.role || '', goal: st.goal || '', pathPct, coursesDone, xp, level: lvl.idx + 1, levelName: tlevel(lvl.idx), streak: st.streak || 0, days, atRisk };
}
function memberRow(s) {
  return `<tr class="mrow" data-action="member-detail" data-uid="${esc(s.uid)}">
    <td><div class="member"><span class="mi t-grad-3">${esc(s.initials)}</span><div>${esc(s.name)}${s.username ? ` <span class="post-handle">@${esc(s.username)}</span>` : ''}<div class="mr">${esc(s.email || '—')}</div></div></div></td>
    <td style="min-width:150px;"><div class="track" style="width:100%;"><div class="fill" style="width:${s.pathPct}%"></div></div></td>
    <td>${s.pathPct}%</td>
    <td>Lv ${s.level}</td>
    <td>${s.ready == null ? '<span style="color:var(--text-faint)">—</span>' : `<span class="sk-pct">${s.ready}%</span>`}</td>
    <td><span class="comp-cell ${s.compHours >= s.compTarget ? 'ok' : s.compHours >= trainingPace(s.compTarget) - 1 ? '' : 'low'}">${s.compHours}/${s.compTarget}h</span></td>
    <td>${s.streak}d</td>
    <td style="color:var(--text-faint);">${s.days == null ? '—' : s.days === 0 ? 'today' : s.days + 'd ago'}</td>
    <td><span class="status-chip ${s.atRisk ? 'risk' : 'ok'}">${s.atRisk ? '⚠ At risk' : '● On track'}</span></td>
    <td><button class="btn btn-glass btn-sm" data-action="nudge" data-uid="${esc(s.uid)}" data-name="${esc(s.name)}">Nudge</button></td>
  </tr>`;
}
function paintCockpit() {
  if (!adminMembers) return;
  const sums = filteredMembers().map(memberSummary).sort((a, b) => (a.atRisk === b.atRisk ? a.pathPct - b.pathPct : (a.atRisk ? -1 : 1)));
  const n = sums.length;
  const avg = n ? Math.round(sums.reduce((a, b) => a + b.pathPct, 0) / n) : 0;
  const active = sums.filter(s => s.days != null && s.days <= 7).length;
  const risk = sums.filter(s => s.atRisk).length;
  const statsEl = $('#cockpitStats');
  if (statsEl) statsEl.innerHTML = `
    <div class="stat"><div class="num">${n}</div><div class="lbl">Members</div></div>
    <div class="stat"><div class="num">${avg}%</div><div class="lbl">Avg. completion</div></div>
    <div class="stat"><div class="num">${active}</div><div class="lbl">Active this week</div></div>
    <div class="stat"><div class="num">${risk}</div><div class="lbl">At risk</div><div class="delta ${risk ? 'warn' : ''}">${risk ? '⚠ Needs a nudge' : '● All on track'}</div></div>`;
  const roster = $('#cockpitRoster');
  if (roster) roster.innerHTML = n ? sums.map(memberRow).join('') : `<tr><td colspan="10" class="empty-note">No members yet — as people sign in, they'll appear here.</td></tr>`;
}
function initAdmin(retries) {
  if (!window.EdenCloud || !EdenCloud.listMembers) {
    if ((retries || 0) < 24 && location.hash.indexOf('#/admin') === 0) { setTimeout(() => initAdmin((retries || 0) + 1), 250); return; }
    const r = $('#cockpitRoster'); if (r) r.innerHTML = `<tr><td colspan="10" class="empty-note">The cockpit needs an internet connection.</td></tr>`;
    return;
  }
  if (adminTab === 'companies') {
    if (window.EdenCloud && EdenCloud.listCompanies) EdenCloud.listCompanies().then(cs => { companiesCache = cs; const el = $('#coList'); if (el) el.innerHTML = companiesListHTML(); }).catch(() => {});
    return;
  }
  if (adminTab === 'broadcasts') {
    if (window.EdenForum && EdenForum.listOfficial) EdenForum.listOfficial().then(paintBroadcasts).catch(() => paintBroadcasts([]));
    return;
  }
  if (adminTab === 'content') {
    if (!adminMembers) EdenCloud.listMembers().then(m => { adminMembers = m; if (adminTab === 'content' && !editingCourse) render(); }).catch(() => {});
    return;
  }
  if (adminTab !== 'cockpit') return;
  if (window.EdenMissions) EdenMissions.listPending().then(paintMissions).catch(() => paintMissions([]));
  const r = $('#cockpitRoster'); if (r) r.innerHTML = Array.from({ length: 4 }, () => `<tr class="skel-row"><td colspan="10"><div class="skel"></div></td></tr>`).join('');
  EdenCloud.listMembers().then(m => { adminMembers = m; paintMgrDash(); paintCockpit(); paintTrends(); paintAsgList(); const h = $('#cockpitHeat'); if (h) h.innerHTML = skillHeatmapHTML(); const cp = $('#cockpitComp'); if (cp) cp.innerHTML = complianceHTML(); const iw = $('#intelWrap'); if (iw) iw.outerHTML = intelHTML(); }).catch(err => {
    console.error('[cockpit]', err);
    const rr = $('#cockpitRoster'); if (rr) rr.innerHTML = `<tr><td colspan="10" class="empty-note">Couldn't read members — make sure the updated Firestore rules (admin read) are published.</td></tr>`;
  });
}
function exportMembersCSV() {
  if (!adminMembers || !adminMembers.length) { toast('No members to export yet', 'ℹ️'); return; }
  const sums = adminMembers.map(memberSummary);
  const head = ['Name', 'Username', 'Email', 'Role', 'Goal', 'Completion %', 'Courses done', 'Level', 'XP', 'Streak (days)', 'Last active (days ago)', 'At risk'];
  const lines = sums.map(s => [s.name, s.username, s.email, s.role, s.goal, s.pathPct, s.coursesDone, s.level, s.xp, s.streak, s.days == null ? '' : s.days, s.atRisk ? 'yes' : 'no']);
  const csv = [head, ...lines].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a'); a.href = url; a.download = 'edenrise-members.csv'; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  toast('Member CSV exported', '⤓');
}

/* ================= AI Course Studio — transcript + link → published course ================= */
let studioDraft = null;
function parseVideoLink(url) {
  if (!url) return null;
  let m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/); if (m) return { type: 'vimeo', id: m[1] };
  m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/); if (m) return { type: 'youtube', id: m[1] };
  if (/\.mp4(\?|$)/.test(url)) return { type: 'mp4', src: url };
  return null;
}
const slugify = s => (s || 'course').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'course';
async function generateCourseDraft(title, text, mode) {
  const cats = [...new Set(CATALOG.filter(x => !x.custom).map(x => x.cat))];
  const icons = Object.keys(ICONS).join(', ');
  const heavy = S.aiModelHeavy || (window.EdenOrg && window.EdenOrg.aiModelHeavy) || '';
  const raw = await llmComplete({ maxTokens: 4000, model: heavy || undefined,
      system: `You are the course architect for ${brandAcademy()} (${brandShortDesc()}; warm, grounded, zero corporate jargon). From lesson material, produce ONE course as raw JSON only (no fences): {"title":str,"title_pt":str,"hook":str,"hook_pt":str,"hookSub":str,"hookSub_pt":str,"desc":str(1-2 sentences),"desc_pt":str,"cat":one of [${cats.join(' | ')}],"icon":one of [${icons}],"modules":[3-5 str],"modules_pt":[same length],"takeaways":[per module, array of exactly 3 str],"takeaways_pt":[same shape],"quiz":[3 of {"q":str,"opts":[4 str],"a":0-3}],"quiz_pt":[same shape]}. Portuguese = European Portuguese. Hooks are short invitations (MasterClass style). Takeaways are learning OUTCOMES — each starts with an action verb, stating what the learner CAN NOW DO (e.g. "Read a soil profile by colour and smell"). Quiz tests understanding of THIS material.${mode === 'capture' ? ' The source is a RAW EXPERT INTERVIEW or SOP, not a lesson: extract the expert\u2019s methods, rules of thumb, stories and step-by-step procedures; preserve their hard-won specifics (numbers, warnings, sequences) as the heart of each module; discard small talk.' : ''}`,
      messages: [{ role: 'user', content: `Working title: ${title || '(none)'}\n\nLesson material:\n${text.slice(0, 14000)}` }]
  });
  const j = JSON.parse(raw.replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
  if (!j.title || !Array.isArray(j.modules) || !Array.isArray(j.quiz)) throw new Error('bad shape');
  return j;
}
function draftToCourse(j, media) {
  const id = 'team-' + slugify(j.title);
  return {
    id, title: j.title, cat: cats0(j.cat), grad: 1 + (id.length % 8), icon: ICONS[j.icon] ? j.icon : 'leaf',
    level: 'All levels', rating: 5.0, learners: 0, isNew: true, custom: true,
    desc: j.desc || '', hook: j.hook || '', hookSub: j.hookSub || '',
    modules: j.modules,
    moduleMedia: media ? j.modules.map(() => media) : undefined,
    takeaways: { en: j.takeaways || [], pt: j.takeaways_pt || [] },
    quiz: { en: j.quiz, pt: j.quiz_pt || j.quiz },
    pt: { title: j.title_pt || j.title, desc: j.desc_pt || j.desc, modules: j.modules_pt || j.modules, hook: j.hook_pt || j.hook, hookSub: j.hookSub_pt || j.hookSub }
  };
  function cats0(c) { return [...new Set(CATALOG.map(x => x.cat))].includes(c) ? c : 'Stewardship'; }
}
function studioDraftHTML(c) {
  return `<div class="studio-draft">
    <div class="ob-eyebrow">${t('studio_draft')}</div>
    <h3 style="font-family:var(--font-display);font-size:22px;margin:8px 0 2px;">${esc(ctitle(c))}</h3>
    <p class="course-hook" style="font-size:17px;margin:4px 0 6px;">${esc(chook(c))}</p>
    <p class="m-sub">${esc(chooksub(c))} ${esc(cdesc(c))}</p>
    <div style="margin:12px 0;font-size:13px;color:var(--text-dim);">${cmods(c).map((m, i) => `<div style="padding:6px 0;border-top:1px solid var(--line);">${i + 1}. ${esc(m)}</div>`).join('')}</div>
    <p class="m-sub" style="color:var(--text-faint);">${tcat(c.cat)} · ${c.modules.length} ${t('modules')} · ${(c.quiz.en || []).length} quiz · EN + PT</p>
    <div style="display:flex;gap:10px;margin-top:14px;">
      <button class="btn btn-primary btn-sm" data-action="studio-publish">${t('studio_publish')}</button>
      <button class="btn btn-glass btn-sm" data-action="studio-discard">${t('studio_discard')}</button>
    </div>
  </div>`;
}
async function studioGenerate() {
  if (!aiKey()) { toast(t('studio_need_key'), 'ℹ️'); return; }
  const text = ($('#stText').value || '').trim();
  if (text.length < 40) { $('#stText').focus(); return; }
  const media = parseVideoLink(($('#stVideo').value || '').trim());
  const btn = $('#stGen'); btn.disabled = true;
  $('#stStatus').innerHTML = `<div class="studio-status"><span class="orb-spin" style="width:20px;height:20px;"></span> ${t('studio_generating')}</div>`;
  try {
    const j = await generateCourseDraft(($('#stTitle').value || '').trim(), text, ($('#stMode') && $('#stMode').value) || 'lesson');
    studioDraft = draftToCourse(j, media);
    $('#stStatus').innerHTML = '';
    $('#stDraft').innerHTML = studioDraftHTML(studioDraft);
  } catch (e) {
    $('#stStatus').innerHTML = `<div class="auth-err on" style="margin-top:10px;">${t('studio_failed')}</div>`;
  }
  btn.disabled = false;
}
function studioPublish() {
  if (!studioDraft) return;
  if (!(window.EdenCloud && EdenCloud.saveCourse)) { toast(_lang() === 'pt' ? 'Precisa de estar online e com sessão iniciada' : 'You need to be online and signed in', '⚠️'); return; }
  const c = studioDraft;
  EdenCloud.saveCourse(c).then(() => {
    studioDraft = null;
    EdenApp.applyCustomCourses(null, c);   /* optimistic add */
    toast(t('studio_published'), '🌿');
    render();
  }).catch(() => toast(t('studio_failed'), '⚠️'));
}

/* ================= Department Digests — the silo-breaker, on the platform ================= */
let digestsCache = [];
function digestsSectionHTML() {
  if (!digestsCache.length) return '';
  const latest = digestsCache.slice(0, 4);
  return `<section class="page-pad" style="padding-top:0;">
    <div class="rail-head" style="margin:8px 0 12px;"><h2>📺 ${t('dig_h')}</h2><span class="hint">${t('dig_sub')}</span></div>
    <div class="dig-grid">${latest.map(d => `
      <div class="dig-card" data-action="dig-open" data-id="${d.id}" role="button" tabindex="0">
        <div class="dig-top t-grad-${d.grad || 5}">${d.media ? '<span class="pe-play">▶</span>' : '📰'}<span class="dig-week">${esc(d.week || '')}</span></div>
        <div class="dig-body"><b>${esc(d.title)}</b><span>${tdept(d.dept) || esc(d.dept || '')}</span></div>
      </div>`).join('')}</div>
  </section>`;
}
function openDigest(id) {
  const d = digestsCache.find(x => x.id === id); if (!d) return;
  if (!$('#digModal')) {
    const el = document.createElement('div');
    el.className = 'take-overlay'; el.id = 'digModal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="take-card dig-modal"><button class="modal-x" data-action="dig-close" aria-label="Close">✕</button><div id="digBody"></div></div>`;
    document.body.appendChild(el);
    el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); });
  }
  const m = d.media;
  const video = m ? (m.type === 'vimeo' ? `<div class="post-embed-live"><iframe src="https://player.vimeo.com/video/${m.id}?dnt=1" allow="autoplay; fullscreen" allowfullscreen></iframe></div>`
    : m.type === 'youtube' ? `<div class="post-embed-live"><iframe src="https://www.youtube-nocookie.com/embed/${m.id}" allow="autoplay; fullscreen" allowfullscreen></iframe></div>`
    : m.type === 'mp4' ? `<video controls playsinline style="width:100%;border-radius:12px;" src="${esc(m.src)}"></video>` : '') : '';
  $('#digBody').innerHTML = `
    <div class="ob-eyebrow">📺 ${t('dig_h')} · ${tdept(d.dept) || esc(d.dept || '')} · ${esc(d.week || '')}</div>
    <h3 style="font-family:var(--font-display);font-size:23px;margin:8px 0 12px;">${esc(d.title)}</h3>
    ${video}
    <div class="dig-narrative">${esc(d.body || '').split('\n').filter(Boolean).map(p => `<p>${p}</p>`).join('')}</div>`;
  $('#digModal').classList.add('open');
}
/* Studio → Digests tab */
function adminDigestsHTML() {
  const rows = digestsCache.map(d => `
    <div class="content-row">
      <span class="ci t-grad-${d.grad || 5}">${svgIcon('sun')}</span>
      <div class="ct"><b>${esc(d.title)}</b><span>${tdept(d.dept) || esc(d.dept || '')} · ${esc(d.week || '')}${d.media ? ' · ▶ video' : ' · script only'}</span></div>
      <button class="btn btn-glass btn-sm" data-action="dig-del" data-id="${d.id}">✕</button>
    </div>`).join('');
  return `<div class="admin-section">
    <h2>Publish a digest</h2>
    <p class="sect-sub">The Monday routine drafts the script to your inbox — paste the narrative here (and the video link once your editor delivers). It appears on everyone's home instantly.</p>
    <div class="studio">
      <div class="ce-two">
        <div class="field"><label>Department</label><select id="dgDept">${DEPTS.map(d => `<option value="${d.key}">${d.en}</option>`).join('')}</select></div>
        <div class="field"><label>Week label</label><input class="auth-input" id="dgWeek" placeholder="Week 27 · Jun 30 – Jul 6"></div>
      </div>
      <input class="auth-input" id="dgTitle" maxlength="90" placeholder="Title — e.g. The week the land drank">
      <input class="auth-input" id="dgVideo" placeholder="Video link — Vimeo / YouTube / .mp4 (optional, add later when the editor delivers)">
      <textarea class="comm-input" id="dgBody" rows="5" placeholder="The narrative — paragraphs from the Monday digest email"></textarea>
      <button class="btn btn-primary" data-action="dig-publish">Publish digest 📺</button>
    </div>
  </div>
  <div class="admin-section">
    <h2>Published digests</h2>
    ${rows || `<p class="empty-note" style="text-align:left;padding:8px 0;">Nothing yet — the first Monday digest will change that.</p>`}
  </div>`;
}
function digPublish() {
  const title = ($('#dgTitle').value || '').trim();
  const body = ($('#dgBody').value || '').trim();
  if (!title || !body) { toast('A title and the narrative are needed', 'ℹ️'); return; }
  if (!(window.EdenCloud && EdenCloud.saveDigest)) { toast('You need to be online and signed in', '⚠️'); return; }
  const dept = $('#dgDept').value;
  const d = {
    id: slugify(($('#dgWeek').value || 'w') + '-' + dept + '-' + title).slice(0, 50),
    dept, week: ($('#dgWeek').value || '').trim(), title, body,
    media: parseVideoLink(($('#dgVideo').value || '').trim()),
    grad: 1 + (dept.length + title.length) % 8, at: Date.now()
  };
  const clean = JSON.parse(JSON.stringify(d));
  EdenCloud.saveDigest(clean).then(() => {
    digestsCache = [clean, ...digestsCache.filter(x => x.id !== clean.id)];
    $('#dgTitle').value = ''; $('#dgBody').value = ''; $('#dgVideo').value = '';
    toast('Digest published to everyone 📺', '🌿'); render();
  }).catch(() => toast('Could not publish — are the Firestore rules published?', '⚠️'));
}

/* ================= First-run product tour ================= */
let tourList = null, tourIdx = 0;
function tourSteps() {
  const visible = sel => { const el = document.querySelector(sel); return el && el.getBoundingClientRect().width > 0 ? el : null; };
  const steps = [
    { sel: null, title: t('tour_welcome_t'), body: t('tour_welcome_b') },
    { sel: '.hero-actions', title: t('tour_path_t'), body: t('tour_path_b') },
    { sel: '.ask-bar', title: t('tour_ask_t'), body: t('tour_ask_b') },
    { sel: '.nav-links a[href="#/community"], .tabbar a[href="#/community"]', title: t('tour_comm_t'), body: t('tour_comm_b') },
    { sel: '.nav-links a[href="#/progress"], .tabbar a[href="#/progress"]', title: t('tour_prog_t'), body: t('tour_prog_b') },
    { sel: '#bellBtn', title: t('tour_bell_t'), body: t('tour_bell_b') },
    { sel: null, title: t('tour_done_t'), body: t('tour_done_b') }
  ];
  return steps.filter(s => !s.sel || visible(s.sel));
}
function startTour() {
  tourList = tourSteps(); tourIdx = 0;
  if ($('#tourOv')) $('#tourOv').remove();
  const ov = document.createElement('div');
  ov.id = 'tourOv';
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', t('tour_done_t'));
  ov.innerHTML = `<div class="tour-ring" id="tourRing"></div><div class="tour-card" id="tourCard"></div>`;
  document.body.appendChild(ov);
  tourShow(0);
}
function tourShow(i) {
  tourIdx = Math.max(0, Math.min(tourList.length - 1, i));
  const st = tourList[tourIdx];
  const ring = $('#tourRing'), card = $('#tourCard');
  const el = st.sel ? document.querySelector(st.sel.split(',').map(s => s.trim()).find(s => { const e = document.querySelector(s); return e && e.getBoundingClientRect().width > 0; }) || st.sel) : null;
  const last = tourIdx === tourList.length - 1;
  card.innerHTML = `
    <div class="tour-step">${tourIdx + 1} / ${tourList.length}</div>
    <b>${st.title}</b><p>${st.body}</p>
    <div class="tour-btns">
      ${tourIdx > 0 ? `<button class="link-quiet" data-action="tour-back">← ${t('tour_back')}</button>` : `<button class="link-quiet" data-action="tour-end">${t('tour_skip')}</button>`}
      <span style="flex:1"></span>
      <button class="btn btn-primary btn-sm" data-action="${last ? 'tour-end' : 'tour-next'}">${last ? t('tour_finish') : t('tour_next')} ${last ? '🌱' : '→'}</button>
    </div>`;
  const primary = card.querySelector('.btn-primary'); if (primary) primary.focus({ preventScroll: true });
  if (el) {
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r = el.getBoundingClientRect();
    ring.style.display = 'block'; ring.style.borderWidth = '2px';
    ring.style.left = (r.left - 8) + 'px'; ring.style.top = (r.top - 8) + 'px';
    ring.style.width = (r.width + 16) + 'px'; ring.style.height = (r.height + 16) + 'px';
    const below = r.bottom + 190 < innerHeight;
    card.style.left = Math.min(innerWidth - 320, Math.max(12, r.left)) + 'px';
    card.style.top = (below ? r.bottom + 18 : Math.max(12, r.top - 205)) + 'px';
    card.style.transform = 'none';
  } else {
    /* no target — collapse the ring to a dot so its shadow still dims the page */
    ring.style.display = 'block'; ring.style.borderWidth = '0';
    ring.style.left = '50vw'; ring.style.top = '46vh'; ring.style.width = '0'; ring.style.height = '0';
    card.style.left = 'calc(50% - min(155px, 50vw - 12px))'; card.style.top = '40%'; card.style.transform = 'none';
  }
}
function endTour() {
  const ov = $('#tourOv'); if (ov) ov.remove();
  S.tourDone = true; save();
}
function maybeTour() {
  if (window.__tourShown || !S.onboarded || S.tourDone) return;
  if ((location.hash || '#/home').indexOf('#/home') !== 0 && location.hash !== '') return;
  window.__tourShown = true;
  setTimeout(startTour, 1400);
}

/* ================= PWA install nudge ================= */
let pwaEvt = null;
addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); pwaEvt = e;
  maybePwaBar();
});
function pwaBarHTML(ios) {
  return `<div class="pwa-bar" id="pwaBar">
    <span class="pwa-ic">🌱</span>
    <div class="pwa-txt"><b>${t('pwa_t')}</b><span>${ios ? t('pwa_ios') : t('pwa_b')}</span></div>
    ${ios ? '' : `<button class="btn btn-primary btn-sm" data-action="pwa-install">${t('pwa_btn')}</button>`}
    <button class="modal-x" style="position:static;" data-action="pwa-dismiss" aria-label="Dismiss">✕</button>
  </div>`;
}
function maybePwaBar(ios) {
  if (localStorage.getItem('eden-pwa-nudged') || $('#pwaBar')) return;
  if (!S.onboarded) return;
  setTimeout(() => {
    if ($('#pwaBar')) return;
    const w = document.createElement('div'); w.innerHTML = pwaBarHTML(!!ios);
    document.body.appendChild(w.firstElementChild);
  }, 3000);
}
/* iOS has no beforeinstallprompt — show the hint on a return visit */
(function iosPwaHint() {
  try {
    const ua = navigator.userAgent, ios = /iphone|ipad|ipod/i.test(ua);
    const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
    const visits = +(localStorage.getItem('eden-visits') || 0) + 1;
    localStorage.setItem('eden-visits', visits);
    if (ios && !standalone && visits >= 2) setTimeout(() => maybePwaBar(true), 2000);
  } catch (e) {}
})();

/* ================= Demo seeding — make the pitch demo feel inhabited ================= */
async function seedDemo() {
  if (!confirm('Seed demo content? This creates real community posts, two live sessions and one assignment (as you).')) return;
  if (!(window.EdenForum && EdenForum.canPost() && window.EdenCloud)) { toast('Sign in first', '⚠️'); return; }
  const day = 86400000, next = n => { const d = new Date(Date.now() + n * day); d.setHours(16, 0, 0, 0); return d; };
  const iso = d => d.toISOString().slice(0, 16);
  const fmtDay = d => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }) + ' · 16:00';
  try {
    await EdenForum.createPost({ channel: 'intro', kind: 'discussion', title: 'Welcome to the ' + brandAcademy() + ' community 🌱', body: 'This is where we learn together — ask anything, share what the land is teaching you, and celebrate each other\u2019s wins. Warm welcome from the whole team!', official: true, pinned: true });
    await EdenForum.createPost({ channel: 'wins', kind: 'message', body: 'First compost pile turned using the layering from the course — look at this heat! https://picsum.photos/seed/edencompost/800/500.jpg' });
    await EdenForum.createPost({ channel: 'general', kind: 'discussion', title: 'Where should the next work party focus?', body: 'Vote below — we\u2019ll bring tools and lunch either way 🌿', poll: { options: ['The east swales', 'Food forest mulching', 'The nursery beds'], votes: {} } });
    const live = [
      { id: 'live-soil-clinic', title: 'Field Hours: Live Soil Clinic', host: 'Marta Oliveira · Head of Regeneration', when: fmtDay(next(4)), date: iso(next(4)), desc: 'Bring a photo or sample of your soil — read live, with the first three things to do.', live: false, viewers: 0, grad: 7, icon: 'sprout' },
      { id: 'live-founder-ama', title: 'Founder AMA: Why Regeneration', host: 'João Amaral · Founder', when: fmtDay(next(8)), date: iso(next(8)), desc: 'Unfiltered Q&A on building EdenRise and stewarding land in the Baixo Alentejo.', live: false, viewers: 0, grad: 1, icon: 'tree' }
    ];
    const assignments = activeAssignments().concat([{ id: 'asg-living-soil-land', courseId: 'living-soil', team: 'land', due: new Date(Date.now() + 14 * day).toISOString().slice(0, 10) }]);
    await EdenCloud.saveMeta(Object.assign({}, studioMeta, { live, assignments }));
    studioMeta = Object.assign({}, studioMeta, { live, assignments });
    toast('Demo content seeded 🌿', '✓'); render();
  } catch (e) { console.error('[seed]', e); toast('Seeding failed — are the Firestore rules published?', '⚠️'); }
}

/* ================= Ask the Academy — AI answers from your own library ================= */
function libraryContext() {
  return CATALOG.map(c => {
    const tk = (c.takeaways && (c.takeaways.en || [])) || (typeof TAKEAWAYS !== 'undefined' && TAKEAWAYS[c.id]) || [];
    return `[${c.id}] ${c.title} (${c.cat}) — ${c.desc} Modules: ${c.modules.join('; ')}.${tk.length ? ' Key ideas: ' + [].concat(...tk).slice(0, 6).join(' | ') : ''}`;
  }).join('\n');
}
function ensureAskModal() {
  if ($('#askModal')) return;
  const el = document.createElement('div');
  el.className = 'take-overlay'; el.id = 'askModal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  el.innerHTML = `<div class="take-card ask-card">
    <button class="modal-x" data-action="ask-close" aria-label="Close">✕</button>
    <div class="ob-eyebrow">✦ ${t('ask_h')}</div>
    <h3 id="askQ" style="font-family:var(--font-display);font-size:22px;margin:8px 0 10px;"></h3>
    <div id="askBody"></div>
  </div>`;
  document.body.appendChild(el);
  el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); });
}
function logAsk(q, via) {
  (S.askLog || (S.askLog = [])).push({ q: q.slice(0, 160), via, at: Date.now() });
  if (S.askLog.length > 50) S.askLog = S.askLog.slice(-50);
  save();
}
async function openAsk(q) {
  q = (q || '').trim(); if (!q) return;
  logAsk(q, 'ask');
  if (!aiKey()) { toast(t('studio_need_key'), 'ℹ️'); return; }
  ensureAskModal();
  $('#askQ').textContent = q;
  const eb = $('#askModal .ob-eyebrow'); if (eb) eb.innerHTML = `✦ ${t('ask_h')} <span class="grounded-inline">· 🔒 ${t('grounded_note')}</span>`;
  $('#askBody').innerHTML = `<div class="studio-status"><span class="orb-spin" style="width:20px;height:20px;"></span> ${t('ask_thinking')}</div>`;
  $('#askModal').classList.add('open');
  try {
    const raw = await llmComplete({ maxTokens: 700,
      system: `You are the ${brandAcademy()} guide (${brandShortDesc()}). Answer the member's question warmly and practically, grounded ONLY in the course library below. HONESTY RULE: if the library doesn't cover the question, say so plainly in the answer ("our courses don't cover this yet") and point to the nearest course — never bluff or invent. Reply as raw JSON: {"answer":str(2-4 sentences, concrete),"refs":[{"courseId":str(an id from the library),"why":str(short)}]} — 0-3 refs, best first. ${_lang() === 'pt' ? 'Responde em português europeu.' : ''}\n\nLIBRARY:\n${libraryContext()}${aiGuardrails()}`,
      messages: [{ role: 'user', content: q }] });
    const j = JSON.parse(raw.replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
    const refs = (j.refs || []).map(r => ({ r, c: courseById(r.courseId) })).filter(x => x.c);
    $('#askBody').innerHTML = `<p class="ask-answer">${esc(j.answer || '')}</p>
      ${refs.length ? `<div class="ob-eyebrow" style="margin-top:16px;">${t('ask_refs')}</div>
      <div class="ask-refs">${refs.map(({ r, c }) => `
        <div class="ask-ref" data-action="ask-ref" data-id="${c.id}" role="button" tabindex="0">
          <span class="ci t-grad-${c.grad}">${svgIcon(c.icon)}</span>
          <div class="ct"><b>${esc(ctitle(c))}</b><span>${esc(r.why || tcat(c.cat))}</span></div>
          <span class="ask-go">→</span>
        </div>`).join('')}</div>` : ''}
      ${aiModelLabel() ? `<div class="ask-model">✦ ${t('ask_by')} ${esc(aiModelLabel())}</div>` : ''}`;
  } catch (e) {
    $('#askBody').innerHTML = `<div class="auth-err on">${t('ask_fail')}</div>`;
  }
}
function askBarHTML() {
  if (!aiKey()) return '';
  return `<section class="page-pad" style="padding-top:0;"><div class="ask-bar">
    <div class="ask-ic">✦</div>
    <div class="ask-main"><b>${t('ask_h')}</b><span>${t('ask_sub')}</span>
      <div class="ask-row"><input class="auth-input" id="askInput" placeholder="${t('ask_ph')}"><button class="btn btn-primary btn-sm" data-action="ask-go">${t('ask_go')}</button></div>
    </div>
  </div></section>`;
}

/* ================= Skills — what the learning is building ================= */
function skillScores() {
  return SKILLS.map(s => {
    const tagged = CATALOG.filter(c => skillsOf(c).includes(s.key));
    if (!tagged.length) return null;
    const touched = tagged.filter(c => coursePct(c.id) > 0);
    const score = Math.round(tagged.reduce((a, c) => a + coursePct(c.id), 0) / tagged.length);
    return { key: s.key, score, touched: touched.length, total: tagged.length };
  }).filter(Boolean);
}
function skillsSectionHTML() {
  const rows = skillScores().filter(s => s.touched > 0);
  if (!rows.length) return '';
  return `<div class="admin-section"><h2>${t('skills_h')}</h2><p class="sect-sub">${t('skills_sub')}</p>
    <div class="skill-list">${rows.sort((a, b) => b.score - a.score).map(s => `
      <div class="skill-row"><span class="sk-name">${tskill(s.key)}</span>
        <div class="track"><div class="fill" style="width:${s.score}%"></div></div>
        <span class="sk-pct">${s.score}%</span></div>`).join('')}</div>
  </div>`;
}
function memberSkillScores(state) {
  const pct = id => { const p = (state.progress || {})[id]; return p ? (p.done ? 100 : (p.pct || 0)) : 0; };
  return SKILLS.map(s => {
    const tagged = CATALOG.filter(c => skillsOf(c).includes(s.key));
    return tagged.length ? Math.round(tagged.reduce((a, c) => a + pct(c.id), 0) / tagged.length) : 0;
  });
}
function skillHeatmapHTML() {
  if (!adminMembers || !adminMembers.length) return '';
  const heat = v => v >= 60 ? 'h3' : v >= 30 ? 'h2' : v > 0 ? 'h1' : 'h0';
  return `<div class="admin-section"><h2>🧭 Team skills heatmap</h2>
    <p class="sect-sub">Where the team is strong, and where the gaps are — completion-weighted per skill.</p>
    <div class="heat-scroll"><table class="heat-table">
      <thead><tr><th></th>${SKILLS.map(s => `<th>${s.en}</th>`).join('')}</tr></thead>
      <tbody>${(filteredMembers() || []).map(m => `<tr><td>${esc((m.profile && m.profile.name) || 'Learner')}</td>
        ${memberSkillScores(m.state).map(v => `<td><span class="heat ${heat(v)}" title="${v}%">${v || ''}</span></td>`).join('')}</tr>`).join('')}
      </tbody>
    </table></div></div>`;
}

/* ================= Role Readiness — role → skills → gaps → next course ================= */
function roleReadiness(state) {
  const role = (state || S).role || ((state || S).profile || {}).role;
  const prof = ROLE_PROFILES[role];
  if (!prof) return null;
  const pctOf = state ? (id => { const p = (state.progress || {})[id]; return p ? (p.done ? 100 : (p.pct || 0)) : 0; }) : (id => coursePct(id));
  const rows = Object.entries(prof.skills).map(([key, target]) => {
    const tagged = CATALOG.filter(c => skillsOf(c).includes(key));
    const score = tagged.length ? Math.round(tagged.reduce((a, c) => a + pctOf(c.id), 0) / tagged.length) : 0;
    return { key, target, score, ready: Math.min(100, Math.round(score / target * 100)) };
  });
  const overall = Math.round(rows.reduce((a, r) => a + r.ready, 0) / rows.length);
  const gap = rows.slice().sort((a, b) => a.ready - b.ready)[0];
  return { role, overall, rows, gap };
}
/* ================= 40h Continuous-Training Compliance (Código do Trabalho art. 131.º) ================= */
const complianceYear = () => new Date().getFullYear();
/* target = 40h × FTE × (months worked this year / 12); fixed-term hired mid-year prorates */
function complianceTarget(pf) {
  pf = pf || S.profile || {};
  const fte = pf.fte != null ? pf.fte : 1;
  let frac = 1;
  if (pf.hireDate) { const h = new Date(pf.hireDate); if (!isNaN(h) && h.getFullYear() === complianceYear()) frac = Math.max(0, 12 - h.getMonth()) / 12; }
  return Math.round(40 * fte * frac);
}
function trainingHours(log) {
  const y = complianceYear();
  return Math.round((log || []).filter(e => e && new Date(e.at).getFullYear() === y).reduce((a, e) => a + (e.hours || 0), 0) * 10) / 10;
}
/* expected hours by today if pacing evenly across the year (the ~1h/week line) */
function trainingPace(target) {
  const now = new Date(), start = new Date(now.getFullYear(), 0, 1);
  return Math.round(target * ((now - start) / (365 * 864e5)) * 10) / 10;
}
/* ===== Compliance Phase 2: legal documents (DRAFT wording — pending lawyer sign-off, SPEC §6/§9) ===== */
/* company identity comes from window.EdenCompany (Phase 5); helpers above */
function ptCourseTitle(id) { const c = courseById(id); return (typeof COURSE_PT !== 'undefined' && COURSE_PT[id] && COURSE_PT[id].title) || (c && c.title) || id; }
function trainingActions(log, year) {
  const b = {};
  (log || []).filter(e => new Date(e.at).getFullYear() === year).forEach(e => { const k = ptCourseTitle(e.courseId); b[k] = (b[k] || 0) + (e.hours || 0); });
  return Object.entries(b).map(([title, h]) => ({ title, hours: Math.round(h * 10) / 10 })).sort((a, b) => b.hours - a.hours);
}
async function complianceVerifyCode(pf, year, log) {
  const e = (log || []).filter(x => new Date(x.at).getFullYear() === year).map(x => `${x.courseId}:${x.mod}:${x.hours}:${x.at}`).sort().join('|');
  try { const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${pf.nif || ''}|${year}|${e}`)); return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16).toUpperCase(); }
  catch (_) { return 'N/D'; }
}
function wrapCanvasText(x, text, cx, cy, maxW, lh) {
  const words = text.split(' '); let line = '', y = cy;
  words.forEach(w => { const test = line + w + ' '; if (x.measureText(test).width > maxW && line) { x.fillText(line.trim(), cx, y); line = w + ' '; y += lh; } else line = test; });
  x.fillText(line.trim(), cx, y); return y;
}
function trainingCertCanvas(pf, year, code) {
  const W = 1600, H = 1131, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  x.fillStyle = '#0e140f'; x.fillRect(0, 0, W, H);
  const g = x.createRadialGradient(W / 2, H * 0.3, 80, W / 2, H / 2, W * 0.8); g.addColorStop(0, 'rgba(200,164,93,.09)'); g.addColorStop(1, 'rgba(200,164,93,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(200,164,93,.85)'; x.lineWidth = 3; x.strokeRect(46, 46, W - 92, H - 92);
  x.strokeStyle = 'rgba(200,164,93,.35)'; x.lineWidth = 1; x.strokeRect(60, 60, W - 120, H - 120);
  x.textAlign = 'center';
  x.fillStyle = '#c8a45d'; x.font = '600 24px Inter, sans-serif'; try { x.letterSpacing = '10px'; } catch (e) {} x.fillText(companyName().toUpperCase().split('').join(' '), W / 2, 138); try { x.letterSpacing = '0px'; } catch (e) {}
  x.fillStyle = '#f7f6f1'; x.font = '600 52px "Cormorant Garamond", serif'; x.fillText('Certificado de Frequência', W / 2, 244);
  x.fillStyle = 'rgba(247,246,241,.7)'; x.font = '400 26px "Cormorant Garamond", serif'; x.fillText('Formação Profissional Contínua', W / 2, 286);
  const done = trainingHours(S.trainingLog), target = complianceTarget(pf) || 40;
  x.fillStyle = 'rgba(247,246,241,.55)'; x.font = '400 22px Inter'; x.fillText('Certifica-se que', W / 2, 372);
  x.fillStyle = '#c8a45d'; x.font = 'italic 600 60px "Cormorant Garamond", serif'; x.fillText(pf.name || '—', W / 2, 442);
  x.fillStyle = 'rgba(247,246,241,.7)'; x.font = '400 20px Inter'; x.fillText(`NIF ${pf.nif || '—'}${pf.employeeNo ? ' · N.º ' + pf.employeeNo : ''}`, W / 2, 480);
  x.fillStyle = 'rgba(247,246,241,.85)'; x.font = '400 21px Inter';
  wrapCanvasText(x, `frequentou ${done} horas de formação profissional contínua no ano de ${year}, ministrada por ${companyName()}${companyNif() ? ' (NIF ' + companyNif() + ')' : ''} ao abrigo do dever de formação previsto nos artigos 130.º a 134.º do Código do Trabalho.`, W / 2, 534, 1080, 30);
  const acts = trainingActions(S.trainingLog, year).slice(0, 6);
  x.textAlign = 'left'; let ay = 672;
  x.fillStyle = 'rgba(200,164,93,.9)'; x.font = '700 13px Inter'; x.fillText('AÇÕES DE FORMAÇÃO · modalidade: formação à distância (e-learning)', 270, ay); ay += 32;
  x.font = '400 18px Inter';
  acts.forEach(a => { x.fillStyle = 'rgba(247,246,241,.8)'; x.fillText(a.title.slice(0, 60), 270, ay); x.textAlign = 'right'; x.fillStyle = '#c8a45d'; x.fillText(a.hours + ' h', W - 270, ay); x.textAlign = 'left'; ay += 30; });
  x.textAlign = 'center';
  x.strokeStyle = 'rgba(200,164,93,.5)'; x.beginPath(); x.moveTo(W / 2 - 150, 902); x.lineTo(W / 2 + 150, 902); x.stroke();
  x.fillStyle = '#f7f6f1'; x.font = '600 30px "Cormorant Garamond", serif'; x.fillText(`Total: ${done} h de ${target} h`, W / 2, 948);
  x.fillStyle = 'rgba(247,246,241,.5)'; x.font = '400 18px Inter'; x.fillText(new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }), W / 2, 986);
  x.fillStyle = 'rgba(247,246,241,.4)'; x.font = '400 15px Inter'; x.fillText(`Código de verificação: ${code}`, W / 2, 1040);
  x.fillStyle = 'rgba(217,179,140,.6)'; x.font = 'italic 400 13px Inter'; x.fillText('Documento comprovativo interno · modelo em validação jurídica', W / 2, 1066);
  return cv;
}
async function downloadTrainingCert() {
  const pf = S.profile || {};
  if (!pf.nif) { toast(t('comp_nif_prompt'), '🪪'); location.hash = '#/profile'; return; }
  const code = await complianceVerifyCode(pf, complianceYear(), S.trainingLog);
  ledgerAppend('cert_issued', { year: complianceYear(), code });
  trainingCertCanvas(pf, complianceYear(), code).toBlob(b => {
    const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `certificado-formacao-${pf.nif || 'x'}-${complianceYear()}.png`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u); toast(t('comp_cert_dl'), '🎓');
  }, 'image/png');
}
function csvBlob(rows, name) {
  const csv = rows.map(r => r.map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const u = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u);
}
function downloadTrainingRegister() {
  const y = complianceYear();
  csvBlob(registerRowsFor(S.profile || {}, S.trainingLog, y), `registo-presencas-${y}.csv`);
  toast(t('comp_reg_dl'), '⤓');
}
function downloadRUannex() {
  if (!adminMembers) { toast('Members still loading', 'ℹ️'); return; }
  const y = complianceYear(), pool = filteredMembers();
  const rows = [['Trabalhador', 'NIF', 'Departamento', 'Contrato', `Horas ${y}`, 'Meta', 'Cumprido', 'Área de formação']];
  pool.forEach(m => { const pf = m.profile || {}, st = m.state || {}, h = trainingHours(st.trainingLog || []), tg = complianceTarget(pf) || 40; rows.push([pf.name || '', pf.nif || '', tdept(pf.dept) || '', pf.contractType || '', h, tg, h >= tg ? 'Sim' : 'Não', 'Formação contínua']); });
  const totalH = pool.reduce((a, m) => a + trainingHours((m.state || {}).trainingLog || []), 0);
  const covered = pool.filter(m => trainingHours((m.state || {}).trainingLog || []) > 0).length;
  rows.push([]); rows.push(['TOTAIS', '', '', '', Math.round(totalH * 10) / 10, '', '', '']);
  rows.push(['Nº de ações', trainingActionsAll(pool, y), 'Trabalhadores abrangidos', covered, '% da força', pool.length ? Math.round(covered / pool.length * 100) + '%' : '0%', '', '']);
  csvBlob(rows, `relatorio-unico-formacao-${y}.csv`); toast('Relatório Único · anexo exportado', '⤓');
}
function trainingActionsAll(pool, y) { const s = new Set(); pool.forEach(m => (m.state && m.state.trainingLog || []).filter(e => new Date(e.at).getFullYear() === y).forEach(e => s.add(e.courseId))); return s.size; }

/* ---------- RGPD doc pack (Compliance Phase 4) — print-ready PT documents.
   DRAFTS ("minuta"): wording pending lawyer sign-off, like the training certificate. */
function gdprDocShell(title, body) {
  const today = new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>${title} — ${companyName()}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a221c; max-width: 760px; margin: 40px auto; padding: 0 24px; line-height: 1.6; font-size: 14px; }
  h1 { font-size: 22px; border-bottom: 2px solid #40563E; padding-bottom: 10px; }
  h2 { font-size: 15px; margin-top: 26px; color: #40563E; }
  table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 12.5px; }
  th, td { border: 1px solid #c9c4b8; padding: 7px 9px; text-align: left; vertical-align: top; }
  th { background: #f0efe8; }
  .meta { color: #555; font-size: 12.5px; }
  .draft { background: #fdf6e3; border: 1px solid #e5d9a8; padding: 10px 14px; font-size: 12px; margin: 18px 0; }
  .sig { margin-top: 46px; display: flex; gap: 60px; }
  .sig div { flex: 1; border-top: 1px solid #888; padding-top: 6px; font-size: 12px; }
  @media print { body { margin: 10mm auto; } }
</style></head><body>
<h1>${title}</h1>
<p class="meta"><b>${esc(companyName())}</b>${companyNif() ? ' · NIF ' + esc(companyNif()) : ''} · ${today} · Plataforma: ${brandAcademy()}</p>
<div class="draft">⚠️ MINUTA — documento em validação jurídica. Rever com aconselhamento legal antes de adotar formalmente.</div>
${body}
<div class="sig"><div>A Gerência / Administração</div><div>Data e assinatura</div></div>
</body></html>`;
}
function gdprRetentionDoc() {
  return gdprDocShell('Política de Retenção de Dados de Formação', `
<h2>1. Objeto e âmbito</h2>
<p>Esta política define os prazos de conservação dos dados pessoais tratados na plataforma de formação ${brandAcademy()}, em cumprimento do RGPD (princípio da limitação da conservação, art. 5.º/1-e) e do Código do Trabalho (arts. 130.º–134.º — formação contínua obrigatória).</p>
<h2>2. Prazos de conservação</h2>
<table><tr><th>Categoria de dados</th><th>Fundamento</th><th>Prazo</th></tr>
<tr><td>Registos de formação (horas, ações, confirmações, certificados)</td><td>Obrigação jurídica — CT arts. 131.º–134.º; crédito de horas (2+3 anos); cessação (5 anos)</td><td><b>5 anos</b> após o ano civil a que respeitam, ou após cessação do contrato</td></tr>
<tr><td>Identificação do trabalhador (nome, NIF, n.º trabalhador, contrato, FTE)</td><td>Obrigação jurídica — Relatório Único e prova de formação</td><td>Enquanto durar o vínculo + 5 anos</td></tr>
<tr><td>Conta e progresso de aprendizagem (percursos, quizzes, XP, notas pessoais)</td><td>Execução do contrato de trabalho / interesse legítimo (desenvolvimento)</td><td>Enquanto a conta estiver ativa; eliminação a pedido</td></tr>
<tr><td>Perguntas colocadas à IA (anonimizadas no cockpit)</td><td>Interesse legítimo — deteção de lacunas de formação</td><td>Máx. 12 meses</td></tr></table>
<h2>3. Eliminação</h2>
<p>Findo o prazo, os dados são eliminados ou anonimizados de forma irreversível. O trabalhador pode exercer os direitos de acesso, retificação, portabilidade e apagamento (este último sem prejuízo das obrigações legais de conservação) diretamente na plataforma (Perfil → Privacidade) ou junto do responsável de RH.</p>`);
}
function gdprArt30Doc() {
  return gdprDocShell('Registo de Atividades de Tratamento (art. 30.º RGPD)', `
<h2>Responsável pelo tratamento</h2>
<p>${esc(companyName())}${companyNif() ? ', NIF ' + esc(companyNif()) : ''} — na qualidade de entidade empregadora.</p>
<h2>Atividades de tratamento</h2>
<table><tr><th>Atividade</th><th>Finalidade</th><th>Base jurídica</th><th>Categorias de dados</th><th>Prazo</th></tr>
<tr><td>Gestão da formação contínua</td><td>Cumprir as 40h anuais (CT art. 131.º) e produzir prova documental</td><td>Obrigação jurídica (art. 6.º/1-c RGPD)</td><td>Identificação, NIF, contrato, horas e ações de formação, confirmações</td><td>5 anos</td></tr>
<tr><td>Conta de aprendizagem</td><td>Percursos, progresso, avaliações e certificados internos</td><td>Execução do contrato (art. 6.º/1-b)</td><td>Nome, email, função, progresso, resultados</td><td>Conta ativa</td></tr>
<tr><td>Tutor de IA e "Perguntar à Academia"</td><td>Apoio à aprendizagem; identificação de lacunas de conteúdo</td><td>Interesse legítimo (art. 6.º/1-f) — com transparência ativa na plataforma</td><td>Perguntas colocadas (visíveis aos administradores de formação)</td><td>12 meses</td></tr></table>
<h2>Destinatários e subcontratantes</h2>
<table><tr><th>Entidade</th><th>Papel</th><th>Localização / garantias</th></tr>
<tr><td>Google Ireland Ltd. (Firebase: Auth, Firestore)</td><td>Subcontratante — alojamento e autenticação</td><td>UE; Data Processing Terms Google Cloud, CCT quando aplicável</td></tr>
<tr><td>Google (Gemini API)</td><td>Subcontratante — geração de respostas do tutor</td><td>Termos API Google; sem uso de dados para treino nos termos pagos/empresariais aplicáveis</td></tr></table>
<h2>Medidas de segurança (art. 32.º)</h2>
<p>Transporte cifrado (TLS), autenticação por conta individual, regras de acesso por perfil e por empresa (multi-inquilino), registo de formação em livro-razão só-de-acréscimo com código de verificação (SHA-256), cópias de segurança do fornecedor de nuvem.</p>`);
}
function gdprDpaDoc() {
  return gdprDocShell('Acordo de Subcontratação de Dados (art. 28.º RGPD) — Minuta', `
<h2>Partes</h2>
<p><b>Responsável:</b> ${esc(companyName())}${companyNif() ? ', NIF ' + esc(companyNif()) : ''} ("Cliente").<br>
<b>Subcontratante:</b> [operador da plataforma ${brandAcademy()} — preencher denominação e NIF] ("Plataforma").</p>
<h2>1. Objeto e duração</h2>
<p>Tratamento de dados pessoais de trabalhadores do Cliente estritamente necessário à prestação do serviço de formação online e registo de formação obrigatória, pela vigência do contrato de serviço.</p>
<h2>2. Instruções e finalidade</h2>
<p>A Plataforma trata os dados apenas mediante instruções documentadas do Cliente e exclusivamente para: (a) gestão de contas e percursos de aprendizagem; (b) registo e prova das horas de formação (CT arts. 130.º–134.º); (c) funcionalidades de tutor de IA, com transparência para os titulares.</p>
<h2>3. Obrigações da Plataforma</h2>
<p>Confidencialidade das pessoas autorizadas; medidas técnicas e organizativas do art. 32.º (cifragem em trânsito, controlo de acessos por empresa, registos verificáveis); assistência ao Cliente no exercício de direitos dos titulares e em avaliações de impacto; notificação de violações de dados sem demora injustificada; eliminação ou devolução dos dados no termo do contrato, sem prejuízo de conservação legal.</p>
<h2>4. Subcontratantes ulteriores</h2>
<p>O Cliente autoriza genericamente o recurso a: Google Ireland Ltd. (Firebase — alojamento, autenticação) e Google (Gemini API — tutor de IA). A Plataforma informará o Cliente de alterações, podendo este opor-se.</p>
<h2>5. Auditoria</h2>
<p>A Plataforma disponibiliza a informação necessária para demonstrar o cumprimento deste acordo e permite auditorias razoáveis, mediante pré-aviso escrito de 15 dias.</p>`);
}
/* R2-8 · EU AI Act Article 4 — AI-literacy evidence pack.
   Generated from the evidence ledger; framed as lightweight support + documentation
   (the Art.4 duty), NOT a certified assessment. Draft wording pending legal review. */
function art4Rows(list) {
  return list.map(({ name, st }) => {
    const p = (st.progress || {})['ai-literacy'];
    const pct = p ? (p.done ? 100 : (p.pct || 0)) : 0;
    const L = st.ledger || [];
    const best = Math.max(0, ...L.filter(e => e.type === 'quiz_pass' && e.courseId === 'ai-literacy').map(e => e.score || 0));
    const ver = courseVerified('ai-literacy', st);
    const ev = L.filter(e => e.courseId === 'ai-literacy').length;
    const hours = (st.trainingLog || []).filter(e => e.courseId === 'ai-literacy').reduce((a, e) => a + (e.hours || 0), 0);
    return `<tr><td>${esc(name)}</td><td>${pct}%${p && p.done ? ' ✓' : ''}</td><td>${best || '—'}</td><td>${ver ? 'Sim ✓' : '—'}</td><td>${Math.round(hours * 100) / 100}h</td><td>${ev}</td></tr>`;
  }).join('');
}
function art4PackHTML(list) {
  const today = new Date().toLocaleDateString('pt-PT');
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>Registo de Literacia de IA — Art. 4.º</title>
<style>body{font-family:Georgia,serif;max-width:860px;margin:40px auto;color:#1d2a20;line-height:1.55;padding:0 20px}h1{font-size:26px}h2{font-size:17px;margin-top:28px}.meta{color:#5a6a5c;font-size:13px}table{border-collapse:collapse;width:100%;margin:18px 0;font-size:13.5px}th,td{border:1px solid #c9d2c9;padding:7px 10px;text-align:left}th{background:#eef2ec}.note{background:#f6f3e8;border:1px solid #ddd2ae;padding:12px 16px;border-radius:8px;font-size:13px;margin-top:26px}</style></head><body>
<h1>Registo de Literacia de IA — Regulamento (UE) 2024/1689, Artigo 4.º</h1>
<p class="meta"><b>${esc(companyName())}</b>${companyNif() ? ' · NIF ' + esc(companyNif()) : ''} · ${today} · Plataforma: ${brandAcademy()}</p>
<h2>1. Enquadramento</h2>
<p>O Artigo 4.º do Regulamento IA obriga os fornecedores e utilizadores de sistemas de IA a assegurar, na medida do possível, um nível suficiente de <b>literacia no domínio da IA</b> do seu pessoal (aplicável desde 2 de fevereiro de 2025; regime sancionatório aplicável a partir de <b>2 de agosto de 2026</b>). Não é exigido formato certificado — um registo interno de formação documentada constitui o suporte adequado.</p>
<h2>2. Medida implementada</h2>
<p>Percurso interno «Working Well with AI / Trabalhar Bem com a IA» (5 módulos: natureza e limites da IA; utilização do tutor de IA; erros e alucinações; dados pessoais e RGPD; o Regulamento IA), com verificação por questionário de cenários e reverificação anual. Os registos abaixo derivam de um <b>diário de eventos de aprendizagem apenas-acrescentar, com cadeia de integridade (SHA-256)</b> — qualquer alteração posterior quebraria a cadeia.</p>
<h2>3. Registo por trabalhador</h2>
<table><tr><th>Trabalhador</th><th>Percurso</th><th>Melhor resultado</th><th>Competência verificada*</th><th>Horas</th><th>Eventos no diário</th></tr>${art4Rows(list)}</table>
<p class="meta">* «Verificada» = percurso concluído + item de cenário aprovado + verificação de retenção diferida (≥7 dias).</p>
<div class="note"><b>Nota:</b> documento de apoio gerado automaticamente pela plataforma ${brandAcademy()} como evidência de diligência nos termos do Art. 4.º — enquadramento de apoio e documentação, não uma certificação formal. Modelo em validação jurídica.</div>
</body></html>`;
}
function downloadArt4Pack(team) {
  let list;
  if (team) {
    if (!adminMembers) { toast('Members still loading', 'ℹ️'); return; }
    list = filteredMembers().map(m => ({ name: (m.profile || {}).name || '—', st: m.state || {} }));
  } else {
    list = [{ name: displayName(), st: S }];
  }
  const blob = new Blob([art4PackHTML(list)], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `literacia-ia-art4-${new Date().getFullYear()}.html`;
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast(t('art4_done'), '⤓');
}
function downloadGdprDoc(kind) {
  const map = { retention: [gdprRetentionDoc, 'politica-retencao'], art30: [gdprArt30Doc, 'registo-tratamento-art30'], dpa: [gdprDpaDoc, 'acordo-subcontratacao-dpa'] };
  const m = map[kind]; if (!m) return;
  const blob = new Blob([m[0]()], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${m[1]}-${new Date().getFullYear()}.html`;
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast(t('gdpr_doc_done'), '⤓');
}

/* ================= R2-18 · Transfer loop — did the learning reach the work? =================
   Course end captures ONE implementation intention; at 7/14/30 days we ask whether it
   was applied. 70–90% of training never reaches daily work — this loop is the counter,
   and `application_checkin` events give the ledger a real Kirkpatrick-L3 signal. */
const TRANSFER_DAYS = [7, 14, 30];
function dueApplicationChecks(st = S) {
  const out = [];
  const its = st.intentions || {};
  for (const courseId in its) {
    const it = its[courseId];
    const days = Math.floor((Date.now() - it.at) / 864e5);
    for (const d of TRANSFER_DAYS) {
      if (days >= d && !(it.checks || {})[d]) { out.push({ courseId, day: d, text: it.text }); break; }
    }
  }
  return out;
}
function applicationRate(st = S) {
  const L = (st.ledger || []).filter(e => e.type === 'application_checkin');
  if (!L.length) return null;
  const applied = L.filter(e => e.applied);
  /* Confirmations are counted from the MANAGER's chain, mirrored into the
     learner's state as copies. A copy is only ever a claim; the manager's own
     chain is the original. Both hashes travel in the export so an auditor can
     hold the two records side by side — which is the whole point of keeping
     them separate. */
  const conf = (st.confirmations || []).filter(c => c.verdict === 'confirmed');
  const confirmedHashes = new Set(conf.map(c => c.learnerEventHash));
  const confirmed = applied.filter(e => confirmedHashes.has(e.hash)).length;
  return {
    applied: applied.length, total: L.length, pct: Math.round(applied.length / L.length * 100),
    confirmed, confirmedPct: applied.length ? Math.round(confirmed / applied.length * 100) : 0
  };
}

/* ---- R2-18b · The manager's chain -----------------------------------
   A learner saying "I applied it" is self-report. A manager confirming it is
   evidence. The tempting shortcut is to append the confirmation onto the
   learner's chain — but then their record has two authors, and "the learner's
   own append-only record" quietly stops being true. We keep a SEPARATE chain
   per manager instead: it references the learner's event BY HASH, so the two
   records are independently verifiable and cross-checkable, and neither can be
   edited to agree with the other after the fact.

   Being straight about the limit: without per-user signing keys, a mirrored
   confirmation inside a learner's export is a copy, not a signature. It is
   checkable against the manager's chain, and the server keeps both create-only
   — enough to make quiet tampering detectable, short of full PKI. */
async function mgrAppend(type, data = {}) {
  const M = (S.mgr = S.mgr || []);
  const core = Object.assign({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    brandId: BRAND.id || 'edenrise', type, at: new Date().toISOString(),
    prevHash: M.length ? M[M.length - 1].hash : 'genesis'
  }, data);
  const hash = await _ledgerSha(JSON.stringify(core));
  const ev = Object.assign(core, { hash });
  M.push(ev); save();
  return ev;
}
/* Check-ins where the learner claims they applied it and no manager has ruled
   yet. Only 'applied' claims need confirming — "not yet" is already honest. */
function pendingConfirmations(members) {
  const out = [];
  const mine = S.mgr || [];
  const ruled = new Set(mine.map(e => e.learnerEventHash));
  for (const m of (members || [])) {
    if (!m.uid || m.uid === (S.profile || {}).uid) continue;      /* never yourself */
    const L = ((m.state || {}).ledger) || [];
    const intents = (m.state || {}).intentions || {};
    for (const e of L) {
      if (e.type !== 'application_checkin' || !e.applied || !e.hash) continue;
      if (ruled.has(e.hash)) continue;
      out.push({
        uid: m.uid, name: (m.profile || {}).name || (m.profile || {}).username || 'Learner',
        courseId: e.courseId, day: e.day, at: e.at, hash: e.hash,
        text: (intents[e.courseId] || {}).text || ''
      });
    }
  }
  return out.sort((a, b) => new Date(b.at) - new Date(a.at));
}
async function confirmApplication(hash, verdict) {
  const p = (pendingConfirmations(adminMembers) || []).find(x => x.hash === hash);
  if (!p) return;
  const ev = await mgrAppend('application_confirmed', {
    subjectUid: p.uid, learnerEventHash: p.hash, courseId: p.courseId, day: p.day || null, verdict
  });
  try {
    await window.EdenCloud.confirmApplication({
      subjectUid: p.uid, learnerEventHash: p.hash, courseId: p.courseId,
      verdict, mgrEvent: ev
    });
  } catch (e) { /* offline / rules not live — the manager chain still holds it */ }
  toast(t(verdict === 'confirmed' ? 'mconf_done' : 'mconf_noted'), verdict === 'confirmed' ? '✅' : '📝');
  const w = document.getElementById('mgrConfirm');
  if (w) w.outerHTML = confirmPanelHTML();
}
function confirmPanelHTML() {
  const pend = pendingConfirmations(adminMembers);
  if (!pend.length) return '<div id="mgrConfirm"></div>';
  return `<div class="admin-section intent-panel" id="mgrConfirm">
    <h2>✅ ${t('mconf_h')}</h2>
    <p class="sect-sub">${t('mconf_sub')}</p>
    ${pend.slice(0, 12).map(p => `<div class="intent-row">
      <div class="intent-info"><b>${esc(p.name)}</b> · ${esc(ctitle(courseById(p.courseId)) || p.courseId)}${p.text ? `<span>“${esc(p.text)}”</span>` : ''}</div>
      <div class="intent-btns">
        <button class="btn btn-primary btn-sm" data-action="app-confirm" data-id="${p.hash}">${t('mconf_yes')}</button>
        <button class="btn btn-ghost btn-sm" data-action="app-deny" data-id="${p.hash}">${t('mconf_no')}</button>
      </div>
    </div>`).join('')}
  </div>`;
}
function transferPanelHTML() {
  const due = dueApplicationChecks();
  if (!due.length) return '';
  return `<div class="admin-section intent-panel">
    <h2>🎯 ${t('appcheck_h')}</h2>
    <p class="sect-sub">${t('appcheck_sub')}</p>
    ${due.map(d => `<div class="intent-row">
      <div class="intent-info"><b>${esc(ctitle(courseById(d.courseId)) || d.courseId)}</b> · ${t('appcheck_day').replace('{d}', d.day)}<span>“${esc(d.text)}”</span></div>
      <div class="intent-btns">
        <button class="btn btn-primary btn-sm" data-action="app-check" data-id="${d.courseId}" data-day="${d.day}" data-applied="1">✓ ${t('appcheck_yes')}</button>
        <button class="btn btn-glass btn-sm" data-action="app-check" data-id="${d.courseId}" data-day="${d.day}" data-applied="0">${t('appcheck_no')}</button>
      </div>
    </div>`).join('')}
  </div>`;
}

/* evidence export — the client-owned file a third party can verify WITHOUT us
   (regulators explicitly ask for tamper-evident records readable outside the vendor) */
function downloadEvidenceExport() {
  const L = S.ledger || [];
  const payload = {
    format: 'lumina-evidence-v1',
    exportedAt: new Date().toISOString(),
    platform: brandAcademy(),
    brandId: BRAND.id || 'edenrise',
    learner: displayName(),
    events: L,
    headHash: L.length ? L[L.length - 1].hash : null,
    /* Bitcoin proofs, as standard detached OpenTimestamps files (base64). Each
       proves its `head` hash existed by a given block. Not our format: decode
       one to <name>.ots and `ots verify` it, or drop it on opentimestamps.org. */
    timestamps: (S.ots || []).map(r => ({ head: r.head, eventsAtStamp: r.count, stampedAt: r.at, status: r.status, bitcoinBlock: r.height || null, otsBase64: r.ots })),
    /* Manager verdicts about this learner. COPIES: the original lives on the
       manager's own chain (mgrEventHash identifies it there). An auditor who
       wants certainty asks the manager for their export and checks the hashes
       line up — that is exactly why the two chains are kept apart. */
    confirmations: (S.confirmations || []).map(c => ({ learnerEventHash: c.learnerEventHash, courseId: c.courseId, verdict: c.verdict, by: c.byName || '', mgrEventHash: c.mgrEventHash, at: c.at })),
    note: 'Append-only SHA-256 hash-chained learning record. Verify at /verify.html or with any RFC-6234 SHA-256 implementation: hash_i = sha256(JSON(event_i minus hash)), event_i.prevHash must equal hash_{i-1}. A "timestamps" entry whose status is "confirmed" additionally proves that head hash existed at/before its Bitcoin block — i.e. the record was not back-dated. It does not attest that the underlying learning claims are true.'
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `evidence-${(S.profile && S.profile.username) || 'learner'}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast(t('ev_export_done'), '⤓');
}

/* R2-5: the harder number above completion — with the evidence-record status line */
function verifiedPanelHTML() {
  const v = verifiedCompetency();
  if (!v.done) return '';
  const events = (S.ledger || []).length;
  return `<div class="admin-section vc-panel">
    <h2>🏅 ${t('vc_title')}</h2>
    <p class="sect-sub">${t('vc_sub')}</p>
    <div class="ready-wrap">
      <div class="jour-ring lg" style="background:conic-gradient(${v.pct >= 100 ? 'var(--accent-2)' : 'var(--accent)'} ${v.pct * 3.6}deg, rgba(231,237,227,.12) 0)"><span>${v.pct}%<small style="font-size:11px">${t('vc_ring')}</small></span></div>
      <div class="ready-rows" style="gap:6px;">
        <div class="between"><span class="sk-name">${t('vc_of').replace('{v}', v.verified).replace('{d}', v.done)}</span></div>
        <div class="vc-how">${t('vc_how')}</div>
        ${(() => { const ar = applicationRate(); if (!ar) return '';
          const self = `<div class="vc-how">🎯 ${t('vc_applied').replace('{a}', ar.applied).replace('{t}', ar.total)} <span style="opacity:.6">(${t('vc_selfrep')})</span></div>`;
          /* self-reported and manager-confirmed are DIFFERENT claims and are
             shown as different lines. Averaging them would quietly inflate the
             stronger one. */
          const conf = ar.applied ? `<div class="vc-how">✅ ${t('vc_confirmed').replace('{c}', ar.confirmed).replace('{a}', ar.applied)}</div>` : '';
          return self + conf; })()}
        <div class="vc-ledger" id="vcLedger">🔐 ${events} ${t('vc_events')} · <span class="vc-chk">…</span> · <button class="link-quiet" data-action="ev-export">⤓ ${t('ev_export')}</button></div>
        <div class="vc-how" id="vcOts">${otsLineHTML()}</div>
      </div>
    </div>
  </div>`;
}
/* One honest line about the strongest claim we can currently make. Never
   promises more than the proof in hand actually supports. */
function otsLineHTML() {
  const r = otsBest();
  if (!r) return `⛓ ${t('ots_none')}`;
  if (r.status === 'confirmed') return `⛓ ${t('ots_confirmed').replace('{b}', r.height)}`;
  return `⏳ ${t('ots_pending')}`;
}
async function paintLedgerCheck() {
  /* stamp/upgrade quietly in the background, then refresh the line if it moved */
  otsMaintain().then(changed => {
    const o = document.getElementById('vcOts');
    if (changed && o) o.innerHTML = otsLineHTML();
  });
  const el = document.querySelector('#vcLedger .vc-chk'); if (!el) return;
  const r = await ledgerVerify();
  el.textContent = r.ok ? t('vc_intact') : t('vc_broken');
  el.style.color = r.ok ? 'var(--accent-2)' : '#d98a76';
}
function compliancePanelHTML() {
  const pf = S.profile || {};
  const log = (S.trainingLog || []).filter(e => new Date(e.at).getFullYear() === complianceYear()).sort((a, b) => b.at - a.at);
  const target = complianceTarget(pf) || 40;
  const done = trainingHours(S.trainingLog);
  const pct = Math.min(100, Math.round(done / target * 100));
  const pace = trainingPace(target);
  const behind = done < pace - 1;
  const dateFmt = ts => new Date(ts).toLocaleDateString(_lang() === 'pt' ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'short' });
  return `<div class="admin-section comp-panel">
    <h2>🛡 ${t('comp_h')} · ${complianceYear()}</h2>
    <p class="sect-sub">${t('comp_sub')}</p>
    <div class="ready-wrap">
      <div class="jour-ring lg" style="background:conic-gradient(${behind ? 'var(--warn, #d9b38c)' : 'var(--accent-2)'} ${pct * 3.6}deg, rgba(231,237,227,.12) 0)"><span>${done}<small style="font-size:11px">/${target}h</small></span></div>
      <div class="ready-rows" style="gap:6px;">
        <div class="between"><span class="sk-name">${t('comp_done')}</span><b>${done} ${t('comp_h_unit')}</b></div>
        <div class="between"><span class="sk-name">${t('comp_target')}</span><b>${target} ${t('comp_h_unit')}</b></div>
        <div class="between"><span class="sk-name">${t('comp_left')}</span><b>${Math.max(0, Math.round((target - done) * 10) / 10)} ${t('comp_h_unit')}</b></div>
        <div class="comp-status ${behind ? 'behind' : 'ok'}">${behind ? `⚠ ${t('comp_behind')} · ${t('comp_pace_by')} ${pace}h` : `● ${t('comp_ontrack')}`}</div>
      </div>
    </div>
    ${!pf.nif ? `<div class="comp-note" data-action="goto" data-route="#/profile" role="button" tabindex="0">🪪 ${t('comp_nif_prompt')} →</div>` : ''}
    <div class="ob-eyebrow" style="margin-top:16px;">${t('comp_log')}</div>
    ${log.length ? `<div class="comp-log">${log.slice(0, 8).map(e => `<div class="comp-row"><span class="cl-t">${esc(e.title || '')}</span><span class="cl-meta">${dateFmt(e.at)} · ${e.hours}${t('comp_h_unit')} ${e.confirmed ? '· ✓' : ''}</span></div>`).join('')}</div>` : `<p class="empty-note" style="text-align:left;padding:6px 0;">${t('comp_none')}</p>`}
    ${log.length ? `<div class="row wrapf gap-3" style="margin-top:16px;">
      <button class="btn btn-primary btn-sm" data-action="comp-cert">🎓 ${t('comp_cert_btn')}</button>
      <button class="btn btn-glass btn-sm" data-action="hour-log">📒 ${t('hourlog_btn')}</button>
      <button class="btn btn-glass btn-sm" data-action="comp-register">⤓ ${t('comp_reg_btn')}</button>
      <button class="btn btn-glass btn-sm" data-action="art4-self">🤖 ${t('art4_btn')}</button>
    </div>` : ''}
  </div>`;
}

function readinessSectionHTML() {
  const r = roleReadiness();
  if (!r) return '';
  const recs = CATALOG.filter(c => skillsOf(c).includes(r.gap.key) && !isDone(c.id)).slice(0, 2);
  return `<div class="admin-section">
    <h2>🧭 ${t('ready_h')}</h2><p class="sect-sub">${t('ready_sub')}</p>
    <div class="ready-wrap">
      <div class="jour-ring lg" style="background:conic-gradient(var(--accent) ${r.overall * 3.6}deg, rgba(231,237,227,.12) 0)"><span>${r.overall}%</span></div>
      <div class="ready-rows">${r.rows.sort((a, b) => a.ready - b.ready).map(x => `
        <div class="skill-row"><span class="sk-name">${tskill(x.key)}</span>
          <div class="track"><div class="fill" style="width:${x.ready}%"></div></div>
          <span class="sk-pct">${x.ready}% <em class="sk-target">${t('ready_of')} ${x.target}</em></span></div>`).join('')}</div>
    </div>
    ${recs.length ? `<div class="ob-eyebrow" style="margin-top:16px;">${t('ready_gap')}: ${tskill(r.gap.key)} · ${t('ready_rec')}</div>
    <div class="ask-refs" style="margin-top:8px;">${recs.map(c => `
      <div class="ask-ref" data-action="open-course" data-id="${c.id}" role="button" tabindex="0">
        <span class="ci t-grad-${c.grad}">${svgIcon(c.icon)}</span>
        <div class="ct"><b>${esc(ctitle(c))}</b><span>${tcat(c.cat)} · ${fmtMins(courseMins(c))}</span></div>
        <span class="ask-go">→</span>
      </div>`).join('')}</div>` : ''}
  </div>`;
}

/* ================= Compliance — certifications that stay alive ================= */
function recertState(c) {
  if (!c.recertMonths) return null;
  const p = prog(c.id); if (!p || !p.done || !p.doneAt) return null;
  const expiry = p.doneAt + c.recertMonths * 2629800000;
  const days = Math.ceil((expiry - Date.now()) / 86400000);
  return days < 0 ? { st: 'expired', days } : days <= 30 ? { st: 'expiring', days } : { st: 'ok', days };
}
function complianceHTML() {
  if (!adminMembers) return '';
  const courses = CATALOG.filter(c => c.recertMonths);
  if (!courses.length) return '';
  const rows = courses.map(c => {
    const per = filteredMembers().map(m => {
      const p = (m.state.progress || {})[c.id];
      if (!p || !p.done || !p.doneAt) return null;
      const days = Math.ceil((p.doneAt + c.recertMonths * 2629800000 - Date.now()) / 86400000);
      return { name: (m.profile && m.profile.name) || 'Learner', days };
    }).filter(Boolean);
    const expired = per.filter(x => x.days < 0), expiring = per.filter(x => x.days >= 0 && x.days <= 30);
    return `<div class="content-row"><span class="ci t-grad-${c.grad}">${svgIcon(c.icon)}</span>
      <div class="ct"><b>${esc(c.title)}</b><span>renews every ${c.recertMonths}mo · ${per.length} certified${expired.length ? ` · <em class="asg-over">${expired.length} expired (${expired.map(x => x.name.split(' ')[0]).join(', ')})</em>` : ''}${expiring.length ? ` · ${expiring.length} expiring soon` : ''}</span></div>
      <span class="pub-chip ${expired.length ? 'draft' : 'live'}">${expired.length ? 'ACTION' : 'OK'}</span></div>`;
  }).join('');
  return `<div class="admin-section"><h2>🛡 Compliance</h2>
    <p class="sect-sub">Recurring certifications — who's current, who needs a renewal nudge.</p>${rows}</div>`;
}

/* ================= AI Cockpit digest ================= */
async function generateCockpitDigest() {
  if (!aiKey()) { toast(t('studio_need_key'), 'ℹ️'); return; }
  if (!adminMembers) { toast('Members are still loading', 'ℹ️'); return; }
  const el = $('#aiDigest');
  el.innerHTML = `<div class="studio-status"><span class="orb-spin" style="width:20px;height:20px;"></span> Reading the team's week…</div>`;
  const sums = adminMembers.map(memberSummary);
  const data = sums.map(s => `${s.name} (${(adminMembers.find(m => memberSummary(m).name === s.name) || { profile: {} }).profile.dept || 'no dept'}): ${s.pathPct}% path, streak ${s.streak}d, last active ${s.days == null ? 'never' : s.days + 'd ago'}, ${s.atRisk ? 'AT RISK' : 'on track'}`).join('\n');
  const asgs = activeAssignments().map(a => `${(courseById(a.courseId) || {}).title} → ${a.team}${a.due ? ' due ' + a.due : ''} (${assignmentTrack(a) || 'no data'})`).join('\n') || 'none';
  try {
    const raw = await llmComplete({ maxTokens: 700,
      system: `You are the learning lead's chief of staff at ${brandAcademy()}. From the member data, write a short leadership digest as raw JSON: {"headline":str(one warm, true sentence about the week),"wins":[1-2 str],"attention":[1-2 str naming specific people kindly],"action":str(ONE concrete recommendation for this week)}. Honest, specific, zero corporate filler.`,
      messages: [{ role: 'user', content: `MEMBERS:\n${data}\n\nASSIGNMENTS:\n${asgs}` }] });
    const j = JSON.parse(raw.replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
    el.innerHTML = `<div class="digest-card">
      <div class="ob-eyebrow">✦ This week</div>
      <h3>${esc(j.headline || '')}</h3>
      ${(j.wins || []).map(w => `<p class="dg-row">🌿 ${esc(w)}</p>`).join('')}
      ${(j.attention || []).map(w => `<p class="dg-row">👀 ${esc(w)}</p>`).join('')}
      <p class="dg-action"><b>→</b> ${esc(j.action || '')}</p>
    </div>`;
  } catch (e) { el.innerHTML = `<div class="auth-err on">Could not write the digest — try again.</div>`; }
}

/* ================= Journeys — milestone paths with a capstone ================= */
function journeyStageDone(st) {
  if (!isDone(st.course)) return false;
  if (st.mission) {
    const m = missionState(st.course);
    return !!(m && m.status === 'approved' && m.claimed);
  }
  return true;
}
function journeyProgress(j) {
  const done = j.stages.filter(journeyStageDone).length;
  return { done, total: j.stages.length, pct: Math.round(done / j.stages.length * 100) };
}
function journeyCardHTML(j) {
  const pr = journeyProgress(j);
  return `<div class="jour-card" data-action="open-journey" data-id="${j.id}" role="button" tabindex="0">
    <span class="ci lg t-grad-${j.grad}">${svgIcon(j.icon)}</span>
    <div class="ct"><b>${esc(tjour(j, 'title'))}</b><span>${esc(tjour(j, 'desc'))}</span>
      <div class="jour-meta">${j.stages.length} ${t('jour_stage').toLowerCase()}s · +${j.xp} XP · 🎓</div></div>
    <div class="jour-ring" style="background:conic-gradient(var(--accent) ${pr.pct * 3.6}deg, rgba(231,237,227,.12) 0)"><span>${pr.pct}%</span></div>
  </div>`;
}
function journeysSectionHTML() {
  return `<div class="admin-section" style="border:none;padding-top:0;">
    <h2>${t('jour_h')}</h2><p class="sect-sub">${t('jour_sub')}</p>
    ${JOURNEYS.map(journeyCardHTML).join('')}
  </div>`;
}
function renderJourney(id) {
  const j = JOURNEYS.find(x => x.id === id);
  if (!j) { location.hash = '#/paths'; return ''; }
  if (myMissions === null && S.profile && S.profile.uid && window.EdenMissions) { myMissions = []; loadMyMissions(); }
  const pr = journeyProgress(j);
  const complete = pr.done === pr.total;
  if (complete && !(S.journeysDone && S.journeysDone[j.id])) {
    (S.journeysDone || (S.journeysDone = {}))[j.id] = Date.now(); save();
    setTimeout(() => awardXp(j.xp, tjour(j, 'title')), 600);
  }
  let unlockedNext = true;
  const stages = j.stages.map((st, i) => {
    const c = courseById(st.course); if (!c) return '';
    const done = journeyStageDone(st);
    const active = !done && unlockedNext;
    if (!done) unlockedNext = false;
    const clickable = done || active || isDone(st.course) || coursePct(st.course) > 0;
    return `<div class="jstage ${done ? 'done' : active || clickable ? 'active' : 'locked'}" ${clickable ? `data-action="open-course" data-id="${c.id}" role="button" tabindex="0"` : ''}>
      <div class="jnode">${done ? '✓' : i + 1}</div>
      <div class="jinfo">
        <span class="jkind">${t('jour_stage')} ${i + 1}${st.capstone ? ` · ${t('jour_capstone')}` : ''}${st.mission ? ` <em>${t('jour_mission_tag')}</em>` : ''}</span>
        <b>${esc(ctitle(c))}</b>
        <span class="jsub">${fmtMins(courseMins(c))} · ${coursePct(c.id)}%${st.mission ? ' · 🌾' : ''}</span>
      </div>
      ${done ? '' : active ? '<span class="jgo">→</span>' : '<span class="jgo">🔒</span>'}
    </div>`;
  }).join('');
  return `<div class="page"><div class="page-pad">
    <button class="comm-back" data-action="goto" data-route="#/paths">← ${t('jour_h')}</button>
    <div class="jour-head">
      <span class="ci lg t-grad-${j.grad}">${svgIcon(j.icon)}</span>
      <div><h1 class="page-title" style="margin:0;">${esc(tjour(j, 'title'))}</h1>
      <p class="page-sub" style="margin:6px 0 0;">${esc(tjour(j, 'desc'))}</p></div>
    </div>
    <div class="hero-progress" style="max-width:420px;margin:18px 0 6px;"><div class="track"><div class="fill" style="width:${pr.pct}%"></div></div><span>${pr.done}/${pr.total} · ${pr.pct}% ${t('jour_progress')}</span></div>
    ${complete ? `<div class="jour-done">🎓 ${t('jour_done')} · +${j.xp} XP <button class="btn btn-glass btn-sm" data-action="jour-cert" data-id="${j.id}">⤓ ${t('jour_cert')}</button></div>` : ''}
    <div class="jstages">${stages}</div>
  </div>${footerHTML()}</div>`;
}

/* ================= Premium certificates (print-grade) =================
   The canvas PNGs stay for legacy, but the primary certificate is now a
   print-window document: vector-crisp at any size, themed from the live brand
   tokens, saved as PDF by the browser. Three tiers, honestly distinguished:
     · Course / Journey  — completion certificates
     · Compliance annual — the 40h record certificate (NIF + verify code)
     · VERIFIED          — the top tier, only issuable when the ledger holds
       completion + applied scenario + delayed retrieval; carries the evidence
       hash and the public verifier URL, so the paper points at the proof.
   Wording rule (legal/TRAINING-RECORDS-LEGAL.md): these are INTERNAL training
   certificates from the employer — they must never imply certified-entity
   (DGERT) professional certification. The footer says so on every tier. */
function brandVar(name, fb) {
  try { const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; } catch (e) { return fb; }
}
function openPrintDoc(html) {
  const w = window.open('', '_blank');
  if (!w) { toast(t('cert_popup'), 'ℹ️'); return; }
  w.document.write(html); w.document.close();
}
function certFooterNote() {
  return _lang() === 'pt'
    ? 'Certificado interno de formação, emitido pela entidade no âmbito da formação contínua (art. 131.º do Código do Trabalho). Não constitui certificação profissional emitida por entidade formadora certificada.'
    : 'Internal training certificate, issued by the organisation within continuous workplace training (PT Labour Code art. 131). It is not a professional certification issued by an accredited training entity.';
}
function buildCertHTML(o) {
  const accent = brandVar('--accent', '#c8a45d');
  const pt = _lang() === 'pt';
  return `<!doctype html><html lang="${pt ? 'pt' : 'en'}"><head><meta charset="utf-8"><title>${esc(o.docTitle)}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; print-color-adjust:exact; -webkit-print-color-adjust:exact; }
  body { font-family: Georgia, 'Times New Roman', serif; background:#efece4; display:grid; place-items:center; min-height:100vh; }
  .sheet { width:297mm; height:210mm; background:#faf8f2; position:relative; padding:16mm 20mm; display:flex; flex-direction:column; align-items:center; text-align:center; }
  .frame { position:absolute; inset:7mm; border:2.5px solid ${accent}; }
  .frame::after { content:''; position:absolute; inset:2.5mm; border:.6px solid #1c242033; }
  .logo { height:15mm; margin:8mm 0 4mm; display:flex; align-items:center; gap:4mm; justify-content:center; }
  .logo svg { height:15mm; width:auto; }
  .brand { font-family:Helvetica,Arial,sans-serif; letter-spacing:.34em; font-size:10.5px; color:#4c554e; text-transform:uppercase; }
  .eyebrow { font-family:Helvetica,Arial,sans-serif; letter-spacing:.42em; font-size:12px; color:${accent}; text-transform:uppercase; margin-top:7mm; }
  ${o.tier ? `.tier { margin-top:3mm; font-family:Helvetica,Arial,sans-serif; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:#faf8f2; background:${accent}; padding:1.6mm 6mm; border-radius:99px; }` : ''}
  .who { font-size:40px; margin-top:6mm; color:#161d18; font-weight:600; }
  .did { font-size:14.5px; color:#57605a; margin-top:3.5mm; font-family:Helvetica,Arial,sans-serif; }
  .what { font-size:27px; color:#161d18; margin-top:2.5mm; max-width:210mm; line-height:1.25; }
  .meta { font-family:Helvetica,Arial,sans-serif; font-size:12.5px; color:#57605a; margin-top:5mm; letter-spacing:.05em; }
  .meta b { color:#161d18; }
  ${o.evidence ? `.ev { margin-top:4mm; font-family:'Courier New',monospace; font-size:10px; color:#6a736c; line-height:1.7; } .ev b { color:#3c453e; font-family:Helvetica,Arial,sans-serif; }` : ''}
  .sig { margin-top:auto; margin-bottom:6mm; display:flex; width:100%; justify-content:space-between; align-items:flex-end; font-family:Helvetica,Arial,sans-serif; font-size:11px; color:#57605a; }
  .sig .line { border-top:1px solid #1c2420; padding-top:2mm; width:62mm; text-align:center; }
  .note { position:absolute; bottom:9.5mm; left:20mm; right:20mm; font-family:Helvetica,Arial,sans-serif; font-size:8px; color:#8b938c; line-height:1.45; }
  .print { position:fixed; top:12px; right:12px; font-family:Helvetica,Arial,sans-serif; background:#161d18; color:#fff; border:0; border-radius:8px; padding:9px 16px; cursor:pointer; font-size:13px; }
  @media print { .print { display:none; } body { background:#faf8f2; } }
</style></head><body>
<button class="print" onclick="print()">⤓ ${pt ? 'Imprimir / Guardar PDF' : 'Print / Save as PDF'}</button>
<div class="sheet">
  <div class="frame"></div>
  <div class="logo">${(window.BRAND && BRAND.logoSvg) || ((document.querySelector('.logo-mark svg') || {}).outerHTML || '')}</div>
  <div class="brand">${esc(brandAcademy())}</div>
  <div class="eyebrow">${esc(o.eyebrow)}</div>
  ${o.tier ? `<div class="tier">★ ${esc(o.tier)}</div>` : ''}
  <div class="who">${esc(o.who)}</div>
  <div class="did">${esc(o.did)}</div>
  <div class="what">${esc(o.what)}</div>
  <div class="meta">${o.meta}</div>
  ${o.evidence ? `<div class="ev">${o.evidence}</div>` : ''}
  <div class="sig"><div>${esc(o.code || '')}</div><div class="line">${esc(companyName())}</div></div>
  <div class="note">${certFooterNote()}${o.extraNote ? ' · ' + o.extraNote : ''}</div>
</div></body></html>`;
}
function certIdentity() { const pf = S.profile || {}; return pf.name || pf.username || (pf.email || '').split('@')[0] || 'Learner'; }
function fmtCertDate(d) {
  const pt = _lang() === 'pt';
  const M = pt ? ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
               : ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return d.getDate() + (pt ? ' de ' : ' ') + M[d.getMonth()] + (pt ? ' de ' : ', ') + d.getFullYear();
}
function premiumCourseCert(courseId) {
  const c = courseById(courseId); if (!c || !isDone(courseId)) return;
  const pt = _lang() === 'pt', h = Math.round(courseMins(c) / 6) / 10;
  openPrintDoc(buildCertHTML({
    docTitle: (pt ? 'Certificado — ' : 'Certificate — ') + ctitle(c),
    eyebrow: pt ? 'Certificado de Conclusão' : 'Certificate of Completion',
    who: certIdentity(),
    did: pt ? 'concluiu com aproveitamento o percurso de formação' : 'has successfully completed the training course',
    what: ctitle(c),
    meta: `${h}h · <b>${fmtCertDate(certDate(c.id))}</b>`,
  }));
  ledgerAppend('cert_issued', { courseId, kind: 'course' });
}
function premiumJourneyCert(id) {
  const j = JOURNEYS.find(x => x.id === id); if (!j) return;
  const pt = _lang() === 'pt';
  const doneAt = new Date((S.journeysDone && S.journeysDone[id]) || Date.now());
  const hours = Math.round(j.stages.reduce((a, st) => { const c = courseById(st.course); return a + (c ? courseMins(c) : 0); }, 0) / 6) / 10;
  openPrintDoc(buildCertHTML({
    docTitle: (pt ? 'Certificado de Percurso — ' : 'Journey Certificate — ') + tjour(j, 'title'),
    eyebrow: pt ? 'Certificado de Percurso' : 'Journey Certificate',
    who: certIdentity(),
    did: pt ? `concluiu o percurso completo (${j.stages.length} etapas)` : `has completed the full journey (${j.stages.length} stages)`,
    what: tjour(j, 'title'),
    meta: `${hours}h · <b>${fmtCertDate(doneAt)}</b>`,
  }));
  ledgerAppend('cert_issued', { journeyId: id, kind: 'journey' });
}
async function premiumComplianceCert() {
  const pf = S.profile || {};
  if (!pf.nif) { toast(t('comp_nif_prompt'), '🪪'); location.hash = '#/profile'; return; }
  const pt = _lang() === 'pt', y = complianceYear();
  const code = await complianceVerifyCode(pf, y, S.trainingLog);
  ledgerAppend('cert_issued', { year: y, code, kind: 'compliance' });
  const h = trainingHours(S.trainingLog || []);
  openPrintDoc(buildCertHTML({
    docTitle: (pt ? 'Certificado de Formação Contínua ' : 'Continuous Training Certificate ') + y,
    eyebrow: pt ? 'Formação Contínua · ' + y : 'Continuous Training · ' + y,
    who: certIdentity(),
    did: (pt ? 'NIF ' : 'Tax ID ') + pf.nif + (pt ? ' · realizou no ano de ' + y : ' · completed in ' + y),
    what: (pt ? `${h} horas de formação registada` : `${h} hours of recorded training`),
    meta: (pt ? 'Meta legal: <b>40h/ano</b> (art. 131.º CT)' : 'Legal target: <b>40h/yr</b> (PT Labour Code 131)'),
    code: (pt ? 'Código de verificação: ' : 'Verification code: ') + code,
  }));
}
/* THE top tier — only exists when the ledger proves it. */
function downloadVerifiedCert(courseId) {
  const c = courseById(courseId);
  if (!c || !courseVerified(courseId)) { toast(t('vcert_locked'), '🔒'); return; }
  const pt = _lang() === 'pt';
  const L = S.ledger || [];
  const doneAt = (S.progress[courseId] || {}).doneAt;
  const ret = L.find(e => e.type === 'delayed_retrieval_pass' && e.courseId === courseId);
  const days = ret && doneAt ? Math.floor((new Date(ret.at) - doneAt) / 864e5) : 7;
  const mgr = (S.confirmations || []).find(x => x.courseId === courseId && x.verdict === 'confirmed');
  const head = L.length ? L[L.length - 1].hash : '';
  const verifyUrl = new URL('verify.html', location.href).href;
  const evRows = [
    pt ? '✓ Conclusão integral do percurso' : '✓ Full course completion',
    pt ? '✓ Exercício de aplicação aprovado' : '✓ Applied scenario passed',
    (pt ? `✓ Retenção verificada ${days} dias após a conclusão` : `✓ Retention verified ${days} days after completion`),
    mgr ? (pt ? `✓ Aplicação no trabalho confirmada pela chefia (${esc(mgr.byName || '')})` : `✓ On-the-job application confirmed by manager (${esc(mgr.byName || '')})`) : null
  ].filter(Boolean);
  openPrintDoc(buildCertHTML({
    docTitle: (pt ? 'Competência Verificada — ' : 'Verified Competency — ') + ctitle(c),
    eyebrow: pt ? 'Certificado de Competência' : 'Competency Certificate',
    tier: pt ? 'Competência Verificada' : 'Verified Competency',
    who: certIdentity(),
    did: pt ? 'demonstrou competência verificada em' : 'has demonstrated verified competency in',
    what: ctitle(c),
    meta: `${Math.round(courseMins(c) / 6) / 10}h · <b>${fmtCertDate(certDate(courseId))}</b>`,
    evidence: `<b>${pt ? 'Evidência' : 'Evidence'}:</b> ${evRows.join(' · ')}<br>${pt ? 'registo' : 'record'} ${esc((head || '').slice(0, 24))}… · ${pt ? 'verificável em' : 'verifiable at'} ${esc(verifyUrl)}`,
    extraNote: pt ? 'A camada «verificada» assenta no registo de evidência encadeado e ancorado publicamente do titular.'
                  : 'The “verified” tier rests on the holder’s hash-chained, publicly anchored evidence record.',
  }));
  ledgerAppend('cert_issued', { courseId, kind: 'verified' });
}
/* ---- Registo Individual de Formação — the learner's legal hour log ---- */
function downloadHourLog() {
  const pt = _lang() === 'pt', pf = S.profile || {}, y = complianceYear();
  const accent = brandVar('--accent', '#c8a45d');
  const rows = (S.trainingLog || []).filter(e => new Date(e.at).getFullYear() === y)
    .sort((a, b) => new Date(a.at) - new Date(b.at));
  const total = trainingHours(rows);
  const tr = rows.map(e => { const c = courseById(e.courseId);
    return `<tr><td>${new Date(e.at).toLocaleDateString(pt ? 'pt-PT' : 'en-GB')}</td><td>${esc(c ? ctitle(c) : e.courseId)}</td><td>${esc(e.kind || (pt ? 'e-learning' : 'e-learning'))}</td><td style="text-align:right">${e.hours || 0}h</td></tr>`; }).join('');
  openPrintDoc(`<!doctype html><html lang="${pt ? 'pt' : 'en'}"><head><meta charset="utf-8"><title>${pt ? 'Registo Individual de Formação' : 'Individual Training Log'} ${y}</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing:border-box; print-color-adjust:exact; -webkit-print-color-adjust:exact; }
  body { font-family: Helvetica, Arial, sans-serif; color:#1c2420; line-height:1.55; font-size:12.5px; max-width:760px; margin:24px auto; padding:0 16px; }
  h1 { font-family: Georgia, serif; font-size:22px; border-bottom:2.5px solid ${accent}; padding-bottom:8px; }
  .id { margin:12px 0 18px; color:#57605a; } .id b { color:#1c2420; }
  table { width:100%; border-collapse:collapse; }
  th { text-align:left; font-size:10.5px; text-transform:uppercase; letter-spacing:.08em; color:#57605a; border-bottom:1.5px solid #1c2420; padding:6px 8px; }
  td { padding:7px 8px; border-bottom:.6px solid #d8d5cb; }
  .tot { margin-top:14px; font-size:14px; } .tot b { font-size:18px; }
  .foot { margin-top:26px; font-size:9px; color:#8b938c; line-height:1.5; }
  .print { position:fixed; top:12px; right:12px; background:#161d18; color:#fff; border:0; border-radius:8px; padding:9px 16px; cursor:pointer; font-size:13px; }
  @media print { .print { display:none; } body { margin:0; } }
</style></head><body>
<button class="print" onclick="print()">⤓ ${pt ? 'Imprimir / Guardar PDF' : 'Print / Save as PDF'}</button>
<h1>${pt ? 'Registo Individual de Formação' : 'Individual Training Log'} · ${y}</h1>
<div class="id">${pt ? 'Trabalhador' : 'Worker'}: <b>${esc(certIdentity())}</b>${pf.nif ? ' · NIF <b>' + esc(pf.nif) + '</b>' : ''}${pf.dept ? ' · ' + esc(tdept(pf.dept)) : ''} · ${esc(companyName())} · ${esc(brandAcademy())}</div>
<table><thead><tr><th>${pt ? 'Data' : 'Date'}</th><th>${pt ? 'Ação de formação' : 'Training action'}</th><th>${pt ? 'Modalidade' : 'Mode'}</th><th style="text-align:right">${pt ? 'Horas' : 'Hours'}</th></tr></thead>
<tbody>${tr || `<tr><td colspan="4" style="color:#8b938c">${pt ? 'Sem registos neste ano.' : 'No entries this year.'}</td></tr>`}</tbody></table>
<div class="tot">${pt ? 'Total do ano' : 'Year total'}: <b>${total}h</b> / ${pt ? 'meta legal' : 'legal target'} ${complianceTarget(pf) || 40}h (art. 131.º CT)</div>
<div class="foot">${pt ? 'Registo gerado pela plataforma a partir do diário de eventos de aprendizagem do titular (encadeado criptograficamente). Documento de apoio ao registo de formação do empregador — art. 131.º/132.º do Código do Trabalho.' : 'Generated by the platform from the holder’s cryptographically chained learning-event record. Supporting document for the employer’s training register — PT Labour Code arts. 131–132.'}</div>
</body></html>`);
}

function downloadJourneyCert(id) {
  const j = JOURNEYS.find(x => x.id === id); if (!j) return;
  const key = 'journey-' + id;
  const doneAt = (S.journeysDone && S.journeysDone[id]) || Date.now();
  /* borrow the course certificate with a journey identity */
  const hadProg = S.progress[key];
  S.progress[key] = { done: true, doneAt };
  const cv = certCanvas({ id: key, title: tjour(j, 'title'), cat: 'Stewardship', modules: j.stages, moduleDurations: j.stages.map(st => { const c = courseById(st.course); return c ? courseMins(c) : 12; }) });
  if (hadProg) S.progress[key] = hadProg; else delete S.progress[key];
  cv.toBlob(b => {
    const url = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = url; a.download = `edenrise-journey-${id}.png`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast(t('jour_cert'), '🎓');
  }, 'image/png');
}

/* ================= Flashcards — the review deck ================= */
let flashDeck = null, flashIdx = 0, flashFlipped = false;
function buildFlashDeck() {
  const cards = [];
  /* mastery loop — questions missed in quizzes come first, once each */
  const missed = (S.missedQ || []).slice(-4).map(m => {
    const c = courseById(m.courseId);
    return { front: m.q, back: m.back, from: `${c ? ctitle(c) + ' · ' : ''}${t('flash_missed')}`, missed: m.q };
  });
  CATALOG.filter(c => isDone(c.id)).forEach(c => {
    const qz = (c.quiz && (c.quiz[_lang()] || c.quiz.en)) || (typeof COURSE_QUIZ !== 'undefined' && COURSE_QUIZ[c.id] && (COURSE_QUIZ[c.id][_lang()] || COURSE_QUIZ[c.id].en)) || [];
    qz.forEach(q => cards.push({ front: q.q, back: q.opts[q.a], from: ctitle(c) }));
  });
  /* deterministic daily shuffle */
  const day = new Date().toISOString().slice(0, 10);
  let seed = [...day].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  return missed.concat(cards.sort(() => rnd() - 0.5)).slice(0, 5);
}
function flashCardHTML() {
  const c = flashDeck[flashIdx];
  return `<div class="flash-count">${flashIdx + 1} / ${flashDeck.length}</div>
    <div class="flash-card ${flashFlipped ? 'flipped' : ''}" data-action="flash-flip" role="button" tabindex="0">
      <div class="flash-face">${esc(flashFlipped ? c.back : c.front)}</div>
      <span class="flash-hint">${flashFlipped ? esc(c.from) : t('flash_flip')}</span>
    </div>
    <div class="flash-foot">${flashFlipped ? `<button class="btn btn-primary btn-sm" data-action="flash-next">${flashIdx + 1 >= flashDeck.length ? t('flash_got') : t('flash_next')} →</button>` : ''}</div>`;
}
function openFlash() {
  flashDeck = buildFlashDeck();
  if (!flashDeck.length) { toast(t('flash_empty'), 'ℹ️'); return; }
  flashIdx = 0; flashFlipped = false;
  if (!$('#flashModal')) {
    const el = document.createElement('div');
    el.className = 'take-overlay'; el.id = 'flashModal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="take-card flash-wrap"><button class="modal-x" data-action="flash-close" aria-label="Close">✕</button>
      <div class="ob-eyebrow">🃏 ${t('flash_h')}</div><div id="flashBody"></div></div>`;
    document.body.appendChild(el);
    el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); });
  }
  $('#flashBody').innerHTML = flashCardHTML();
  $('#flashModal').classList.add('open');
}
function flashNext() {
  const cur = flashDeck[flashIdx];
  if (cur && cur.missed) { S.missedQ = (S.missedQ || []).filter(m => m.q !== cur.missed); save(); }
  if (flashIdx + 1 >= flashDeck.length) {
    $('#flashModal').classList.remove('open');
    const day = new Date().toISOString().slice(0, 10);
    if (S.flashDay !== day) { S.flashDay = day; save(); awardXp(10, t('flash_h')); }
    else toast(t('flash_done'), '🌱');
    return;
  }
  flashIdx++; flashFlipped = false;
  $('#flashBody').innerHTML = flashCardHTML();
}

/* ================= Learning story — the map, not the percentage ================= */
async function generateLearnStory(force) {
  if (!aiKey()) { toast(t('studio_need_key'), 'ℹ️'); return; }
  const el = $('#storyBody'); if (!el) return;
  if (!force && S.learnStory && S.learnStory.lang === S.lang && Date.now() - (S.learnStory.at || 0) < 6048e5) return;
  el.innerHTML = `<div class="studio-status"><span class="orb-spin" style="width:18px;height:18px;"></span></div>`;
  const skills = skillScores().filter(s => s.touched).map(s => `${tskill(s.key)} ${s.score}%`).join(', ') || 'nothing started yet';
  const rr = roleReadiness();
  const done = CATALOG.filter(c => isDone(c.id)).map(c => ctitle(c)).join(', ') || 'none yet';
  const recent = (S.trainingLog || []).slice(-4).map(e => e.title).join('; ');
  try {
    const text = await llmComplete({ maxTokens: 350,
      system: `You are the learner's guide at ${brandAcademy()}. Write a warm, honest, PERSONAL 3-sentence learning story in the second person: (1) what they're genuinely strong in, (2) what they're still building, (3) the ONE next right step. Concrete, no percentages, no flattery, no lists — just three flowing sentences. ${_lang() === 'pt' ? 'Escreve em português europeu.' : 'Write in English.'}`,
      messages: [{ role: 'user', content: `Skills: ${skills}. ${rr ? `Role readiness: ${rr.overall}% (weakest: ${tskill(rr.gap.key)}).` : ''} Courses completed: ${done}. Recent sessions: ${recent}. Streak: ${S.streak || 0} days. Goal: ${tgoal(S.goal)}.` }] });
    S.learnStory = { text: text.trim().slice(0, 600), at: Date.now(), lang: S.lang }; save();
    el.innerHTML = `<p class="story-text">${esc(S.learnStory.text)}</p><button class="link-quiet" data-action="story-gen">${t('story_refresh')}</button>`;
  } catch (e) { el.innerHTML = `<button class="btn btn-glass btn-sm" data-action="story-gen">${t('story_btn')}</button>`; toast(t('ask_fail'), '⚠️'); }
}

/* ================= Certificates — a moment you can hold ================= */
function certDate(courseId) {
  const p = S.progress[courseId];
  return new Date((p && p.doneAt) || Date.now());
}
function certCanvas(c) {
  const W = 1600, H = 1131;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  x.fillStyle = '#0e140f'; x.fillRect(0, 0, W, H);
  const g = x.createRadialGradient(W / 2, H * 0.34, 80, W / 2, H / 2, W * 0.75);
  g.addColorStop(0, 'rgba(200,164,93,.10)'); g.addColorStop(1, 'rgba(200,164,93,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(200,164,93,.85)'; x.lineWidth = 3; x.strokeRect(46, 46, W - 92, H - 92);
  x.strokeStyle = 'rgba(200,164,93,.35)'; x.lineWidth = 1; x.strokeRect(60, 60, W - 120, H - 120);
  x.textAlign = 'center';
  x.fillStyle = '#c8a45d'; x.font = '600 26px Inter, sans-serif';
  x.letterSpacing = '12px';
  x.fillText('E D E N R I S E   A C A D E M Y', W / 2, 160);
  x.letterSpacing = '0px';
  x.fillStyle = 'rgba(166,195,165,.8)'; x.font = '500 20px Inter, sans-serif';
  x.fillText('✦', W / 2, 212);
  x.fillStyle = '#f7f6f1'; x.font = '600 64px "Cormorant Garamond", serif';
  x.fillText(t('cert_title'), W / 2, 320);
  x.fillStyle = 'rgba(247,246,241,.55)'; x.font = '400 24px Inter, sans-serif';
  x.fillText(t('cert_awarded'), W / 2, 420);
  x.fillStyle = '#c8a45d'; x.font = 'italic 600 84px "Cormorant Garamond", serif';
  x.fillText(displayName(), W / 2, 520);
  x.fillStyle = 'rgba(247,246,241,.55)'; x.font = '400 24px Inter, sans-serif';
  x.fillText(t('cert_for'), W / 2, 600);
  x.fillStyle = '#f7f6f1'; x.font = '600 46px "Cormorant Garamond", serif';
  x.fillText(ctitle(c), W / 2, 668);
  x.fillStyle = 'rgba(166,195,165,.75)'; x.font = '500 21px Inter, sans-serif';
  x.fillText(`${tcat(c.cat)} · ${c.modules.length} ${t('modules')} · ${fmtMins(courseMins(c))}`, W / 2, 726);
  const d = certDate(c.id);
  x.strokeStyle = 'rgba(200,164,93,.5)'; x.beginPath(); x.moveTo(W / 2 - 130, 830); x.lineTo(W / 2 + 130, 830); x.stroke();
  x.fillStyle = '#f7f6f1'; x.font = '500 24px Inter, sans-serif';
  x.fillText(d.toLocaleDateString(_lang() === 'pt' ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), W / 2, 880);
  x.fillStyle = 'rgba(247,246,241,.4)'; x.font = '400 19px Inter, sans-serif';
  x.fillText(brandAcademy() + ' · ' + brandLocation(), W / 2, 1005);
  return cv;
}
function downloadCert(courseId) {
  const c = courseById(courseId); if (!c || !isDone(courseId)) return;
  certCanvas(c).toBlob(b => {
    const url = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = url; a.download = `edenrise-certificate-${courseId}.png`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast(t('cert_dl'), '🎓');
  }, 'image/png');
}
function linkedInCertUrl(c) {
  const d = certDate(c.id);
  return 'https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME'
    + '&name=' + encodeURIComponent(ctitle(c))
    + '&organizationName=' + encodeURIComponent(brandAcademy())
    + '&issueYear=' + d.getFullYear() + '&issueMonth=' + (d.getMonth() + 1);
}
function certsSectionHTML() {
  const done = CATALOG.filter(c => isDone(c.id));
  return `<div class="admin-section">
    <h2>🎓 ${t('certs_h')}</h2>
    <p class="sect-sub">${t('certs_sub')}</p>
    ${done.length ? `<div class="cert-grid">${done.map(c => `
      <div class="cert-card">
        <div class="cert-art"><span>✦</span><b>${esc(ctitle(c))}</b><span class="cert-d">${certDate(c.id).toLocaleDateString(_lang() === 'pt' ? 'pt-PT' : 'en-GB', { month: 'short', year: 'numeric' })}</span></div>
        <div class="cert-actions">
          <button class="btn btn-glass btn-sm" data-action="cert-dl" data-id="${c.id}">⤓ ${t('cert_dl')}</button>
          ${courseVerified(c.id) ? `<button class="btn btn-primary btn-sm" data-action="vcert" data-id="${c.id}">★ ${t('vcert_btn')}</button>` : ''}
          <a class="btn btn-glass btn-sm" href="${linkedInCertUrl(c)}" target="_blank" rel="noopener">in ${t('cert_li')}</a>
        </div>
      </div>`).join('')}</div>` : `<p class="empty-note" style="text-align:left;padding:8px 0;">${t('cert_none')}</p>`}
  </div>`;
}

/* ================= Field Missions — prove it on the land ================= */
let myMissions = null;
let misPhotoData = '';
function loadMyMissions() {
  if (!(window.EdenMissions && S.profile && S.profile.uid)) return;
  EdenMissions.listMine().then(list => { myMissions = list; if (location.hash.indexOf('#/course') === 0) render(); }).catch(() => {});
}
function missionState(courseId) {
  return (myMissions || []).filter(m => m.courseId === courseId)
    .sort((a, b) => tsMillis(b.createdAt) - tsMillis(a.createdAt))[0] || null;
}
function missionCardHTML(c) {
  const m = missionFor(c.id); if (!m) return '';
  const st = missionState(c.id);
  let body;
  if (!(S.profile && S.profile.uid)) body = `<p class="mis-note">${t('mis_signin')}</p>`;
  else if (st && st.status === 'approved' && st.claimed) body = `<p class="mis-ok">✓ ${t('mis_done')} · +${m.xp} XP</p>`;
  else if (st && st.status === 'approved') body = `<button class="btn btn-primary btn-sm" data-action="mis-claim" data-id="${st.id}" data-course="${c.id}">🌾 ${t('mis_claim')} +${m.xp} XP</button>`;
  else if (st && st.status === 'pending') body = `<p class="mis-note">${t('mis_pending')}</p>`;
  else body = `${st && st.status === 'declined' ? `<p class="mis-note warn">${t('mis_declined')}</p>` : ''}
    <textarea class="comm-input" id="misNote" rows="2" placeholder="${t('mis_note_ph')}"></textarea>
    <div class="mis-actions">
      <label class="btn btn-glass btn-sm mis-photo-btn">📷 ${t('mis_photo')}<input type="file" id="misPhoto" accept="image/*" hidden></label>
      <span id="misPreview"></span>
      <span style="flex:1"></span>
      <button class="btn btn-primary btn-sm" data-action="mis-submit" data-id="${c.id}">${t('mis_submit')}</button>
    </div>`;
  return `<div class="admin-section mission-card">
    <h2>🌾 ${t('mis_h')} <span class="mis-xp">+${m.xp} XP</span></h2>
    <p class="sect-sub">${t('mis_sub')}</p>
    <div class="mis-brief"><b>${esc(m.title)}</b><p>${esc(m.brief)}</p></div>
    ${body}
  </div>`;
}
function compressPhoto(file, cb) {
  const img = new Image();
  /* cb(null) = unusable photo (HEIC the browser can't decode, corrupt file, or too big even after compression) */
  img.onerror = () => { URL.revokeObjectURL(img.src); cb(null); };
  img.onload = () => {
    const draw = max => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      let q = 0.72, out = cv.toDataURL('image/jpeg', q);
      while (out.length > 280000 && q > 0.3) { q -= 0.12; out = cv.toDataURL('image/jpeg', q); }
      return out;
    };
    let out = draw(900);
    if (out.length > 280000) out = draw(600);
    URL.revokeObjectURL(img.src);
    cb(out.length > 280000 ? null : out);
  };
  img.src = URL.createObjectURL(file);
}
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target && e.target.id === 'askInput') openAsk(e.target.value);
  if (e.key === 'Enter' && e.target && e.target.id === 'ckAsk') cockpitAsk();
});
document.addEventListener('change', e => {
  if (e.target && e.target.id === 'ckDept') {
    cockpitDept = e.target.value;
    paintMgrDash(); paintCockpit(); paintTrends(); paintAsgList();
    const h = $('#cockpitHeat'); if (h) h.innerHTML = skillHeatmapHTML();
    const cp = $('#cockpitComp'); if (cp) cp.innerHTML = complianceHTML();
    return;
  }
  if (e.target && e.target.id === 'misPhoto' && e.target.files && e.target.files[0]) {
    compressPhoto(e.target.files[0], data => {
      if (!data) { misPhotoData = ''; toast(t('mis_photo_fail'), '⚠️'); e.target.value = ''; return; }
      misPhotoData = data;
      const pv = $('#misPreview'); if (pv) pv.innerHTML = `<img class="mis-thumb" src="${data}" alt="">`;
    });
  }
});
function submitMission(courseId) {
  if (!(window.EdenMissions && S.profile && S.profile.uid)) { showLoginGate(); return; }
  const note = ($('#misNote') && $('#misNote').value || '').trim();
  if (!note && !misPhotoData) { if ($('#misNote')) $('#misNote').focus(); return; }
  EdenMissions.submit({ courseId, note, photo: misPhotoData }).then(() => {
    misPhotoData = '';
    toast(t('mis_pending'), '🌾');
    loadMyMissions(); render();
  }).catch(() => toast(_lang() === 'pt' ? 'Não foi possível submeter' : 'Could not submit', '⚠️'));
}
function claimMission(id, courseId) {
  const m = MISSIONS[courseId];
  EdenMissions.claim(id).then(() => {
    const mine = (myMissions || []).find(x => x.id === id); if (mine) mine.claimed = true;
    awardXp((m && m.xp) || 100, t('mis_h'));
    render();
  }).catch(() => toast(_lang() === 'pt' ? 'Não foi possível reclamar — tente de novo' : 'Could not claim — try again', '⚠️'));
}

/* ================= AI Role-Play Coach — the practice arena ================= */
let coach = null;
function ensureCoachModal() {
  if ($('#coachModal')) return;
  const el = document.createElement('div');
  el.className = 'take-overlay'; el.id = 'coachModal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  el.innerHTML = `<div class="take-card coach-card">
    <button class="modal-x" data-action="coach-close" aria-label="Close">✕</button>
    <div class="ob-eyebrow" id="coachEyebrow"></div>
    <h3 id="coachTitle" style="font-family:var(--font-display);font-size:24px;margin:6px 0 2px;"></h3>
    <p class="m-sub" id="coachGoal"></p>
    <div class="coach-chat" id="coachChat"></div>
    <div class="coach-input" id="coachInputRow">
      <input class="auth-input" id="coachBox" placeholder="">
      <button class="btn btn-primary btn-sm" data-action="coach-send" aria-label="Send">→</button>
    </div>
    <div class="coach-foot"><button class="link-quiet" data-action="coach-finish" id="coachFinish"></button></div>
  </div>`;
  document.body.appendChild(el);
  el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); });
  $('#coachBox').addEventListener('keydown', e => { if (e.key === 'Enter') coachSend(); });
}
function openCoach(courseId) {
  const sc = roleplayFor(courseId); if (!sc) return;
  if (!aiKey()) { toast(t('studio_need_key'), 'ℹ️'); return; }
  ensureCoachModal();
  coach = { courseId, sc, msgs: [{ role: 'assistant', content: sc.opening }], busy: false, done: false };
  $('#coachEyebrow').textContent = `🎭 ${t('coach_h')} · ${sc.persona}`;
  $('#coachTitle').textContent = sc.title;
  $('#coachGoal').textContent = `${t('coach_goal')}: ${sc.goal}`;
  $('#coachBox').placeholder = t('coach_ph');
  $('#coachFinish').textContent = t('coach_end');
  $('#coachInputRow').style.display = '';
  $('#coachFinish').style.display = '';
  paintCoach();
  $('#coachModal').classList.add('open');
  setTimeout(() => $('#coachBox').focus(), 250);
}
function paintCoach() {
  const el = $('#coachChat'); if (!el || !coach) return;
  el.innerHTML = coach.msgs.map(m => `<div class="coach-msg ${m.role === 'user' ? 'me' : 'them'}">${esc(m.content)}</div>`).join('')
    + (coach.busy ? `<div class="coach-msg them typing">${t('coach_thinking')}</div>` : '')
    + (coach.err ? `<div class="coach-msg them coach-msg-err">⚠️ ${esc(t('coach_err'))}</div>` : '');
  el.scrollTop = el.scrollHeight;
}
async function coachSend() {
  if (!coach || coach.busy || coach.done) return;
  const box = $('#coachBox'); const text = (box.value || '').trim(); if (!text) return;
  box.value = '';
  coach.msgs.push({ role: 'user', content: text });
  coach.busy = true; coach.err = false; paintCoach();
  try {
    const reply = await llmComplete({ maxTokens: 220, system: coach.sc.system, messages: coach.msgs.map(m => ({ role: m.role, content: m.content })) });
    coach.msgs.push({ role: 'assistant', content: reply.trim() });
  } catch (e) {
    /* the turn failed — put the message back so nothing is lost, and say so honestly */
    coach.msgs.pop();
    box.value = text;
    coach.err = true;
  }
  coach.busy = false; paintCoach();
}
async function coachFinish() {
  if (!coach || coach.busy) return;
  if (coach.msgs.filter(m => m.role === 'user').length < 2) { toast(_lang() === 'pt' ? 'Troque mais algumas mensagens primeiro' : 'Exchange a few more messages first', 'ℹ️'); return; }
  coach.busy = true; coach.done = true; paintCoach();
  const transcript = coach.msgs.map(m => `${m.role === 'user' ? 'Leader' : coach.sc.persona}: ${m.content}`).join('\n');
  try {
    const raw = await llmComplete({ maxTokens: 600,
      system: `You are a warm, honest leadership coach at ${brandAcademy()}. Score the Leader's side of this role-play against the rubric. Reply as raw JSON only: {"scores":[{"dim":str,"score":1-5,"note":str(short)}],"tip":str(one specific, kind suggestion)} . Rubric dimensions: ${coach.sc.rubric.join(' | ')}. ${_lang() === 'pt' ? 'Responde em português europeu.' : ''}`,
      messages: [{ role: 'user', content: transcript }] });
    const j = JSON.parse(raw.replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
    const first = !(S.coachDone && S.coachDone[coach.courseId]);
    (S.coachDone || (S.coachDone = {}))[coach.courseId] = Date.now(); save();
    $('#coachChat').innerHTML += `<div class="coach-score"><b>${t('coach_score')}</b>
      ${j.scores.map(s => `<div class="cs-row"><span>${esc(s.dim)}</span><span class="cs-stars">${'★'.repeat(s.score)}${'☆'.repeat(5 - s.score)}</span><em>${esc(s.note || '')}</em></div>`).join('')}
      <p class="cs-tip">💡 ${esc(j.tip || '')}</p>
      <button class="btn btn-glass btn-sm" data-action="coach-again" data-id="${coach.courseId}">↺ ${t('coach_again')}</button></div>`;
    $('#coachChat').scrollTop = $('#coachChat').scrollHeight;
    $('#coachInputRow').style.display = 'none';
    $('#coachFinish').style.display = 'none';
    if (first) setTimeout(() => awardXp(40, t('coach_h')), 600);
  } catch (e) {
    coach.done = false;
    toast(_lang() === 'pt' ? 'Não foi possível avaliar — tente de novo' : 'Could not score — try again', '⚠️');
  }
  coach.busy = false;
}
function coachCardHTML(c) {
  const sc = roleplayFor(c.id); if (!sc) return '';
  const done = S.coachDone && S.coachDone[c.id];
  return `<div class="admin-section coach-invite">
    <h2>🎭 ${t('coach_h')}</h2>
    <p class="sect-sub">${t('coach_sub')}</p>
    <div class="mis-brief"><b>${esc(sc.title)}</b><p>${esc(sc.goal)}</p></div>
    <button class="btn btn-primary btn-sm" data-action="coach-open" data-id="${c.id}">${done ? '↺ ' + t('coach_again') : t('coach_start')}</button>
  </div>`;
}

/* ================= Assignments, resources, ratings, calendar ================= */
const activeAssignments = () => (studioMeta && Array.isArray(studioMeta.assignments)) ? studioMeta.assignments : [];
function myAssignments() {
  const dept = (S.profile && S.profile.dept) || '';
  return activeAssignments().filter(a => (a.team === 'everyone' || a.team === dept) && !isDone(a.courseId));
}
function assignmentCardsHTML() {
  const list = myAssignments(); if (!list.length) return '';
  return `<section class="page-pad" style="padding-top:0;">${list.map(a => {
    const c = courseById(a.courseId); if (!c) return '';
    const overdue = a.due && new Date(a.due + 'T23:59:59') < new Date();
    return `<div class="asg-card" data-action="open-course" data-id="${c.id}" role="button" tabindex="0">
      <span class="ci t-grad-${c.grad}">${svgIcon(c.icon)}</span>
      <div class="ct"><b>📌 ${t('asg_assigned')}: ${esc(ctitle(c))}</b>
        <span>${a.due ? `${t('asg_due')} ${new Date(a.due).toLocaleDateString(_lang() === 'pt' ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'short' })}` : ''}${overdue ? ` · <em class="asg-over">${t('asg_overdue')}</em>` : ''}${coursePct(c.id) ? ` · ${coursePct(c.id)}%` : ''}</span></div>
      <button class="btn btn-primary btn-sm">${coursePct(c.id) ? t('resume_module').split(' ')[0] : t('asg_start')} →</button>
    </div>`;
  }).join('')}</section>`;
}
function resourcesHTML(c) {
  if (!Array.isArray(c.resources) || !c.resources.length) return '';
  return `<div class="admin-section"><h2>📎 ${t('res_h')}</h2>
    <div class="res-list">${c.resources.map(r => `<a class="res-row" href="${esc(r.url)}" target="_blank" rel="noopener"><span>↗</span>${esc(r.label || r.url)}</a>`).join('')}</div></div>`;
}
function ratingStarsHTML(courseId) {
  const mine = (S.ratings || {})[courseId] || 0;
  return `<div class="rate-block"><b>${t('rate_h')}</b><div class="rate-stars">${[1, 2, 3, 4, 5].map(n =>
    `<button class="rate-star ${n <= mine ? 'on' : ''}" data-action="rate" data-id="${courseId}" data-n="${n}">${n <= mine ? '★' : '☆'}</button>`).join('')}</div></div>`;
}
function icsForSession(s) {
  if (!s.date) return;
  const dt = new Date(s.date);
  const fmt = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//' + brandAcademy() + '//EN', 'BEGIN:VEVENT',
    'UID:' + s.id + '@edenrise-academy', 'DTSTAMP:' + fmt(new Date(dt)),
    'DTSTART:' + fmt(dt), 'DTEND:' + fmt(new Date(dt.getTime() + 3600000)),
    'SUMMARY:' + s.title.replace(/,/g, '\\,'), 'DESCRIPTION:' + (s.desc || '').replace(/,/g, '\\,'),
    'LOCATION:' + brandAcademy() + ' (online)', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a'); a.href = url; a.download = 'edenrise-' + s.id + '.ics';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

/* ---------- admin console — EdenRise Studio ---------- */
let adminTab = 'cockpit';
let cockpitDept = '';
const filteredMembers = () => !adminMembers ? null : (cockpitDept ? adminMembers.filter(m => (m.profile && m.profile.dept) === cockpitDept) : adminMembers);
let editingCourse = null;   /* working copy inside the course editor */
let liveDraft = null;       /* live schedule being edited */
const attr = s => esc(String(s == null ? '' : s)).replace(/"/g, '&quot;');

function saveAssignments(assignments, msg) {
  if (!(window.EdenCloud && EdenCloud.saveMeta)) { toast('You need to be online and signed in', '⚠️'); return; }
  EdenCloud.saveMeta(Object.assign({}, studioMeta, { assignments })).then(() => {
    studioMeta = Object.assign({}, studioMeta, { assignments });
    toast(msg, '📌'); render(); initAdmin();
  }).catch(() => toast('Could not save — are the Firestore rules published?', '⚠️'));
}
/* how many members in the target team have finished the assigned course */
function assignmentTrack(a) {
  if (!adminMembers) return '';
  const pool = adminMembers.filter(m => a.team === 'everyone' || (m.profile && m.profile.dept) === a.team);
  if (!pool.length) return '';
  const done = pool.filter(m => { const p = (m.state.progress || {})[a.courseId]; return p && p.done; }).length;
  return `${done}/${pool.length} done`;
}
function paintMissions(list) {
  const el = $('#missionQueue'); if (!el) return;
  el.innerHTML = list.length ? list.map(m => {
    const c = courseById(m.courseId);
    const mis = MISSIONS[m.courseId];
    return `<div class="mq-row">
      ${m.photo ? `<img class="mq-photo" src="${m.photo}" alt="proof">` : `<span class="ci t-grad-${c ? c.grad : 1}">${svgIcon(c ? c.icon : 'leaf')}</span>`}
      <div class="ct"><b>${esc(m.authorName || 'Learner')} · ${c ? esc(c.title) : m.courseId}</b>
        <span>${esc((mis && mis.en.title) || '')}${m.note ? ' — “' + esc(m.note.slice(0, 140)) + '”' : ''} · ${timeAgo(m.createdAt)}</span></div>
      <button class="btn btn-primary btn-sm" data-action="mis-review" data-id="${m.id}" data-ok="1">✓ Approve</button>
      <button class="btn btn-glass btn-sm" data-action="mis-review" data-id="${m.id}" data-ok="0">Decline</button>
    </div>`;
  }).join('') : `<p class="empty-note" style="text-align:left;padding:8px 0;">No missions waiting — the queue is clear 🌿</p>`;
}
function teamQuestions() {
  return (filteredMembers() || []).flatMap(m => (m.state.askLog || [])).sort((a, b) => (b.at || 0) - (a.at || 0));
}
function intelHTML() {
  const qs = teamQuestions();
  return `<div class="admin-section">
    <h2>💬 What the team is asking</h2>
    <p class="sect-sub">Every Ask-the-Academy and tutor question, anonymised — the raw signal for what training to build next.</p>
    ${qs.length ? qs.slice(0, 10).map(x => `<div class="intel-q"><span class="n">${timeAgo({ seconds: (x.at || 0) / 1000 })}</span><span>${esc(x.q)}</span></div>`).join('') : `<p class="empty-note" style="text-align:left;padding:8px 0;">No questions logged yet — they appear as the team uses Ask the Academy and the tutor.</p>`}
    ${qs.length >= 3 ? `<button class="btn btn-glass btn-sm" data-action="intel-gaps" style="margin-top:12px;">✦ Find content gaps</button><div id="gapResults"></div>` : ''}
  </div>
  ${(() => { /* quality loop — quiz questions the team flagged as possibly wrong */
    const flags = (filteredMembers() || []).flatMap(m => (m.state.qFlags || [])).sort((a, b) => (b.at || 0) - (a.at || 0));
    if (!flags.length) return '';
    return `<div class="admin-section">
    <h2>⚑ Flagged quiz questions</h2>
    <p class="sect-sub">Questions the team marked as possibly wrong — review them, and fix the course content or quiz where needed.</p>
    ${flags.slice(0, 10).map(f => { const c = courseById(f.courseId); return `<div class="intel-q"><span class="n">${c ? esc(ctitle(c)) : ''}${f.ai ? ' · ✦AI' : ''}</span><span>${esc(f.q)}</span></div>`; }).join('')}
  </div>`; })()}
  <div class="admin-section">
    <h2>✦ Ask the Cockpit</h2>
    <p class="sect-sub">Your admin assistant — ask anything about the team in plain language: “who’s behind?”, “what should I assign the Land team?”, “who’s ready for leadership?”</p>
    <div class="cockpit-chat">
      <div class="coach-chat" id="ckChat" style="display:none;"></div>
      <div class="coach-input" style="margin-top:10px;">
        <input class="auth-input" id="ckAsk" placeholder="Ask about your team…">
        <button class="btn btn-primary btn-sm" data-action="ck-ask">→</button>
      </div>
    </div>
  </div>`;
}
async function findContentGaps() {
  if (!aiKey()) { toast(t('studio_need_key'), 'ℹ️'); return; }
  const el = $('#gapResults');
  el.innerHTML = `<div class="studio-status"><span class="orb-spin" style="width:20px;height:20px;"></span> Clustering the team's questions…</div>`;
  const qs = teamQuestions().slice(0, 40).map(x => x.q).join('\n');
  const cats = CATALOG.map(c => c.title).join(' | ');
  try {
    const raw = await llmComplete({ maxTokens: 700,
      system: `You are the curriculum strategist for ${brandAcademy()}. Given real questions members asked, and the existing course list, find what training is MISSING. Reply as raw JSON: {"gaps":[1-3 of {"theme":str,"evidence":str(which questions point here),"course":str(a concrete course title to build)}]}. Only real gaps — if the library covers it, don't invent one.`,
      messages: [{ role: 'user', content: `QUESTIONS:\n${qs}\n\nEXISTING COURSES: ${cats}` }] });
    const j = JSON.parse(raw.replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
    el.innerHTML = (j.gaps || []).map(g => `<div class="gap-card">
      <span class="ci t-grad-4">${svgIcon('seed')}</span>
      <div class="ct"><b>${esc(g.course)}</b><span>${esc(g.theme)} — ${esc(g.evidence)}</span></div>
      <button class="btn btn-primary btn-sm" data-action="gap-draft" data-title="${attr(g.course)}">Draft it ✦</button>
    </div>`).join('') || `<p class="empty-note" style="text-align:left;padding:8px 0;">No real gaps found — the library covers what the team is asking 🌿</p>`;
  } catch (e) { el.innerHTML = `<div class="auth-err on">Could not analyse — try again.</div>`; }
}
let ckHistory = [];
async function cockpitAsk() {
  const box = $('#ckAsk'); const q = (box.value || '').trim(); if (!q) return;
  if (!aiKey()) { toast(t('studio_need_key'), 'ℹ️'); return; }
  if (!adminMembers) { toast('Members are still loading', 'ℹ️'); return; }
  box.value = '';
  const chat = $('#ckChat'); chat.style.display = '';
  ckHistory.push({ role: 'user', content: q });
  chat.innerHTML = ckHistory.map(m => `<div class="coach-msg ${m.role === 'user' ? 'me' : 'them'}">${esc(m.content).replace(/\n/g, '<br>')}</div>`).join('') + `<div class="coach-msg them typing">…</div>`;
  chat.scrollTop = chat.scrollHeight;
  const sums = filteredMembers().map(memberSummary);
  const data = sums.map(s => `${s.name} [${(filteredMembers().find(m => (m.profile.name || '') === s.name) || { profile: {} }).profile.dept || '?'}]: path ${s.pathPct}%, ready ${s.ready == null ? '?' : s.ready + '%'}, streak ${s.streak}d, active ${s.days == null ? 'never' : s.days + 'd ago'}, ${s.atRisk ? 'AT RISK' : 'ok'}`).join('\n');
  const asgs = activeAssignments().map(a => `${(courseById(a.courseId) || {}).title} → ${a.team}${a.due ? ' due ' + a.due : ''}`).join('\n') || 'none';
  try {
    const reply = await llmComplete({ maxTokens: 600,
      system: `You are the ${brandAcademy()} admin assistant. Answer the leader's questions from the LIVE DATA below — specific names and numbers, warm but direct, max 120 words. If asked what to do, give ONE concrete recommendation. Never invent data.\n\nMEMBERS:\n${data}\n\nASSIGNMENTS:\n${asgs}\n\nCOURSES AVAILABLE: ${CATALOG.map(c => c.title).slice(0, 30).join(' | ')}`,
      messages: ckHistory.slice(-8) });
    ckHistory.push({ role: 'assistant', content: reply });
  } catch (e) { ckHistory.push({ role: 'assistant', content: 'Could not reach the AI — check the team key in Settings.' }); }
  chat.innerHTML = ckHistory.map(m => `<div class="coach-msg ${m.role === 'user' ? 'me' : 'them'}">${esc(m.content).replace(/\n/g, '<br>')}</div>`).join('');
  chat.scrollTop = chat.scrollHeight;
}
function paintAsgList() {
  const el = $('#asgList'); if (!el) return;
  el.innerHTML = activeAssignments().map((a, i) => {
    const c = courseById(a.courseId);
    const track = assignmentTrack(a);
    return `<div class="assignment-row">📌 <b>${c ? esc(c.title) : a.courseId}</b> → ${a.team === 'everyone' ? 'Everyone' : tdept(a.team)}${a.due ? ` · due ${a.due}` : ''}${track ? ` · <span class="asg-track">${track}</span>` : ''}<button class="ar-x" data-action="unassign" data-idx="${i}" title="Remove">✕</button></div>`;
  }).join('');
}
function paintTrends() {
  const el = $('#cockpitTrends'); if (!el || !adminMembers) return;
  /* team minutes + completions per week, last 4 weeks */
  const now = Date.now(), week = 6048e5;
  const mins = [0, 0, 0, 0], comps = [0, 0, 0, 0];
  filteredMembers().forEach(m => {
    Object.entries(m.state.mins || {}).forEach(([day, v]) => {
      const age = Math.floor((now - new Date(day).getTime()) / week);
      if (age >= 0 && age < 4) mins[3 - age] += v;
    });
    Object.values(m.state.progress || {}).forEach(p => {
      if (p && p.done && p.doneAt) { const age = Math.floor((now - p.doneAt) / week); if (age >= 0 && age < 4) comps[3 - age]++; }
    });
  });
  const bars = (arr, unit) => { const mx = Math.max(...arr, 1); return arr.map((v, i) => `
    <div class="bar-col"><span class="bv">${Math.round(v) || ''}</span><div class="bar ${i === 3 ? 'today' : ''}" style="height:${Math.max(4, v / mx * 100)}%"></div><span class="bl">${['-3w', '-2w', '-1w', 'now'][i]}</span></div>`).join(''); };
  el.innerHTML = `
    <div class="chart-card"><h3>Team minutes · last 4 weeks</h3><div class="bars sm">${bars(mins)}</div></div>
    <div class="chart-card"><h3>Courses completed · last 4 weeks</h3><div class="bars sm">${bars(comps)}</div></div>`;
}
function studioTabsHTML() {
  const tabs = [['cockpit', 'People'], ['content', 'Content'], ['broadcasts', 'Broadcasts'], ['digests', 'Digests'], ['live', 'Live sessions'], ['company', 'Company'], ['settings', 'Settings']];
  if (isSuperAdmin()) tabs.push(['companies', 'Companies ✦']);
  return `<div class="comm-pills studio-tabs">${tabs.map(([id, label]) =>
    `<button class="ch-item ${adminTab === id ? 'active' : ''}" data-action="admin-tab" data-tab="${id}"><span>${label}</span></button>`).join('')}</div>`;
}

/* ================= Manager Dashboard — compliance-first team command (Phase 3) ================= */
function memberRecertIssues(m) {
  const now = Date.now(), out = [];
  CATALOG.filter(c => c.recertMonths).forEach(c => {
    const p = ((m.state || {}).progress || {})[c.id];
    if (p && p.done && p.doneAt) {
      const days = Math.ceil((p.doneAt + c.recertMonths * 2629800000 - now) / 86400000);
      if (days < 0) out.push({ course: c.title, state: 'expired', days });
      else if (days <= 30) out.push({ course: c.title, state: 'expiring', days });
    }
  });
  return out;
}
function attentionQueue(pool) {
  return pool.map(m => {
    const s = memberSummary(m);
    const reasons = [];
    memberRecertIssues(m).forEach(r => reasons.push({ sev: r.state === 'expired' ? 3 : 2, txt: r.state === 'expired' ? `🛡 ${r.course} expired` : `🛡 ${r.course} expires in ${r.days}d` }));
    const pace = trainingPace(s.compTarget);
    if (s.compHours < pace - 2) reasons.push({ sev: 2, txt: `⏱ ${s.compHours}h of ~${Math.round(pace)}h expected (40h pace)` });
    if (s.days == null) reasons.push({ sev: 1, txt: '😴 never active' });
    else if (s.days >= 10) reasons.push({ sev: 1, txt: `😴 inactive ${s.days}d` });
    if (s.pathPct < 35) reasons.push({ sev: 1, txt: `🌱 path at ${s.pathPct}%` });
    return { s, reasons, score: reasons.reduce((a, r) => a + r.sev, 0) };
  }).filter(x => x.reasons.length).sort((a, b) => b.score - a.score);
}
function pacingChartSVG(pool) {
  const y = complianceYear(), now = new Date(), curM = now.getFullYear() === y ? now.getMonth() : 11;
  const teamTarget = pool.reduce((a, m) => a + (complianceTarget(m.profile || {}) || 40), 0);
  const byMonth = Array(12).fill(0);
  pool.forEach(m => ((m.state || {}).trainingLog || []).forEach(e => { const d = new Date(e.at); if (d.getFullYear() === y) byMonth[d.getMonth()] += (e.hours || 0); }));
  let cum = 0; const actual = byMonth.map(h => (cum += h));
  const W = 640, H = 190, PX = 34, PY = 18, iw = W - PX - 14, ih = H - PY - 30;
  const maxV = Math.max(teamTarget, actual[curM] || 1, 1);
  const X = i => PX + (i / 11) * iw, Y = v => PY + ih - (v / maxV) * ih;
  const idealPts = Array.from({ length: 12 }, (_, i) => `${X(i)},${Y(teamTarget * (i + 1) / 12)}`).join(' ');
  const actualPts = actual.slice(0, curM + 1).map((v, i) => `${X(i)},${Y(v)}`).join(' ');
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const onPace = actual[curM] >= teamTarget * (curM + 1) / 12 - 2;
  return `<svg viewBox="0 0 ${W} ${H}" class="pace-chart" role="img" aria-label="Team training hours vs the 40h pacing line">
    ${[0, .5, 1].map(f => `<line x1="${PX}" x2="${W - 14}" y1="${Y(maxV * f)}" y2="${Y(maxV * f)}" class="pc-grid"/><text x="${PX - 6}" y="${Y(maxV * f) + 4}" class="pc-lbl" text-anchor="end">${Math.round(maxV * f)}</text>`).join('')}
    ${months.map((mm, i) => `<text x="${X(i)}" y="${H - 8}" class="pc-lbl" text-anchor="middle">${mm}</text>`).join('')}
    <polyline points="${idealPts}" class="pc-ideal"/>
    ${actualPts.includes(' ') || curM === 0 ? `<polyline points="${actualPts}" class="pc-actual ${onPace ? '' : 'warn'}"/>` : ''}
    <circle cx="${X(curM)}" cy="${Y(actual[curM] || 0)}" r="4" class="pc-dot ${onPace ? '' : 'warn'}"/>
    <text x="${X(curM) + (curM > 8 ? -8 : 8)}" y="${Y(actual[curM] || 0) - 8}" class="pc-now ${onPace ? '' : 'warn'}" text-anchor="${curM > 8 ? 'end' : 'start'}">${Math.round(actual[curM] * 10) / 10}h</text>
  </svg>`;
}
function paintMgrDash() {
  const el = $('#mgrDash'); if (!el || !adminMembers) return;
  const pool = filteredMembers(); if (!pool.length) { el.innerHTML = ''; return; }
  const sums = pool.map(memberSummary);
  const teamTarget = sums.reduce((a, s) => a + s.compTarget, 0);
  const teamHours = Math.round(sums.reduce((a, s) => a + s.compHours, 0) * 10) / 10;
  const teamPct = teamTarget ? Math.min(100, Math.round(teamHours / teamTarget * 100)) : 0;
  const trained = sums.filter(s => s.compHours > 0).length;
  const tenPct = pool.length ? trained / pool.length >= 0.10 : false;
  const complete = sums.filter(s => s.compHours >= s.compTarget).length;
  const onTrack = sums.filter(s => s.compHours < s.compTarget && s.compHours >= trainingPace(s.compTarget) - 2).length;
  const behind = pool.length - complete - onTrack;
  const expired = pool.reduce((a, m) => a + memberRecertIssues(m).filter(r => r.state === 'expired').length, 0);
  const q = attentionQueue(pool);
  el.innerHTML = `
  ${confirmPanelHTML()}
  <div class="admin-section" style="margin-top:18px;">
    <h2>🛡 Compliance command</h2>
    <p class="sect-sub">The team's mandatory 40h continuous training — Código do Trabalho art. 131.º. Live, prorated, exportable.</p>
    <span class="badge ${tenPct ? 'mg-ok' : 'mg-bad'}" style="margin-top:10px;display:inline-flex;">${tenPct ? '● Art. 131.º/5 · ≥10% trained ✓' : '⚠ Art. 131.º/5 · <10% of workforce trained'}</span>
    <div class="mgr-heroes">
      <div class="mgr-hero"><div class="jour-ring" style="--sz:74px;background:conic-gradient(${teamPct >= 50 ? 'var(--accent-2)' : 'var(--warn, #d9b38c)'} ${teamPct * 3.6}deg, rgba(231,237,227,.12) 0)"><span>${teamPct}%</span></div>
        <div><div class="mh-num">${teamHours}<small>/${teamTarget}h</small></div><div class="mh-lbl">Team hours · ${complianceYear()}</div></div></div>
      <div class="mgr-hero"><div class="mh-num">${trained}<small>/${pool.length}</small></div><div class="mh-lbl">Workers trained this year</div><div class="mh-sub ${tenPct ? 'ok' : 'bad'}">${Math.round((pool.length ? trained / pool.length : 0) * 100)}% of workforce · legal min 10%</div></div>
      <div class="mgr-hero"><div class="mgr-dist" role="img" aria-label="Compliance distribution">
          ${complete ? `<span class="md-seg done" style="flex:${complete}" title="${complete} complete"></span>` : ''}
          ${onTrack ? `<span class="md-seg ok" style="flex:${onTrack}" title="${onTrack} on track"></span>` : ''}
          ${behind ? `<span class="md-seg low" style="flex:${behind}" title="${behind} behind"></span>` : ''}</div>
        <div class="mh-lbl">${complete} complete · ${onTrack} on track · ${behind} behind</div></div>
      <div class="mgr-hero"><div class="mh-num ${expired ? 'bad' : ''}">${expired}</div><div class="mh-lbl">Expired certifications</div>${expired ? '<div class="mh-sub bad">action required</div>' : '<div class="mh-sub ok">all current</div>'}</div>
      ${(() => { /* R2-5: verified competency — the number above completion */
        const withDone = pool.map(m => verifiedCompetency(m.state || {})).filter(v => v.done > 0);
        const tv = withDone.reduce((a, v) => a + v.verified, 0), td = withDone.reduce((a, v) => a + v.done, 0);
        const vp = td ? Math.round(tv / td * 100) : 0;
        const rates = pool.map(m => applicationRate(m.state || {})).filter(Boolean);
        const ap = rates.length ? Math.round(rates.reduce((a, r) => a + r.applied, 0) / rates.reduce((a, r) => a + r.total, 0) * 100) : null;
        return `<div class="mgr-hero"><div class="mh-num">${vp}<small>%</small></div><div class="mh-lbl">Verified competency</div><div class="mh-sub">${tv}/${td} completed courses verified${ap != null ? ` · 🎯 ${ap}% applied on the job` : ''}</div></div>`;
      })()}
    </div>
    <div class="mgr-pace"><div class="ob-eyebrow" style="margin-bottom:8px;">Hours vs the pacing line</div>${pacingChartSVG(pool)}
      <div class="pc-legend"><span><i class="pc-key ideal"></i>ideal pace (40h × team, spread over the year)</span><span><i class="pc-key actual"></i>actual cumulative hours</span></div></div>
    <div class="ob-eyebrow" style="margin:20px 0 8px;">Needs attention ${q.length ? `· ${q.length}` : ''}</div>
    ${q.length ? q.slice(0, 8).map(x => `
      <div class="mgr-q" data-action="member-detail" data-uid="${esc(x.s.uid)}" role="button" tabindex="0">
        <span class="avatar">${esc(x.s.initials)}</span>
        <div class="grow"><b>${esc(x.s.name)}</b><div class="mgr-reasons">${x.reasons.slice(0, 3).map(r => `<span class="chip" style="font-size:11px;">${r.txt}</span>`).join('')}</div></div>
        <button class="btn btn-glass btn-sm" data-action="nudge" data-uid="${esc(x.s.uid)}" data-name="${esc(x.s.name)}">Nudge</button>
      </div>`).join('') : `<p class="empty-note" style="text-align:left;padding:6px 0;">Nobody needs attention — the whole team is on pace 🌿</p>`}
  </div>`;
}

/* ---- Member drill-down drawer ---- */
function openMemberDetail(uid) {
  const m = (adminMembers || []).find(x => x.uid === uid); if (!m) return;
  const s = memberSummary(m), pf = m.profile || {}, st = m.state || {};
  const log = (st.trainingLog || []).slice().sort((a, b) => b.at - a.at);
  const pace = trainingPace(s.compTarget);
  const issues = memberRecertIssues(m);
  const pct = Math.min(100, Math.round(s.compHours / (s.compTarget || 40) * 100));
  document.querySelectorAll('#mdetModal').forEach(x => x.remove());
  const ov = document.createElement('div');
  ov.className = 'take-overlay open'; ov.id = 'mdetModal'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  ov.innerHTML = `<div class="take-card mdet">
    <button class="modal-x" data-action="mdet-close" aria-label="Close">✕</button>
    <div class="row gap-3"><span class="avatar" style="width:46px;height:46px;font-size:15px;">${esc(s.initials)}</span>
      <div class="grow"><h3 style="font-family:var(--font-display);font-size:21px;margin:0;">${esc(s.name)}</h3>
      <span class="m-sub">${tdept(pf.dept) || '—'} · ${esc(s.email || '')}</span></div></div>
    <div class="mdet-meta">${[['NIF', pf.nif], ['N.º', pf.employeeNo], ['Contract', pf.contractType], ['FTE', pf.fte != null ? pf.fte : 1], ['Since', pf.hireDate]].filter(x => x[1]).map(x => `<span>${x[0]} <b>${esc(String(x[1]))}</b></span>`).join('')}</div>
    <div class="ready-wrap" style="margin-top:14px;">
      <div class="jour-ring" style="--sz:74px;background:conic-gradient(${s.compHours >= pace - 2 ? 'var(--accent-2)' : 'var(--warn, #d9b38c)'} ${pct * 3.6}deg, rgba(231,237,227,.12) 0)"><span>${s.compHours}<small style="font-size:10px;">/${s.compTarget}h</small></span></div>
      <div class="ready-rows" style="gap:5px;">
        <div class="between"><span class="sk-name">40h status</span><b>${s.compHours >= s.compTarget ? '✓ complete' : s.compHours >= pace - 2 ? '● on track' : '⚠ behind pace'}</b></div>
        <div class="between"><span class="sk-name">Courses done</span><b>${s.coursesDone}</b></div>
        <div class="between"><span class="sk-name">Level · streak</span><b>Lv ${s.level} · ${s.streak}d</b></div>
        ${issues.length ? `<div class="comp-status behind">🛡 ${issues.map(i => `${esc(i.course)} ${i.state === 'expired' ? 'expired' : 'expires in ' + i.days + 'd'}`).join(' · ')}</div>` : ''}
      </div></div>
    <div class="ob-eyebrow" style="margin-top:16px;">Training log · ${complianceYear()}</div>
    ${log.length ? `<div class="comp-log">${log.slice(0, 8).map(e => `<div class="comp-row"><span class="cl-t">${esc(e.title || '')}</span><span class="cl-meta">${new Date(e.at).toLocaleDateString('pt-PT')} · ${e.hours}h</span></div>`).join('')}</div>` : `<p class="empty-note" style="text-align:left;padding:6px 0;">No credited hours yet.</p>`}
    <div class="row wrapf gap-3" style="margin-top:16px;">
      <button class="btn btn-primary btn-sm" data-action="nudge" data-uid="${esc(s.uid)}" data-name="${esc(s.name)}">Nudge</button>
      <button class="btn btn-glass btn-sm" data-action="mdet-register" data-uid="${esc(s.uid)}">⤓ Registo CSV</button>
      <button class="btn btn-glass btn-sm" data-action="mdet-exit" data-uid="${esc(s.uid)}">📄 Declaração de cessação</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  const esch = e => { if (e.key === 'Escape') { ov.remove(); removeEventListener('keydown', esch); } };
  addEventListener('keydown', esch);
}
function registerRowsFor(pf, log, y) {
  const rows = [['Trabalhador', 'NIF', 'Ação', 'Módulo', 'Modalidade', 'Data', 'Duração (h)', 'Confirmação']];
  (log || []).filter(e => new Date(e.at).getFullYear() === y).sort((a, b) => a.at - b.at)
    .forEach(e => rows.push([pf.name || '', pf.nif || '', ptCourseTitle(e.courseId), e.title || '', 'e-learning', new Date(e.at).toLocaleString('pt-PT'), e.hours, e.confirmed ? 'Sim' : '']));
  return rows;
}
function downloadMemberRegister(uid) {
  const m = (adminMembers || []).find(x => x.uid === uid); if (!m) return;
  csvBlob(registerRowsFor(m.profile || {}, (m.state || {}).trainingLog, complianceYear()), `registo-presencas-${(m.profile || {}).nif || uid}-${complianceYear()}.csv`);
  toast(t('comp_reg_dl'), '⤓');
}
/* Art. 134.º exit statement — outstanding training hours at contract cessation (DRAFT wording) */
async function downloadExitStatement(uid) {
  const m = (adminMembers || []).find(x => x.uid === uid); if (!m) return;
  const pf = m.profile || {}, log = (m.state || {}).trainingLog || [];
  const y = complianceYear();
  const years = [];
  for (let i = 4; i >= 0; i--) {
    const yy = y - i;
    const h = Math.round(log.filter(e => new Date(e.at).getFullYear() === yy).reduce((a, e) => a + (e.hours || 0), 0) * 10) / 10;
    if (h > 0 || yy === y) years.push({ yy, h, target: yy === y ? (complianceTarget(pf) || 40) : Math.round(40 * (pf.fte != null ? pf.fte : 1)) });
  }
  const code = await complianceVerifyCode(pf, y, log);
  const W = 1600, H = 1131, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  x.fillStyle = '#0e140f'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(200,164,93,.85)'; x.lineWidth = 3; x.strokeRect(46, 46, W - 92, H - 92);
  x.textAlign = 'center';
  x.fillStyle = '#c8a45d'; x.font = '600 24px Inter'; x.fillText(companyName().toUpperCase().split('').join(' '), W / 2, 140);
  x.fillStyle = '#f7f6f1'; x.font = '600 46px "Cormorant Garamond", serif'; x.fillText('Declaração de Formação Profissional Contínua', W / 2, 236);
  x.fillStyle = 'rgba(247,246,241,.7)'; x.font = '400 22px "Cormorant Garamond", serif'; x.fillText('para efeitos do artigo 134.º do Código do Trabalho (cessação de contrato)', W / 2, 276);
  x.fillStyle = 'rgba(247,246,241,.85)'; x.font = '400 21px Inter';
  wrapCanvasText(x, `Declara-se, para os devidos efeitos, que ${pf.name || '—'}, NIF ${pf.nif || '—'}${pf.employeeNo ? ', trabalhador n.º ' + pf.employeeNo : ''}, tem o seguinte registo de horas de formação profissional contínua nos últimos anos civis:`, W / 2, 356, 1100, 32);
  x.textAlign = 'left'; let ay = 470;
  x.fillStyle = 'rgba(200,164,93,.9)'; x.font = '700 15px Inter';
  x.fillText('ANO', 380, ay); x.fillText('HORAS REGISTADAS', 620, ay); x.fillText('MÍNIMO LEGAL', 940, ay); x.fillText('EM FALTA', 1160, ay); ay += 14;
  x.strokeStyle = 'rgba(200,164,93,.35)'; x.beginPath(); x.moveTo(380, ay); x.lineTo(1240, ay); x.stroke(); ay += 34;
  let owed = 0;
  years.forEach(r => { const miss = Math.max(0, Math.round((r.target - r.h) * 10) / 10); owed += miss;
    x.fillStyle = 'rgba(247,246,241,.85)'; x.font = '400 20px Inter';
    x.fillText(String(r.yy), 380, ay); x.fillText(r.h + ' h', 620, ay); x.fillText(r.target + ' h', 940, ay);
    x.fillStyle = miss ? '#d9b38c' : '#a6c3a5'; x.fillText(miss + ' h', 1160, ay); ay += 34; });
  ay += 10; x.strokeStyle = 'rgba(200,164,93,.35)'; x.beginPath(); x.moveTo(380, ay); x.lineTo(1240, ay); x.stroke(); ay += 44;
  x.fillStyle = '#f7f6f1'; x.font = '600 26px "Cormorant Garamond", serif';
  x.fillText(`Total de horas de formação em falta: ${Math.round(owed * 10) / 10} h`, 380, ay);
  x.textAlign = 'center';
  x.fillStyle = 'rgba(247,246,241,.55)'; x.font = '400 17px Inter';
  wrapCanvasText(x, 'Nota: este registo reflete as horas documentadas na plataforma ' + brandAcademy() + '; formação anterior à adoção da plataforma pode não estar incluída.', W / 2, 880, 1000, 26);
  x.fillStyle = 'rgba(247,246,241,.5)'; x.font = '400 18px Inter'; x.fillText(new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }), W / 2, 966);
  x.fillStyle = 'rgba(247,246,241,.4)'; x.font = '400 15px Inter'; x.fillText(`Código de verificação: ${code}`, W / 2, 1024);
  x.fillStyle = 'rgba(217,179,140,.6)'; x.font = 'italic 400 13px Inter'; x.fillText('Documento comprovativo interno · modelo em validação jurídica', W / 2, 1052);
  cv.toBlob(b => { const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `declaracao-cessacao-${pf.nif || uid}.png`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u); toast('Declaração transferida', '📄'); }, 'image/png');
}

function adminCockpitHTML() {
  const asgs = activeAssignments();
  const assignments = asgs.map((a, i) => {
    const c = courseById(a.courseId);
    const track = assignmentTrack(a);
    return `<div class="assignment-row">📌 <b>${c ? esc(c.title) : a.courseId}</b> → ${a.team === 'everyone' ? 'Everyone' : tdept(a.team)}${a.due ? ` · due ${a.due}` : ''}${track ? ` · <span class="asg-track">${track}</span>` : ''}<button class="ar-x" data-action="unassign" data-idx="${i}" title="Remove">✕</button></div>`;
  }).join('');
  return `<section class="stats" id="cockpitStats" style="margin:24px 0 0;">
      <div class="stat"><div class="num">—</div><div class="lbl">Members</div></div>
      <div class="stat"><div class="num">—</div><div class="lbl">Avg. completion</div></div>
      <div class="stat"><div class="num">—</div><div class="lbl">Active this week</div></div>
      <div class="stat"><div class="num">—</div><div class="lbl">At risk</div></div>
    </section>
    <div id="mgrDash"></div>
    <div class="admin-section">
      <div class="cockpit-head">
        <div><h2>Team</h2><p class="sect-sub">Your real members, sorted by who needs attention. “Nudge” pings their next lesson.</p></div>
        <div style="display:flex;gap:8px;align-items:center;">
          <select id="ckDept" class="ck-dept"><option value="">All departments</option>${DEPTS.map(d => `<option value="${d.key}" ${cockpitDept === d.key ? 'selected' : ''}>${d.en}</option>`).join('')}</select>
          <button class="btn btn-glass btn-sm" data-action="export-members">⤓ Export CSV</button><button class="btn btn-glass btn-sm" data-action="ru-annex">🛡 ${t('ru_annex_btn')}</button><button class="btn btn-glass btn-sm" data-action="art4-pack" title="EU AI Act Art. 4 — AI-literacy evidence">🤖 ${t('art4_btn')}</button><button class="btn btn-glass btn-sm" data-action="gdpr-doc" data-kind="retention" title="${t('gdpr_retention')}">📄 RGPD·1</button><button class="btn btn-glass btn-sm" data-action="gdpr-doc" data-kind="art30" title="${t('gdpr_art30')}">📄 RGPD·2</button><button class="btn btn-glass btn-sm" data-action="gdpr-doc" data-kind="dpa" title="${t('gdpr_dpa')}">📄 RGPD·3</button>
        </div>
      </div>
      <div class="team-table"><table>
        <thead><tr><th>Member</th><th>Path progress</th><th></th><th>Level</th><th>Role ready</th><th>40h</th><th>Streak</th><th>Last active</th><th>Status</th><th></th></tr></thead>
        <tbody id="cockpitRoster"><tr><td colspan="10" class="empty-note">Loading members…</td></tr></tbody>
      </table></div>
      <div class="two-col" id="cockpitTrends" style="margin-top:18px;"></div>
      <div style="margin-top:18px;"><button class="btn btn-glass btn-sm" data-action="ai-digest">✦ AI weekly digest</button><div id="aiDigest"></div></div>
    </div>
    <div id="cockpitHeat"></div>
    <div id="cockpitComp"></div>
    <div class="admin-section">
      <h2>🌾 Field Missions review</h2>
      <p class="sect-sub">Members' real-world proof, waiting for your eyes. Approve to release their XP.</p>
      <div id="missionQueue"><p class="empty-note" style="text-align:left;padding:8px 0;">Loading…</p></div>
    </div>
    ${adminMembers ? intelHTML() : '<div id="intelWrap"></div>'}
    <div class="admin-section">
      <h2>Assign learning</h2>
      <p class="sect-sub">Assignments appear on each learner's home with the due date.</p>
      <div class="composer">
        <div class="field"><label>Course</label>
          <select id="asgCourse">${CATALOG.map(c => `<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select></div>
        <div class="field"><label>Team</label>
          <select id="asgTeam"><option value="everyone">Everyone</option>${DEPTS.map(d => `<option value="${d.key}">${d.en}</option>`).join('')}</select></div>
        <div class="field"><label>Due date</label><input id="asgDue" type="date"></div>
        <button class="btn btn-primary" data-action="assign">Assign →</button>
      </div>
      <div id="asgList">${assignments}</div>
    </div>`;
}

/* ----- Content: every course, editable ----- */
function courseStatus(c) { return c.custom ? ['draft', 'Team'] : c.edited ? ['edited', 'Edited'] : ['live', 'Catalog']; }
function avgRating(courseId) {
  if (!adminMembers) return null;
  const rs = adminMembers.map(m => (m.state.ratings || {})[courseId]).filter(Boolean);
  return rs.length ? { avg: (rs.reduce((a, b) => a + b, 0) / rs.length).toFixed(1), n: rs.length } : null;
}
function adminContentHTML() {
  if (editingCourse) return courseEditorHTML();
  const rows = CATALOG.map(c => {
    const [cls, label] = courseStatus(c);
    const r = avgRating(c.id);
    return `<div class="content-row">
      <span class="ci t-grad-${c.grad}">${svgIcon(c.icon)}</span>
      <div class="ct"><b>${esc(ctitle(c))}</b><span>${tcat(c.cat)} · ${c.modules.length} ${t('modules')} · ${fmtMins(courseMins(c))}${r ? ` · ★ ${r.avg} (${r.n})` : ''}</span></div>
      <span class="pub-chip ${courseStale(c) ? 'draft' : 'live'}" title="Content freshness — re-dated on every save">${courseStale(c) ? '⏳ review due' : '✓ ' + fmtYm(c.updated)}</span>
      <span class="pub-chip ${cls}">${label}</span>
      <button class="btn btn-glass btn-sm" data-action="ce-open" data-id="${c.id}">✎ Edit</button>
    </div>`;
  }).join('');
  return `<div class="admin-section">
    <h2>All courses</h2>
    <p class="sect-sub">Everything on the platform. Edit copy, modules and videos in both languages — changes publish to the whole team instantly.</p>
    <div class="content-table">${rows}</div>
  </div>
  <div class="admin-section">
    <h2>${t('studio_title')}</h2>
    <p class="sect-sub">${t('studio_sub')}</p>
    <div class="studio">
      <div class="ce-two">
        <div class="field"><label>Source type</label><select id="stMode">
          <option value="lesson">Lesson transcript / script</option>
          <option value="capture">Expert interview / SOP — knowledge capture</option>
        </select></div>
        <div class="field"><label>&nbsp;</label><input class="auth-input" id="stTitle" placeholder="${t('studio_title_ph')}"></div>
      </div>
      <input class="auth-input" id="stVideo" placeholder="${t('studio_video_ph')}">
      <textarea class="comm-input" id="stText" rows="5" placeholder="${t('studio_text_ph')}"></textarea>
      <button class="btn btn-primary" data-action="studio-gen" id="stGen">${t('studio_gen')}</button>
      <div id="stStatus"></div>
      <div id="stDraft"></div>
    </div>
  </div>`;
}
function videoUrlOf(m) {
  if (!m) return '';
  if (m.type === 'vimeo') return 'https://vimeo.com/' + m.id;
  if (m.type === 'youtube') return 'https://www.youtube.com/watch?v=' + m.id;
  if (m.type === 'mp4') return m.src;
  return '';
}
function openCourseEditor(id) {
  const c = courseById(id); if (!c) return;
  const pt = (c.pt || COURSE_PT[id] || {});
  const hooks = c.hook != null ? [c.hook, c.hookSub || ''] : (COURSE_HOOKS[id] || ['', '']);
  const hooksPt = pt.hook != null ? [pt.hook, pt.hookSub || ''] : (COURSE_HOOKS_PT[id] || ['', '']);
  const ptMods = pt.modules || [];
  editingCourse = {
    id, custom: !!c.custom, cat: c.cat, level: c.level || 'All levels',
    title: c.title, title_pt: pt.title || '',
    hook: hooks[0] || '', hookSub: hooks[1] || '', hook_pt: hooksPt[0] || '', hookSub_pt: hooksPt[1] || '',
    desc: c.desc || '', desc_pt: pt.desc || '',
    mods: c.modules.map((m, i) => ({
      en: m, pt: ptMods[i] || '',
      video: videoUrlOf(modMedia(c, i)),
      mins: (c.moduleDurations && c.moduleDurations[i]) || 12
    })),
    resourcesRaw: (c.resources || []).map(r => `${r.label} | ${r.url}`).join('\n'),
    sequential: !!c.sequential,
    recertMonths: c.recertMonths || 0
  };
  adminTab = 'content';
  render();
}
function ceFieldPair(label, key, ph) {
  const e = editingCourse;
  return `<div class="ce-two">
    <div class="field"><label>${label} · EN</label><input class="auth-input" data-ce="${key}" value="${attr(e[key])}" placeholder="${ph || ''}"></div>
    <div class="field"><label>${label} · PT</label><input class="auth-input" data-ce="${key}_pt" value="${attr(e[key + '_pt'])}" placeholder="${ph || ''}"></div>
  </div>`;
}
function courseEditorHTML() {
  const e = editingCourse;
  const cats = [...new Set(CATALOG.filter(x => !x.custom).map(x => x.cat))];
  const levels = ['Beginner', 'Intermediate', 'Advanced', 'All levels'];
  const modRows = e.mods.map((m, i) => `
    <div class="ce-mod" data-idx="${i}">
      <span class="ce-mod-n">${i + 1}</span>
      <div class="ce-mod-grid">
        <input class="auth-input" data-cm="en" value="${attr(m.en)}" placeholder="Module title · EN">
        <input class="auth-input" data-cm="pt" value="${attr(m.pt)}" placeholder="Título do módulo · PT">
        <input class="auth-input" data-cm="video" value="${attr(m.video)}" placeholder="Video link — Vimeo / YouTube / .mp4 (optional)">
        <input class="auth-input ce-mins" data-cm="mins" type="number" min="1" max="180" value="${attr(m.mins)}" title="Minutes">
      </div>
      <button class="btn btn-glass btn-sm" data-action="ce-mod-del" data-idx="${i}" title="Remove module">✕</button>
    </div>`).join('');
  return `<div class="admin-section ce-editor">
    <div class="cockpit-head">
      <div><h2>✎ ${esc(e.title || 'New course')}</h2><p class="sect-sub">${e.custom ? 'Team-published course' : 'Catalog course — your edit becomes the live version; you can always revert.'}</p></div>
      <button class="btn btn-glass btn-sm" data-action="ce-cancel">← All courses</button>
    </div>
    ${ceFieldPair('Title', 'title')}
    ${ceFieldPair('Hook — the one-line invitation', 'hook')}
    ${ceFieldPair('Hook subtitle', 'hookSub')}
    <div class="ce-two">
      <div class="field"><label>Description · EN</label><textarea class="comm-input" rows="2" data-ce="desc">${esc(e.desc)}</textarea></div>
      <div class="field"><label>Description · PT</label><textarea class="comm-input" rows="2" data-ce="desc_pt">${esc(e.desc_pt)}</textarea></div>
    </div>
    <div class="ce-two">
      <div class="field"><label>Category</label><select data-ce="cat">${cats.map(x => `<option ${x === e.cat ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      <div class="field"><label>Level</label><select data-ce="level">${levels.map(x => `<option ${x === e.level ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
    </div>
    <div class="ce-two">
      <div class="field"><label>Resources — one per line: Label | https://url</label><textarea class="comm-input" rows="2" data-ce="resourcesRaw" placeholder="Soil worksheet | https://…">${esc(e.resourcesRaw)}</textarea></div>
      <div class="field" style="display:flex;align-items:flex-end;gap:18px;padding-bottom:6px;flex-wrap:wrap;"><label class="lv-check" style="margin:0;"><input type="checkbox" id="ceSeq" ${e.sequential ? 'checked' : ''}> 🔒 Sequential — modules unlock in order</label>
      <label class="lv-check" style="margin:0;">🛡 Recertify every <input class="auth-input ce-mins" id="ceRecert" type="number" min="0" max="60" value="${attr(e.recertMonths || '')}" placeholder="0" style="width:64px;padding:6px 8px;"> months</label></div>
    </div>
    <h3 class="ce-h3">Modules <span class="sect-sub" style="display:inline;font-weight:400;">— paste a Vimeo or YouTube link and the player wires it automatically</span></h3>
    <div id="ceMods">${modRows}</div>
    <button class="btn btn-glass btn-sm" data-action="ce-mod-add" style="margin-top:10px;">+ Add module</button>
    <div class="ce-actions">
      <button class="btn btn-primary" data-action="ce-save">Save & publish</button>
      <button class="btn btn-glass" data-action="ce-cancel">Cancel</button>
      <span style="flex:1"></span>
      ${!e.custom && (courseById(e.id) || {}).edited ? `<button class="btn btn-glass" data-action="ce-revert">↺ Revert to original</button>` : ''}
      ${e.custom ? `<button class="btn btn-glass danger" data-action="studio-del" data-id="${e.id}">✕ Delete course</button>` : ''}
    </div>
  </div>`;
}
function readEditorDOM() {
  const e = editingCourse; if (!e) return;
  document.querySelectorAll('[data-ce]').forEach(el => { e[el.dataset.ce] = el.value; });
  e.mods = [...document.querySelectorAll('.ce-mod')].map(row => {
    const v = k => (row.querySelector(`[data-cm="${k}"]`) || {}).value || '';
    return { en: v('en'), pt: v('pt'), video: v('video'), mins: +v('mins') || 12 };
  });
}
function ceSave() {
  readEditorDOM();
  const e = editingCourse;
  const mods = e.mods.filter(m => m.en.trim());
  if (!e.title.trim() || !mods.length) { toast('A title and at least one module are needed', 'ℹ️'); return; }
  if (!(window.EdenCloud && EdenCloud.saveCourse)) { toast('You need to be online and signed in', '⚠️'); return; }
  const base = (ORIG_COURSES[e.id] && ORIG_COURSES[e.id].c) || courseById(e.id) || {};
  const media = mods.map(m => parseVideoLink(m.video.trim()));
  const out = Object.assign({}, base, {
    id: e.id, title: e.title.trim(), cat: e.cat, level: e.level,
    hook: e.hook.trim(), hookSub: e.hookSub.trim(), desc: e.desc.trim(),
    modules: mods.map(m => m.en.trim()),
    moduleMedia: media.some(Boolean) ? media : null,
    moduleDurations: mods.map(m => m.mins),
    pt: {
      title: e.title_pt.trim() || e.title.trim(), desc: e.desc_pt.trim() || e.desc.trim(),
      modules: mods.map(m => m.pt.trim() || m.en.trim()),
      hook: e.hook_pt.trim() || e.hook.trim(), hookSub: e.hookSub_pt.trim() || e.hookSub.trim()
    }
  });
  out.resources = (e.resourcesRaw || '').split('\n').map(l => {
    const m = l.split('|'); const url = (m[1] || m[0] || '').trim();
    return /^https?:\/\//.test(url) ? { label: (m.length > 1 ? m[0] : url).trim(), url } : null;
  }).filter(Boolean);
  out.sequential = !!($('#ceSeq') && $('#ceSeq').checked);
  out.updated = new Date().toISOString().slice(0, 7);   /* content freshness — every save re-dates the course */
  out.recertMonths = Math.max(0, +($('#ceRecert') && $('#ceRecert').value) || 0) || null;
  if (!out.custom) out.edited = true;
  const clean = JSON.parse(JSON.stringify(out));   /* Firestore rejects undefined values */
  EdenCloud.saveCourse(clean).then(() => {
    EdenApp.applyCustomCourses(null, clean);
    editingCourse = null;
    toast('Course published to the whole team', '🌿');
    render();
  }).catch(err => { console.error('[studio]', err); toast('Could not save — are the Firestore rules published?', '⚠️'); });
}
function ceRevert() {
  const e = editingCourse; if (!e) return;
  if (!confirm('Revert this course to the original catalog version?')) return;
  EdenCloud.deleteCourse(e.id).then(() => {
    const o = ORIG_COURSES[e.id];
    if (o) {
      const i = CATALOG.findIndex(x => x.id === e.id); if (i >= 0) CATALOG[i] = o.c;
      if (o.hooks) COURSE_HOOKS[e.id] = o.hooks; if (o.hooksPt) COURSE_HOOKS_PT[e.id] = o.hooksPt;
      if (o.pt) COURSE_PT[e.id] = o.pt; else delete COURSE_PT[e.id];
    }
    editingCourse = null;
    toast('Reverted to the original', '↺'); render();
  }).catch(() => toast('Could not revert', '⚠️'));
}

/* ----- Broadcasts: official posts into the community ----- */
function adminBroadcastsHTML() {
  const commOpts = COMMUNITY_CHANNELS.map(c => `<option value="${c.id}">${t(c.key)}</option>`).join('');
  const courseOpts = CATALOG.map(c => `<option value="${c.id}">${esc(ctitle(c))}</option>`).join('');
  return `<div class="admin-section">
    <h2>New broadcast</h2>
    <p class="sect-sub">Posts as an official ${brandName()} announcement in the community — gold badge, optionally pinned to the top of its channel.</p>
    <div class="studio">
      <div class="ce-two">
        <div class="field"><label>Channel</label><select id="bcChannel">
          <optgroup label="Community">${commOpts}</optgroup>
          <optgroup label="Course channels">${courseOpts}</optgroup>
        </select></div>
        <div class="field" style="display:flex;align-items:flex-end;"><label class="lv-check"><input type="checkbox" id="bcPin" checked> 📌 Pin to top</label></div>
      </div>
      <input class="auth-input" id="bcTitle" maxlength="120" placeholder="Title (optional — makes it a discussion)">
      <textarea class="comm-input" id="bcBody" rows="3" placeholder="The announcement… links to images or videos embed automatically"></textarea>
      <button class="btn btn-primary" data-action="bc-send">Broadcast 📣</button>
    </div>
  </div>
  <div class="admin-section">
    <h2>Past broadcasts</h2>
    <div id="bcList"><div class="skel" style="height:44px;"></div></div>
  </div>`;
}
function paintBroadcasts(posts) {
  const el = $('#bcList'); if (!el) return;
  el.innerHTML = posts.length ? posts.map(p => `
    <div class="content-row">
      <span class="ci t-grad-2">${svgIcon('sun')}</span>
      <div class="ct"><b>${esc(p.title || (p.body || '').slice(0, 60))}</b><span>${esc(channelMeta(p.channel).label)} · ${timeAgo(p.createdAt)}${p.pinned ? ' · 📌' : ''}</span></div>
      <button class="btn btn-glass btn-sm" data-action="bc-del" data-id="${p.id}">✕</button>
    </div>`).join('') : `<p class="empty-note" style="text-align:left;padding:8px 0;">No broadcasts yet — your first announcement will appear here.</p>`;
}
function bcSend() {
  const title = ($('#bcTitle') && $('#bcTitle').value || '').trim();
  const body = ($('#bcBody') && $('#bcBody').value || '').trim();
  if (!body) { if ($('#bcBody')) $('#bcBody').focus(); return; }
  if (!(window.EdenForum && EdenForum.canPost())) { toast('Sign in first', '⚠️'); return; }
  EdenForum.createPost({
    channel: $('#bcChannel').value, kind: title ? 'discussion' : 'message',
    title, body, official: true, pinned: $('#bcPin').checked
  }).then(() => {
    $('#bcTitle').value = ''; $('#bcBody').value = '';
    toast('Broadcast published', '📣'); initAdmin();
  }).catch(() => toast('Could not post — are the Firestore rules published?', '⚠️'));
}

/* ----- Live sessions manager ----- */
function adminLiveHTML() {
  if (!liveDraft) liveDraft = liveList().map(s => Object.assign({}, s));
  const rows = liveDraft.map((s, i) => `
    <div class="lv-row" data-idx="${i}">
      <div class="lv-grid">
        <input class="auth-input" data-lv="title" value="${attr(s.title)}" placeholder="Session title">
        <input class="auth-input" data-lv="host" value="${attr(s.host)}" placeholder="Host — Name · Role">
        <input class="auth-input" data-lv="when" value="${attr(s.when)}" placeholder="When — e.g. Fri 14:00 WET">
        <input class="auth-input" data-lv="desc" value="${attr(s.desc)}" placeholder="One-line description">
        <input class="auth-input" data-lv="date" type="datetime-local" value="${attr(s.date)}" title="Exact date & time — enables members' Add-to-calendar">
      </div>
      <label class="lv-check"><input type="checkbox" data-lv="live" ${s.live ? 'checked' : ''}> 🔴 LIVE now</label>
      <button class="btn btn-glass btn-sm" data-action="lv-del" data-idx="${i}" title="Remove">✕</button>
    </div>`).join('');
  return `<div class="admin-section">
    <h2>Live schedule</h2>
    <p class="sect-sub">What members see on the Live page and in the community sidebar. Save publishes instantly to everyone — guests included.</p>
    <div id="lvRows">${rows || `<p class="empty-note" style="text-align:left;">No sessions scheduled.</p>`}</div>
    <div class="ce-actions">
      <button class="btn btn-glass btn-sm" data-action="lv-add">+ Add session</button>
      <span style="flex:1"></span>
      <button class="btn btn-primary" data-action="lv-save">Save schedule</button>
    </div>
  </div>`;
}
function readLiveRows() {
  if (!liveDraft) return;
  document.querySelectorAll('.lv-row').forEach((row, i) => {
    if (!liveDraft[i]) return;
    row.querySelectorAll('[data-lv]').forEach(el => {
      liveDraft[i][el.dataset.lv] = el.type === 'checkbox' ? el.checked : el.value;
    });
  });
}
function lvSave() {
  readLiveRows();
  const ICON_CYCLE = ['sprout', 'tree', 'drop', 'sun', 'leaf', 'people'];
  const live = liveDraft.filter(s => (s.title || '').trim()).map((s, i) => ({
    id: s.id || 'live-' + slugify(s.title), title: s.title.trim(), host: (s.host || '').trim(),
    when: (s.when || '').trim(), desc: (s.desc || '').trim(), date: s.date || '', live: !!s.live,
    viewers: s.viewers || 0, grad: s.grad || (i % 8) + 1, icon: s.icon || ICON_CYCLE[i % ICON_CYCLE.length]
  }));
  if (!(window.EdenCloud && EdenCloud.saveMeta)) { toast('You need to be online and signed in', '⚠️'); return; }
  EdenCloud.saveMeta(Object.assign({}, studioMeta, { live })).then(() => {
    studioMeta = Object.assign({}, studioMeta, { live });
    liveDraft = null;
    toast('Live schedule published', '📅'); render();
  }).catch(() => toast('Could not save — are the Firestore rules published?', '⚠️'));
}

/* ----- Phase 5: Company (tenant self-service) ----- */
function adminCompanyHTML() {
  const co = window.EdenCompany || { id: (BRAND.id || 'edenrise'), name: (BRAND.name || 'EdenRise'), adminEmails: [] };
  const invite = co.inviteCode ? `${location.origin}${location.pathname}?join=${co.inviteCode}` : '';
  return `<div class="admin-section">
    <h2>🏢 ${esc(co.name || co.id)}</h2>
    <p class="sect-sub">Your company's identity — it brands the academy and, importantly, the legal training documents.</p>
    <div class="ce-two">
      <div class="field"><label>Company name</label><input class="auth-input" id="coName" value="${attr(co.name || '')}"></div>
      <div class="field"><label>NIF</label><input class="auth-input" id="coNif" inputmode="numeric" maxlength="9" value="${attr(co.nif || '')}"></div>
    </div>
    <div class="ce-two">
      <div class="field"><label>Logo URL (optional)</label><input class="auth-input" id="coLogo" value="${attr(co.logoUrl || '')}" placeholder="https://…/logo.png"></div>
      <div class="field"><label>Accent colour (optional)</label><input class="auth-input" id="coAccent" value="${attr(co.accent || '')}" placeholder="#c8a45d"></div>
    </div>
    <div class="field" style="margin-top:12px;"><label>Admin emails (one per line — these people manage this company)</label>
      <textarea class="comm-input" id="coAdmins" rows="3">${esc((co.adminEmails || []).join('\n'))}</textarea></div>
    <button class="btn btn-primary btn-sm" style="margin-top:14px;" data-action="co-save">Save company</button>
  </div>
  <div class="admin-section">
    <h2>✉️ Invite your team</h2>
    <p class="sect-sub">Anyone who opens this link (or enters the code at sign-up) joins <b>${esc(co.name || co.id)}</b> automatically.</p>
    ${co.inviteCode ? `<div class="org-key" style="align-items:center;">
      <div class="notif-info"><b>${esc(co.inviteCode)}</b><span style="word-break:break-all;">${esc(invite)}</span></div>
      <div class="row gap-3"><button class="btn btn-glass btn-sm" data-action="co-copy-invite">Copy link</button>
      <button class="btn btn-quiet btn-sm" data-action="co-rotate-invite">↺ New code</button></div>
    </div>` : `<button class="btn btn-glass btn-sm" data-action="co-rotate-invite">Generate invite code</button>`}
  </div>`;
}
function saveCompanySettings() {
  const admins = ($('#coAdmins').value || '').split('\n').map(x => x.trim().toLowerCase()).filter(x => /.+@.+\..+/.test(x));
  const data = { id: (window.EdenCompany || {}).id, name: ($('#coName').value || '').trim(), nif: ($('#coNif').value || '').replace(/\D/g, '').slice(0, 9), logoUrl: ($('#coLogo').value || '').trim(), accent: ($('#coAccent').value || '').trim(), adminEmails: admins };
  EdenCloud.saveCompany(data).then(() => { toast('Company saved', '🏢'); render(); }).catch(() => toast('Could not save — are the new Firestore rules deployed?', '⚠️'));
}
/* ----- Phase 5: Companies (superadmin console) ----- */
let companiesCache = null;
function adminCompaniesHTML() {
  return `<div class="admin-section">
    <h2>✦ Companies</h2>
    <p class="sect-sub">Every tenant on the platform. Create a company, hand its admin the invite link, activate when they subscribe.</p>
    <div id="coList">${companiesCache ? companiesListHTML() : '<div class="skel" style="height:44px;"></div>'}</div>
  </div>
  <div class="admin-section">
    <h2>New company</h2>
    <div class="ce-two">
      <div class="field"><label>ID (slug, permanent)</label><input class="auth-input" id="ncId" placeholder="quinta-do-sol"></div>
      <div class="field"><label>Name</label><input class="auth-input" id="ncName" placeholder="Quinta do Sol, Lda"></div>
    </div>
    <div class="ce-two">
      <div class="field"><label>NIF</label><input class="auth-input" id="ncNif" inputmode="numeric" maxlength="9"></div>
      <div class="field"><label>First admin email</label><input class="auth-input" id="ncAdmin" type="email" placeholder="gestor@quinta.pt"></div>
    </div>
    <button class="btn btn-primary btn-sm" style="margin-top:14px;" data-action="co-create">Create company →</button>
  </div>`;
}
function companiesListHTML() {
  return (companiesCache || []).map(c => `<div class="content-row">
    <span class="ci t-grad-${1 + (c.id.length % 8)}">${svgIcon('people')}</span>
    <div class="ct"><b>${esc(c.name || c.id)}</b><span>${esc(c.id)} · ${c.plan || 'trial'} · ${(c.adminEmails || []).length} admin(s) · invite ${esc(c.inviteCode || '—')}</span></div>
    <span class="pub-chip ${c.status === 'active' ? 'live' : 'draft'}">${(c.status || 'active').toUpperCase()}</span>
    <button class="btn btn-glass btn-sm" data-action="co-toggle" data-id="${esc(c.id)}">${c.status === 'suspended' ? 'Activate' : 'Suspend'}</button>
  </div>`).join('') || `<p class="empty-note" style="text-align:left;padding:8px 0;">Only ${brandName()} so far — create the first client company below.</p>`;
}
function createCompanyFromForm() {
  const id = ($('#ncId').value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const name = ($('#ncName').value || '').trim();
  if (!id || !name) { toast('ID and name are needed', 'ℹ️'); return; }
  EdenCloud.createCompany({ id, name, nif: ($('#ncNif').value || '').trim(), adminEmail: ($('#ncAdmin').value || '').trim() })
    .then(code => { toast(`Company created — invite ${code}`, '✦'); companiesCache = null; initAdmin(); render(); })
    .catch(e => toast('Create failed: ' + String(e.message || e).slice(0, 60), '⚠️'));
}

/* ----- Settings ----- */
function adminSettingsHTML() {
  const g = (window.EdenOrg && window.EdenOrg.aiGuard) || {};
  return `<div class="admin-section">
    <h2>Team settings</h2>
    <div class="org-key" style="margin-top:14px;">
      <div class="notif-info"><b>AI guardrails</b><span>What the learners' AI may talk about. Questions are always visible to admins (learning visibility).</span></div>
      <div style="display:flex;flex-direction:column;gap:10px;flex:1;min-width:280px;">
        <label class="lv-check" style="margin:0;"><input type="checkbox" id="guardCourseOnly" ${g.courseOnly !== false ? 'checked' : ''}> Course-only mode — the AI stays on course & work topics</label>
        <input class="auth-input" id="guardBlocked" placeholder="Blocked topics (comma-separated, optional)" value="${attr(g.blocked || '')}">
        <button class="btn btn-glass btn-sm" data-action="guard-save" style="align-self:flex-start;">Save guardrails</button>
      </div>
    </div>
    <div class="org-key" style="margin-top:14px;">
      <div class="notif-info"><b>Demo content</b><span>Seed a welcome broadcast, a wins post with photo, a poll, two dated live sessions and one assignment — so the platform demos inhabited.</span></div>
      <button class="btn btn-glass btn-sm" data-action="seed-demo">🌿 Seed demo content</button>
    </div>
    <div class="org-key" style="margin-top:14px;">
      <div class="notif-info"><b>${t('orgkey_title')}</b><span>${t('orgkey_sub')} Key prefix picks the provider: AIza=Gemini · sk-ant=Claude · sk-or=OpenRouter · gsk_=Groq · sk-=OpenAI/DeepSeek.</span></div>
      <div style="display:flex;flex-direction:column;gap:8px;flex:1;min-width:280px;">
        <input class="auth-input" id="orgKeyInput" type="password" placeholder="AIza… / sk-ant-… / sk-or-… / gsk_…" value="${attr((window.EdenOrg && window.EdenOrg.aiKey) || '')}">
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <input class="auth-input" id="orgModelInput" list="modelSuggest" placeholder="Model — e.g. gemini-3-flash-preview (blank = provider default)" value="${attr((window.EdenOrg && window.EdenOrg.aiModel) || '')}" style="flex:1;min-width:220px;">
          <input class="auth-input" id="orgModelHeavy" list="modelSuggest" placeholder="Course-drafting model (optional, bigger)" value="${attr((window.EdenOrg && window.EdenOrg.aiModelHeavy) || '')}" style="flex:1;min-width:220px;">
        </div>
        <datalist id="modelSuggest">
          <option value="gemini-3-flash-preview">Free tier · best pt-PT alignment (research: 99.8%)</option>
          <option value="gemini-3.5-flash">Free tier · newest Flash</option>
          <option value="gemini-2.5-flash">Free tier · current default, proven</option>
          <option value="gemini-3.1-pro-preview">Paid · Portuguese leader, best for course drafting</option>
          <option value="claude-haiku-4-5">Paid · fast, strong instruction-following</option>
          <option value="claude-sonnet-4-6">Paid · workhorse quality</option>
          <option value="gpt-5-mini">Paid · OpenAI mid-tier</option>
          <option value="deepseek-chat">Paid · cheapest capable (China-hosted — GDPR note)</option>
        </datalist>
        <button class="btn btn-primary btn-sm" data-action="orgkey-save" style="align-self:flex-start;">${t('save')}</button>
      </div>
    </div>
  </div>`;
}

function renderAdmin() {
  const bodies = { cockpit: adminCockpitHTML, content: adminContentHTML, broadcasts: adminBroadcastsHTML, digests: adminDigestsHTML, live: adminLiveHTML, company: adminCompanyHTML, companies: adminCompaniesHTML, settings: adminSettingsHTML };
  return `<div class="page"><div class="page-pad">
    <h1 class="page-title">${brandName()} Studio</h1>
    <p class="page-sub">The back office — people, content, broadcasts and the live schedule in one place.</p>
    ${studioTabsHTML()}
    ${(bodies[adminTab] || adminCockpitHTML)()}
  </div>${footerHTML()}</div>`;
}

/* ---------- My Progress ---------- */
function renderProgress() {
  const lv = levelFor(S.xp);
  const board = leaderboard();
  const rank = myRank();
  const maxXp = Math.max(...board.map(r => r.xp), 1);
  const doneCount = CATALOG.filter(c => isDone(c.id)).length;
  const nudge = board.length < 2
    ? `<div class="nudge-line">${svgIcon('sprout')}<span>${t('board_grow')}</span></div>`
    : (rank.ahead
      ? `<div class="nudge-line">${svgIcon('bird')}<span><b>${rank.ahead.name.split(' ')[0]}</b> ${t('xp_ahead_1')} <b>${rank.ahead.xp - S.xp} XP</b> ${t('xp_ahead_2')}</span></div>`
      : `<div class="nudge-line">${svgIcon('sun')}<span>${t('top_board')}</span></div>`);

  return `<div class="page"><div class="page-pad">
    <h1 class="page-title">${t('my_progress')}</h1>
    <p class="page-sub">${t('progress_sub')}</p>

    <div class="prog-top">
      <div class="level-card">
        <div class="level-ring" style="background:conic-gradient(var(--accent) ${lv.pct * 3.6}deg, rgba(231,237,227,.1) 0)">
          <div class="level-ring-in">
            <div class="lv-num">${t('level_ab')} ${lv.idx + 1}</div>
            <div class="lv-name">${tlevel(lv.idx)}</div>
          </div>
        </div>
        <div class="level-meta">
          <div class="lv-xp">${S.xp.toLocaleString()} <span>${t('xp')}</span></div>
          ${lv.next != null
            ? `<div class="lv-next"><div class="track"><div class="fill" style="width:${lv.pct}%"></div></div><span>${lv.toNext} ${t('xp_to')} <b>${tlevel(lv.idx + 1)}</b></span></div>`
            : `<div class="lv-next"><span>${t('highest_level')}</span></div>`}
        </div>
      </div>
      <div class="prog-mini">
        <div class="stat"><div class="num">${S.streak}d</div><div class="lbl">${t('learning_streak')}</div><div class="delta">${t('keep_alive')}</div></div>
        <div class="stat"><div class="num">#${rank.rank}</div><div class="lbl">${t('board_rank')}</div><div class="delta">${t('of')} ${rank.total} ${t('this_week').toLowerCase()}</div></div>
        <div class="stat"><div class="num">${S.badges.length}<span style="font-size:18px;color:var(--text-faint)">/${BADGES.length}</span></div><div class="lbl">${t('badges_earned')}</div><div class="delta">${S.badges.length ? t('nice_work') : t('earn_first')}</div></div>
        <div class="stat"><div class="num">${doneCount}</div><div class="lbl">${t('courses_finished')}</div><div class="delta">${S.quizzesPassed} ${t('skills_verified').toLowerCase()}</div></div>
      </div>
    </div>

    <div class="admin-section story-card">
      <h2>✦ ${t('story_h')}</h2>
      <p class="sect-sub">${t('story_sub')}</p>
      <div id="storyBody">${S.learnStory && S.learnStory.text && S.learnStory.lang === S.lang ? `<p class="story-text">${esc(S.learnStory.text)}</p><button class="link-quiet" data-action="story-gen">${t('story_refresh')}</button>` : `<button class="btn btn-glass btn-sm" data-action="story-gen">${t('story_btn')}</button>`}</div>
    </div>
    ${transferPanelHTML()}
    ${verifiedPanelHTML()}
    ${compliancePanelHTML()}
    ${readinessSectionHTML()}
    ${skillsSectionHTML()}
    ${certsSectionHTML()}
    <div class="admin-section"><h2>🃏 ${t('flash_h')}</h2><p class="sect-sub">${t('flash_sub')}</p>
      ${(S.missedQ || []).length ? `<p class="missed-note">🎯 ${(S.missedQ || []).length} ${t('flash_missed_n')}</p>` : ''}
      <button class="btn btn-glass btn-sm" data-action="flash-open">${t('flash_open')}</button></div>

    <div class="admin-section">
      <h2>${t('badges_h')}</h2>
      <p class="sect-sub">${t('badges_sub')}</p>
      <div class="badge-grid">
        ${BADGES.map(b => { const got = S.badges.includes(b.id); return `
          <div class="badge ${got ? 'got' : 'locked'}">
            <div class="badge-ic">${got ? svgIcon(b.icon) : svgIcon('seed')}</div>
            <div class="badge-t">${tbadge(b, 'title')}</div>
            <div class="badge-d">${got ? tbadge(b, 'desc') : t('locked_dot') + ' ' + tbadge(b, 'desc')}</div>
          </div>`; }).join('')}
      </div>
    </div>

    <div class="admin-section">
      <h2>${t('leaders_board')}</h2>
      <p class="sect-sub">${t('board_sub')}</p>
      <div class="board-scope">
        <button class="rx ${boardScope === 'all' ? 'on' : ''}" data-action="board-scope" data-v="all">${t('board_all')}</button>
        <button class="rx ${boardScope === 'week' ? 'on' : ''}" data-action="board-scope" data-v="week">${t('board_week')}</button>
        ${(S.profile && S.profile.dept) ? `<button class="rx ${boardScope === 'dept' ? 'on' : ''}" data-action="board-scope" data-v="dept">${t('board_dept')} · ${tdept(S.profile.dept)}</button>` : ''}
      </div>
      ${nudge}
      <div class="board">
        ${board.map((r, i) => `
          <div class="board-row ${r.me ? 'me' : ''}">
            <span class="board-rank">${i + 1}</span>
            <span class="mi t-grad-${r.grad}">${r.initials}</span>
            <span class="board-name">${r.name}${r.me ? ` <span class="you-tag">${t('you')}</span>` : ''}</span>
            <span class="board-bar"><span class="fill" style="width:${Math.round(r.xp / maxXp * 100)}%"></span></span>
            <span class="board-xp">${r.xp.toLocaleString()} XP</span>
          </div>`).join('')}
      </div>
    </div>

    <div class="admin-section">
      <h2>${t('your_path_to')} ${tgoal(S.goal)}</h2>
      <p class="sect-sub">${t('path_points')}</p>
      ${pathStepperHTML()}
    </div>
  </div>${footerHTML()}</div>`;
}

/* ---------- real streak — counts actual learning days ---------- */
function bumpStreak() {
  const today = new Date().toDateString();
  if (S.lastActiveDay === today) return;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  S.streak = (S.lastActiveDay === yesterday) ? (S.streak || 0) + 1 : 1;
  if (S.streak > (S.bestStreak || 0)) S.bestStreak = S.streak;
  S.lastActiveDay = today;
  checkBadges(true);
}

/* ---------- daily drop — one 30-second question a day (Axonify pattern) ---------- */
function courseQuizFor(c) {
  const lang = _lang() === 'pt' ? 'pt' : 'en';
  if (COURSE_QUIZ[c.id]) return COURSE_QUIZ[c.id][lang] || COURSE_QUIZ[c.id].en;
  if (c.quiz) return (c.quiz[lang] || c.quiz.en || c.quiz);
  return QUIZ_BANK[c.cat] || QUIZ_BANK._default;
}
function dailyQuestion() {
  const dayKey = new Date().toISOString().slice(0, 10);
  if (S.daily && S.daily.date === dayKey) return { answered: true, correct: S.daily.correct, dayKey };
  const ids = [...new Set([...(S.path || []), ...Object.keys(S.progress || {})])]
    .filter(id => courseById(id) && coursePct(id) > 0);
  if (!ids.length) return null;
  const seed = parseInt(dayKey.replace(/-/g, ''), 10);
  const c = courseById(ids[seed % ids.length]);
  const qs = courseQuizFor(c);
  return { c, q: qs[seed % qs.length], dayKey };
}
function dailyDropHTML() {
  const d = dailyQuestion();
  if (!d) return '';
  if (d.answered) return `<section class="daily done"><div class="daily-head"><span class="daily-ic">🌱</span><div><b>${t('daily_title')}</b><span class="daily-sub">${d.correct ? t('daily_correct') : t('daily_wrong')} · ${t('daily_tomorrow')}</span></div><span class="daily-streak">🔥 ${S.streak || 0} ${t('daily_streak')}</span></div></section>`;
  return `<section class="daily" id="dailyDrop">
    <div class="daily-head"><span class="daily-ic">🌱</span><div><b>${t('daily_title')}</b><span class="daily-sub">${t('daily_sub')} · ${t('daily_from')} ${ctitle(d.c)}</span></div><span class="daily-streak">🔥 ${S.streak || 0} ${t('daily_streak')}</span></div>
    <div class="daily-q">${d.q.q}</div>
    <div class="daily-opts">${d.q.opts.map((o, i) => `<button class="daily-opt" data-action="daily-answer" data-opt="${i}" data-a="${d.q.a}">${o}</button>`).join('')}</div>
  </section>`;
}
function answerDaily(el) {
  const d = dailyQuestion();   /* capture the course before S.daily marks it answered */
  const chosen = +el.dataset.opt, correct = chosen === +el.dataset.a;
  if (correct && d && d.c) ledgerAppend('delayed_retrieval_pass', { courseId: d.c.id, via: 'daily' });
  S.daily = { date: new Date().toISOString().slice(0, 10), correct };
  bumpStreak();
  if (correct) awardXp(10, 'daily question');
  save();
  const box = $('#dailyDrop');
  if (box) {
    box.querySelectorAll('.daily-opt').forEach(b => { b.disabled = true; if (+b.dataset.opt === +b.dataset.a) b.classList.add('right'); });
    el.classList.add(correct ? 'right' : 'wrong');
    setTimeout(() => { const wrap = document.createElement('div'); wrap.innerHTML = dailyDropHTML(); const el2 = $('#dailyDrop'); if (el2 && wrap.firstElementChild) el2.replaceWith(wrap.firstElementChild); }, 1400);
  }
}

/* ================= Nudges & notifications ================= */
function nextLesson() {
  const id = S.path.find(x => !isDone(x)); if (!id) return null;
  const c = courseById(id); if (!c) return null;
  const p = prog(id); const mi = p && !p.done ? (p.mod || 0) : 0;
  return { course: ctitle(c), mod: (cmods(c)[mi] || ''), route: '#/course/' + id };
}
function computeNudges() {
  const out = [];
  const lv = levelFor(S.xp);
  const rank = myRank();
  const nl = nextLesson();
  /* transfer loop: an application check-in is due — the highest-value nudge there is */
  const due = dueApplicationChecks();
  if (due.length) out.push({ id: 'appcheck', icon: '🎯', title: t('nudge_appcheck_t'), body: t('nudge_appcheck_b').replace('{c}', ctitle(courseById(due[0].courseId)) || ''), route: '#/progress' });
  if (rank.total >= 2) {
    if (rank.ahead) out.push({ id: 'board', icon: '🌿', title: t('nudge_board_t'), body: t('nudge_board_b').replace('{name}', rank.ahead.name.split(' ')[0]).replace('{xp}', rank.ahead.xp - S.xp), route: '#/progress' });
    else out.push({ id: 'top', icon: '🌟', title: t('nudge_top_t'), body: t('nudge_top_b'), route: '#/progress' });
  }
  if (lv.next != null && lv.toNext <= 140) out.push({ id: 'level', icon: '🌱', title: t('nudge_level_t'), body: t('nudge_level_b').replace('{xp}', lv.toNext).replace('{lvl}', tlevel(lv.idx + 1)), route: '#/library' });
  if (S.streak > 0) out.push({ id: 'streak', icon: '🔥', title: t('nudge_streak_t').replace('{n}', S.streak), body: t('nudge_streak_b'), route: nl ? nl.route : '#/library' });
  if (nl) out.push({ id: 'lesson', icon: '▶', title: t('nudge_lesson_t'), body: t('nudge_lesson_b').replace('{mod}', nl.mod).replace('{course}', nl.course), route: nl.route });
  const done = CATALOG.filter(c => isDone(c.id)).length;
  if (done === 2 && !(S.badges || []).includes('grove')) out.push({ id: 'badge', icon: '🏅', title: t('nudge_badge_t'), body: t('nudge_badge_b'), route: '#/library' });
  /* spaced repetition — finished courses resurface at 3/7/30-day windows */
  const inWindow = d => (d >= 3 && d <= 4) || (d >= 7 && d <= 9) || (d >= 28 && d <= 34);
  const refresh = Object.entries(S.progress)
    .filter(([id, p]) => p && p.done && p.doneAt && courseById(id))
    .map(([id, p]) => ({ id, days: Math.floor((Date.now() - p.doneAt) / 86400000) }))
    .filter(x => inWindow(x.days))
    .sort((a, b) => a.days - b.days)[0];
  CATALOG.filter(c => c.recertMonths).forEach(c => {
    const rs = recertState(c);
    if (rs && rs.st !== 'ok') out.push({ id: 'recert-' + c.id, icon: '🛡', title: t('nudge_recert_t'), body: t('nudge_recert_b').replace('{course}', ctitle(c)).replace('{when}', rs.st === 'expired' ? t('comp_expired').toLowerCase() : t('comp_expiring').toLowerCase()), route: '#/course/' + c.id });
  });
  if (refresh) out.push({ id: 'refresh', icon: '🌱', title: t('nudge_refresh_t'), body: t('nudge_refresh_b').replace('{course}', ctitle(courseById(refresh.id))).replace('{n}', refresh.days), route: '#/course/' + refresh.id });
  return out.slice(0, 5);
}
function notifPrefs() { return (S.profile && S.profile.notify) || {}; }
function updateBell() {
  const dot = $('#bellDot'); if (!dot) return;
  const seen = sessionStorage.getItem('nudges-seen');
  dot.style.display = (computeNudges().length && !seen) ? 'block' : 'none';
}
function nudgePanelHTML() {
  const ns = computeNudges();
  if (!ns.length) return `<div class="nudge-empty">${t('nudge_empty')}</div>`;
  return `<div class="nudge-head">${(ns.length === 1 ? t('nudge_today_one') : t('nudge_today')).replace('{n}', ns.length)}</div>` + ns.map(n => `<button class="nudge" data-action="goto" data-route="${n.route}">
    <span class="nudge-ic">${n.icon}</span>
    <div class="nudge-txt"><div class="nudge-t">${n.title}</div><div class="nudge-b">${n.body}</div></div>
  </button>`).join('');
}
function openBell() {
  const panel = $('#bellPanel'); if (!panel) return;
  panel.innerHTML = nudgePanelHTML();
  makeFocusable(panel);
  const open = panel.classList.toggle('open');
  if (open) { sessionStorage.setItem('nudges-seen', '1'); updateBell(); }
}
/* browser notifications — a real, no-backend nudge channel */
function fireBrowserNudge() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  const ns = computeNudges(); if (!ns.length) return false;
  const n = ns[0];
  try { new Notification(brandName() + ' · ' + n.title, { body: n.body, icon: 'favicon.svg', tag: 'edenrise-nudge' }); return true; } catch (e) { return false; }
}
function welcomeNudge() {
  if (sessionStorage.getItem('welcomed')) return;
  sessionStorage.setItem('welcomed', '1');
  const ns = computeNudges(); if (!ns.length) return;
  if (notifPrefs().push && !fireBrowserNudge()) { /* permission lost */ }
  const top = ns[0];
  setTimeout(() => toast(`${top.icon} ${top.body}`, '🌱'), 1400);
}
async function toggleNotif(ch) {
  const prof = S.profile = S.profile || {};
  const notify = prof.notify = prof.notify || {};
  if (ch === 'push' && !notify.push) {
    if (!('Notification' in window)) { toast(t('notif_blocked'), '⚠️'); return; }
    let perm = Notification.permission;
    if (perm === 'default') perm = await Notification.requestPermission();
    if (perm !== 'granted') { toast(t('notif_blocked'), '⚠️'); return; }
    notify.push = true; save(); render(); toast(t('notif_on'), '🔔'); fireBrowserNudge();
    return;
  }
  notify[ch] = !notify[ch];
  save(); render();
  /* one-time warm welcome when email nudges turn on — also proves the pipeline */
  if (ch === 'email' && notify.email && mailReady() && prof.email) {
    sendMail({ kind: 'optin', to: prof.email, name: prof.name || '', lang: _lang() })
      .then(r => { if (r.ok) toast(t('mail_optin_sent'), '🌿'); })
      .catch(() => {});
  }
}

/* ================= Community forum ================= */
let commChannel = 'general', commThread = null, commPosts = [], commReplies = [];
let commUnsub = null, commThreadUnsub = null;
const myUid = () => (S.profile && S.profile.uid) || (window.EdenForum && EdenForum.me().authorUid) || null;
const forumCanPost = () => !!(window.EdenForum && EdenForum.canPost());
const showLoginGate = () => document.documentElement.setAttribute('data-gate', 'on');
const COMMUNITY_CHANNELS = [
  { id: 'intro', key: 'ch_intro', icon: 'people' },
  { id: 'general', key: 'ch_general', icon: 'leaf' },
  { id: 'wins', key: 'ch_wins', icon: 'sun' }
];
function channelMeta(id) {
  const cc = COMMUNITY_CHANNELS.find(c => c.id === id);
  if (cc) return { label: t(cc.key), icon: cc.icon };
  const c = courseById(id);
  return c ? { label: ctitle(c), icon: c.icon } : { label: id, icon: 'leaf' };
}
function timeAgo(ts) {
  const v = ts && ts.toMillis ? ts.toMillis() : (ts && ts.seconds ? ts.seconds * 1000 : 0);
  if (!v) return t('comm_just_now');
  const s = Math.floor((Date.now() - v) / 1000);
  if (s < 60) return t('comm_just_now');
  const m = Math.floor(s / 60); if (m < 60) return m + 'm';
  const h = Math.floor(m / 60); if (h < 24) return h + 'h';
  const d = Math.floor(h / 24); if (d < 7) return d + 'd';
  return new Date(v).toLocaleDateString();
}
function channelPillsHTML() {
  const pill = id => {
    const m = channelMeta(id);
    return `<button class="ch-item ${id === commChannel ? 'active' : ''}" data-action="comm-channel" data-ch="${id}">${svgIcon(m.icon)}<span>${m.label}</span></button>`;
  };
  const paths = S.path.map(id => courseById(id)).filter(Boolean).map(c => pill(c.id)).join('');
  return `<div class="comm-pills">${COMMUNITY_CHANNELS.map(c => pill(c.id)).join('')}${paths}
    <button class="ch-item ${commChannel === '__members' ? 'active' : ''}" data-action="comm-channel" data-ch="__members">${svgIcon('people')}<span>${t('comm_members')}</span></button>
  </div>`;
}
const isOnline = m => Date.now() - tsMillis(m.lastSeen) < 150000;
function memberDot(m) { return `<span class="m-ava ${isOnline(m) ? 'online' : ''}" data-action="member-card" data-uid="${m.uid}" title="${esc(m.name || '')}">${esc(m.initials || 'ER')}</span>`; }
function sidebarHTML() {
  const board = (boardCache || []).slice().sort((x, y) => (y.xp || 0) - (x.xp || 0));
  const online = (boardCache || []).filter(isOnline);
  const newest = (boardCache || []).filter(m => m.joinedAt).sort((x, y) => tsMillis(y.joinedAt) - tsMillis(x.joinedAt)).slice(0, 3);
  const live = liveList()[0];
  return `<aside class="comm-pulse">
    <div class="pulse-card">
      <h4>🏆 ${t('comm_top')}</h4>
      ${board.length ? board.slice(0, 5).map((m, i) => `<div class="pulse-row" data-action="member-card" data-uid="${m.uid}"><span class="pr-n">${i + 1}</span>${memberDot(m)}<span class="pr-name">${esc((m.name || '').split(' ')[0])}</span><span class="pr-xp">${m.xp || 0} XP</span></div>`).join('') : `<p class="pulse-empty">${t('comm_no_members')}</p>`}
    </div>
    ${online.length ? `<div class="pulse-card"><h4>🟢 ${t('comm_online')}</h4><div class="pulse-avas">${online.slice(0, 8).map(memberDot).join('')}</div></div>` : ''}
    ${newest.length ? `<div class="pulse-card"><h4>🌱 ${t('comm_newest')}</h4>${newest.map(m => `<div class="pulse-row" data-action="member-card" data-uid="${m.uid}">${memberDot(m)}<span class="pr-name">${esc(m.name || '')}</span></div>`).join('')}</div>` : ''}
    ${live ? `<div class="pulse-card"><h4>📅 ${t('comm_next_live')}</h4><div class="pulse-live" data-action="goto" data-route="#/live"><b>${esc(live.title)}</b><span>${live.live ? '🔴 LIVE' : esc(live.when)}</span></div></div>` : ''}
    <button class="link-quiet" data-action="comm-channel" data-ch="__members" style="padding:4px 6px;">${t('comm_all_members')}</button>
  </aside>`;
}
function membersDirHTML() {
  const list = (boardCache || []).slice().sort((x, y) => (isOnline(y) - isOnline(x)) || (y.xp || 0) - (x.xp || 0));
  if (!list.length) return `<div class="empty-note">${t('comm_no_members')}</div>`;
  return `<div class="members-grid">${list.map(m => `
    <div class="member-tile" data-action="member-card" data-uid="${m.uid}">
      ${memberDot(m)}
      <div class="mt-info"><b>${esc(m.name || 'Learner')}</b>${m.username ? `<span class="post-handle">@${esc(m.username)}</span>` : ''}
      <span class="mt-meta">${levelFor(m.xp || 0) ? tlevel(levelFor(m.xp || 0).idx) : ''} · ${m.xp || 0} XP · 🔥${m.streak || 0}</span></div>
      ${isOnline(m) ? `<span class="mt-on">● ${t('comm_online')}</span>` : ''}
    </div>`).join('')}</div>`;
}
const mentions = html => html.replace(/(^|[\s>])@([a-z0-9][a-z0-9_.-]{1,24})/gi, '$1<span class="mention" data-action="member-card" data-handle="$2">@$2</span>');
const canModerate = p => { const me = myUid(); return !!me && (p.authorUid === me || isAdmin()); };
const tsMillis = ts => ts && ts.toMillis ? ts.toMillis() : (ts && ts.seconds ? ts.seconds * 1000 : (typeof ts === 'number' ? ts : 0));
/* smart embeds: image URLs render, YouTube/Vimeo become playable, links clickable */
function richBody(text) {
  let h = esc(text || '');
  h = h.replace(/(https?:\/\/[^\s<]+\.(?:png|jpe?g|gif|webp)(?:\?[^\s<]*)?)/gi, '\n<img class="post-img" loading="lazy" src="$1">\n');
  h = h.replace(/(?:https?:\/\/)(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})[^\s<]*/gi, '\n<div class="post-embed" data-action="embed-play" data-embed="yt:$1"><span class="pe-play">\u25b6</span><span>YouTube</span></div>\n');
  h = h.replace(/(?:https?:\/\/)(?:www\.)?vimeo\.com\/(\d+)[^\s<]*/gi, '\n<div class="post-embed" data-action="embed-play" data-embed="vm:$1"><span class="pe-play">\u25b6</span><span>Vimeo</span></div>\n');
  h = h.replace(/(^|[\s])(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener" class="post-link">$2</a>');
  return mentions(h).replace(/\n/g, '<br>');
}
const REACTS = ['\ud83c\udf31', '\ud83d\udd25', '\ud83d\ude4c', '\ud83d\udca1'];
function reactionRowHTML(p) {
  const me = myUid();
  const rx = p.reactions || {};
  const chips = REACTS.filter(e => (rx[e] || []).length).map(e =>
    `<button class="rx ${me && rx[e].includes(me) ? 'on' : ''}" data-action="comm-react" data-id="${p.id}" data-emoji="${e}">${e} ${rx[e].length}</button>`).join('');
  return chips + `<span class="rx-add" data-action="comm-react-pick" data-id="${p.id}">\u263a+<span class="rx-picker">${REACTS.map(e => `<button class="rx-opt" data-action="comm-react" data-id="${p.id}" data-emoji="${e}">${e}</button>`).join('')}</span></span>`;
}
function pollHTML(p) {
  if (!p.poll || !Array.isArray(p.poll.options)) return '';
  const votes = p.poll.votes || {};
  const me = myUid();
  const counts = p.poll.options.map((_, i) => Object.values(votes).filter(v => v === i).length);
  const total = counts.reduce((x, y) => x + y, 0) || 0;
  return `<div class="poll">${p.poll.options.map((opt, i) => {
    const pct = total ? Math.round(counts[i] / total * 100) : 0;
    const mine = me && votes[me] === i;
    return `<button class="poll-opt ${mine ? 'mine' : ''}" data-action="comm-vote" data-id="${p.id}" data-opt="${i}">
      <span class="poll-bar" style="width:${pct}%"></span>
      <span class="poll-label">${esc(opt)}</span><span class="poll-pct">${pct}%</span>
    </button>`;
  }).join('')}<div class="poll-total">${total} ${t('comm_poll_votes')}</div></div>`;
}
function postCardHTML(p) {
  const liked = p.likedBy && myUid() && p.likedBy.includes(myUid());
  const isDisc = p.kind === 'discussion' && p.title;
  const rc = p.replyCount || 0;
  return `<article class="post ${isDisc ? 'is-disc' : ''} ${p.pinned ? 'pinned' : ''}"${isDisc ? ` data-action="comm-open" data-id="${p.id}"` : ''}>
    <div class="post-av" data-action="member-card" data-handle="${esc(p.authorHandle || '')}">${esc(p.authorInitials || 'ER')}</div>
    <div class="post-main">
      <div class="post-head">${p.official ? `<span class="off-badge">✦ ${brandName()} · ${t('comm_official')}</span>` : ''}${p.pinned ? `<span class="pin-badge">\ud83d\udccc ${t('comm_pinned')}</span>` : ''}<b>${esc(p.authorName || 'Learner')}</b>${p.authorHandle ? `<span class="post-handle" data-action="member-card" data-handle="${esc(p.authorHandle)}">@${esc(p.authorHandle)}</span>` : ''}<span class="post-time">\u00b7 ${timeAgo(p.createdAt)}</span></div>
      ${isDisc ? `<div class="post-title">${esc(p.title)}</div>` : ''}
      <div class="post-body">${richBody(p.body)}</div>
      ${pollHTML(p)}
      <div class="post-foot">
        <button class="post-act ${liked ? 'liked' : ''}" data-action="comm-like" data-id="${p.id}">\u2665 <span>${p.likes || 0}</span></button>
        ${reactionRowHTML(p)}
        ${isDisc ? `<span class="post-act soft">\ud83d\udcac ${rc} ${rc === 1 ? t('comm_reply_one') : t('comm_replies')}</span>` : ''}
        ${isAdmin() ? `<button class="post-act" data-action="comm-pin" data-id="${p.id}">\ud83d\udccc ${p.pinned ? t('comm_unpin') : t('comm_pin')}</button>` : ''}
        ${canModerate(p) ? `<button class="post-act danger" data-action="comm-del" data-id="${p.id}">\u2715 ${t('comm_delete')}</button>` : ''}
      </div>
    </div>
  </article>`;
}
function replyHTML(r, postId) {
  const liked = r.likedBy && myUid() && r.likedBy.includes(myUid());
  return `<div class="reply">
    <div class="post-av sm" data-action="member-card" data-handle="${esc(r.authorHandle || '')}">${esc(r.authorInitials || 'ER')}</div>
    <div class="post-main">
      <div class="post-head"><b>${esc(r.authorName || 'Learner')}</b>${r.authorHandle ? `<span class="post-handle" data-action="member-card" data-handle="${esc(r.authorHandle)}">@${esc(r.authorHandle)}</span>` : ''}<span class="post-time">\u00b7 ${timeAgo(r.createdAt)}</span></div>
      <div class="post-body">${richBody(r.body)}</div>
      <div class="post-foot">
        <button class="post-act sm ${liked ? 'liked' : ''}" data-action="comm-rlike" data-id="${postId}" data-rid="${r.id}">\u2665 <span>${r.likes || 0}</span></button>
        ${canModerate(r) ? `<button class="post-act sm danger" data-action="comm-rdel" data-id="${postId}" data-rid="${r.id}">\u2715 ${t('comm_delete')}</button>` : ''}
      </div>
    </div>
  </div>`;
}
function composerHTML(isReply) {
  if (!forumCanPost()) return `<div class="comm-signin"><span>\ud83c\udf31 ${t('comm_signin_post')}</span><button class="btn btn-primary btn-sm" data-action="show-login">${t('prof_signin')}</button></div>`;
  const me = EdenForum.me();
  if (isReply) {
    return `<div class="composer reply-composer">
      <div class="post-av sm">${esc(me.authorInitials)}</div>
      <div class="composer-body">
        <textarea id="commReplyBox" class="comm-input" rows="1" placeholder="${t('comm_msg_ph')}"></textarea>
        <button class="btn btn-primary btn-sm" data-action="comm-reply">${t('comm_send')}</button>
      </div>
    </div>`;
  }
  return `<div class="composer">
    <div class="post-av sm">${esc(me.authorInitials)}</div>
    <div class="composer-body">
      <input id="commTitle" class="comm-input title" maxlength="120" placeholder="${t('comm_title_ph')}">
      <textarea id="commBody" class="comm-input" rows="2" placeholder="${t('comm_body_ph')}"></textarea>
      <div id="pollBuilder" class="poll-builder" style="display:none;">
        <input class="comm-input" maxlength="60" placeholder="${t('comm_poll_opt')} 1">
        <input class="comm-input" maxlength="60" placeholder="${t('comm_poll_opt')} 2">
        <input class="comm-input" maxlength="60" placeholder="${t('comm_poll_opt')} 3 (optional)">
      </div>
      <div class="composer-foot"><button class="link-quiet" style="padding:0;" data-action="comm-poll-toggle">${t('comm_add_poll')}</button><span style="flex:1"></span><button class="btn btn-primary btn-sm" data-action="comm-post">${t('comm_post')}</button></div>
    </div>
  </div>`;
}
function renderCommunity() {
  let main;
  if (commChannel === '__members') {
    main = `<div class="comm-main"><div class="comm-head"><span class="comm-ch-ic">${svgIcon('people')}</span><div><h2>${t('comm_members')}</h2><span class="comm-ch-sub">${t('comm_title')}</span></div></div>${membersDirHTML()}</div>`;
  } else if (commThread) {
    const p = commPosts.find(x => x.id === commThread) || {};
    main = `<div class="comm-main">
      <button class="comm-back" data-action="comm-back">← ${t('comm_back')}</button>
      <div id="commThreadHead">${p.id ? postCardHTML(p) : ''}</div>
      <div class="thread-replies" id="commReplies"></div>
      ${composerHTML(true)}
    </div>`;
  } else {
    main = `<div class="comm-main">
      ${composerHTML(false)}
      <div class="comm-feed" id="commFeed">${'<div class="post skel-post"><div class="skel av"></div><div style="flex:1"><div class="skel" style="width:38%"></div><div class="skel" style="width:82%;margin-top:8px"></div></div></div>'.repeat(3)}</div>
    </div>`;
  }
  return `<div class="page"><div class="page-pad">
    <h1 class="page-title">${t('comm_title')}</h1>
    <p class="page-sub">${t('comm_sub')}</p>
    ${channelPillsHTML()}
    <div class="comm-wrap2">
      ${main}
      ${sidebarHTML()}
    </div>
  </div></div>`;
}
function showMemberCard(el) {
  document.querySelectorAll('.member-card-pop').forEach(x => x.remove());
  const uid = el.dataset.uid, handle = (el.dataset.handle || '').toLowerCase();
  const m = (boardCache || []).find(x => (uid && x.uid === uid) || (handle && (x.username || '').toLowerCase() === handle));
  if (!m) return;
  const lv = levelFor(m.xp || 0);
  const card = document.createElement('div');
  card.className = 'member-card-pop';
  card.innerHTML = `<div class="mc-head"><span class="m-ava lg ${isOnline(m) ? 'online' : ''}">${esc(m.initials || 'ER')}</span>
    <div><b>${esc(m.name || 'Learner')}</b>${m.username ? `<span class="post-handle">@${esc(m.username)}</span>` : ''}</div></div>
    <div class="mc-stats"><span>${tlevel(lv.idx)} · Lv ${lv.idx + 1}</span><span>${m.xp || 0} XP</span><span>🔥 ${m.streak || 0}</span></div>
    ${m.joinedAt ? `<div class="mc-since">${t('comm_member_since')} ${new Date(tsMillis(m.joinedAt)).toLocaleDateString(_lang() === 'pt' ? 'pt-PT' : 'en-GB', { month: 'long', year: 'numeric' })}</div>` : ''}
    ${isOnline(m) ? `<div class="mc-on">● ${t('comm_online')}</div>` : ''}`;
  document.body.appendChild(card);
  const r = el.getBoundingClientRect();
  card.style.left = Math.min(innerWidth - 250, Math.max(10, r.left)) + 'px';
  card.style.top = Math.min(innerHeight - 170, r.bottom + 8) + 'px';
  setTimeout(() => document.addEventListener('click', function h(e) { if (!card.contains(e.target)) { card.remove(); document.removeEventListener('click', h); } }), 50);
}
function teardownCommunity() { if (commUnsub) { commUnsub(); commUnsub = null; } if (commThreadUnsub) { commThreadUnsub(); commThreadUnsub = null; } }
function paintFeed() { const f = $('#commFeed'); if (!f) return; const ordered = [...commPosts].sort((a, b) => (!!b.pinned) - (!!a.pinned)); f.innerHTML = ordered.length ? ordered.map(postCardHTML).join('') : `<div class="empty-note">${t('comm_empty')}</div>`; makeFocusable(f); }
function paintThreadHead() { const h = $('#commThreadHead'); if (!h) return; const p = commPosts.find(x => x.id === commThread); if (p) h.innerHTML = postCardHTML(p); }
function paintReplies() { const r = $('#commReplies'); if (!r) return; r.innerHTML = commReplies.length ? commReplies.map(x => replyHTML(x, commThread)).join('') : `<div class="empty-note">${t('comm_empty_replies')}</div>`; makeFocusable(r); }
function initCommunity(retries) {
  teardownCommunity();
  if (commChannel === '__members') return;
  if (!window.EdenForum) {
    /* auth.js loads as a deferred module — it may not be ready at first paint. Poll briefly. */
    if ((retries || 0) < 24 && location.hash.indexOf('#/community') === 0) { setTimeout(() => initCommunity((retries || 0) + 1), 250); return; }
    const f = $('#commFeed') || $('#commReplies'); if (f) f.innerHTML = `<div class="empty-note">${_lang() === 'pt' ? 'A comunidade precisa de ligação à Internet.' : 'The community needs an internet connection.'}</div>`;
    return;
  }
  if (commThread) {
    commUnsub = EdenForum.subscribeChannel(commChannel, posts => { commPosts = posts; paintThreadHead(); });
    commThreadUnsub = EdenForum.subscribeThread(commThread, reps => { commReplies = reps; paintReplies(); });
  } else {
    commUnsub = EdenForum.subscribeChannel(commChannel, posts => { commPosts = posts; paintFeed(); });
  }
}
function submitPost() {
  if (!forumCanPost()) return showLoginGate();
  const title = ($('#commTitle') && $('#commTitle').value || '').trim();
  const body = ($('#commBody') && $('#commBody').value || '').trim();
  if (!body) return;
  let poll = null;
  const pb = $('#pollBuilder');
  if (pb && pb.style.display !== 'none') {
    const opts = [...pb.querySelectorAll('input')].map(i => i.value.trim()).filter(Boolean);
    if (opts.length >= 2) poll = { options: opts.slice(0, 4), votes: {} };
  }
  EdenForum.createPost({ channel: commChannel, kind: title ? 'discussion' : 'message', title, body, poll })
    .then(() => { if ($('#commTitle')) $('#commTitle').value = ''; if ($('#commBody')) $('#commBody').value = ''; toast(t('comm_posted'), '🌿'); })
    .catch(() => toast(_lang() === 'pt' ? 'Não foi possível publicar' : 'Could not post', '⚠️'));
}
function submitReply() {
  if (!forumCanPost()) return showLoginGate();
  const body = ($('#commReplyBox') && $('#commReplyBox').value || '').trim();
  if (!body || !commThread) return;
  EdenForum.addReply(commThread, body).then(() => { if ($('#commReplyBox')) $('#commReplyBox').value = ''; }).catch(() => toast(_lang() === 'pt' ? 'Não foi possível publicar' : 'Could not post', '⚠️'));
}

function renderProfile() {
  const p = S.profile || {};
  const isGuest = !p.uid;
  const notify = notifPrefs();
  const lv = levelFor(S.xp);
  const doneCount = CATALOG.filter(c => isDone(c.id)).length;
  const providerLabel = p.provider === 'google.com' ? 'Google' : p.provider === 'password' ? 'Email' : (p.provider || '');
  const roleOpts = ROLE_OPTIONS.map(r => `<option value="${r.key}" ${S.role === r.key ? 'selected' : ''}>${trole(r)}</option>`).join('');
  const goalOpts = Object.keys(GOAL_PRESETS).map(g => `<option value="${g}" ${S.goal === g ? 'selected' : ''}>${tgoal(g)}</option>`).join('');
  return `<div class="page"><div class="page-pad">
    <h1 class="page-title">${t('prof_title')}</h1>
    <p class="page-sub">${t('prof_sub')}</p>
    ${isGuest ? `<div class="prof-guest">🌱 <span>${t('prof_guest')}</span><button class="btn btn-primary btn-sm" data-action="show-login">${t('prof_signin')}</button></div>` : ''}
    <div class="prof-card">
      <div class="prof-avatar ${p.photo ? 'has-photo' : ''}"${p.photo ? ` style="background-image:url('${esc(p.photo)}')"` : ''}>${p.photo ? '' : userInitials()}</div>
      <div class="prof-id">
        <div class="prof-name">${esc(displayName())}${isAdmin() ? ' <span class="admin-badge">Admin</span>' : ''}</div>
        <div class="prof-handle">${userHandle() ? '@' + esc(userHandle()) : '—'}</div>
        <div class="prof-meta">${isGuest ? (_lang() === 'pt' ? 'Conta de convidado' : 'Guest account') : esc(p.email || '')}${providerLabel ? ` · ${t('prof_via')} ${providerLabel}` : ''}</div>
      </div>
      <div class="prof-lvl"><div class="lv-num">${t('level_ab')} ${lv.idx + 1}</div><div class="lv-name">${tlevel(lv.idx)}</div><div class="prof-xp">${S.xp.toLocaleString()} XP</div></div>
    </div>
    <div class="prof-stats">
      <div class="stat"><div class="num">${doneCount}</div><div class="lbl">${t('courses_finished')}</div></div>
      <div class="stat"><div class="num">${S.badges.length}</div><div class="lbl">${t('badges_earned')}</div></div>
      <div class="stat"><div class="num">${S.streak}d</div><div class="lbl">${t('learning_streak')}</div></div>
      <div class="stat"><div class="num">${S.quizzesPassed}</div><div class="lbl">${t('skills_verified')}</div></div>
    </div>
    <div class="admin-section">
      <h2>${t('prof_edit')}</h2>
      <div class="prof-form">
        <label>${t('prof_name')}<input class="auth-input" id="pfName" value="${esc(displayName())}"></label>
        <label>${t('prof_username')}<div class="ob-handle"><span>@</span><input class="ob-input" id="pfUser" maxlength="20" value="${esc(userHandle())}" placeholder="${suggestHandle()}"></div></label>
        <label>${t('prof_role')}<select class="auth-input" id="pfRole"><option value="">—</option>${roleOpts}</select></label>
        <label>${t('dept_label')}<select class="auth-input" id="pfDept"><option value="">${t('dept_none')}</option>${DEPTS.map(d => `<option value="${d.key}" ${(S.profile && S.profile.dept) === d.key ? 'selected' : ''}>${tdept(d.key)}</option>`).join('')}</select></label>
        <label>${t('prof_nif')}<input class="auth-input" id="pfNif" inputmode="numeric" maxlength="9" value="${esc((S.profile && S.profile.nif) || '')}" placeholder="123456789"></label>
        <label>${t('prof_empno')}<input class="auth-input" id="pfEmpNo" value="${esc((S.profile && S.profile.employeeNo) || '')}"></label>
        <label>${t('prof_contract')}<select class="auth-input" id="pfContract">${[['permanent','contract_permanent'],['fixed_term','contract_fixed'],['part_time','contract_part']].map(([v,k])=>`<option value="${v}" ${(S.profile && S.profile.contractType)===v?'selected':''}>${t(k)}</option>`).join('')}</select></label>
        <label>${t('prof_fte')}<select class="auth-input" id="pfFte">${[['1',t('fte_full')],['0.5',t('fte_half')]].map(([v,l])=>`<option value="${v}" ${String((S.profile && S.profile.fte)!=null?S.profile.fte:1)===v?'selected':''}>${l}</option>`).join('')}</select></label>
        <label>${t('prof_hire')}<input class="auth-input" id="pfHire" type="date" value="${esc((S.profile && S.profile.hireDate) || '')}"></label>
        <label>${t('prof_goal')}<select class="auth-input" id="pfGoal">${goalOpts}</select></label>
      </div>
      <button class="btn btn-primary" data-action="save-profile" style="margin-top:16px;">${t('prof_save')}</button>
    </div>
    <div class="admin-section">
      <h2>${t('notif_title')}</h2>
      <p class="sect-sub">${t('notif_sub')}</p>
      <div class="notif-row"><div class="notif-info"><b>${t('notif_browser')}</b><span>${t('notif_browser_d')}</span></div><div class="toggle ${notify.push ? 'on' : ''}" data-action="notif-toggle" data-ch="push" role="switch" aria-checked="${notify.push ? 'true' : 'false'}" tabindex="0"></div></div>
      <div class="notif-row"><div class="notif-info"><b>${t('notif_email')}</b><span>${t('notif_email_d')}${mailReady() ? '' : ` · <em>${t('notif_soon')}</em>`}</span></div><div class="toggle ${notify.email ? 'on' : ''}" data-action="notif-toggle" data-ch="email" role="switch" aria-checked="${notify.email ? 'true' : 'false'}" tabindex="0"></div></div>
      <div class="notif-row"><div class="notif-info"><b>${t('notif_whatsapp')}</b><span>${t('notif_whatsapp_d')} · <em>${t('notif_soon')}</em></span></div><div class="toggle ${notify.whatsapp ? 'on' : ''}" data-action="notif-toggle" data-ch="whatsapp" role="switch" aria-checked="${notify.whatsapp ? 'true' : 'false'}" tabindex="0"></div></div>
      ${notify.whatsapp ? `<input class="auth-input" id="pfPhone" placeholder="${t('notif_phone_ph')}" value="${esc(p.phone || '')}" style="margin-top:12px;max-width:300px;">` : ''}
    </div>
    <div class="admin-section">
      <h2>🔒 ${t('trust_title')}</h2>
      <p class="sect-sub">${t('trust_sub')}</p>
      <ul class="trust-list">
        <li>👁 ${t('trust_sees')}</li>
        <li>📚 ${t('trust_grounded')}</li>
        <li>🤝 ${t('trust_visible')}</li>
        <li>🧠 ${t('trust_thinking')}</li>
      </ul>
      <details class="trust-peek">
        <summary>👁 ${t('trust_peek')}</summary>
        <ul class="trust-list">${aiKnowsLines().map(l => `<li>${l}</li>`).join('')}</ul>
        <p class="sect-sub" style="margin-top:8px;">${t('trust_peek_note')}</p>
      </details>
    </div>
    <div class="admin-section">
      <h2>${t('gdpr_title')}</h2>
      <p class="sect-sub">${t('gdpr_sub')}${isGuest ? ' ' + t('gdpr_guest_note') : ''}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-glass" data-action="gdpr-export">⤓ ${t('gdpr_export')}</button>
        <button class="btn btn-glass danger-btn" data-action="gdpr-delete">✕ ${t('gdpr_delete')}</button>
      </div>
    </div>
    ${isGuest ? '' : `<button class="btn btn-glass" data-action="signout" style="margin-top:20px;">${t('prof_signout')}</button>`}
  </div>${footerHTML()}</div>`;
}
/* inspectable memory — literally the data points buildTutorSystem feeds the AI, human-readable */
function aiKnowsLines() {
  const lines = [];
  lines.push(`${t('knows_name')}: ${esc(displayName())}${S.role ? ' · ' + esc(S.role) : ''}`);
  if (S.goal) lines.push(`${t('knows_goal')}: “${esc(S.goal)}”`);
  const pathBits = S.path.map(x => { const c = courseById(x); return c ? `${esc(ctitle(c))} (${isDone(x) ? '✓' : coursePct(x) + '%'})` : ''; }).filter(Boolean);
  if (pathBits.length) lines.push(`${t('knows_path')}: ${pathBits.join(' · ')}`);
  const id = currentCourseId(); const c = id && courseById(id);
  if (c) lines.push(`${t('knows_open')}: ${esc(ctitle(c))}`);
  lines.push(`${t('knows_stats')}: ${S.streak || 0}🔥 · ${S.xp || 0} XP · ${S.quizzesPassed || 0} ${t('knows_quizzes')}`);
  return lines;
}
function exportMyData() {
  const data = { exportedAt: new Date().toISOString(), app: brandAcademy(), profile: S.profile || {}, goal: S.goal, role: S.role, path: S.path, progress: S.progress, xp: S.xp, badges: S.badges, streak: S.streak, quizzesPassed: S.quizzesPassed, notes: S.notes, lang: S.lang, ratings: S.ratings || {}, coachDone: S.coachDone || {}, notify: (S.profile || {}).notify || {} };
  delete data.profile.notify;
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = 'edenrise-my-data.json'; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  toast(t('gdpr_exported'), '⤓');
}
async function deleteMyAccount() {
  const typed = prompt(t('gdpr_delete_warn'));
  if (typed !== 'DELETE') return;
  const isGuest = !(S.profile && S.profile.uid);
  if (isGuest || !(window.EdenCloud && EdenCloud.deleteAccount)) {
    localStorage.removeItem('edenrise-state-v2'); localStorage.removeItem('eden-auth-mode');
    toast(t('gdpr_deleted'), '🌿'); setTimeout(() => location.reload(), 900); return;
  }
  try {
    await EdenCloud.deleteAccount();
    toast(t('gdpr_deleted'), '🌿');
  } catch (e) {
    if (String(e && e.code).includes('requires-recent-login')) toast(t('gdpr_recent_login'), 'ℹ️');
    else toast(t('mail_failed'), '⚠️');
  }
}
function saveProfile() {
  const name = ($('#pfName').value || '').trim();
  const user = slugHandle($('#pfUser').value);
  const role = $('#pfRole').value;
  const goal = $('#pfGoal').value;
  const phone = $('#pfPhone') ? $('#pfPhone').value.trim() : ((S.profile && S.profile.phone) || '');
  const dept = $('#pfDept') ? $('#pfDept').value : ((S.profile && S.profile.dept) || '');
  const legal = {
    nif: ($('#pfNif') && $('#pfNif').value || '').replace(/\D/g, '').slice(0, 9),
    employeeNo: ($('#pfEmpNo') && $('#pfEmpNo').value || '').trim(),
    contractType: ($('#pfContract') && $('#pfContract').value) || 'permanent',
    fte: $('#pfFte') ? +$('#pfFte').value : 1,
    hireDate: ($('#pfHire') && $('#pfHire').value) || ''
  };
  S.profile = Object.assign({}, S.profile, { name: name || displayName(), username: user, role, phone, dept }, legal);
  if (role) S.role = role;
  if (goal && goal !== S.goal) { S.goal = goal; S.path = [...GOAL_PRESETS[goal]]; }
  save();
  if (window.EdenCloud && window.EdenCloud.updateName) window.EdenCloud.updateName(name);
  EdenApp.applyProfile(S.profile);
  updateXpChip(); render();
  toast(t('prof_saved'), '✓');
}

/* ---------- router ---------- */
const routes = { home: renderHome, library: renderLibrary, paths: renderPaths, live: renderLive, progress: renderProgress, analytics: renderAnalytics, admin: renderAdmin, profile: renderProfile, community: renderCommunity };
/* a11y: make clickable non-native elements keyboard-operable */
function makeFocusable(root) {
  (root || document).querySelectorAll('[data-action]').forEach(el => {
    if (/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
  });
}
function render() {
  const hash = location.hash || '#/home';
  const [, route, param] = hash.split('/');
  if ((route === 'analytics' || route === 'admin') && !isAdmin()) { location.hash = '#/home'; return; }
  /* overlay hygiene — a stuck full-screen layer must never block the app */
  const takeM = $('#takeModal'); if (takeM && takeM.classList.contains('open') && !pendingNext) takeM.classList.remove('open');
  document.querySelectorAll('.levelup').forEach(el => el.remove());
  $$('.nav-links a, .mobile-drawer a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#/${route}`));
  syncChrome();
  if (route !== 'community') teardownCommunity();
  $('#app').innerHTML = route === 'course' ? renderCourse(param) : route === 'journey' ? renderJourney(param) : (routes[route] || renderHome)();
  makeFocusable($('#app'));
  lazyBackgrounds();
  if (route === 'community') initCommunity();
  if (route === 'admin' && isAdmin()) initAdmin();
  if (route === 'progress' && boardCache === null) initBoard();
  if (route === 'progress') paintLedgerCheck();
  maybeTour();
  if (route === 'community') initBoard();
  window.scrollTo({ top: 0, behavior: 'instant' });
  const libInput = $('#libSearch');
  if (libInput) {
    libInput.oninput = e => {
      libQuery = e.target.value;
      const tmp = document.createElement('div');
      tmp.innerHTML = renderLibrary();
      const newGrid = tmp.querySelector('.grid');
      const oldGrid = $('#app .grid');
      if (newGrid && oldGrid) oldGrid.innerHTML = newGrid.innerHTML;
    };
  }
  initMotion();
}
/* covers download only as their cards approach the viewport (~1.4MB saved on Library) */
const loadBg = el => { el.style.backgroundImage = `url('${el.dataset.bg}')`; el.removeAttribute('data-bg'); };
let ioEverFired = false;
const bgObserver = ('IntersectionObserver' in window) ? new IntersectionObserver(entries => {
  ioEverFired = true;
  entries.forEach(e => { if (e.isIntersecting) { loadBg(e.target); bgObserver.unobserve(e.target); } });
}, { rootMargin: '400px' }) : null;
function lazyBackgrounds() {
  const els = [...document.querySelectorAll('.thumb[data-bg]')];
  els.slice(0, 8).forEach(loadBg);                 /* above the fold: instant */
  const rest = els.slice(8);
  if (!bgObserver) { rest.forEach(loadBg); return; }
  rest.forEach(el => bgObserver.observe(el));
  clearTimeout(lazyBackgrounds._t);
  lazyBackgrounds._t = setTimeout(() => {          /* observer broken? load everything (old behavior) */
    if (!ioEverFired) document.querySelectorAll('.thumb[data-bg]').forEach(loadBg);
  }, 2500);
}
addEventListener('hashchange', render);

/* ---------- language (EN / PT) ---------- */
const NAV_KEYS = { '#/home': 'nav_home', '#/library': 'nav_library', '#/paths': 'nav_paths', '#/community': 'nav_community', '#/live': 'nav_live', '#/progress': 'nav_progress', '#/analytics': 'nav_analytics', '#/admin': 'nav_admin' };
function syncChrome() {
  $$('.nav-links a, .mobile-drawer a').forEach(a => { const k = NAV_KEYS[a.getAttribute('href')]; if (k) a.textContent = t(k); });
  const search = $('#navSearch'); if (search) search.innerHTML = `⌕&nbsp; ${t('search_ph')} <kbd>⌘K</kbd>`;
  const org = $('#orgChip'); if (org) org.innerHTML = `<span class="org-dot"></span>${brandName()} · ${BRAND.wordSub || 'Academy'}`;
  const tn = $('#aiTitle'); if (tn) tn.textContent = t('tutor_name');
  /* AI Act Art. 50: people must know they are talking to AI — said plainly, always visible */
  const td = $('#aiDisclosure'); if (td) td.textContent = t('tutor_ai_note');
  $$('.quick-row .quick[data-tk]').forEach(b => { b.textContent = t(b.dataset.tk); });
  const inp = $('#aiInput'); if (inp) inp.placeholder = t('ask_anything');
  const stEl = $('#tutorStatus'); if (stEl && !aiKey()) stEl.textContent = t('tutor_demo');
  const tsTitle = $('#tutorSettings .ts-title'); if (tsTitle) tsTitle.textContent = t('connect_ai');
  const tsNote = $('#tutorSettings .ts-note'); if (tsNote) tsNote.textContent = t('api_note');
  const sv = $('#apiKeySave'); if (sv) sv.textContent = t('save');
  const cl = $('#apiKeyClear'); if (cl) cl.textContent = t('use_demo');
  const askBtn = document.querySelector('.player-top .btn[data-action="ai-open"]'); if (askBtn) askBtn.textContent = t('ask_tutor');
  const nt = $('#notesToggle'); if (nt) nt.textContent = t('notes_transcript');
  const pc = $('#playerComplete'); if (pc) pc.textContent = t('mark_complete');
  $$('.lang-btn').forEach(b => { const on = b.dataset.lang === _lang(); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  document.documentElement.classList.toggle('is-admin', isAdmin());
  updateBell();
  document.documentElement.lang = _lang();
}
function setLang(l) {
  if (l === S.lang) return;
  S.lang = l; save(); render();
  const st = $('#tutorStatus'); if (st && st.textContent.includes('Demo') || st && st.textContent.includes('demo')) st.textContent = t('tutor_demo');
  const ai = $('#aiPanel'); if (ai) { const inp = $('#aiInput'); if (inp) inp.placeholder = t('ask_anything'); }
  if (tutorPanel && tutorPanel.classList.contains('open')) { const m = $('#aiMsgs'); if (m) m.innerHTML = ''; tutorHistory = []; tutorGreet(); }
}
/* EAA/a11y: every focusable action element activates with Enter/Space, not
   just clicks — one delegated handler instead of per-element wiring. */
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target;
  if (el && el.getAttribute && el.getAttribute('tabindex') === '0'
      && (el.dataset.action || el.dataset.ck !== undefined || el.classList.contains('q-opt') || el.getAttribute('role') === 'button')) {
    e.preventDefault(); el.click();
  }
});
document.addEventListener('click', e => { const lb = e.target.closest('.lang-btn'); if (lb) setLang(lb.dataset.lang); });

/* ---------- GSAP motion (graceful + never leaves content hidden) ---------- */
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const BLOCK_SEL = '.hero-content > *, .hero-side, .pillar, .rail-section, .path-banner, .stats, .module-list, .admin-section, .chart-card, .live-card, .two-col';
function forceVisible() {
  document.querySelectorAll(BLOCK_SEL).forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
}
/* GSAP loads on demand — desktop only, never on phones (bandwidth + battery) */
let motionLibsState = 0; /* 0 none · 1 loading · 2 ready */
function loadMotionLibs() {
  if (motionLibsState || innerWidth <= 1024 || reduceMotion) return;
  motionLibsState = 1;
  const add = s => new Promise(r => { const el = document.createElement('script'); el.src = s; el.onload = r; el.onerror = r; document.head.appendChild(el); });
  add('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js')
    .then(() => add('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js'))
    .then(() => { motionLibsState = 2; initMotion(); });
}
let _motionRoute = null;
function initMotion() {
  const G = window.gsap;
  if (!G) { forceVisible(); loadMotionLibs(); return; }
  if (reduceMotion) { forceVisible(); return; }
  /* Only play entrance animations on a genuine ROUTE CHANGE. On same-route
     re-renders (async cloud data → render()), NEVER re-hide content — else
     gsap.from() re-sets opacity:0 and an interrupted tween leaves the hero /
     featured program blank. */
  const _r = (location.hash || '#/home').split('/')[1] || 'home';
  if (_r === _motionRoute) { forceVisible(); return; }
  _motionRoute = _r;
  const ST = window.ScrollTrigger;
  if (ST) { G.registerPlugin(ST); ST.getAll().forEach(t => t.kill()); }

  /* hero entrance — headline, meta, actions, side panel */
  const hero = $('.hero-content');
  if (hero) {
    const tl = G.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero-eyebrow', { y: 18, opacity: 0, duration: .6 })
      .from('.hero h1', { y: 28, opacity: 0, duration: .9 }, '-=.35')
      .from('.hero-meta > *', { y: 14, opacity: 0, stagger: .05, duration: .5 }, '-=.5')
      .from('.hero p.desc', { y: 18, opacity: 0, duration: .6 }, '-=.4')
      .from('.hero-actions .btn', { y: 16, opacity: 0, stagger: .07, duration: .5 }, '-=.4')
      .from('.hero-progress', { opacity: 0, duration: .6 }, '-=.3')
      .from('.hero-side', { x: 26, opacity: 0, duration: .8 }, '-=.9');
    /* safety: if frames are throttled (background tab), jump to the end */
    setTimeout(() => { try { if (tl.progress() < 1) tl.progress(1); } catch (e) {} }, 2200);
  }

  if (ST) {
    G.from('.pillar', { y: 14, opacity: 0, stagger: .06, duration: .6, ease: 'power2.out',
      scrollTrigger: { trigger: '.pillars', start: 'top 95%', once: true } });
    G.utils.toArray('.rail-section, .path-banner, .stats, .module-list, .admin-section, .chart-card, .live-card, .two-col').forEach(el => {
      G.from(el, { y: 26, opacity: 0, duration: .7, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    setTimeout(() => { try { ST.refresh(); } catch (e) {} }, 250);
  }
  /* hard guarantee: nothing stays invisible, even if rAF is frozen */
  setTimeout(forceVisible, 2600);
}

/* ---------- player ---------- */
const playerEl = $('#player'), videoEl = $('#playerVideo');
const simStage = $('#simStage'), simFill = $('#simFill');
const vimeoWrap = $('#vimeoWrap'), soonStage = $('#soonStage');
const modMedia = (c, i) => (c.moduleMedia && c.moduleMedia[i]) || null;
let playing = null; /* {courseId, mod} */
let saveTimer = 0;
let sim = { timer: null, t: 0, dur: 20, running: false };

/* simulated lesson — used when external video can't stream (offline/sandbox) */
function startSim(c, mod) {
  videoEl.style.display = 'none';
  simStage.classList.add('on');
  $('#simIcon').innerHTML = svgIcon(c.icon);
  $('#simTitle').textContent = c.modules[mod];
  stopSim();
  $('#simPlayBtn').textContent = '⏸ Pause';
  sim.t = 0; sim.running = true;
  sim.timer = setInterval(() => {
    if (!sim.running) return;
    sim.t += 0.25;
    simFill.style.width = Math.min(100, sim.t / sim.dur * 100) + '%';
    if (playing) {
      const p = S.progress[playing.courseId];
      const cc = courseById(playing.courseId);
      if (p && !p.done && playing.mod >= (p.mod || 0)) {
        p.mod = playing.mod;
        p.pct = Math.min(99, Math.round(((playing.mod + sim.t / sim.dur) / cc.modules.length) * 100));
        clearTimeout(saveTimer); saveTimer = setTimeout(save, 800);
      }
    }
    if (sim.t >= sim.dur) {
      stopSim();
      if (playing) completeModule(playing.courseId, playing.mod);
      else simFill.style.width = '100%';
    }
  }, 250);
}
function stopSim() { clearInterval(sim.timer); sim.timer = null; sim.running = false; simFill.style.width = '0%'; }
$('#simPlayBtn').addEventListener('click', () => {
  sim.running = !sim.running;
  $('#simPlayBtn').textContent = sim.running ? '⏸ Pause' : '▶ Play lesson';
});
videoEl.addEventListener('error', () => {
  if (!playerEl.classList.contains('open')) return;
  if (playing) {
    const media = modMedia(courseById(playing.courseId), playing.mod);
    if (media && (media.type === 'vimeo' || media.type === 'youtube' || media.type === 'soon')) return; /* not using the <video> element */
    startSim(courseById(playing.courseId), playing.mod);
  } else startSim({ icon: '🔴', modules: [$('#playerTitle').textContent] }, 0);
});

/* real learning minutes — ticks while the player is open and the tab visible */
const dayKey = () => new Date().toISOString().slice(0, 10);
setInterval(() => {
  if (!playerEl.classList.contains('open') || document.visibilityState !== 'visible') return;
  S.mins = S.mins || {};
  S.mins[dayKey()] = Math.round(((S.mins[dayKey()] || 0) + 0.5) * 10) / 10;
  bumpStreak();
  save();
}, 30000);
function minutesLast7() {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    out.push({ label: d.toLocaleDateString(_lang() === 'pt' ? 'pt-PT' : 'en-GB', { weekday: 'short' }), v: Math.round((S.mins || {})[d.toISOString().slice(0, 10)] || 0) });
  }
  return out;
}
const weekMinutes = () => minutesLast7().reduce((a, b) => a + b.v, 0);
const avgQuizScore = () => (S.quizScores && S.quizScores.length) ? Math.round(S.quizScores.reduce((a, b) => a + b, 0) / S.quizScores.length) : null;

function resetStages() {
  stopSim(); simStage.classList.remove('on');
  vimeoWrap.classList.remove('on'); vimeoWrap.innerHTML = '';
  soonStage.classList.remove('on');
  videoEl.style.display = ''; videoEl.pause(); try { videoEl.removeAttribute('src'); videoEl.load(); } catch (e) {}
}
function openPlayer(courseId, mod) {
  const c = courseById(courseId);
  if (!c) return;
  if (mod == null) mod = (prog(courseId) && !isDone(courseId)) ? (prog(courseId).mod || 0) : 0;
  mod = Math.min(mod, c.modules.length - 1);
  const media = modMedia(c, mod);
  clearCheckpoint();
  playing = { courseId, mod };
  if (!prog(courseId)) S.progress[courseId] = { mod, pct: 0 };
  resetStages();

  if (media && media.type === 'soon') {
    videoEl.style.display = 'none';
    soonStage.classList.add('on');
    $('#soonTitle').textContent = t('coming_soon');
    const ss = $('#soonStage .soon-sub'); if (ss) ss.textContent = t('soon_sub');
  } else if (media && media.type === 'youtube') {
    videoEl.style.display = 'none';
    vimeoWrap.classList.add('on');
    vimeoWrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${media.id}?autoplay=1&rel=0" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen title="${cmods(c)[mod]}"></iframe>`;
  } else if (media && media.type === 'vimeo') {
    videoEl.style.display = 'none';
    vimeoWrap.classList.add('on');
    vimeoWrap.innerHTML = `<iframe src="https://player.vimeo.com/video/${media.id}?${media.h ? 'h=' + media.h + '&' : ''}title=0&byline=0&portrait=0&badge=0&autoplay=1&autopause=0&dnt=1&player_id=0&app_id=58479" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen title="${cmods(c)[mod]}"></iframe>`;
    armCheckpoint(c, mod);
  } else {
    videoEl.src = c.video || vidFor(courseId, mod);
    videoEl.play().catch(() => {});
  }

  $('#playerTitle').textContent = ctitle(c);
  $('#playerSub').textContent = `${t('module')} ${mod + 1} ${t('of')} ${c.modules.length} · ${cmods(c)[mod]}`;
  const pg = $('#playerGoal'); if (pg) { const goal = (takeawaysFor(c, mod) || [])[0] || ''; pg.textContent = goal ? `🎯 ${t('lesson_goal')}: ${goal}` : ''; }
  $('#playerPills').innerHTML = c.modules.map((m, i) => {
    const p = prog(courseId);
    const mm = modMedia(c, i);
    const soon = mm && mm.type === 'soon';
    const done = isDone(courseId) || (p && !p.done && i < (p.mod || 0));
    return `<button class="mod-pill ${i === mod ? 'current' : done ? 'done' : ''} ${soon ? 'soon' : ''}" data-action="play" data-id="${courseId}" data-mod="${i}">${done ? '✓ ' : soon ? '🔒 ' : ''}${i + 1}. ${soon ? t('coming_soon') : cmods(c)[i]}</button>`;
  }).join('');
  /* hide "mark complete" for coming-soon lessons */
  $('#playerComplete').style.display = (media && media.type === 'soon') ? 'none' : '';
  playerEl.classList.add('open');
  if ($('#notesDrawer').classList.contains('open')) refreshNotesDrawer();
  maybePretest(c, mod);
}

/* R2-12 · pretesting warm-up — guess before you learn. Two zero-stakes questions before
   the FIRST lesson of an untouched course; even wrong guesses prime retention, and the
   pretest→quiz delta becomes an honest learning-gain number in the ledger. */
function maybePretest(c, mod) {
  if (mod !== 0) return;
  if (coursePct(c.id) > 0 || isDone(c.id)) return;
  if ((S.ledger || []).some(e => e.type === 'pretest' && e.courseId === c.id)) return;
  /* own-quiz only — a pretest asking bank questions unrelated to this course
     (the old courseQuizFor fallthrough) is worse than no pretest at all */
  const qs = courseOwnQuiz(c);
  if (!Array.isArray(qs) || qs.length < 2) return;
  const pick = [qs[0], qs[1]];
  const ov = $('#ckOv'); if (!ov) return;
  let idx = 0, right = 0;
  const drawOne = () => {
    const q = pick[idx];
    ov.innerHTML = `<div class="ck-card">
      <div class="ob-eyebrow">🌱 ${t('pre_h')} · ${idx + 1}/2</div>
      <p class="pre-sub">${t('pre_sub')}</p>
      <div class="ck-q">${esc(q.q)}</div>
      ${q.opts.map((o, i) => `<div class="q-opt" data-ck="${i}" role="button" tabindex="0"><span class="radio"></span><span>${esc(o)}</span></div>`).join('')}
      <div class="ck-foot"><button class="ob-skip" id="preSkip">${t('pre_skip')}</button><span style="flex:1"></span><button class="btn btn-primary btn-sm" id="preNext" style="display:none;">${idx ? '▶ ' + t('ck_continue') : t('pre_next')}</button></div>
    </div>`;
    ov.classList.add('on');
    let answered = false;
    ov.querySelectorAll('.q-opt').forEach(el => el.addEventListener('click', () => {
      if (answered) return; answered = true;
      const sel = +el.dataset.ck;
      ov.querySelectorAll('.q-opt').forEach((x, i) => { if (i === q.a) x.classList.add('correct'); else if (i === sel) x.classList.add('wrong'); });
      if (sel === q.a) right++;
      $('#preNext').style.display = '';
    }));
    $('#preNext').addEventListener('click', () => {
      idx++;
      if (idx < pick.length) drawOne();
      else { ledgerAppend('pretest', { courseId: c.id, score: Math.round(right / pick.length * 100) }); ov.classList.remove('on'); ov.innerHTML = ''; toast(t('pre_done'), '🌱'); }
    });
    $('#preSkip').addEventListener('click', () => {
      ledgerAppend('pretest', { courseId: c.id, score: null, skipped: true });
      ov.classList.remove('on'); ov.innerHTML = '';
    });
  };
  drawOne();
}
function closePlayer() {
  playerEl.classList.remove('open');
  $('#notesDrawer').classList.remove('open');
  resetStages();
  clearCheckpoint();
  playing = null;
  render();
}

/* ---------- in-video checkpoints — one retrieval question mid-lesson (Vimeo Player SDK).
   Learning science: a single active-recall pause beats passive watching. Once per lesson, ever. */
let vimeoPlayer = null, _vimeoSDKp = null;
function loadVimeoSDK() {
  if (window.Vimeo) return Promise.resolve();
  if (!_vimeoSDKp) _vimeoSDKp = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://player.vimeo.com/api/player.js';
    s.onload = res; s.onerror = () => { _vimeoSDKp = null; rej(); };
    document.head.appendChild(s);
  });
  return _vimeoSDKp;
}
function clearCheckpoint() {
  const ov = $('#ckOv'); if (ov) { ov.classList.remove('on'); ov.innerHTML = ''; }
  if (vimeoPlayer) { try { vimeoPlayer.destroy(); } catch (e) {} vimeoPlayer = null; }
}
/* Course-SPECIFIC questions only (the course's own quiz — never QUIZ_BANK).
   Interrupting a lesson is only earned when the question is about THAT course:
   pausing a leadership video to ask about soil regeneration teaches people to
   resent the player. Category/default banks remain fine for the *post-course*
   quiz, where the learner chose to be quizzed — but they never gate playback. */
function courseOwnQuiz(c) {
  const cq = (typeof COURSE_QUIZ !== 'undefined' && COURSE_QUIZ[c.id]) || c.quiz;
  if (!cq) return null;
  const qs = cq[_lang() === 'pt' ? 'pt' : 'en'] || cq.en || cq;
  return (Array.isArray(qs) && qs.length) ? qs : null;
}
function checkpointQuestion(c, mod) {
  const qs = courseOwnQuiz(c);
  return qs ? qs[mod % qs.length] : null;
}
function armCheckpoint(c, mod) {
  const key = c.id + ':' + mod;
  const q = checkpointQuestion(c, mod);
  if (!q || (S.checkpoints || {})[key]) return;
  loadVimeoSDK().then(() => {
    const ifr = vimeoWrap.querySelector('iframe');
    if (!ifr || !window.Vimeo || !playing || playing.courseId !== c.id || playing.mod !== mod) return;
    try { vimeoPlayer = new Vimeo.Player(ifr); } catch (e) { return; }
    let fired = false;
    vimeoPlayer.on('timeupdate', d => {
      if (fired || !d || !d.percent || d.percent < 0.5) return;
      fired = true;
      (S.checkpoints = S.checkpoints || {})[key] = 1; save();
      vimeoPlayer.pause().catch(() => {});
      showCheckpoint(q, c);
    });
  }).catch(() => {});
}
function showCheckpoint(q, c) {
  const ov = $('#ckOv'); if (!ov) return;
  let answered = false;
  ov.innerHTML = `<div class="ck-card">
    <div class="ob-eyebrow">🎯 ${t('ck_h')} · ${esc(ctitle(c))}</div>
    <div class="ck-q">${esc(q.q)}</div>
    ${q.opts.map((o, i) => `<div class="q-opt" data-ck="${i}" role="button" tabindex="0"><span class="radio"></span><span>${esc(o)}</span></div>`).join('')}
    <div class="ck-foot"><span class="ck-note" id="ckNote"></span><button class="btn btn-primary btn-sm" id="ckGo" style="display:none;">▶ ${t('ck_continue')}</button></div>
  </div>`;
  ov.classList.add('on');
  ov.querySelectorAll('.q-opt').forEach(el => el.addEventListener('click', () => {
    if (answered) return; answered = true;
    const sel = +el.dataset.ck;
    ov.querySelectorAll('.q-opt').forEach((x, i) => {
      if (i === q.a) x.classList.add('correct');
      else if (i === sel) x.classList.add('wrong');
    });
    if (sel === q.a) { $('#ckNote').textContent = t('ck_right'); awardXp(5, t('ck_h')); }
    else {
      $('#ckNote').textContent = t('ck_wrong');
      S.missedQ = ((S.missedQ || []).filter(m => m.q !== q.q)).concat({ q: q.q, back: q.opts[q.a], courseId: c.id, at: Date.now() }).slice(-30);
      save();
    }
    $('#ckGo').style.display = '';
  }));
  $('#ckGo').addEventListener('click', () => {
    ov.classList.remove('on'); ov.innerHTML = '';
    if (vimeoPlayer) vimeoPlayer.play().catch(() => {});
  });
}

/* ---------- notes & transcript ---------- */
function makeTranscript(c, mod) {
  const t = c.modules[mod];
  return [
    ['0:00', `Welcome back. This module is “${t}” — by the end you'll be able to apply it in your own work at ${brandName()}.`],
    ['0:48', `First, the common misconception: most teams treat ${t.toLowerCase()} as a one-off task. It's a habit, not an event.`],
    ['2:15', `Here's the framework — three parts, and the middle one is where ${c.cat.toLowerCase()} teams usually slip.`],
    ['4:40', `Quick example from a real ${c.cat.toLowerCase()} case. Notice what changes the moment the owner is named.`],
    ['7:02', `Practice prompt: pause the video and try this on something you shipped last month.`],
    ['9:30', `Recap and what's next — the assessment will adapt to how you do on the practice prompt.`]
  ];
}
let notesTimer = 0;
function refreshNotesDrawer() {
  if (!playing) return;
  const c = courseById(playing.courseId);
  $('#ndTranscript').innerHTML = makeTranscript(c, playing.mod)
    .map(([tc, tx]) => `<div class="nd-line"><span class="tc">${tc}</span><span>${tx}</span></div>`).join('');
  const saved = (S.notes[playing.courseId] || {})[playing.mod] || '';
  $('#ndNotes').value = saved;
  $('#ndSaved').textContent = saved ? '· saved' : '';
}
$('#notesToggle').addEventListener('click', () => { refreshNotesDrawer(); $('#notesDrawer').classList.toggle('open'); });
$('#notesClose').addEventListener('click', () => $('#notesDrawer').classList.remove('open'));
$('#ndNotes').addEventListener('input', e => {
  if (!playing) return;
  $('#ndSaved').textContent = '· saving…';
  clearTimeout(notesTimer);
  notesTimer = setTimeout(() => {
    if (!playing) return;
    (S.notes[playing.courseId] = S.notes[playing.courseId] || {})[playing.mod] = e.target.value;
    save();
    $('#ndSaved').textContent = '· saved';
  }, 600);
});
videoEl.addEventListener('timeupdate', () => {
  if (!playing || !videoEl.duration) return;
  const c = courseById(playing.courseId);
  const p = S.progress[playing.courseId];
  if (p && !p.done && playing.mod >= (p.mod || 0)) {
    p.mod = playing.mod;
    p.pct = Math.min(99, Math.round(((playing.mod + videoEl.currentTime / videoEl.duration) / c.modules.length) * 100));
    clearTimeout(saveTimer); saveTimer = setTimeout(save, 800);
  }
});
videoEl.addEventListener('ended', () => { if (playing) completeModule(playing.courseId, playing.mod); });

/* "what you take with you" — 3 key learnings shown at each module's end (peak-end moment) */
function takeawaysFor(c, mod) {
  const tw = TAKEAWAYS[c.id] || c.takeaways;
  const lang = _lang() === 'pt' ? 'pt' : 'en';
  if (tw && tw[lang] && tw[lang][mod]) return tw[lang][mod];
  const m = cmods(c)[mod] || ctitle(c);
  return _lang() === 'pt'
    ? [`A prática central de “${m}” — comece pequeno e repita até virar hábito.`,
       `Como isto se liga ao seu trabalho diário na terra e à sua equipa.`,
       `Uma pergunta para levar: o que mudaria se aplicasse isto amanhã?`]
    : [`The core practice from “${m}” — start small and repeat it until it's habit.`,
       `How this connects to your daily work on the land, and to your team.`,
       `A question to carry: what would change if you applied this tomorrow?`];
}
let pendingNext = null; /* what happens after the takeaways card */
function showTakeaways(c, mod, next) {
  pendingNext = next;
  $('#takeList').innerHTML = takeawaysFor(c, mod).map((x, i) =>
    `<div class="take-item" style="animation-delay:${.15 + i * .18}s"><span class="take-num">${i + 1}</span><p>${x}</p></div>`).join('');
  $('#takeMod').textContent = `${cmods(c)[mod]} · ${ctitle(c)}`;
  $('#takeTitle').textContent = t('take_title');
  $('#takeSub').textContent = t('take_sub');
  $('#takeGo').textContent = next && next.kind === 'course-done' ? t('take_done') : t('take_continue');
  if (next && next.kind === 'course-done') {
    $('#takeList').innerHTML += `<div class="take-extra">
      ${ratingStarsHTML(next.courseId)}
      <button class="btn btn-glass btn-sm" data-action="cert-dl" data-id="${next.courseId}">🎓 ${t('cert_dl')}</button>
    </div>
    ${(S.intentions || {})[next.courseId] ? '' : `<div class="intent-box">
      <div class="ob-eyebrow">🌱 ${t('intent_h')}</div>
      <p class="pre-sub">${t('intent_sub')}</p>
      <div class="ask-row"><input class="auth-input" id="intentText" maxlength="140" placeholder="${t('intent_ph')}"><button class="btn btn-primary btn-sm" data-action="intent-save" data-id="${next.courseId}">${t('intent_save')}</button></div>
    </div>`}`;
  }
  const tq = $('#takeQuiz');
  if (tq) { tq.style.display = next && next.kind === 'course-done' ? '' : 'none'; tq.textContent = t('take_quiz'); }
  $('#takeModal').classList.add('open');
}
function resolveTakeaways(toQuiz) {
  $('#takeModal').classList.remove('open');
  const n = pendingNext; pendingNext = null;
  if (!n) return;
  if (toQuiz && n.courseId) { closePlayer(); setTimeout(() => openQuiz(n.courseId), 250); return; }   /* watch → assess loop */
  if (n.kind === 'next') openPlayer(n.courseId, n.mod);
  else if (n.kind === 'soon') { closePlayer(); setTimeout(() => toast(_lang() === 'pt' ? 'É tudo por agora — o resto da jornada está a caminho 🌱' : 'That’s every lesson available so far — the rest of the journey is coming soon 🌱', '🌱'), 400); }
  else if (n.kind === 'course-done') {
    closePlayer();
    setTimeout(() => { openTutorWith(`${_lang() === 'pt' ? 'Terminou' : 'You finished'} <b>${ctitle(courseById(n.courseId))}</b> — ${_lang() === 'pt' ? 'quer o teste de certificação agora? São 3 perguntas.' : 'want the certification quiz now? It’s 3 questions.'}`, ['Quiz me now', 'Build me a path']); }, 700);
  }
}
function completeModule(courseId, mod) {
  const c = courseById(courseId);
  const p = S.progress[courseId] || (S.progress[courseId] = { mod: 0, pct: 0 });
  /* 40h compliance: credit this lesson's carga horária to the append-only training ledger */
  if (!(S.trainingLog || (S.trainingLog = [])).some(e => e.courseId === courseId && e.mod === mod)) {
    const mins = (c.moduleDurations && c.moduleDurations[mod]) || 12;
    S.trainingLog.push({ courseId, mod, title: (cmods(c)[mod] || c.modules[mod]), hours: Math.round(mins / 60 * 100) / 100, at: Date.now(), confirmed: true });
  }
  ledgerAppend('module_complete', { courseId, mod, mins: (c.moduleDurations && c.moduleDurations[mod]) || 12 });
  if (mod >= c.modules.length - 1) ledgerAppend('course_complete', { courseId });
  if (S.review[courseId] === mod) { delete S.review[courseId]; toast('Review module cleared — nice recovery', '↺'); }
  bumpStreak();
  if (mod >= c.modules.length - 1) {
    p.done = true; p.pct = 100; delete p.mod;
    p.doneAt = p.doneAt || Date.now();   /* spaced-repetition anchor */
    save();
    toast(`${_lang() === 'pt' ? 'Curso concluído' : 'Course complete'}: ${ctitle(c)} 🎉`, '🏆');
    awardXp(XP.module + XP.course, 'course complete');
    checkBadges();
    showTakeaways(c, mod, { kind: 'course-done', courseId });
  } else {
    const nextMedia = modMedia(c, mod + 1);
    p.mod = mod + 1;
    p.pct = Math.round((p.mod / c.modules.length) * 100);
    save();
    awardXp(XP.module, 'module');
    checkBadges();
    showTakeaways(c, mod, (nextMedia && nextMedia.type === 'soon') ? { kind: 'soon' } : { kind: 'next', courseId, mod: mod + 1 });
  }
}

/* ---------- quiz ---------- */
let quiz = null; /* {courseId, qs, idx, sel, score} */
/* quiz selection — real course questions first, then AI-generated from the
   course itself (BYO Claude key), then the generic category bank */
const aiQuizCache = {};
async function generateAIQuiz(c) {
  const lang = _lang() === 'pt' ? 'pt' : 'en';
  const key = c.id + ':' + lang;
  if (aiQuizCache[key]) return aiQuizCache[key];
  /* ground the questions in the course's real takeaways, not just the blurb */
  const tk = []; try { const T = (typeof TAKEAWAYS !== 'undefined') && TAKEAWAYS[c.id]; if (T) (T[lang] || T.en || []).forEach(m => Array.isArray(m) ? tk.push(...m) : tk.push(m)); } catch (e) {}
  const text = await llmComplete({
    system: `You are a master instructor and assessment designer for ${brandAcademy()} — ${brandShortDesc()}. Write a rigorous, practical quiz that tests whether a worker can APPLY this course in the real world — never rote recall of words.\nRULES:\n1. Every question is a realistic ON-THE-LAND scenario or judgement call ("You're doing X and Y happens — what's the best move / why?").\n2. Distractors must be PLAUSIBLE mistakes a real person would actually make — never obviously silly.\n3. Ground every question in THIS course's real content AND ${brandRealm()}.\n4. ACCURACY OVER QUANTITY: every question and its correct answer must be verifiably supported by the course content provided — if the content is thin, write only 3 solid questions instead of inventing a 4th. A wrong "correct answer" is the worst possible failure.\n5. Reply with ONLY a raw JSON array of 3-4 objects: {"q":"…","opts":["…","…","…","…"],"a":<correct index 0-3>}. No markdown, no fences.\nLanguage: ${lang === 'pt' ? 'European Portuguese (pt-PT — never Brazilian)' : 'English'}.`,
    messages: [{ role: 'user', content: `COURSE: "${ctitle(c)}" (${tcat(c.cat)})\nHook: ${chook(c)} ${chooksub(c)}\nAbout: ${cdesc(c)}\nModules: ${cmods(c).join('; ')}.${tk.length ? '\nKey ideas taught: ' + tk.join(' | ') : ''}` }],
    maxTokens: 1300
  });
  const qs = JSON.parse(text.replace(/^[^\[]*/, '').replace(/[^\]]*$/, ''));
  if (!Array.isArray(qs) || qs.length < 3 || !qs.every(x => x.q && Array.isArray(x.opts) && x.opts.length === 4 && x.a >= 0 && x.a < 4)) throw new Error('bad shape');
  aiQuizCache[key] = qs.slice(0, 4);
  return aiQuizCache[key];
}
function startQuiz(c, qs, ai) {
  quiz = { courseId: c.id, qs, idx: 0, sel: null, score: 0, answered: false, ai: !!ai };
  $('#quizModal').classList.add('open');
  drawQuiz();
}
function openQuiz(courseId) {
  const c = courseById(courseId) || CATALOG[0];
  const lang = _lang() === 'pt' ? 'pt' : 'en';
  const cq = COURSE_QUIZ[c.id] || c.quiz;
  const staticQ = cq ? (cq[lang] || cq.en || cq) : (QUIZ_BANK[c.cat] || QUIZ_BANK._default);
  if (aiKey()) {   /* AI-FIRST: rigorous, land-adapted, scenario questions; curated set is the fallback */
    $('#quizModal').classList.add('open');
    $('#quizBody').innerHTML = `<div class="q-center"><div class="orb-spin"></div><p class="m-sub" style="margin-top:16px;">${t('quiz_ai_building')}</p></div>`;
    generateAIQuiz(c).then(qs => startQuiz(c, qs, true)).catch(() => startQuiz(c, staticQ, false));
    return;
  }
  startQuiz(c, staticQ, false);
}
function drawQuiz() {
  const c = courseById(quiz.courseId);
  const box = $('#quizBody');
  if (quiz.idx >= quiz.qs.length) {
    const pctScore = Math.round(quiz.score / quiz.qs.length * 100);
    const pass = pctScore >= 70;
    S.quizScores = (S.quizScores || []).concat(pctScore).slice(-30);
    if (pass) { S.quizzesPassed++; save(); awardXp(XP.quiz, 'quiz passed'); checkBadges(); }
    else {
      const p = prog(quiz.courseId);
      S.review[quiz.courseId] = p && p.mod != null ? p.mod : 0;
    }
    save();
    /* evidence ledger: every attempt recorded; AI quizzes are scenario/application items;
       a pass ≥7 days after finishing the course doubles as a delayed retrieval check */
    ledgerAppend(pass ? 'quiz_pass' : 'quiz_fail', { courseId: quiz.courseId, score: pctScore, ai: !!quiz.ai });
    if (pass && quiz.ai) ledgerAppend('application_item_pass', { courseId: quiz.courseId, score: pctScore });
    const _qp = prog(quiz.courseId);
    if (pass && _qp && _qp.done && _qp.doneAt && (Date.now() - _qp.doneAt) >= 7 * 864e5)
      ledgerAppend('delayed_retrieval_pass', { courseId: quiz.courseId, score: pctScore, via: 'quiz' });
    box.innerHTML = `<div class="q-center">
      <div class="score-ring" style="background:conic-gradient(${pass ? 'var(--accent-2)' : '#f59e0b'} ${pctScore * 3.6}deg, rgba(255,255,255,.08) 0); ">
        <span style="background:var(--bg-2);width:96px;height:96px;border-radius:50%;display:grid;place-items:center;">${pctScore}%</span>
      </div>
      <h3>${pass ? 'Verified ✓' : 'Almost there'}</h3>
      <p class="m-sub">${pass
        ? `Skill verified and added to your profile. The AI just unlocked the next step of your path.`
        : `Below 70% — the AI re-queued the tricky module in <b>${c.title}</b> for review. It happens to the best of us.`}</p>
      <div class="q-foot" style="justify-content:center;">
        <button class="btn btn-primary btn-sm" data-action="quiz-close">${pass ? 'Continue' : 'Review module'}</button>
      </div></div>`;
    return;
  }
  const q = quiz.qs[quiz.idx];
  /* aligned with the onboarding design language: progress bar + eyebrow + title */
  box.innerHTML = `
    <div class="onboard-progress" style="margin-bottom:18px;"><div class="fill" style="width:${Math.round(quiz.idx / quiz.qs.length * 100)}%"></div></div>
    <div class="ob-eyebrow">${t('quiz_q')} ${quiz.idx + 1} ${t('quiz_of')} ${quiz.qs.length} · ${ctitle(c)}${quiz.ai ? ` &nbsp;<span style="color:var(--accent)">${t('quiz_ai_tag')}</span>` : ''}</div>
    <div class="ob-title" style="font-size:24px;margin-top:6px;">${q.q}</div>
    <div style="margin-top:18px;">
    ${q.opts.map((o, i) => `<div class="q-opt" data-opt="${i}"><span class="radio"></span><span>${o}</span></div>`).join('')}
    </div>
    <div class="q-foot">
      <button class="ob-skip" data-action="quiz-close">Exit</button>
      <button class="ob-skip q-flag" data-action="quiz-flag" title="${t('quiz_flag_tip')}" aria-label="${t('quiz_flag_tip')}">⚑</button>
      <span style="flex:1"></span>
      <button class="btn btn-primary btn-sm" id="quizNext" disabled style="opacity:.5">Check answer</button>
    </div>`;
  box.querySelectorAll('.q-opt').forEach(el => el.addEventListener('click', () => {
    if (quiz.answered) return;
    box.querySelectorAll('.q-opt').forEach(x => x.classList.remove('sel'));
    el.classList.add('sel'); quiz.sel = +el.dataset.opt;
    const btn = $('#quizNext'); btn.disabled = false; btn.style.opacity = 1;
  }));
  $('#quizNext').addEventListener('click', () => {
    if (!quiz.answered) {
      if (quiz.sel == null) return;
      quiz.answered = true;
      const q = quiz.qs[quiz.idx];
      box.querySelectorAll('.q-opt').forEach((x, i) => {
        if (i === q.a) x.classList.add('correct');
        else if (i === quiz.sel && i !== q.a) x.classList.add('wrong');
      });
      if (quiz.sel === q.a) quiz.score++;
      else { /* practice-what-you-missed: wrong answers resurface first in the review deck */
        S.missedQ = ((S.missedQ || []).filter(m => m.q !== q.q)).concat({ q: q.q, back: q.opts[q.a], courseId: quiz.courseId, at: Date.now() }).slice(-30);
        save();
      }
      $('#quizNext').textContent = quiz.idx === quiz.qs.length - 1 ? 'See result' : 'Next question';
    } else {
      quiz.idx++; quiz.sel = null; quiz.answered = false; drawQuiz();
    }
  });
}

/* ---------- command palette ---------- */
const PALETTE_ACTIONS = [
  { t: 'Go to Library', icon: '📚', run: () => location.hash = '#/library' },
  { t: 'Go to Paths', icon: '🧭', run: () => location.hash = '#/paths' },
  { t: 'Go to Live sessions', icon: '🔴', run: () => location.hash = '#/live' },
  { t: 'Go to Analytics', icon: '📊', run: () => location.hash = '#/analytics' },
  { t: 'Quiz me on my current course', icon: '🎯', run: () => openQuiz(currentCourseId() || 'leading-data') },
  { t: 'Ask the AI tutor', icon: '✦', run: () => setTutorOpen(true) },
  { t: 'Regenerate my AI path', icon: '↺', run: () => regenPath() }
];
let palIdx = 0;
function openPalette() { $('#palette').classList.add('open'); const i = $('#palInput'); i.value = ''; drawPalette(''); setTimeout(() => i.focus(), 30); }

/* ---------- voice search (Web Speech API) ---------- */
let voiceRec = null;
function startVoiceSearch() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast(t('voice_unsupported'), 'ℹ️'); return; }
  if (voiceRec) { try { voiceRec.stop(); } catch (e) {} voiceRec = null; setVoiceUI(false); return; }
  const r = voiceRec = new SR();
  r.lang = _lang() === 'pt' ? 'pt-PT' : 'en-US';
  r.interimResults = true;
  r.maxAlternatives = 1;
  openPalette();
  setVoiceUI(true);
  $('#palInput').placeholder = t('voice_hint');
  r.onresult = e => {
    const txt = [...e.results].map(x => x[0].transcript).join(' ').trim();
    $('#palInput').value = txt;
    drawPalette(txt);
  };
  r.onend = () => { voiceRec = null; setVoiceUI(false); };
  r.onerror = () => { voiceRec = null; setVoiceUI(false); };
  try { r.start(); } catch (e) { voiceRec = null; setVoiceUI(false); }
}
function setVoiceUI(on) {
  $$('.mic-btn').forEach(b => { b.classList.toggle('listening', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  const st = $('#palVoiceState'); if (st) { st.textContent = on ? `● ${t('voice_listening')}` : ''; st.classList.toggle('on', on); }
}
function closePalette() { $('#palette').classList.remove('open'); }
function drawPalette(q) {
  q = q.toLowerCase();
  /* natural-language friendly: strip voice filler, match across title/hook/desc in both languages */
  q = q.replace(/^(i'?m looking for|i want|find me|show me|procuro|estou à procura de|quero|encontra)\s+/i, '')
       .replace(/^(something|anything|a course|um curso|algo|alguma coisa)\s+(about|on|sobre|de)?\s*/i, '').trim().toLowerCase();
  const words = q.split(/\s+/).filter(w => w.length > 2);
  const hay = c => (c.title + ' ' + c.cat + ' ' + c.desc + ' ' + ctitle(c) + ' ' + cdesc(c) + ' ' + tcat(c.cat) + ' ' + chook(c) + ' ' + chooksub(c)).toLowerCase();
  const courses = CATALOG.filter(c => !q || hay(c).includes(q) || (words.length && words.some(w => hay(c).includes(w)))).slice(0, 6);
  const acts = PALETTE_ACTIONS.filter(a => !q || a.t.toLowerCase().includes(q));
  palIdx = 0;
  let html = '';
  if (courses.length) html += `<div class="palette-group">Courses</div>` + courses.map(c =>
    `<div class="palette-item" data-pal="course:${c.id}"><span class="pi-icon t-grad-${c.grad}">${svgIcon(c.icon)}</span><div><div>${c.title}</div><div class="pi-meta">${c.cat} · ${fmtMins(courseMins(c))} · ★ ${c.rating}</div></div></div>`).join('');
  if (acts.length) html += `<div class="palette-group">Actions</div>` + acts.map((a, i) =>
    `<div class="palette-item" data-pal="act:${PALETTE_ACTIONS.indexOf(a)}"><span class="pi-icon" style="background:var(--surface-2)">${a.icon}</span><div>${a.t}</div></div>`).join('');
  if (q && aiKey()) html += `<div class="palette-group">✦</div><div class="palette-item" data-pal="ask:${esc(q)}"><span class="pi-icon" style="background:var(--surface-2)">✦</span><div>${t('ask_more')}“${esc(q)}”</div></div>`;
  $('#palResults').innerHTML = html || `<div class="palette-empty">No matches for “${esc(q)}” — try the AI tutor.</div>`;
  highlightPal();
}
function highlightPal() {
  const items = $$('#palResults .palette-item');
  items.forEach((el, i) => el.classList.toggle('hl', i === palIdx));
  if (items[palIdx]) items[palIdx].scrollIntoView({ block: 'nearest' });
}
function runPal(el) {
  const _p = el.dataset.pal, _i = _p.indexOf(':');
  const kind = _p.slice(0, _i), val = _p.slice(_i + 1);
  closePalette();
  if (kind === 'ask') { openAsk(val); return; }
  if (kind === 'course') location.hash = '#/course/' + val;
  else PALETTE_ACTIONS[+val].run();
}

/* ---------- AI tutor ---------- */
const tutorPanel = $('#aiPanel');
function setTutorOpen(open) {
  tutorPanel.classList.toggle('open', open);
  if (open && !tutorPanel.dataset.greeted) { tutorPanel.dataset.greeted = '1'; tutorGreet(); }
}
function currentCourseId() {
  const m = location.hash.match(/#\/course\/([\w-]+)/);
  if (m) return m[1];
  if (playing) return playing.courseId;
  return S.path.find(x => !isDone(x)) || null;
}
function addMsg(html, who) {
  const div = document.createElement('div');
  div.className = 'msg ' + who; div.innerHTML = html;
  $('#aiMsgs').appendChild(div);
  $('#aiMsgs').scrollTop = $('#aiMsgs').scrollHeight;
  return div;
}
function botSay(html, delay = 700) {
  const t = document.createElement('div');
  t.className = 'msg bot typing'; t.innerHTML = '<span></span><span></span><span></span>';
  $('#aiMsgs').appendChild(t); $('#aiMsgs').scrollTop = $('#aiMsgs').scrollHeight;
  setTimeout(() => { t.classList.remove('typing'); t.innerHTML = html; $('#aiMsgs').scrollTop = $('#aiMsgs').scrollHeight; }, delay);
}
function tutorGreet() {
  const id = currentCourseId();
  const c = id && courseById(id);
  const p = c && prog(c.id);
  const pt = _lang() === 'pt';
  if (c && p && !p.done) botSay(pt
    ? `Olá ${firstName()} 👋 Está ${coursePct(c.id)}% em <b>${ctitle(c)}</b> — de momento em “${cmods(c)[p.mod || 0]}”. Quer um resumo de 30 segundos, ou faço-lhe um teste?`
    : `Hey ${firstName()} 👋 You're ${coursePct(c.id)}% through <b>${ctitle(c)}</b> — currently on “${cmods(c)[p.mod || 0]}”. Want a 30-second recap, or shall I quiz you?`);
  else botSay(pt
    ? `Olá ${firstName()} 👋 Posso resumir qualquer curso, testá-lo, ou reconstruir o seu percurso. Vejo o seu progresso e o seu objetivo (<b>${tgoal(S.goal)}</b>) — pergunte-me o que quiser.`
    : `Hey ${firstName()} 👋 I can summarize any course, quiz you, or rebuild your learning path. I can see your progress and your goal (<b>${tgoal(S.goal)}</b>) — ask me anything.`);
}
function openTutorWith(html, quicks) {
  setTutorOpen(true);
  botSay(html, 500);
}
/* ---------- real Claude integration (BYO key) ---------- */
let tutorHistory = [];
const TUTOR_MODES = {
  hint:     'MODE: HINT — reply with ONE small nudge (max 2 sentences) that helps them find the answer themselves. NEVER give the full answer; end by handing the thinking back to them.',
  coach:    'MODE: COACH — reply Socratically: acknowledge briefly, then ask 1–2 guiding questions that lead them to the answer. Do not hand over answers; build their thinking.',
  explain:  'MODE: EXPLAIN — teach the concept clearly and warmly, with ONE concrete example from the land/courses, then end with one short check-for-understanding question.',
  practice: 'MODE: PRACTICE — give ONE practical exercise on their topic (something they can do or answer now). When they attempt it, give specific feedback and only then the model answer.',
  teach:    'MODE: TEACH-ME — role-reverse: you are now an eager, slightly confused APPRENTICE on their team, and THEY are your teacher. Ask them to explain their current topic in their own words. React like a real novice: get one thing subtly wrong or ask a naive follow-up ("wait, so why wouldn\'t I just…?") so they must clarify. NEVER lecture or correct with the full answer — if their explanation has a gap, ask the question that exposes it and let them close it. When they teach it well, tell them exactly what convinced you.'
};
function aiGuardrails() {
  const g = (window.EdenOrg && window.EdenOrg.aiGuard) || {};
  let out = '';
  if (g.courseOnly !== false) out += '\nSCOPE: only discuss topics related to this team\'s courses and their work on the land. If asked something unrelated, warmly steer back to the learning.';
  if (g.blocked) out += '\nNever discuss: ' + g.blocked + '.';
  return out;
}
function buildTutorSystem() {
  const id = currentCourseId(); const c = id && courseById(id);
  const p = c && prog(c.id);
  const pathLines = S.path.map(x => {
    const cc = courseById(x); if (!cc) return '';
    return `- ${cc.title}: ${isDone(x) ? 'completed' : pathStatus(x) === 'current' ? coursePct(x) + '% in progress' : 'locked'}`;
  }).join('\n');
  return `You are the ${brandName()} Tutor, the in-app AI learning companion inside ${brandAcademy()} — the learning platform of ${brandEthos()}
You are talking to ${displayName()}${S.role ? ' (' + S.role + ')' : ''}, whose learning goal is "${S.goal}".

His AI learning path right now:
${pathLines}

${c ? `He currently has "${c.title}" open${p && !p.done ? ` — module ${(p.mod || 0) + 1} of ${c.modules.length}, "${c.modules[p.mod || 0]}", ${coursePct(c.id)}% complete` : ''}. Course description: ${c.desc}` : 'No course is currently open.'}

Deadlines: "Fire Safety on the Land" is required and due in 3 days (it's fire season in the Alentejo); the team series "Living by the Seasons" is due June 30.

Style: warm, encouraging, concise (2-4 sentences unless asked for depth). Refer to his actual progress and path when relevant. You can offer to quiz him — if he agrees, tell him to press the "Quiz me now" button. Never invent courses that aren't in his path or the descriptions above.
HONESTY: Be honest before being helpful. If you are not sure of something, or the courses don't cover it, say so plainly ("I'm not certain" / "our courses don't cover this yet — check with the land team") instead of guessing. Never invent facts, names, numbers or regulations. When the learner shares their own reasoning, respond to their ACTUAL thinking — name what's right in it before correcting what's off.
${_lang() === 'pt' ? 'IMPORTANT: Respond in European Portuguese (português de Portugal).' : ''}\n\n${TUTOR_MODES[S.tutorMode || 'explain']}${aiGuardrails()}`;
}
/* provider-agnostic completion — Claude (sk-ant-…) or free-tier Gemini (AIza…) */
const aiKey = () => S.apiKey || (window.EdenOrg && window.EdenOrg.aiKey) || '';
const llmProvider = () => aiKey().startsWith('AIza') ? 'gemini' : 'anthropic';
function aiModel() { return S.aiModel || (window.EdenOrg && window.EdenOrg.aiModel) || ''; }
/* transparency: the model that actually answers — shown on AI outputs (no silent swaps) */
function aiModelLabel() { const k = aiKey(); if (!k) return ''; return aiModel() || LLM_DEFAULTS[llmProviderOf(k, aiModel())] || ''; }
function llmProviderOf(key, model) {
  if (!key) return null;
  if (key.startsWith('AIza')) return 'gemini';
  if (key.startsWith('sk-ant')) return 'anthropic';
  if (key.startsWith('sk-or-')) return 'openrouter';
  if (key.startsWith('gsk_')) return 'groq';
  if ((model || '').startsWith('deepseek')) return 'deepseek';
  if ((model || '').startsWith('mistral') || (model || '').startsWith('magistral')) return 'mistral';
  return 'openai';
}
const LLM_DEFAULTS = { gemini: 'gemini-2.5-flash', anthropic: 'claude-sonnet-4-6', openrouter: 'google/gemini-2.5-flash', groq: 'llama-3.3-70b-versatile', deepseek: 'deepseek-chat', mistral: 'mistral-small-latest', openai: 'gpt-5-mini' };
async function llmComplete({ system, messages, maxTokens, model }) {
  /* pt-PT drift guard (P3B3, 2026): models slide toward pt-BR over turns — re-assert on every call */
  if (/portugu/i.test(system || '') && _lang() === 'pt') system += '\nIMPORTANTE: responde SEMPRE em português europeu (pt-PT) — nunca em português do Brasil. Evita "você", gerúndios contínuos e léxico brasileiro, mesmo em conversas longas.';
  const key = aiKey();
  const mdl = model || aiModel();
  const prov = llmProviderOf(key, mdl);
  const useModel = mdl || LLM_DEFAULTS[prov];
  if (prov === 'gemini') {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${key}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: maxTokens }
      })
    });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err.error && err.error.message) || 'HTTP ' + res.status); }
    const data = await res.json();
    return (((data.candidates || [])[0] || {}).content || { parts: [] }).parts.map(p => p.text || '').join('') || '…';
  }
  if (prov === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: useModel, max_tokens: maxTokens, system, messages })
    });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err.error && err.error.message) || 'HTTP ' + res.status); }
    const data = await res.json();
    return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n') || '…';
  }
  /* OpenAI-compatible chat/completions: OpenRouter, Groq, DeepSeek, Mistral, OpenAI */
  const base = prov === 'openrouter' ? 'https://openrouter.ai/api/v1'
    : prov === 'groq' ? 'https://api.groq.com/openai/v1'
    : prov === 'deepseek' ? 'https://api.deepseek.com/v1'
    : prov === 'mistral' ? 'https://api.mistral.ai/v1'
    : 'https://api.openai.com/v1';
  const body = { model: useModel, messages: [{ role: 'system', content: system }, ...messages] };
  if (prov === 'openai') body.max_completion_tokens = maxTokens; else body.max_tokens = maxTokens;
  const res = await fetch(base + '/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
    body: JSON.stringify(body)
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err.error && err.error.message) || 'HTTP ' + res.status); }
  const data = await res.json();
  return (((data.choices || [])[0] || {}).message || {}).content || '…';
}
async function askClaude(text) {
  logAsk(text, 'tutor');
  tutorHistory.push({ role: 'user', content: text });
  const typing = document.createElement('div');
  typing.className = 'msg bot typing'; typing.innerHTML = '<span></span><span></span><span></span>';
  $('#aiMsgs').appendChild(typing); $('#aiMsgs').scrollTop = $('#aiMsgs').scrollHeight;
  try {
    const reply = await llmComplete({ system: buildTutorSystem(), messages: tutorHistory.slice(-12), maxTokens: 700 });
    tutorHistory.push({ role: 'assistant', content: reply });
    typing.classList.remove('typing');
    typing.innerHTML = esc(reply).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    $('#aiMsgs').scrollTop = $('#aiMsgs').scrollHeight;
  } catch (e) {
    typing.remove();
    toast(`Claude error: ${String(e.message).slice(0, 80)} — falling back to demo reply`, '⚠️');
    tutorHistory.pop();
    scriptedRespond(text);
  }
}
function tutorRespond(text) {
  const t0 = text.toLowerCase();
  /* quiz launches stay native — they open the real quiz modal */
  if (t0.includes('quiz')) {
    const id = currentCourseId();
    botSay(`Loading a checkpoint quiz for <b>${id ? courseById(id).title : 'your current course'}</b>… 3 questions, adaptive. Good luck 🎯`);
    setTimeout(() => openQuiz(id || 'leading-data'), 900);
    return;
  }
  if (aiKey()) { askClaude(text); return; }
  scriptedRespond(text);
}
function scriptedRespond(text) {
  const id = currentCourseId(); const c = id && courseById(id);
  const t0 = text.toLowerCase();
  const pt = _lang() === 'pt';
  const title = c ? ctitle(c) : '';
  const mods = c ? cmods(c) : [];
  if (t0.includes('quiz') || t0.includes('teste')) {
    botSay(pt ? `A preparar um teste de verificação para <b>${c ? title : 'o seu curso atual'}</b>… 3 perguntas, adaptativo. Boa sorte 🎯`
              : `Loading a checkpoint quiz for <b>${c ? title : 'your current course'}</b>… 3 questions, adaptive. Good luck 🎯`);
    setTimeout(() => openQuiz(id || 'leading-data'), 900); return;
  }
  if (t0.includes('summar') || t0.includes('recap') || t0.includes('resum')) {
    botSay(c ? (pt ? `<b>${title}</b> num fôlego: ${cdesc(c)} Os módulos constroem até “${mods[mods.length - 1]}” — e pelo seu histórico de testes, dê atenção extra ao módulo ${Math.min(3, mods.length)}: “${mods[Math.min(2, mods.length - 1)]}”.`
                    : `<b>${title}</b> in one breath: ${cdesc(c)} The modules build toward “${mods[mods.length - 1]}” — and based on your quiz history, pay extra attention to module ${Math.min(3, mods.length)}: “${mods[Math.min(2, mods.length - 1)]}”.`)
             : (pt ? `Abra um curso e eu resumo-o a pensar nas suas lacunas.` : `Open a course and I'll summarize it with your gaps in mind.`)); return;
  }
  if (t0.includes('path') || t0.includes('percurso')) {
    botSay(pt ? `É para já — reequilibrei o seu percurso rumo a <b>${tgoal(S.goal)}</b>. Veja o separador Percursos; adiantei a sua competência mais fraca e cortei o que já provou saber.`
              : `On it — I rebalanced your path toward <b>${tgoal(S.goal)}</b>. Check the Paths tab; I moved your weakest verified skill earlier and trimmed what you've already proven.`);
    setTimeout(regenPath, 800); return;
  }
  if (t0.includes('explain') || t0.includes('new') || t0.includes('explica')) {
    botSay(c ? (pt ? `Claro — imagine <b>${title.toLowerCase()}</b> como aprender a conduzir: os primeiros módulos são espelhos-e-cinto, os do meio são trânsito real, e o final é o exame de condução. Está a ${coursePct(c.id) || 0}% — em pleno “trânsito real”. 🚗`
                    : `Sure — imagine <b>${title.toLowerCase()}</b> as learning to drive: the early modules are mirrors-and-seatbelt basics, the middle ones are real traffic, and the capstone is your driving test. You're ${coursePct(c.id) || 0}% in — solidly “real traffic”. 🚗`)
             : (pt ? `Com todo o gosto — abra qualquer curso e explico-o do zero.` : `Happy to — open any course and I'll explain it from zero.`)); return;
  }
  if (t0.includes('due') || t0.includes('deadline') || t0.includes('assigned') || t0.includes('prazo')) {
    botSay(pt ? `Tem <b>Segurança contra Incêndios na Terra</b> com prazo em 3 dias (faltam 8 minutos no módulo atual — vitória fácil), e o <b>Viver com as Estações</b> da equipa tem prazo a 30 de junho.`
              : `You have <b>Fire Safety on the Land</b> due in 3 days (8 minutes left in your current module — easy win), and the team's <b>Living by the Seasons</b> is due June 30.`); return;
  }
  botSay(c ? (pt ? `Boa pergunta. No contexto de <b>${title}</b>: ${cdesc(c).split('.')[0]}. Quer que transforme isto em flashcards, ou que ponha o módulo relacionado na fila?`
                  : `Good question. In the context of <b>${title}</b>: ${cdesc(c).split('.')[0]}. Want me to turn that into flashcards, or queue the related module?`)
           : (pt ? `Posso resumir cursos, testá-lo, acompanhar prazos ou reconstruir o seu percurso — experimente “o que tem prazo?” ou “teste-me”.`
                  : `I can summarize courses, quiz you, track deadlines, or rebuild your path — try “what's due?” or “quiz me”.`));
}

/* ---------- path regeneration ---------- */
function regenPath() {
  const btn = $('#regenBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="regen-thinking">✦ AI re-planning<span class="typing" style="padding:0"><span></span><span></span><span></span></span></span>`; }
  setTimeout(() => {
    const done = S.path.filter(isDone);
    const rest = S.path.filter(x => !isDone(x));
    if (rest.length > 2) { const cur = rest.shift(); rest.push(rest.shift()); rest.unshift(cur); } /* keep current, rotate the queue */
    const pool = ['forecasting', 'metrics', 'systems'].filter(x => !S.path.includes(x));
    if (pool.length && S.path.length < 7) rest.splice(2, 0, pool[0]);
    S.path = [...done, ...rest];
    S.rationaleIdx = (S.rationaleIdx + 1) % PATH_RATIONALES.length;
    save(); render();
    toast('Path re-planned by ' + brandName() + ' AI', '✦');
  }, 1400);
}

/* ---------- global click handling ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  /* close avatar menu on outside click */
  if (!e.target.closest('.avatar') && !e.target.closest('.avatar-menu')) $('#avatarMenu').classList.remove('open');
  if (!e.target.closest('.bell') && !e.target.closest('.nudge-panel')) { const bp = $('#bellPanel'); if (bp) bp.classList.remove('open'); }
  if (!el) return;
  e.stopPropagation();
  const { action, id, mod, dir, route, cat, msg } = el.dataset;
  switch (action) {
    case 'open-course': location.hash = '#/course/' + id; break;
    case 'goto': location.hash = route; break;
    case 'play': openPlayer(id, mod != null ? +mod : undefined); break;
    case 'toggle-path':
      if (inPath(id)) { S.path = S.path.filter(x => x !== id); toast(`Removed from your path`, '－'); }
      else { S.path.push(id); toast(`Added to your AI path — it'll be sequenced after your current step`, '✦'); }
      save(); render(); break;
    case 'quiz': openQuiz(id); break;
    case 'quiz-close': {
      $('#quizModal').classList.remove('open');
      const failed = quiz && S.review[quiz.courseId] != null;
      if (failed) location.hash = '#/course/' + quiz.courseId;
      render(); break;
    }
    case 'rail': el.parentElement.querySelector('.rail').scrollBy({ left: +dir * 640, behavior: 'smooth' }); break;
    case 'regen-path': regenPath(); break;
    case 'remind':
      el.classList.toggle('on');
      if (S.reminders.includes(id)) { S.reminders = S.reminders.filter(x => x !== id); toast('Reminder removed', '🔕'); }
      else { S.reminders.push(id); toast('We\'ll ping you 10 minutes before', '🔔'); }
      save(); break;
    case 'join-live': {
      toast('Joining the live studio…', '🔴');
      if (!(S.attended || (S.attended = [])).includes(id)) { S.attended.push(id); save(); setTimeout(() => awardXp(15, t('live_attended')), 1200); }
      const s = liveList().find(x => x.id === id);
      setTimeout(() => {
        playing = null;
        videoEl.src = VIDS[7];
        $('#playerTitle').textContent = s.title;
        $('#playerSub').textContent = `LIVE · ${s.host}`;
        $('#playerPills').innerHTML = `<span class="mod-pill current">🔴 LIVE · ${s.viewers} watching</span><span class="mod-pill">Replay available tomorrow</span>`;
        playerEl.classList.add('open'); videoEl.play().catch(() => {});
      }, 600); break;
    }
    case 'lib-filter': libFilter = cat; render(); break;
    case 'ai-overview': {
      const c = courseById(id);
      setTutorOpen(true);
      botSay(`<b>${c.title}</b> — AI overview: ${c.desc} You'd be joining ${c.learners} fellow stewards (★ ${c.rating}). Given your goal (<b>${S.goal}</b>), I'd slot it ${inPath(id) ? 'right where it already is in your path' : 'after your current course'}. Want me to add it?`);
      break;
    }
    case 'ai-open': setTutorOpen(true); break;
    case 'ai-missing': setTutorOpen(true); botSay(t('missing_prompt'), 400); break;
    case 'take-go': resolveTakeaways(); break;
    case 'take-quiz': resolveTakeaways(true); break;
    case 'daily-answer': answerDaily(el); break;
    case 'orgkey-save': {
      const k = ($('#orgKeyInput').value || '').trim();
      const mdl = ($('#orgModelInput') && $('#orgModelInput').value || '').trim();
      const mdlH = ($('#orgModelHeavy') && $('#orgModelHeavy').value || '').trim();
      if (!(window.EdenCloud && EdenCloud.saveOrgConfig)) { toast(t('mail_failed'), '⚠️'); break; }
      EdenCloud.saveOrgConfig({ aiKey: k, aiModel: mdl, aiModelHeavy: mdlH }).then(() => {
        window.EdenOrg = Object.assign({}, window.EdenOrg, { aiKey: k, aiModel: mdl, aiModelHeavy: mdlH });
        syncTutorStatus();
        toast(t('orgkey_saved'), '🌿');
      }).catch(() => toast(t('mail_failed'), '⚠️'));
      break;
    }
    case 'studio-gen': studioGenerate(); break;
    case 'studio-publish': studioPublish(); break;
    case 'studio-discard': studioDraft = null; $('#stDraft').innerHTML = ''; break;
    case 'studio-del': {
      if (!confirm(t('studio_delete_confirm'))) break;
      if (window.EdenCloud && EdenCloud.deleteCourse) EdenCloud.deleteCourse(id).then(() => {
        const i = CATALOG.findIndex(x => x.id === id && x.custom); if (i >= 0) CATALOG.splice(i, 1);
        editingCourse = null;
        toast(t('comm_deleted'), '－'); render();
      });
      break;
    }
    case 'admin-tab': adminTab = el.dataset.tab; editingCourse = null; liveDraft = null; render(); initAdmin(); break;
    case 'ce-open': openCourseEditor(id); break;
    case 'ce-cancel': editingCourse = null; render(); break;
    case 'ce-save': ceSave(); break;
    case 'ce-revert': ceRevert(); break;
    case 'ce-mod-add': readEditorDOM(); editingCourse.mods.push({ en: '', pt: '', video: '', mins: 12 }); render(); break;
    case 'ce-mod-del': readEditorDOM(); editingCourse.mods.splice(+el.dataset.idx, 1); render(); break;
    case 'bc-send': bcSend(); break;
    case 'bc-del': {
      if (!confirm('Delete this broadcast?')) break;
      EdenForum.remove(id).then(() => { toast(t('comm_deleted'), '－'); initAdmin(); });
      break;
    }
    case 'lv-add': readLiveRows(); liveDraft.push({ title: '', host: '', when: '', desc: '', live: false }); render(); break;
    case 'lv-del': readLiveRows(); liveDraft.splice(+el.dataset.idx, 1); render(); break;
    case 'lv-save': lvSave(); break;
    case 'cert-dl': premiumCourseCert(id); break;
    case 'mis-submit': submitMission(id); break;
    case 'mis-claim': claimMission(id, el.dataset.course); break;
    case 'mis-review': EdenMissions.review(id, el.dataset.ok === '1').then(() => { toast(el.dataset.ok === '1' ? '🌾 Approved' : 'Declined', el.dataset.ok === '1' ? '✓' : '－'); initAdmin(); }); break;
    case 'coach-open': openCoach(id); break;
    case 'coach-close': $('#coachModal').classList.remove('open'); break;
    case 'coach-send': coachSend(); break;
    case 'coach-finish': coachFinish(); break;
    case 'coach-again': $('#coachModal').classList.remove('open'); setTimeout(() => openCoach(id), 200); break;
    case 'rate': {
      (S.ratings || (S.ratings = {}))[id] = +el.dataset.n; save();
      const blk = el.closest('.rate-block'); if (blk) { const w = document.createElement('div'); w.innerHTML = ratingStarsHTML(id); blk.replaceWith(w.firstElementChild); }
      toast(t('rate_thanks'), '🌿');
      break;
    }
    case 'cal-ics': { const s = liveList().find(x => x.id === id); if (s) icsForSession(s); break; }
    case 'seq-locked': toast(t('mod_locked'), '🔒'); break;
    case 'tutor-mode': {
      S.tutorMode = el.dataset.mode; save();
      document.querySelectorAll('#tutorModes .tmode').forEach(b => b.classList.toggle('on', b.dataset.mode === S.tutorMode));
      toast(t('mode_tip_' + S.tutorMode), '✦');
      break;
    }
    case 'story-gen': generateLearnStory(true); break;
    case 'guard-save': {
      const aiGuard = { courseOnly: $('#guardCourseOnly').checked, blocked: ($('#guardBlocked').value || '').trim() };
      EdenCloud.saveOrgConfig({ aiGuard }).then(() => { window.EdenOrg = Object.assign({}, window.EdenOrg, { aiGuard }); toast('Guardrails saved', '🔒'); }).catch(() => toast(t('mail_failed'), '⚠️'));
      break;
    }
    case 'ask-go': openAsk($('#askInput') && $('#askInput').value); break;
    case 'ask-close': $('#askModal').classList.remove('open'); break;
    case 'ask-ref': $('#askModal').classList.remove('open'); location.hash = '#/course/' + id; break;
    case 'board-scope': boardScope = el.dataset.v; render(); break;
    case 'flash-open': openFlash(); break;
    case 'flash-flip': flashFlipped = !flashFlipped; $('#flashBody').innerHTML = flashCardHTML(); break;
    case 'flash-next': flashNext(); break;
    case 'flash-close': $('#flashModal').classList.remove('open'); break;
    case 'open-journey': location.hash = '#/journey/' + id; break;
    case 'jour-cert': premiumJourneyCert(id); break;
    case 'ai-digest': generateCockpitDigest(); break;
    case 'comp-cert': premiumComplianceCert(); break;
    case 'comp-register': downloadTrainingRegister(); break;
    case 'ru-annex': downloadRUannex(); break;
    case 'vcert': downloadVerifiedCert(id); break;
    case 'hour-log': downloadHourLog(); break;
    case 'art4-pack': downloadArt4Pack(true); break;
    case 'art4-self': downloadArt4Pack(false); break;
    case 'ev-export': downloadEvidenceExport(); break;
    case 'app-confirm': confirmApplication(id, 'confirmed'); break;
    case 'app-deny': confirmApplication(id, 'not_seen'); break;
    case 'intent-save': {
      const txt = ($('#intentText') && $('#intentText').value || '').trim();
      if (!txt) { toast(t('intent_ph'), '🌱'); break; }
      (S.intentions = S.intentions || {})[el.dataset.id] = { text: txt, at: Date.now(), checks: {} };
      ledgerAppend('intention_set', { courseId: el.dataset.id, text: txt.slice(0, 140) });
      save(); el.closest('.intent-box').innerHTML = `<p class="pre-sub">🌱 ${t('intent_saved')}</p>`;
      break;
    }
    case 'app-check': {
      const cid2 = el.dataset.id, day = +el.dataset.day, applied = el.dataset.applied === '1';
      const it = (S.intentions || {})[cid2]; if (!it) break;
      (it.checks = it.checks || {})[day] = true;
      ledgerAppend('application_checkin', { courseId: cid2, day, applied });
      save(); render();
      toast(applied ? t('appcheck_bravo') : t('appcheck_ok'), applied ? '🎉' : '🌱');
      break;
    }
    case 'gdpr-doc': downloadGdprDoc(el.dataset.kind); break;
    case 'member-detail': openMemberDetail(el.dataset.uid); break;
    case 'mdet-close': { const mv = $('#mdetModal'); if (mv) mv.remove(); break; }
    case 'mdet-register': downloadMemberRegister(el.dataset.uid); break;
    case 'mdet-exit': downloadExitStatement(el.dataset.uid); break;
    case 'co-save': saveCompanySettings(); break;
    case 'co-create': createCompanyFromForm(); break;
    case 'co-toggle': {
      const co = (companiesCache || []).find(x => x.id === el.dataset.id); if (!co) break;
      EdenCloud.saveCompany({ id: co.id, status: co.status === 'suspended' ? 'active' : 'suspended' })
        .then(() => { co.status = co.status === 'suspended' ? 'active' : 'suspended'; const l = $('#coList'); if (l) l.innerHTML = companiesListHTML(); toast('Updated', '✓'); });
      break;
    }
    case 'co-copy-invite': {
      const co = window.EdenCompany || {};
      const link = `${location.origin}${location.pathname}?join=${co.inviteCode || ''}`;
      navigator.clipboard && navigator.clipboard.writeText(link).then(() => toast('Invite link copied', '✉️')).catch(() => prompt('Copy the invite link:', link));
      break;
    }
    case 'co-rotate-invite': EdenCloud.rotateInvite().then(() => { toast('New invite code generated', '↺'); render(); }).catch(() => toast('Could not rotate', '⚠️')); break;
    case 'dig-open': openDigest(id); break;
    case 'dig-close': $('#digModal').classList.remove('open'); break;
    case 'dig-publish': digPublish(); break;
    case 'intel-gaps': findContentGaps(); break;
    case 'quiz-flag': { /* honesty loop — members can flag a question that looks wrong */
      const fq = quiz && quiz.qs && quiz.qs[quiz.idx]; if (!fq) break;
      S.qFlags = ((S.qFlags || []).filter(f => f.q !== fq.q)).concat({ q: fq.q, courseId: quiz.courseId, ai: !!quiz.ai, at: Date.now() }).slice(-20);
      save(); toast(t('quiz_flagged'), '⚑'); break;
    }
    case 'ck-ask': cockpitAsk(); break;
    case 'gap-draft': {
      adminTab = 'content'; editingCourse = null; render();
      setTimeout(() => { const ti = $('#stTitle'); if (ti) { ti.value = el.dataset.title; ti.scrollIntoView({ block: 'center' }); const tx = $('#stText'); if (tx) tx.focus(); } }, 250);
      toast('Paste the source material and generate ✦', 'ℹ️');
      break;
    }
    case 'dig-del': {
      if (!confirm('Delete this digest for everyone?')) break;
      EdenCloud.deleteDigest(id).then(() => { digestsCache = digestsCache.filter(x => x.id !== id); toast(t('comm_deleted'), '－'); render(); });
      break;
    }
    case 'tour-next': tourShow(tourIdx + 1); break;
    case 'tour-back': tourShow(tourIdx - 1); break;
    case 'tour-end': endTour(); break;
    case 'tour-start': S.tourDone = false; location.hash = '#/home'; setTimeout(startTour, 600); break;
    case 'pwa-install': if (pwaEvt) { pwaEvt.prompt(); pwaEvt = null; } localStorage.setItem('eden-pwa-nudged', '1'); const pb = $('#pwaBar'); if (pb) pb.remove(); break;
    case 'pwa-dismiss': localStorage.setItem('eden-pwa-nudged', '1'); const pb2 = $('#pwaBar'); if (pb2) pb2.remove(); break;
    case 'seed-demo': seedDemo(); break;
    case 'voice-search': startVoiceSearch(); break;
    case 'save-profile': saveProfile(); break;
    case 'gdpr-export': exportMyData(); break;
    case 'gdpr-delete': deleteMyAccount(); break;
    case 'notif-toggle': toggleNotif(el.dataset.ch); break;
    case 'comm-channel': commChannel = el.dataset.ch; commThread = null; render(); break;
    case 'comm-open': commThread = id; render(); break;
    case 'comm-back': commThread = null; render(); break;
    case 'comm-post': submitPost(); break;
    case 'comm-reply': submitReply(); break;
    case 'comm-like': {
      if (!forumCanPost()) { showLoginGate(); break; }
      const post = commPosts.find(x => x.id === id);
      const liked = post && post.likedBy && post.likedBy.includes(myUid());
      EdenForum.toggleLike(id, liked); break;
    }
    case 'comm-rlike': {
      if (!forumCanPost()) { showLoginGate(); break; }
      const rep = commReplies.find(x => x.id === el.dataset.rid);
      const liked = rep && rep.likedBy && rep.likedBy.includes(myUid());
      EdenForum.toggleReplyLike(id, el.dataset.rid, liked); break;
    }
    case 'comm-react': {
      if (!forumCanPost()) { showLoginGate(); break; }
      const post = commPosts.find(x => x.id === id);
      const on = !(post && post.reactions && post.reactions[el.dataset.emoji] && post.reactions[el.dataset.emoji].includes(myUid()));
      EdenForum.react(id, el.dataset.emoji, on);
      break;
    }
    case 'comm-react-pick': el.classList.toggle('open'); break;
    case 'comm-vote': {
      if (!forumCanPost()) { showLoginGate(); break; }
      EdenForum.vote(id, +el.dataset.opt);
      break;
    }
    case 'comm-poll-toggle': { const pb = $('#pollBuilder'); if (pb) pb.style.display = pb.style.display === 'none' ? '' : 'none'; break; }
    case 'member-card': showMemberCard(el); break;
    case 'embed-play': {
      const [kind, vid] = el.dataset.embed.split(':');
      const src = kind === 'yt' ? `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1` : `https://player.vimeo.com/video/${vid}?autoplay=1&dnt=1`;
      const wrap = document.createElement('div'); wrap.className = 'post-embed-live';
      wrap.innerHTML = `<iframe src="${src}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>`;
      el.replaceWith(wrap);
      break;
    }
    case 'comm-pin': {
      const post = commPosts.find(x => x.id === id);
      if (post && window.EdenForum) EdenForum.togglePin(id, !!post.pinned);
      break;
    }
    case 'comm-del': {
      if (!confirm(t('comm_confirm_del'))) break;
      if (window.EdenForum) EdenForum.remove(id).then(() => toast(t('comm_deleted'), '－'));
      if (commThread === id) { commThread = null; render(); }
      break;
    }
    case 'comm-rdel': {
      if (!confirm(t('comm_confirm_del_reply'))) break;
      if (window.EdenForum) EdenForum.removeReply(id, el.dataset.rid).then(() => toast(t('comm_deleted'), '－'));
      break;
    }
    case 'show-login': document.documentElement.setAttribute('data-gate', 'on'); break;
    case 'signout': if (window.EdenCloud && window.EdenCloud.signOut) window.EdenCloud.signOut(); else toast('Sign-in ships once Firebase is connected', '👋'); break;
    case 'toast-msg': toast(msg, 'ℹ️'); break;
    case 'privacy-note': toast(t('comm_privacy'), '🔒'); break;
    case 'nudge':
      if (el.dataset.uid) emailNudgeMember(el.dataset.uid, el);
      else toast(`Nudge queued for ${el.dataset.name} — sends once email/WhatsApp delivery is connected`, '👋');
      break;
    case 'export-members': exportMembersCSV(); break;
    case 'assign': {
      const courseId = $('#asgCourse').value, team = $('#asgTeam').value, due = $('#asgDue').value || '';
      const assignments = activeAssignments().concat([{ id: 'asg-' + courseId + '-' + team, courseId, team, due }]);
      saveAssignments(assignments, `Assigned “${courseById(courseId).title}”`);
      break;
    }
    case 'unassign': {
      const assignments = activeAssignments().slice(); assignments.splice(+el.dataset.idx, 1);
      saveAssignments(assignments, 'Assignment removed');
      break;
    }
    case 'reset-demo': localStorage.removeItem('edenrise-state-v2'); location.hash = '#/home'; location.reload(); break;
  }
});

/* nav & chrome events */
addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', scrollY > 30), { passive: true });
$('#navSearch').addEventListener('click', openPalette);
$('#avatarBtn').addEventListener('click', e => { e.stopPropagation(); const open = $('#avatarMenu').classList.toggle('open'); $('#avatarBtn').setAttribute('aria-expanded', open ? 'true' : 'false'); });
$('#bellBtn').addEventListener('click', e => { e.stopPropagation(); $('#avatarMenu').classList.remove('open'); openBell(); });

/* mobile drawer */
const mDrawer = $('#mobileDrawer'), mBurger = $('#navBurger');
function setDrawer(open) {
  mDrawer.classList.toggle('open', open);
  mBurger.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.style.overflow = open ? 'hidden' : '';
}
mBurger.addEventListener('click', () => setDrawer(true));
$('#drawerClose').addEventListener('click', () => setDrawer(false));
mDrawer.addEventListener('click', e => { if (e.target === mDrawer || e.target.closest('.mobile-drawer a')) setDrawer(false); });
addEventListener('hashchange', () => setDrawer(false));

/* a11y: Enter/Space activates focused clickable (non-native) elements */
addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = document.activeElement;
  if (!el || /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
  if (el.matches('[data-action], [role="button"]')) { e.preventDefault(); el.click(); }
});
$('#playerBack').addEventListener('click', closePlayer);
$('#playerComplete').addEventListener('click', () => { if (playing) completeModule(playing.courseId, playing.mod); else closePlayer(); });
$('#aiFab').addEventListener('click', () => setTutorOpen(!tutorPanel.classList.contains('open')));
$('#aiSend').addEventListener('click', sendTutor);
$('#aiInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendTutor(); });
function sendTutor() {
  const i = $('#aiInput'); const t = i.value.trim(); if (!t) return;
  addMsg(esc(t), 'user'); i.value = ''; tutorRespond(t);
}
$$('.quick').forEach(b => b.addEventListener('click', () => { addMsg(b.textContent, 'user'); tutorRespond(b.dataset.intent || b.textContent); }));

/* palette events */
$('#palInput').addEventListener('input', e => drawPalette(e.target.value));
$('#palInput').addEventListener('keydown', e => {
  const items = $$('#palResults .palette-item');
  if (e.key === 'ArrowDown') { palIdx = Math.min(palIdx + 1, items.length - 1); highlightPal(); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { palIdx = Math.max(palIdx - 1, 0); highlightPal(); e.preventDefault(); }
  else if (e.key === 'Enter' && items[palIdx]) runPal(items[palIdx]);
});
$('#palResults').addEventListener('click', e => { const it = e.target.closest('.palette-item'); if (it) runPal(it); });
$('#palette').addEventListener('click', e => { if (e.target === $('#palette')) closePalette(); });
$('#quizModal').addEventListener('click', e => { if (e.target === $('#quizModal')) { $('#quizModal').classList.remove('open'); render(); } });
$('#takeModal').addEventListener('click', e => { if (e.target === $('#takeModal')) resolveTakeaways(); });

addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
  if (e.key === 'Escape') {
    const pop = document.querySelector('.member-card-pop');
    const openM = ['#coachModal', '#askModal', '#flashModal', '#digModal'].map(s => $(s)).find(m => m && m.classList.contains('open'));
    if ($('#tourOv')) endTour();
    else if (pop) pop.remove();
    else if (openM) openM.classList.remove('open');
    else if ($('#takeModal').classList.contains('open')) resolveTakeaways();
    else if (mDrawer.classList.contains('open')) setDrawer(false);
    else if ($('#palette').classList.contains('open')) closePalette();
    else if ($('#quizModal').classList.contains('open')) { $('#quizModal').classList.remove('open'); render(); }
    else if (playerEl.classList.contains('open')) closePlayer();
    else setTutorOpen(false);
  }
});

/* tutor settings */
function syncTutorModesUI() {
  document.querySelectorAll('#tutorModes .tmode').forEach(b => { b.classList.toggle('on', b.dataset.mode === (S.tutorMode || 'explain')); const k = b.dataset.tk; if (k) b.textContent = t(k); b.title = t('mode_tip_' + b.dataset.mode); });
  const g = $('#groundedNote'); if (g) g.textContent = '🔒 ' + t('grounded_note');
}
function syncTutorStatus() {
  syncTutorModesUI();
  const orgOnly = !S.apiKey && aiKey();
  const prov = llmProviderOf(aiKey(), aiModel());
  const label = { gemini: 'Gemini', anthropic: 'Claude', openrouter: 'OpenRouter', groq: 'Groq', deepseek: 'DeepSeek', mistral: 'Mistral', openai: 'OpenAI' }[prov] || 'AI';
  $('#tutorStatus').textContent = aiKey()
    ? `● Live · ${aiModel() || label + ' · ' + (LLM_DEFAULTS[prov] || '')}${orgOnly ? ' · team key' : ''}`
    : '● Demo mode · scripted replies';
}
$('#tutorSettingsBtn').addEventListener('click', () => {
  $('#apiKeyInput').value = S.apiKey || '';
  $('#aiModelSelect').value = S.aiModel || 'claude-opus-4-8';
  $('#tutorSettings').classList.toggle('open');
});
$('#apiKeySave').addEventListener('click', () => {
  S.apiKey = $('#apiKeyInput').value.trim();
  S.aiModel = $('#aiModelSelect').value;
  save(); syncTutorStatus();
  $('#tutorSettings').classList.remove('open');
  tutorHistory = [];
  toast(S.apiKey ? 'Tutor is now powered by Claude — ask it anything' : 'No key entered — staying in demo mode', '✦');
});
$('#apiKeyClear').addEventListener('click', () => {
  S.apiKey = ''; save(); syncTutorStatus();
  $('#tutorSettings').classList.remove('open');
  toast('Demo mode — replies are scripted', 'ℹ️');
});
syncTutorStatus();

/* ---------- onboarding ---------- */
let ob = { step: 0, role: null, goal: null, username: '' };
/* true when the user has clearly used the platform before — used to avoid
   re-onboarding a returning user whose `onboarded` flag was lost. */
function hasLearningHistory() {
  return !!(
    (S.progress && Object.keys(S.progress).length) ||
    (S.badges && S.badges.length) ||
    (S.quizzesPassed > 0) ||
    (S.trainingLog && S.trainingLog.length) ||
    (S.streak > 0) ||
    (S.profile && (S.profile.username || S.profile.role || S.profile.nif)) ||
    (S.xp && S.xp > (typeof seedXp === 'function' ? seedXp() : 0))
  );
}
function startOnboarding() {
  ob = { step: 0, role: (S.profile && S.profile.role) || null, goal: null, username: (S.profile && S.profile.username) || '' };
  $('#onboard').classList.add('open');
  drawOnboard();
}
function drawOnboard() {
  const body = $('#obBody');
  $('#obFill').style.width = [33, 66, 100][ob.step] + '%';
  if (ob.step === 0) {
    body.innerHTML = `
      <div class="ob-eyebrow">${t('ob_step')} 1 ${t('of')} 3 · ${t('ob_welcome')}</div>
      <div class="ob-title">${t('ob_hi')} ${firstName()} 🌱</div>
      <p class="ob-sub">${t('ob_pick_handle')}</p>
      <div class="ob-handle"><span>@</span><input id="obUsername" class="ob-input" maxlength="20" autocomplete="off" placeholder="${suggestHandle()}" value="${esc((ob.username || '').replace(/^@/, ''))}"></div>
      <p class="ob-sub" style="margin-top:16px;">${t('ob_role_q')}</p>
      <div class="ob-grid">${ROLE_OPTIONS.map(r => `
        <div class="ob-option ${ob.role === r.key ? 'sel' : ''}" data-role="${r.key}">
          <span class="oi">${svgIcon(r.icon)}</span><div>${trole(r)}<div class="od">${tgoal(r.goals[0])} ${t('track_more')}</div></div>
        </div>`).join('')}
      </div>
      <div class="ob-foot">
        <button class="ob-skip" id="obSkip">${t('ob_skip')}</button>
        <span style="flex:1"></span>
        <button class="btn btn-primary" id="obNext" ${ob.role ? '' : 'disabled style="opacity:.5"'}>${t('ob_continue')}</button>
      </div>`;
    const grabHandle = () => { const u = $('#obUsername'); if (u) ob.username = u.value.trim(); };
    body.querySelectorAll('.ob-option').forEach(o => o.addEventListener('click', () => { grabHandle(); ob.role = o.dataset.role; drawOnboard(); }));
  } else if (ob.step === 1) {
    const role = ROLE_OPTIONS.find(r => r.key === ob.role) || ROLE_OPTIONS[0];
    const goals = [...new Set([...role.goals, ...Object.keys(GOAL_PRESETS)])].slice(0, 4);
    body.innerHTML = `
      <div class="ob-eyebrow">${t('ob_step')} 2 ${t('of')} 3 · ${t('ob_destination')}</div>
      <div class="ob-title">${t('ob_q2')}</div>
      <p class="ob-sub">${t('ob_q2_sub')}</p>
      <div class="ob-grid">${goals.map(g => `
        <div class="ob-option ${ob.goal === g ? 'sel' : ''}" data-goal="${g}">
          <span class="oi">${svgIcon(courseById(GOAL_PRESETS[g][0]).icon)}</span><div>${tgoal(g)}<div class="od">${GOAL_PRESETS[g].length} ${t('courses_adaptive')}</div></div>
        </div>`).join('')}
      </div>
      <div class="ob-foot">
        <button class="ob-skip" id="obBack">← ${_lang() === 'pt' ? 'Voltar' : 'Back'}</button>
        <span style="flex:1"></span>
        <button class="btn btn-primary" id="obNext" ${ob.goal ? '' : 'disabled style="opacity:.5"'}>${t('ob_build')}</button>
      </div>`;
    body.querySelectorAll('.ob-option').forEach(o => o.addEventListener('click', () => { ob.goal = o.dataset.goal; drawOnboard(); }));
    $('#obBack').addEventListener('click', () => { ob.step = 0; drawOnboard(); });
  } else {
    body.innerHTML = `
      <div class="ob-gen">
        <div class="orb-spin"></div>
        <div class="ob-title" style="font-size:24px;">${t('ob_building')} ${tgoal(ob.goal)}</div>
        <div class="gen-line" id="genLine">${_lang() === 'pt' ? 'A ler o seu perfil…' : 'Reading your role profile…'}</div>
      </div>`;
    const lines = _lang() === 'pt'
      ? ['A ler o seu perfil…', 'A percorrer a biblioteca ' + brandName() + '…', 'A ver competências que pode saltar…', 'A sequenciar 4–6 cursos…', 'Concluído ✓']
      : ['Reading your role profile…', 'Scanning the ' + brandName() + ' library…', 'Checking skills you can skip…', 'Sequencing 4–6 courses…', 'Done ✓'];
    let i = 0;
    const iv = setInterval(() => {
      i++;
      if (i < lines.length) { $('#genLine').textContent = lines[i]; return; }
      clearInterval(iv);
      S.goal = ob.goal;
      S.path = [...GOAL_PRESETS[ob.goal]];
      S.role = ob.role;
      const handle = slugHandle(ob.username) || suggestHandle();
      /* guests have no auth name — the handle they just picked becomes their display name */
      S.profile = Object.assign({}, S.profile, { username: handle, role: ob.role }, (S.profile && S.profile.name) ? {} : { name: handle });
      S.onboarded = true;
      save();   /* → syncs the profile (name, @username, role) + path to the account in Firestore */
      $('#onboard').classList.remove('open');
      render();
      toast(`${_lang() === 'pt' ? 'O seu percurso para' : 'Your AI path to'} ${tgoal(ob.goal)} ${_lang() === 'pt' ? 'está pronto' : 'is ready'}`, '✦');
      setTimeout(() => { setTutorOpen(true); }, 900);
    }, 750);
  }
  const next = $('#obNext');
  if (next) next.addEventListener('click', () => {
    if (ob.step === 0) { const u = $('#obUsername'); if (u) ob.username = u.value.trim(); if (!ob.role) return; }
    if (ob.step === 1 && !ob.goal) return;
    ob.step++; drawOnboard();
  });
  const skip = $('#obSkip');
  if (skip) skip.addEventListener('click', () => { S.onboarded = true; save(); $('#onboard').classList.remove('open'); });
}

/* avatar menu actions */
$('#avatarMenu').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $('#avatarMenu').classList.remove('open');
  if (b.dataset.m === 'profile') location.hash = '#/profile';
  if (b.dataset.m === 'onboard') startOnboarding();
  if (b.dataset.m === 'reset') { localStorage.removeItem('edenrise-state-v2'); location.hash = '#/home'; location.reload(); }
  if (b.dataset.m === 'signout') { if (window.EdenCloud && window.EdenCloud.signOut) window.EdenCloud.signOut(); else toast('Sign-in ships once Firebase is connected', '👋'); }
});

/* ---------- bridge for the Firebase auth module (auth.js) ---------- */
window.EdenApp = {
  reloadState() {
    try { S = Object.assign({}, structuredClone(DEFAULT_STATE), JSON.parse(localStorage.getItem('edenrise-state-v2') || '{}')); } catch (e) {}
    if (S.xp == null) S.xp = seedXp();
    if (!S.badges) S.badges = [];
    checkBadges(true);
    updateXpChip(); render();
    setTimeout(applyPendingJoin, 600);
    this.maybeOnboard();
    if (S.onboarded) welcomeNudge();
  },
  maybeOnboard() {
    /* Returning-user safety net: the `onboarded` flag can be lost (iOS evicts
       PWA/Safari storage after ~7 idle days; an in-app browser like WhatsApp has
       isolated storage; Firebase auth can resolve a beat after the null state).
       Anyone who already has real history must NEVER be dumped back into
       onboarding — land them on their home page instead. */
    if (!S.onboarded && hasLearningHistory()) { S.onboarded = true; save(); }
    if (S.onboarded) { const ob = $('#onboard'); if (ob) ob.classList.remove('open'); return; }
    startOnboarding();
  },
  applyProfile(p) {
    if (!p) return;
    S.profile = Object.assign({}, S.profile, p); save();   /* merge — keep username/bio set during onboarding */
    if (p.email) ledgerAppend('consent_given', { via: 'signin' });   /* GDPR consent is part of the evidence record (idempotent) */
    const av = $('#avatarBtn'); if (av) { av.textContent = userInitials(); av.title = displayName(); }
  },
  currentState() { return S; },
  /* merge team-published (studio) courses into the catalog.
     Cloud docs with a catalog id REPLACE that entry (admin edits); the original
     is kept in ORIG_COURSES so "Revert" can restore it without a reload. */
  applyCustomCourses(list, single) {
    const put = c => {
      const i = CATALOG.findIndex(x => x.id === c.id);
      if (i >= 0) {
        if (!CATALOG[i].custom && !CATALOG[i].edited) ORIG_COURSES[c.id] = { c: CATALOG[i], hooks: COURSE_HOOKS[c.id], hooksPt: COURSE_HOOKS_PT[c.id], pt: COURSE_PT[c.id] };
        CATALOG[i] = c;
      } else CATALOG.push(c);
      if (c.edited) {   /* an edited catalog course must beat the static i18n/hook maps */
        if (c.hook != null) COURSE_HOOKS[c.id] = [c.hook, c.hookSub || ''];
        if (c.pt) { COURSE_PT[c.id] = c.pt; if (c.pt.hook != null) COURSE_HOOKS_PT[c.id] = [c.pt.hook, c.pt.hookSub || '']; }
      }
    };
    const restore = id => {
      const o = ORIG_COURSES[id]; if (!o) return null;
      if (o.hooks) COURSE_HOOKS[id] = o.hooks;
      if (o.hooksPt) COURSE_HOOKS_PT[id] = o.hooksPt;
      if (o.pt) COURSE_PT[id] = o.pt; else delete COURSE_PT[id];
      return o.c;
    };
    if (single) put(single);
    if (Array.isArray(list)) {
      for (let i = CATALOG.length - 1; i >= 0; i--) {
        if (CATALOG[i].custom) CATALOG.splice(i, 1);
        else if (CATALOG[i].edited) { const orig = restore(CATALOG[i].id); if (orig) CATALOG[i] = orig; }
      }
      list.forEach(put);
    }
    CATALOG.forEach(c => { if (!c.poster && !c.custom) c.poster = 'media/covers/' + c.id + '.jpg'; });
    render();
  },
  /* studio meta from Firestore (live-sessions schedule etc.) */
  applyMeta(meta) { studioMeta = meta || null; render(); },
  /* Phase 5: tenant identity → branding + gating */
  applyCompany(co) {
    if (!co) return;
    if (co.accent && /^#[0-9a-f]{6}$/i.test(co.accent)) {
      document.documentElement.style.setProperty('--accent', co.accent);
      document.documentElement.style.setProperty('--glow', co.accent + '55');
    }
    let bar = document.getElementById('suspendBar');
    if (co.status === 'suspended' && !isSuperAdmin()) {
      if (!bar) { bar = document.createElement('div'); bar.id = 'suspendBar'; document.body.prepend(bar); }
      bar.innerHTML = '⚠ ' + (_lang() === 'pt' ? 'A subscrição desta empresa está suspensa — contacte o administrador.' : 'This company\'s subscription is suspended — contact your administrator.');
    } else if (bar) bar.remove();
    syncChrome && syncChrome();
  },
  applyDigests(list) { digestsCache = list || []; render(); }
};
if (S.profile) EdenApp.applyProfile(S.profile);

/* ---------- device adaptation — read the device, adapt the shell ----------
   html gets classes like: os-android os-ios dev-phone-sm dev-phone dev-phone-lg
   dev-tablet dpr-2 — CSS tunes type scale, hit areas and grids per class. */
(function deviceClass() {
  const h = document.documentElement, ua = navigator.userAgent;
  const os = /android/i.test(ua) ? 'android' : /iphone|ipad|ipod|macintosh.*mobile/i.test(ua) ? 'ios' : 'desktop';
  h.classList.add('os-' + os);
  const apply = () => {
    const w = innerWidth;
    h.classList.remove('dev-phone-sm', 'dev-phone', 'dev-phone-lg', 'dev-tablet', 'dev-desktop');
    h.classList.add(w <= 360 ? 'dev-phone-sm' : w <= 400 ? 'dev-phone' : w <= 480 ? 'dev-phone-lg' : w <= 1024 ? 'dev-tablet' : 'dev-desktop');
  };
  apply();
  addEventListener('resize', apply, { passive: true });
  h.classList.add('dpr-' + Math.min(3, Math.round(devicePixelRatio || 1)));
})();

/* presence heartbeat — the green dots. One tiny write a minute while active */
setInterval(() => {
  if (document.visibilityState !== 'visible') return;
  if (window.EdenCloud && EdenCloud.heartbeat) EdenCloud.heartbeat();
}, 60000);
setTimeout(() => { if (window.EdenCloud && EdenCloud.heartbeat) EdenCloud.heartbeat(); }, 4000);
/* stamp joinedAt once — powers "new in the community" */
if (S.profile && S.profile.uid && !S.profile.joinedAt) { S.profile.joinedAt = Date.now(); save(); }

/* ---------- resilience: offline awareness + sync flush ---------- */
addEventListener('offline', () => toast(t('offline_note'), '📴'));
addEventListener('online', () => { save(); toast(t('online_note'), '🌿'); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && window.EdenCloud && EdenCloud.flush) EdenCloud.flush();
});
/* service worker — offline app shell + cached art */
/* Phase 5: invite links — ?join=CODE joins that company after sign-in */
(function captureJoin() {
  try {
    const code = new URLSearchParams(location.search).get('join');
    if (code) { localStorage.setItem('eden-join', code.toUpperCase()); history.replaceState(null, '', location.pathname + location.hash); }
  } catch (e) {}
})();
function applyPendingJoin() {
  let code; try { code = localStorage.getItem('eden-join'); } catch (e) { return; }
  if (!code || !(window.EdenCloud && EdenCloud.joinCompany)) return;
  if (S.profile && S.profile.companyId && S.profile.companyId !== 'edenrise') { localStorage.removeItem('eden-join'); return; }
  EdenCloud.joinCompany(code).then(cidJoined => {
    localStorage.removeItem('eden-join');
    S.profile = Object.assign({}, S.profile, { companyId: cidJoined }); save();
    toast((_lang() === 'pt' ? 'Bem-vindo à ' : 'Welcome to ') + companyName() + ' 🏢', '✦'); render();
  }).catch(() => { localStorage.removeItem('eden-join'); toast(_lang() === 'pt' ? 'Código de convite inválido' : 'Invalid invite code', '⚠️'); });
}
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  /* AUTO-UPDATE: when a newer version is deployed, the new service worker
     activates (sw.js does skipWaiting + clients.claim) and takes control →
     reload ONCE to the fresh version. Guard against the first-install case
     (no existing controller) and against reload loops. Kills stale-cache. */
  if (navigator.serviceWorker.controller) {
    let _swReloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (_swReloaded) return; _swReloaded = true; location.reload();
    });
  }
  addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.update().catch(() => {});                          /* check for a newer SW right now */
      setInterval(() => reg.update().catch(() => {}), 1800000);  /* …and every 30 min */
    }).catch(() => {});
  });
}

/* boot */
setTimeout(() => { if (boardCache === null) initBoard(); }, 2500);
if (S.xp == null) S.xp = seedXp();
if (!S.badges) S.badges = [];
checkBadges(true);
save();
render();
updateXpChip();
/* gentle "welcome back" nudge once per session (only when past the gate) */
if (S.onboarded && document.documentElement.getAttribute('data-gate') !== 'on') welcomeNudge();
/* onboarding is triggered AFTER the user gets past the auth gate (see auth.js /
   EdenApp.maybeOnboard) — never before sign-in. Fallback: if no auth module is
   present at all (Firebase blocked), still onboard so the demo isn't stuck. */
if (!window.EdenCloud && !localStorage.getItem('eden-auth-mode') && !S.onboarded) {
  /* no auth layer available — legacy/demo behaviour */
  setTimeout(() => { if (!window.EdenCloud && !S.onboarded) startOnboarding(); }, 4500);
}
