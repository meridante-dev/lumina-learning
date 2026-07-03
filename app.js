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
const fmtMins = m => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? (m % 60) + 'm' : ''}`.trim() : `${m}m`;
const vidFor = (id, mod) => VIDS[(id.length * 7 + mod * 3) % VIDS.length];
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
/* identity — real profile name once signed in, else the demo founder */
const displayName = () => (S.profile && S.profile.name) || 'João';
const firstName = () => displayName().trim().split(/\s+/)[0] || 'João';
const userHandle = () => (S.profile && S.profile.username) || '';
const userInitials = () => displayName().trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'JA';
const slugHandle = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 20);
const suggestHandle = () => { const p = S.profile || {}; return slugHandle(p.username) || slugHandle(p.name) || slugHandle((p.email || '').split('@')[0]) || 'learner'; };
/* admin access — only these accounts see Analytics + Admin */
const ADMIN_EMAILS = ['admin@edenrise.com', 'info@edenrise.com', 'john@edenrise.com'];
const isAdmin = () => ADMIN_EMAILS.includes(((S.profile && S.profile.email) || '').trim().toLowerCase());

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
function awardXp(n, reason) {
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
function leaderboard() {
  const meRow = { uid: myUid(), name: displayName(), initials: userInitials(), grad: 3, xp: S.xp || 0, streak: S.streak || 0, me: true };
  const others = (boardCache || []).filter(r => r.uid && r.uid !== meRow.uid).map(r => Object.assign({ grad: 3 }, r, { me: false }));
  return [meRow, ...others].sort((a, b) => b.xp - a.xp);
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
  const featured = courseById(S.path.find(x => !isDone(x)) || 'leading-data') || courseById('leading-data');
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
  ${dailyDropHTML()}
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
  ${railHTML('Courses in this path', 'In AI-planned order', S.path.map(id => courseById(id)).filter(Boolean).map(c => cardHTML(c)))}
  ${railHTML('Suggested next paths', 'Based on your goal & org needs', ['new-manager', 'prompt-eng', 'ai-agents', 'systems'].map(id => cardHTML(courseById(id))))}
  ${footerHTML()}</div>`;
}

function renderLive() {
  return `<div class="page"><div class="page-pad">
    <h1 class="page-title">${t('live_title')}</h1>
    <p class="page-sub">${t('live_sub')}</p>
    ${LIVE_SESSIONS.map(s => `
      <div class="live-card">
        <div class="live-thumb t-grad-${s.grad}">${svgIcon(s.icon)}${s.live ? '<span class="live-badge">● LIVE</span>' : ''}</div>
        <div class="live-info">
          <h3>${s.title}</h3><div class="host">${s.host}</div><div class="d">${s.desc}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:12px;">
          <span class="live-when">${s.live ? `🔴 ${s.viewers} ${t('watching')}` : s.when}</span>
          ${s.live
            ? `<button class="btn btn-primary btn-sm" data-action="join-live" data-id="${s.id}">${t('join_now')}</button>`
            : `<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:12px;color:var(--text-faint);font-weight:600;">${t('remind_me')}</span><div class="toggle ${S.reminders.includes(s.id) ? 'on' : ''}" data-action="remind" data-id="${s.id}"></div></div>`}
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
  const p = prog(id);
  const cur = p && !p.done ? (p.mod || 0) : -1;
  const modules = c.modules.map((m, i) => {
    const mm = modMedia(c, i);
    const soon = mm && mm.type === 'soon';
    const done = isDone(id) || (p && !p.done && i < (p.mod || 0));
    const isCur = i === cur && !soon;
    const review = S.review[id] === i;
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
          ${isDone(id) ? `<div class="hero-progress"><span class="due ok" style="margin:0;">✓ ${t('completed')}${p.score ? ' · ' + t('scored') + ' ' + p.score + '%' : ''}</span></div>` : ''}
        </div>
      </div>
    </div>
    <div class="rail-head" style="margin-top:14px;"><h2>${t('modules_h')}</h2><span class="hint">${t('tap_module')}</span></div>
    <div class="module-list">${modules}</div>
    ${railHTML(t('more_in') + ' ' + tcat(c.cat), t('related_courses'), CATALOG.filter(x => x.cat === c.cat && x.id !== id).map(x => cardHTML(x)))}
    ${footerHTML()}</div>`;
}

const footerHTML = () => `
<footer>
  <div class="logo"><span class="logo-mark"><svg class="er-mark" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 37.5V15a11 11 0 0 1 22 0v22.5" stroke="rgba(166,195,165,.5)" stroke-width="1"/><g transform="translate(15 0)"><path d="M0 33V13" stroke="#b27a52" stroke-width="1.1" stroke-linecap="round"/><g fill="#b27a52"><path d="M0 0C-3.4-3-3.4-9 0-12 3.4-9 3.4-3 0 0Z" transform="translate(0 13)"/><path d="M0 0C-3.1-2.6-3.1-8 0-11 3.1-8 3.1-2.6 0 0Z" transform="translate(0 18) rotate(36)"/><path d="M0 0C-3.1-2.6-3.1-8 0-11 3.1-8 3.1-2.6 0 0Z" transform="translate(0 18) rotate(-36)"/><path d="M0 0C-2.9-2.4-2.9-7.4 0-10 2.9-7.4 2.9-2.4 0 0Z" transform="translate(0 23) rotate(60)"/><path d="M0 0C-2.9-2.4-2.9-7.4 0-10 2.9-7.4 2.9-2.4 0 0Z" transform="translate(0 23) rotate(-60)"/><path d="M0 0C-2.6-2.1-2.6-6.6 0-9 2.6-6.6 2.6-2.1 0 0Z" transform="translate(0 28) rotate(104)"/><path d="M0 0C-2.6-2.1-2.6-6.6 0-9 2.6-6.6 2.6-2.1 0 0Z" transform="translate(0 28) rotate(-104)"/></g></g></svg></span><span class="logo-word"><span class="er-name">EDENRISE</span><span class="er-sub">Academy</span></span></div>
  <span>${t('footer_tag')}</span>
  <div class="links">
    <button data-action="goto" data-route="#/admin" data-admin>Admin console</button>
    <button data-action="ai-open">Help</button>
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
    ? { lang, title: `O bosque sente a sua falta, ${name} 🌿`, body: `O seu percurso está à sua espera, sem pressa. Quando tiver dez minutos, há sempre algo novo a crescer na EdenRise Academy.` }
    : { lang, title: `The grove misses you, ${name} 🌿`, body: `Your path is waiting, no rush at all. Whenever you have ten minutes, there's always something new growing at EdenRise Academy.` };
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
  const name = pf.name || (pf.email ? pf.email.split('@')[0] : 'Learner');
  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'ER';
  const path = st.path || [], prg = st.progress || {};
  const doneInPath = path.filter(id => prg[id] && prg[id].done).length;
  const pathPct = path.length ? Math.round(doneInPath / path.length * 100) : 0;
  const coursesDone = Object.values(prg).filter(p => p && p.done).length;
  const xp = st.xp || 0, lvl = levelFor(xp);
  const days = m.updatedAt ? Math.floor((Date.now() - m.updatedAt) / 86400000) : null;
  const atRisk = pathPct < 35 || (days != null && days > 10);
  return { uid: m.uid, name, initials, email: pf.email || '', username: pf.username || '', role: st.role || pf.role || '', goal: st.goal || '', pathPct, coursesDone, xp, level: lvl.idx + 1, levelName: tlevel(lvl.idx), streak: st.streak || 0, days, atRisk };
}
function memberRow(s) {
  return `<tr>
    <td><div class="member"><span class="mi t-grad-3">${esc(s.initials)}</span><div>${esc(s.name)}${s.username ? ` <span class="post-handle">@${esc(s.username)}</span>` : ''}<div class="mr">${esc(s.email || '—')}</div></div></div></td>
    <td style="min-width:150px;"><div class="track" style="width:100%;"><div class="fill" style="width:${s.pathPct}%"></div></div></td>
    <td>${s.pathPct}%</td>
    <td>Lv ${s.level}</td>
    <td>${s.streak}d</td>
    <td style="color:var(--text-faint);">${s.days == null ? '—' : s.days === 0 ? 'today' : s.days + 'd ago'}</td>
    <td><span class="status-chip ${s.atRisk ? 'risk' : 'ok'}">${s.atRisk ? '⚠ At risk' : '● On track'}</span></td>
    <td><button class="btn btn-glass btn-sm" data-action="nudge" data-uid="${esc(s.uid)}" data-name="${esc(s.name)}">Nudge</button></td>
  </tr>`;
}
function paintCockpit() {
  if (!adminMembers) return;
  const sums = adminMembers.map(memberSummary).sort((a, b) => (a.atRisk === b.atRisk ? a.pathPct - b.pathPct : (a.atRisk ? -1 : 1)));
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
  if (roster) roster.innerHTML = n ? sums.map(memberRow).join('') : `<tr><td colspan="8" class="empty-note">No members yet — as people sign in, they'll appear here.</td></tr>`;
}
function initAdmin(retries) {
  if (!window.EdenCloud || !EdenCloud.listMembers) {
    if ((retries || 0) < 24 && location.hash.indexOf('#/admin') === 0) { setTimeout(() => initAdmin((retries || 0) + 1), 250); return; }
    const r = $('#cockpitRoster'); if (r) r.innerHTML = `<tr><td colspan="8" class="empty-note">The cockpit needs an internet connection.</td></tr>`;
    return;
  }
  const r = $('#cockpitRoster'); if (r) r.innerHTML = Array.from({ length: 4 }, () => `<tr class="skel-row"><td colspan="8"><div class="skel"></div></td></tr>`).join('');
  EdenCloud.listMembers().then(m => { adminMembers = m; paintCockpit(); }).catch(err => {
    console.error('[cockpit]', err);
    const rr = $('#cockpitRoster'); if (rr) rr.innerHTML = `<tr><td colspan="8" class="empty-note">Couldn't read members — make sure the updated Firestore rules (admin read) are published.</td></tr>`;
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
async function generateCourseDraft(title, text) {
  const cats = [...new Set(CATALOG.filter(x => !x.custom).map(x => x.cat))];
  const icons = Object.keys(ICONS).join(', ');
  const raw = await llmComplete({ maxTokens: 4000,
      system: `You are the course architect for EdenRise Academy (regenerative-living school, Baixo Alentejo, Portugal; warm, grounded, zero corporate jargon). From lesson material, produce ONE course as raw JSON only (no fences): {"title":str,"title_pt":str,"hook":str,"hook_pt":str,"hookSub":str,"hookSub_pt":str,"desc":str(1-2 sentences),"desc_pt":str,"cat":one of [${cats.join(' | ')}],"icon":one of [${icons}],"modules":[3-5 str],"modules_pt":[same length],"takeaways":[per module, array of exactly 3 str],"takeaways_pt":[same shape],"quiz":[3 of {"q":str,"opts":[4 str],"a":0-3}],"quiz_pt":[same shape]}. Portuguese = European Portuguese. Hooks are short invitations (MasterClass style). Takeaways are what a learner keeps. Quiz tests understanding of THIS material.`,
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
    const j = await generateCourseDraft(($('#stTitle').value || '').trim(), text);
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

/* ---------- admin console ---------- */
let uploadedDrafts = [];
function renderAdmin() {
  const content = [...uploadedDrafts, ...CATALOG.slice(0, 6)].map(c => `
    <div class="content-row">
      <span class="ci t-grad-${c.grad}">${svgIcon(c.icon)}</span>
      <div class="ct"><b>${c.title}</b><span>${c.cat} · ${c.modules.length} modules · ${c.learners || 0} learners</span></div>
      <span class="pub-chip ${c.draft ? 'draft' : 'live'}">${c.draft ? 'DRAFT · AI-built' : 'PUBLISHED'}</span>
    </div>`).join('');
  const assignments = S.assignments.map((a, i) => {
    const c = courseById(a.courseId);
    return `<div class="assignment-row">📌 <b>${c ? c.title : a.courseId}</b> → ${a.team} · due ${a.due}<button class="ar-x" data-action="unassign" data-idx="${i}" title="Remove">✕</button></div>`;
  }).join('');
  return `<div class="page"><div class="page-pad">
    <h1 class="page-title">Leader's Cockpit</h1>
    <p class="page-sub">EdenRise workspace · live member data from every signed-in learner.</p>
    <section class="stats" id="cockpitStats" style="margin:28px 0 0;">
      <div class="stat"><div class="num">—</div><div class="lbl">Members</div></div>
      <div class="stat"><div class="num">—</div><div class="lbl">Avg. completion</div></div>
      <div class="stat"><div class="num">—</div><div class="lbl">Active this week</div></div>
      <div class="stat"><div class="num">—</div><div class="lbl">At risk</div></div>
    </section>

    <div class="admin-section">
      <div class="cockpit-head">
        <div><h2>Team</h2><p class="sect-sub">Your real members, sorted by who needs attention. “Nudge” pings their next lesson.</p></div>
        <button class="btn btn-glass btn-sm" data-action="export-members">⤓ Export CSV</button>
      </div>
      <div class="team-table"><table>
        <thead><tr><th>Member</th><th>Path progress</th><th></th><th>Level</th><th>Streak</th><th>Last active</th><th>Status</th><th></th></tr></thead>
        <tbody id="cockpitRoster"><tr><td colspan="8" class="empty-note">Loading members…</td></tr></tbody>
      </table></div>
    </div>

    <div class="admin-section">
      <h2>${t('studio_title')}</h2>
      <p class="sect-sub">${t('studio_sub')}</p>
      <div class="org-key">
        <div class="notif-info"><b>${t('orgkey_title')}</b><span>${t('orgkey_sub')}</span></div>
        <div style="display:flex;gap:8px;flex:1;min-width:280px;">
          <input class="auth-input" id="orgKeyInput" type="password" placeholder="AIza… / sk-ant-…" value="${esc((window.EdenOrg && window.EdenOrg.aiKey) || '')}" style="flex:1;">
          <button class="btn btn-primary btn-sm" data-action="orgkey-save">${t('save')}</button>
        </div>
      </div>
      <div class="studio">
        <input class="auth-input" id="stTitle" placeholder="${t('studio_title_ph')}">
        <input class="auth-input" id="stVideo" placeholder="${t('studio_video_ph')}">
        <textarea class="comm-input" id="stText" rows="5" placeholder="${t('studio_text_ph')}"></textarea>
        <button class="btn btn-primary" data-action="studio-gen" id="stGen">${t('studio_gen')}</button>
        <div id="stStatus"></div>
        <div id="stDraft"></div>
      </div>
      <div class="admin-section" style="margin-top:8px;padding-top:0;border:none;">
        <h2 style="font-size:17px;">${t('studio_custom')}</h2>
        <div id="customList">${CATALOG.filter(x => x.custom).map(x => `
          <div class="content-row"><span class="ci t-grad-${x.grad}">${svgIcon(x.icon)}</span>
          <div class="ct"><b>${ctitle(x)}</b><span>${tcat(x.cat)} · ${x.modules.length} ${t('modules')}</span></div>
          <button class="btn btn-glass btn-sm" data-action="studio-del" data-id="${x.id}">✕ ${t('comm_delete')}</button></div>`).join('') || `<p class="empty-note" style="text-align:left;padding:8px 0;">—</p>`}
        </div>
      </div>
      ${content}
    </div>

    <div class="admin-section">
      <h2>Assign learning</h2>
      <p class="sect-sub">Assignments appear on each learner's home with the due date.</p>
      <div class="composer">
        <div class="field"><label>Course</label>
          <select id="asgCourse">${CATALOG.map(c => `<option value="${c.id}">${c.title}</option>`).join('')}</select></div>
        <div class="field"><label>Team</label>
          <select id="asgTeam"><option>Everyone</option><option>Engineering</option><option>Sales</option><option>Support</option><option>Leadership</option></select></div>
        <div class="field"><label>Due date</label><input id="asgDue" type="date" value="2026-06-30"></div>
        <button class="btn btn-primary" data-action="assign">Assign →</button>
      </div>
      ${assignments}
    </div>
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
  const chosen = +el.dataset.opt, correct = chosen === +el.dataset.a;
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
  return ns.map(n => `<button class="nudge" data-action="goto" data-route="${n.route}">
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
  try { new Notification('EdenRise · ' + n.title, { body: n.body, icon: 'favicon.svg', tag: 'edenrise-nudge' }); return true; } catch (e) { return false; }
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
function channelListHTML() {
  const item = (id, cls) => {
    const m = channelMeta(id);
    return `<button class="ch-item ${id === commChannel ? 'active' : ''}" data-action="comm-channel" data-ch="${id}">${svgIcon(m.icon)}<span>${m.label}</span></button>`;
  };
  const paths = S.path.map(id => courseById(id)).filter(Boolean).map(c => item(c.id)).join('');
  return `
    <div class="ch-group-label">${t('comm_channels')}</div>
    ${COMMUNITY_CHANNELS.map(c => item(c.id)).join('')}
    <div class="ch-group-label">${t('comm_paths')}</div>
    ${paths}`;
}
const mentions = html => html.replace(/(^|[\s>])@([a-z0-9][a-z0-9_.-]{1,24})/gi, '$1<span class="mention">@$2</span>');
const canModerate = p => { const me = myUid(); return !!me && (p.authorUid === me || isAdmin()); };
function postCardHTML(p) {
  const liked = p.likedBy && myUid() && p.likedBy.includes(myUid());
  const isDisc = p.kind === 'discussion' && p.title;
  const rc = p.replyCount || 0;
  return `<article class="post ${isDisc ? 'is-disc' : ''} ${p.pinned ? 'pinned' : ''}"${isDisc ? ` data-action="comm-open" data-id="${p.id}"` : ''}>
    <div class="post-av">${esc(p.authorInitials || 'ER')}</div>
    <div class="post-main">
      <div class="post-head">${p.pinned ? `<span class="pin-badge">📌 ${t('comm_pinned')}</span>` : ''}<b>${esc(p.authorName || 'Learner')}</b>${p.authorHandle ? `<span class="post-handle">@${esc(p.authorHandle)}</span>` : ''}<span class="post-time">· ${timeAgo(p.createdAt)}</span></div>
      ${isDisc ? `<div class="post-title">${esc(p.title)}</div>` : ''}
      <div class="post-body">${mentions(esc(p.body || '').replace(/\n/g, '<br>'))}</div>
      <div class="post-foot">
        <button class="post-act ${liked ? 'liked' : ''}" data-action="comm-like" data-id="${p.id}">♥ <span>${p.likes || 0}</span></button>
        ${isDisc ? `<span class="post-act soft">💬 ${rc} ${rc === 1 ? t('comm_reply_one') : t('comm_replies')}</span>` : ''}
        ${isAdmin() ? `<button class="post-act" data-action="comm-pin" data-id="${p.id}">📌 ${p.pinned ? t('comm_unpin') : t('comm_pin')}</button>` : ''}
        ${canModerate(p) ? `<button class="post-act danger" data-action="comm-del" data-id="${p.id}">✕ ${t('comm_delete')}</button>` : ''}
      </div>
    </div>
  </article>`;
}
function replyHTML(r, postId) {
  const liked = r.likedBy && myUid() && r.likedBy.includes(myUid());
  return `<div class="reply">
    <div class="post-av sm">${esc(r.authorInitials || 'ER')}</div>
    <div class="post-main">
      <div class="post-head"><b>${esc(r.authorName || 'Learner')}</b>${r.authorHandle ? `<span class="post-handle">@${esc(r.authorHandle)}</span>` : ''}<span class="post-time">· ${timeAgo(r.createdAt)}</span></div>
      <div class="post-body">${mentions(esc(r.body || '').replace(/\n/g, '<br>'))}</div>
      <div class="post-foot">
        <button class="post-act sm ${liked ? 'liked' : ''}" data-action="comm-rlike" data-id="${postId}" data-rid="${r.id}">♥ <span>${r.likes || 0}</span></button>
        ${canModerate(r) ? `<button class="post-act sm danger" data-action="comm-rdel" data-id="${postId}" data-rid="${r.id}">✕ ${t('comm_delete')}</button>` : ''}
      </div>
    </div>
  </div>`;
}
function composerHTML(isReply) {
  if (!forumCanPost()) return `<div class="comm-signin"><span>🌱 ${t('comm_signin_post')}</span><button class="btn btn-primary btn-sm" data-action="show-login">${t('prof_signin')}</button></div>`;
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
      <div class="composer-foot"><span class="composer-hint">${t('comm_new')}</span><button class="btn btn-primary btn-sm" data-action="comm-post">${t('comm_post')}</button></div>
    </div>
  </div>`;
}
function renderCommunity() {
  const m = channelMeta(commChannel);
  let main;
  if (commThread) {
    const p = commPosts.find(x => x.id === commThread) || {};
    main = `<div class="comm-main">
      <button class="comm-back" data-action="comm-back">← ${t('comm_back')}</button>
      <div id="commThreadHead">${p.id ? postCardHTML(p) : ''}</div>
      <div class="thread-replies" id="commReplies"></div>
      ${composerHTML(true)}
    </div>`;
  } else {
    main = `<div class="comm-main">
      <div class="comm-head"><span class="comm-ch-ic">${svgIcon(m.icon)}</span><div><h2>${m.label}</h2><span class="comm-ch-sub">${t('comm_title')}</span></div></div>
      ${composerHTML(false)}
      <div class="comm-feed" id="commFeed">${'<div class="post skel-post"><div class="skel av"></div><div style="flex:1"><div class="skel" style="width:38%"></div><div class="skel" style="width:82%;margin-top:8px"></div></div></div>'.repeat(3)}</div>
    </div>`;
  }
  return `<div class="page"><div class="page-pad">
    <h1 class="page-title">${t('comm_title')}</h1>
    <p class="page-sub">${t('comm_sub')}</p>
    <div class="comm-wrap">
      <aside class="comm-side">${channelListHTML()}</aside>
      ${main}
    </div>
  </div></div>`;
}
function teardownCommunity() { if (commUnsub) { commUnsub(); commUnsub = null; } if (commThreadUnsub) { commThreadUnsub(); commThreadUnsub = null; } }
function paintFeed() { const f = $('#commFeed'); if (!f) return; const ordered = [...commPosts].sort((a, b) => (!!b.pinned) - (!!a.pinned)); f.innerHTML = ordered.length ? ordered.map(postCardHTML).join('') : `<div class="empty-note">${t('comm_empty')}</div>`; makeFocusable(f); }
function paintThreadHead() { const h = $('#commThreadHead'); if (!h) return; const p = commPosts.find(x => x.id === commThread); if (p) h.innerHTML = postCardHTML(p); }
function paintReplies() { const r = $('#commReplies'); if (!r) return; r.innerHTML = commReplies.length ? commReplies.map(x => replyHTML(x, commThread)).join('') : `<div class="empty-note">${t('comm_empty_replies')}</div>`; makeFocusable(r); }
function initCommunity(retries) {
  teardownCommunity();
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
  EdenForum.createPost({ channel: commChannel, kind: title ? 'discussion' : 'message', title, body })
    .then(() => { if ($('#commTitle')) $('#commTitle').value = ''; if ($('#commBody')) $('#commBody').value = ''; toast(t('comm_posted'), '🌿'); })
    .catch(() => toast(_lang() === 'pt' ? 'Não foi possível publicar' : 'Could not post', '⚠️'));
}
function submitReply() {
  if (!forumCanPost()) return showLoginGate();
  const body = ($('#commReplyBox') && $('#commReplyBox').value || '').trim();
  if (!body || !commThread) return;
  EdenForum.addReply(commThread, body).then(() => { if ($('#commReplyBox')) $('#commReplyBox').value = ''; }).catch(() => {});
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
function exportMyData() {
  const data = { exportedAt: new Date().toISOString(), app: 'EdenRise Academy', profile: S.profile || {}, goal: S.goal, role: S.role, path: S.path, progress: S.progress, xp: S.xp, badges: S.badges, streak: S.streak, quizzesPassed: S.quizzesPassed, notes: S.notes, lang: S.lang, notify: (S.profile || {}).notify || {} };
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
  S.profile = Object.assign({}, S.profile, { name: name || displayName(), username: user, role, phone });
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
  $('#app').innerHTML = route === 'course' ? renderCourse(param) : (routes[route] || renderHome)();
  makeFocusable($('#app'));
  lazyBackgrounds();
  if (route === 'community') initCommunity();
  if (route === 'admin' && isAdmin()) initAdmin();
  if (route === 'progress' && boardCache === null) initBoard();
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
  const org = $('#orgChip'); if (org) org.innerHTML = `<span class="org-dot"></span>${t('org')}`;
  const tn = $('#aiTitle'); if (tn) tn.textContent = t('tutor_name');
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
function initMotion() {
  const G = window.gsap;
  if (!G) { forceVisible(); loadMotionLibs(); return; }
  if (reduceMotion) { forceVisible(); return; }
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
    vimeoWrap.innerHTML = `<iframe src="https://player.vimeo.com/video/${media.id}?${media.h ? 'h=' + media.h + '&' : ''}title=0&byline=0&portrait=0&badge=0&autoplay=1&autopause=0&player_id=0&app_id=58479" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen title="${cmods(c)[mod]}"></iframe>`;
  } else {
    videoEl.src = c.video || vidFor(courseId, mod);
    videoEl.play().catch(() => {});
  }

  $('#playerTitle').textContent = ctitle(c);
  $('#playerSub').textContent = `${t('module')} ${mod + 1} ${t('of')} ${c.modules.length} · ${cmods(c)[mod]}`;
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
}
function closePlayer() {
  playerEl.classList.remove('open');
  $('#notesDrawer').classList.remove('open');
  resetStages();
  playing = null;
  render();
}

/* ---------- notes & transcript ---------- */
function makeTranscript(c, mod) {
  const t = c.modules[mod];
  return [
    ['0:00', `Welcome back. This module is “${t}” — by the end you'll be able to apply it in your own work at EdenRise.`],
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
  const text = await llmComplete({
    system: `You write short, rigorous multiple-choice quizzes for EdenRise Academy (regenerative living school, Alentejo). Reply with ONLY a JSON array of exactly 3 objects: {"q":"…","opts":["…","…","…","…"],"a":<correct index 0-3>}. Questions test understanding (not trivia) of the course's core ideas. Language: ${lang === 'pt' ? 'European Portuguese' : 'English'}. No markdown, no fences — raw JSON only.`,
    messages: [{ role: 'user', content: `Course: "${ctitle(c)}" — ${chook(c)} ${chooksub(c)} ${cdesc(c)} Modules: ${cmods(c).join('; ')}.` }],
    maxTokens: 900
  });
  const qs = JSON.parse(text.replace(/^[^\[]*/, '').replace(/[^\]]*$/, ''));
  if (!Array.isArray(qs) || qs.length < 3 || !qs.every(x => x.q && Array.isArray(x.opts) && x.opts.length === 4 && x.a >= 0 && x.a < 4)) throw new Error('bad shape');
  aiQuizCache[key] = qs.slice(0, 3);
  return aiQuizCache[key];
}
function startQuiz(c, qs, ai) {
  quiz = { courseId: c.id, qs, idx: 0, sel: null, score: 0, answered: false, ai: !!ai };
  $('#quizModal').classList.add('open');
  drawQuiz();
}
function openQuiz(courseId) {
  const c = courseById(courseId) || courseById('leading-data');
  const lang = _lang() === 'pt' ? 'pt' : 'en';
  const cq = COURSE_QUIZ[c.id] || c.quiz;
  if (cq) { startQuiz(c, cq[lang] || cq.en || cq, false); return; }   /* real content (incl. studio courses) */
  const fallback = () => startQuiz(c, QUIZ_BANK[c.cat] || QUIZ_BANK._default, false);
  if (aiKey()) {                                                     /* AI writes from the course */
    $('#quizModal').classList.add('open');
    $('#quizBody').innerHTML = `<div class="q-center"><div class="orb-spin"></div><p class="m-sub" style="margin-top:16px;">${t('quiz_ai_building')}</p></div>`;
    generateAIQuiz(c).then(qs => startQuiz(c, qs, true)).catch(() => fallback());
    return;
  }
  fallback();
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
  $('#palResults').innerHTML = html || `<div class="palette-empty">No matches for “${esc(q)}” — try the AI tutor.</div>`;
  highlightPal();
}
function highlightPal() {
  const items = $$('#palResults .palette-item');
  items.forEach((el, i) => el.classList.toggle('hl', i === palIdx));
  if (items[palIdx]) items[palIdx].scrollIntoView({ block: 'nearest' });
}
function runPal(el) {
  const [kind, val] = el.dataset.pal.split(':');
  closePalette();
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
function buildTutorSystem() {
  const id = currentCourseId(); const c = id && courseById(id);
  const p = c && prog(c.id);
  const pathLines = S.path.map(x => {
    const cc = courseById(x); if (!cc) return '';
    return `- ${cc.title}: ${isDone(x) ? 'completed' : pathStatus(x) === 'current' ? coursePct(x) + '% in progress' : 'locked'}`;
  }).join('\n');
  return `You are the EdenRise Tutor, the in-app AI learning companion inside EdenRise Academy — the learning platform of EdenRise, a regenerative-living farm and school in the Baixo Alentejo, Portugal. Its ethos: where nature leads, the land heals, and stewardship shapes everything. The courses teach regenerative living — soil, water, food forests, native flora, foraging, natural building, fire stewardship and nature connection.
You are talking to ${displayName()}${S.role ? ' (' + S.role + ')' : ''}, whose learning goal is "${S.goal}".

His AI learning path right now:
${pathLines}

${c ? `He currently has "${c.title}" open${p && !p.done ? ` — module ${(p.mod || 0) + 1} of ${c.modules.length}, "${c.modules[p.mod || 0]}", ${coursePct(c.id)}% complete` : ''}. Course description: ${c.desc}` : 'No course is currently open.'}

Deadlines: "Fire Safety on the Land" is required and due in 3 days (it's fire season in the Alentejo); the team series "Living by the Seasons" is due June 30.

Style: warm, encouraging, concise (2-4 sentences unless asked for depth). Refer to his actual progress and path when relevant. You can offer to quiz him — if he agrees, tell him to press the "Quiz me now" button. Never invent courses that aren't in his path or the descriptions above.
${_lang() === 'pt' ? 'IMPORTANT: Respond in European Portuguese (português de Portugal).' : ''}`;
}
/* provider-agnostic completion — Claude (sk-ant-…) or free-tier Gemini (AIza…) */
const aiKey = () => S.apiKey || (window.EdenOrg && window.EdenOrg.aiKey) || '';
const llmProvider = () => aiKey().startsWith('AIza') ? 'gemini' : 'anthropic';
async function llmComplete({ system, messages, maxTokens }) {
  if (llmProvider() === 'gemini') {
    const model = 'gemini-2.5-flash';
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiKey()}`, {
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
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': aiKey(), 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: S.aiModel || 'claude-opus-4-8', max_tokens: maxTokens, system, messages })
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err.error && err.error.message) || 'HTTP ' + res.status); }
  const data = await res.json();
  return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n') || '…';
}
async function askClaude(text) {
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
    toast('Path re-planned by EdenRise AI', '✦');
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
      const s = LIVE_SESSIONS.find(x => x.id === id);
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
      if (!(window.EdenCloud && EdenCloud.saveOrgConfig)) { toast(t('mail_failed'), '⚠️'); break; }
      EdenCloud.saveOrgConfig({ aiKey: k }).then(() => {
        window.EdenOrg = Object.assign({}, window.EdenOrg, { aiKey: k });
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
        toast(t('comm_deleted'), '－'); render();
      });
      break;
    }
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
      const courseId = $('#asgCourse').value, team = $('#asgTeam').value, due = $('#asgDue').value || 'soon';
      S.assignments.push({ courseId, team, due });
      save(); render();
      toast(`Assigned “${courseById(courseId).title}” to ${team}`, '📌');
      break;
    }
    case 'unassign': S.assignments.splice(+el.dataset.idx, 1); save(); render(); toast('Assignment removed', '－'); break;
    case 'upload': {
      const dz = $('#dropzone');
      if (dz.dataset.busy) break;
      dz.dataset.busy = '1';
      dz.innerHTML = `<div class="dz-icon">✦</div><div class="dz-t">AI processing “leadership_offsite_keynote.mp4”…</div><div class="dz-s" id="dzStep">Transcribing audio</div><div class="track"><div class="fill" id="dzFill" style="width:5%"></div></div>`;
      const steps = ['Transcribing audio', 'Detecting chapter breaks', 'Drafting 6 modules', 'Writing quiz questions', 'Generating thumbnail'];
      let i = 0;
      const iv = setInterval(() => {
        i++;
        if (i < steps.length) { $('#dzStep').textContent = steps[i]; $('#dzFill').style.width = (5 + i * 22) + '%'; return; }
        clearInterval(iv);
        uploadedDrafts.unshift({ id: 'draft-' + uploadedDrafts.length, title: 'Leadership Offsite Keynote', cat: 'Leadership', grad: 3, icon: '🎬', modules: ['Opening: the year ahead', 'Strategy deep-dive', 'Org changes', 'Customer stories', 'Q&A highlights', 'Closing & commitments'], draft: true, learners: 0 });
        render();
        toast('AI built 6 modules + a quiz from your video — review the draft', '🎬');
      }, 800);
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
    if ($('#takeModal').classList.contains('open')) resolveTakeaways();
    else if (mDrawer.classList.contains('open')) setDrawer(false);
    else if ($('#palette').classList.contains('open')) closePalette();
    else if ($('#quizModal').classList.contains('open')) { $('#quizModal').classList.remove('open'); render(); }
    else if (playerEl.classList.contains('open')) closePlayer();
    else setTutorOpen(false);
  }
});

/* tutor settings */
function syncTutorStatus() {
  const orgOnly = !S.apiKey && aiKey();
  $('#tutorStatus').textContent = aiKey()
    ? (llmProvider() === 'gemini' ? `● Live · Gemini 2.5 Flash${orgOnly ? ' · team key' : ' (free tier)'}` : `● Live · ${(S.aiModel || 'claude-opus-4-8').replace('claude-', 'Claude ').replace(/-/g, ' ')}${orgOnly ? ' · team key' : ''}`)
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
      ? ['A ler o seu perfil…', 'A percorrer a biblioteca EdenRise…', 'A ver competências que pode saltar…', 'A sequenciar 4–6 cursos…', 'Concluído ✓']
      : ['Reading your role profile…', 'Scanning the EdenRise library…', 'Checking skills you can skip…', 'Sequencing 4–6 courses…', 'Done ✓'];
    let i = 0;
    const iv = setInterval(() => {
      i++;
      if (i < lines.length) { $('#genLine').textContent = lines[i]; return; }
      clearInterval(iv);
      S.goal = ob.goal;
      S.path = [...GOAL_PRESETS[ob.goal]];
      S.role = ob.role;
      const handle = slugHandle(ob.username) || suggestHandle();
      S.profile = Object.assign({}, S.profile, { username: handle, role: ob.role });
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
    this.maybeOnboard();
    if (S.onboarded) welcomeNudge();
  },
  maybeOnboard() { if (!S.onboarded) startOnboarding(); },
  applyProfile(p) {
    if (!p) return;
    S.profile = Object.assign({}, S.profile, p); save();   /* merge — keep username/bio set during onboarding */
    const av = $('#avatarBtn'); if (av) { av.textContent = userInitials(); av.title = displayName(); }
  },
  currentState() { return S; },
  /* merge team-published (studio) courses into the catalog */
  applyCustomCourses(list, single) {
    if (single) { if (!CATALOG.some(x => x.id === single.id)) CATALOG.push(single); }
    if (Array.isArray(list)) {
      for (let i = CATALOG.length - 1; i >= 0; i--) if (CATALOG[i].custom) CATALOG.splice(i, 1);
      list.forEach(c => CATALOG.push(c));
    }
    CATALOG.forEach(c => { if (!c.poster && !c.custom) c.poster = 'media/covers/' + c.id + '.jpg'; });
    render();
  }
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

/* ---------- resilience: offline awareness + sync flush ---------- */
addEventListener('offline', () => toast(t('offline_note'), '📴'));
addEventListener('online', () => { save(); toast(t('online_note'), '🌿'); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && window.EdenCloud && EdenCloud.flush) EdenCloud.flush();
});
/* service worker — offline app shell + cached art */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
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
