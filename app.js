/* ============ EdenRise app — router, state, player, tutor ============ */

/* ---------- state ---------- */
let S;
try { S = Object.assign({}, structuredClone(DEFAULT_STATE), JSON.parse(localStorage.getItem('edenrise-state') || '{}')); }
catch { S = structuredClone(DEFAULT_STATE); }
const save = () => localStorage.setItem('edenrise-state', JSON.stringify(S));

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const courseById = id => CATALOG.find(c => c.id === id);
const prog = id => S.progress[id];
const coursePct = id => { const p = prog(id); return p ? (p.done ? 100 : (p.pct || 0)) : 0; };
const isDone = id => !!(prog(id) && prog(id).done);
const inPath = id => S.path.includes(id);
const courseMins = c => c.modules.length * 12;
const fmtMins = m => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? (m % 60) + 'm' : ''}`.trim() : `${m}m`;
const vidFor = (id, mod) => VIDS[(id.length * 7 + mod * 3) % VIDS.length];
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

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

/* ---------- card builder ---------- */
function cardHTML(c, opts = {}) {
  const pct = coursePct(c.id);
  const p = prog(c.id);
  const chips = [];
  if (opts.rank) chips.push(`<span class="chip">#${opts.rank} THIS WEEK</span>`);
  if (c.ai) chips.push(`<span class="chip ai">✦ AI PATH</span>`);
  if (c.required) chips.push(`<span class="chip">REQUIRED</span>`);
  if (c.teamGoal) chips.push(`<span class="chip">TEAM GOAL</span>`);
  if (c.isNew) chips.push(`<span class="chip">NEW</span>`);
  if (p && !p.done) chips.push(`<span class="chip">MODULE ${(p.mod || 0) + 1}/${c.modules.length}</span>`);
  let foot = '';
  if (pct > 0 && pct < 100) foot = `<div class="card-progress"><div class="fill" style="width:${pct}%"></div></div>`;
  if (isDone(c.id)) foot = `<span class="due ok">✓ Completed${p.cert ? ' · cert issued' : ` · ${p.score || 90}%`}</span>`;
  else if (c.due) foot += `<span class="due">⏰ ${c.due}</span>`;
  return `
  <article class="card" data-action="open-course" data-id="${c.id}">
    <div class="card-actions">
      <button class="icon-btn" data-action="play" data-id="${c.id}" title="Play">▶</button>
      <button class="icon-btn ${inPath(c.id) ? 'in-path' : ''}" data-action="toggle-path" data-id="${c.id}" title="${inPath(c.id) ? 'In your path' : 'Add to path'}">${inPath(c.id) ? '✓' : '＋'}</button>
    </div>
    <div class="thumb t-grad-${c.grad}"><span class="big-icon">${svgIcon(c.icon)}</span><div class="chip-row">${chips.join('')}</div></div>
    <div class="card-body">
      <h3>${c.title}</h3>
      <div class="meta"><span>${c.cat}</span><span class="dot"></span><span>${fmtMins(courseMins(c))}</span><span class="dot"></span><span>★ ${c.rating}</span></div>
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
      <button class="see-all" data-action="goto" data-route="${seeAllRoute || '#/library'}">See all →</button>
    </div>
    <div class="rail-wrap">
      <button class="rail-arrow prev" data-action="rail" data-dir="-1">‹</button>
      <div class="rail">${cards.join('')}</div>
      <button class="rail-arrow next" data-action="rail" data-dir="1">›</button>
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
    const sub = st === 'done' ? `Completed${p && p.score ? ' · ' + p.score + '%' : ''}` : st === 'current' ? `In progress · ${coursePct(id)}%` : (S.path.indexOf(id) === S.path.findIndex(x => !isDone(x)) + 1 ? 'Next up' : 'Locked');
    return `<div class="seg ${st}" data-action="open-course" data-id="${id}"><div class="snode">${node}</div><div class="sl">${c.title}</div><div class="sd">${sub}</div></div>`;
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
    const sub = st === 'done' ? `Completed${p && p.note ? ' · ' + p.note : p && p.score ? ' · scored ' + p.score + '%' : ''}` : st === 'current' ? 'In progress · adapted today' : 'Unlocks after assessment';
    return `<div class="path-step ${st === 'current' ? 'step-active' : ''}" data-action="open-course" data-id="${id}">
      <div class="step-node ${nodeCls}">${node}</div>
      <div class="step-info"><div class="t">${c.title}</div><div class="s">${sub}</div></div></div>`;
  }).join('');
  const words = featured.title.split(' ');
  const lastWord = words.pop();

  return `<div class="page">
  <header class="hero">
    <div class="hero-bg"></div><div class="hero-grid"></div>
    <div class="orb orb-1"></div><div class="orb orb-2"></div><div class="hero-fade"></div>
    <div class="hero-content">
      <span class="hero-eyebrow"><span class="pulse-dot"></span>Featured Program · Curated for you by AI</span>
      <h1>${words.join(' ')} <span class="grad-text">${lastWord}</span></h1>
      <div class="hero-meta">
        <span class="match">97% match</span><span class="sep"></span>
        <span>${featured.modules.length} modules</span><span class="sep"></span>
        <span>${fmtMins(courseMins(featured))}</span><span class="sep"></span>
        <span>${featured.level}</span>
        <span class="badge-hd">4K</span><span class="badge-hd">CERTIFIED</span>
      </div>
      <p class="desc">${featured.desc}</p>
      <div class="hero-actions">
        <button class="btn btn-primary" data-action="play" data-id="${featured.id}">▶&nbsp; ${fp && fp.mod != null ? `Resume Module ${fp.mod + 1}` : 'Start learning'}</button>
        <button class="btn btn-glass" data-action="ai-overview" data-id="${featured.id}">✦&nbsp; AI Overview</button>
        <button class="btn btn-glass" data-action="toggle-path" data-id="${featured.id}">${inPath(featured.id) ? '✓ In My Path' : '+ My Path'}</button>
      </div>
      <div class="hero-progress">
        <div class="track"><div class="fill" style="width:${coursePct(featured.id)}%"></div></div>
        <span>${coursePct(featured.id)}% complete · est. ${fmtMins(Math.round(courseMins(featured) * (100 - coursePct(featured.id)) / 100))} left</span>
      </div>
    </div>
    <aside class="hero-side">
      <h4><span class="ai-spark">✦</span> Your AI learning path</h4>
      ${heroSide}
    </aside>
  </header>
  <section class="pillars">${PILLARS.map(p => `<div class="pillar">${svgIcon(p.icon)}<span>${p.label}</span></div>`).join('')}</section>
  ${railHTML('Continue learning', 'Synced across your devices', continuing.map(c => cardHTML(c)))}
  ${railHTML('Assigned to you', 'From EdenRise · Stewardship', assigned.map(c => cardHTML(c)))}
  <section class="path-banner">
    <div class="shimmer"></div>
    <div class="path-banner-head">
      <div class="left">
        <span class="ai-tag">✦ Generated by EdenRise AI · updated 2h ago</span>
        <h2>Your path to ${S.goal}</h2>
        <p class="sub">Built from your role, your last 6 assessments, and the skills gap analysis your manager shared. It reshapes itself every time you learn.</p>
      </div>
      <button class="btn btn-glass" data-action="regen-path" id="regenBtn">Regenerate path ↺</button>
    </div>
    ${pathStepperHTML()}
    <div class="path-banner-foot">
      <div class="why">💡 <span><b>Why this order?</b>&nbsp; ${PATH_RATIONALES[S.rationaleIdx % PATH_RATIONALES.length]}</span></div>
    </div>
  </section>
  <section class="stats">
    <div class="stat"><div class="num">12d</div><div class="lbl">Learning streak</div><div class="delta">▲ Personal best</div></div>
    <div class="stat"><div class="num">${fmtMins(S.week.reduce((a, b) => a + b, 0))}</div><div class="lbl">This week</div><div class="delta">▲ 38% vs last week</div></div>
    <div class="stat"><div class="num">${Object.values(S.progress).filter(p => p.done).length + S.quizzesPassed}</div><div class="lbl">Skills verified</div><div class="delta">▲ ${S.quizzesPassed} from quizzes</div></div>
    <div class="stat"><div class="num">94%</div><div class="lbl">Avg. assessment score</div><div class="delta warn">— Top 5% in EdenRise</div></div>
  </section>
  ${railHTML('Trending at EdenRise', 'What the EdenRise community is learning', trending.map((c, i) => cardHTML(c, { rank: c.trending })))}
  ${railHTML('Because you completed “Living Soil”', 'AI recommendations', recs.map(c => cardHTML(c)))}
  ${footerHTML()}</div>`;
}

let libFilter = 'All', libQuery = '';
function renderLibrary() {
  const cats = ['All', ...new Set(CATALOG.map(c => c.cat))];
  let list = CATALOG.filter(c => (libFilter === 'All' || c.cat === libFilter) &&
    (!libQuery || (c.title + ' ' + c.cat + ' ' + c.desc).toLowerCase().includes(libQuery.toLowerCase())));
  return `<div class="page"><div class="page-pad">
    <h1 class="page-title">Library</h1>
    <p class="page-sub">${CATALOG.length} courses · tended by the EdenRise team, sequenced by EdenRise AI.</p>
    <div class="lib-search">⌕ <input id="libSearch" placeholder="Filter the library…" value="${esc(libQuery)}"></div>
    <div class="filter-row">${cats.map(c => `<button class="filter-chip ${c === libFilter ? 'active' : ''}" data-action="lib-filter" data-cat="${c}">${c}</button>`).join('')}</div>
    <div class="grid">${list.map(c => cardHTML(c)).join('')}</div>
    ${list.length ? '' : '<p class="empty-note">Nothing matches — try another filter or ask the AI tutor to find it.</p>'}
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
    <h1 class="page-title">Live</h1>
    <p class="page-sub">Sessions with real humans — office hours, AMAs and workshops. Replays land in the Library within a day.</p>
    ${LIVE_SESSIONS.map(s => `
      <div class="live-card">
        <div class="live-thumb t-grad-${s.grad}">${svgIcon(s.icon)}${s.live ? '<span class="live-badge">● LIVE</span>' : ''}</div>
        <div class="live-info">
          <h3>${s.title}</h3><div class="host">${s.host}</div><div class="d">${s.desc}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:12px;">
          <span class="live-when">${s.live ? `🔴 ${s.viewers} watching` : s.when}</span>
          ${s.live
            ? `<button class="btn btn-primary btn-sm" data-action="join-live" data-id="${s.id}">Join now</button>`
            : `<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:12px;color:var(--text-faint);font-weight:600;">Remind me</span><div class="toggle ${S.reminders.includes(s.id) ? 'on' : ''}" data-action="remind" data-id="${s.id}"></div></div>`}
        </div>
      </div>`).join('')}
  </div>${footerHTML()}</div>`;
}

function renderAnalytics() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const max = Math.max(...S.week, 1);
  const todayIdx = 3; /* demo: Thursday */
  const skills = [
    ['Data analysis', 86], ['Visualization', 58], ['SQL', 91],
    ['Leadership comms', 64], ['AI tooling', 72], ['Security hygiene', 78]
  ];
  const certs = CATALOG.filter(c => isDone(c.id));
  return `<div class="page"><div class="page-pad">
    <h1 class="page-title">Analytics</h1>
    <p class="page-sub">Your learning, measured. Admins see the team roll-up; you see you.</p>
    <section class="stats" style="margin:28px 0 0;">
      <div class="stat"><div class="num">12d</div><div class="lbl">Streak</div><div class="delta">▲ Personal best</div></div>
      <div class="stat"><div class="num">${fmtMins(S.week.reduce((a, b) => a + b, 0))}</div><div class="lbl">This week</div><div class="delta">▲ 38% vs last week</div></div>
      <div class="stat"><div class="num">${certs.length}</div><div class="lbl">Certificates</div><div class="delta">▲ GDPR latest</div></div>
      <div class="stat"><div class="num">${S.quizzesPassed}</div><div class="lbl">Quizzes passed</div><div class="delta">${S.quizzesPassed ? '▲ Keep going' : '— Take your first'}</div></div>
    </section>
    <div class="two-col" style="margin-top:18px;">
      <div class="chart-card">
        <h3>Minutes learned · this week</h3>
        <div class="bars">${S.week.map((v, i) => `
          <div class="bar-col">
            <span class="bv">${v || ''}</span>
            <div class="bar ${i === todayIdx ? 'today' : ''}" style="height:${Math.max(4, v / max * 100)}%"></div>
            <span class="bl">${days[i]}</span>
          </div>`).join('')}
        </div>
      </div>
      <div class="chart-card">
        <h3>Certificates</h3>
        ${certs.map(c => `<div class="cert-row"><span class="ci">${svgIcon(c.icon)}</span><span class="ct">${c.title}</span><span class="cd">★ verified</span></div>`).join('') || '<p class="empty-note">Complete a course to earn your first certificate.</p>'}
      </div>
    </div>
    <div class="chart-card">
      <h3>Skill confidence · from assessments</h3>
      ${skills.map(([n, v]) => `<div class="skill-row"><span class="sn">${n}</span><div class="track"><div class="fill" style="width:${v}%"></div></div><span class="sv">${v}%</span></div>`).join('')}
    </div>
  </div>${footerHTML()}</div>`;
}

function renderCourse(id) {
  const c = courseById(id);
  if (!c) { location.hash = '#/home'; return ''; }
  const p = prog(id);
  const cur = p && !p.done ? (p.mod || 0) : -1;
  const modules = c.modules.map((m, i) => {
    const done = isDone(id) || (p && !p.done && i < (p.mod || 0));
    const isCur = i === cur;
    const review = S.review[id] === i;
    return `<div class="module-row ${done ? 'done' : ''} ${isCur ? 'current' : ''}" data-action="play" data-id="${id}" data-mod="${i}">
      <div class="m-num">${done ? '✓' : isCur ? '▶' : i + 1}</div>
      <div class="m-title">${m}${review ? ' &nbsp;<span class="review-flag">↺ AI re-queued for review</span>' : ''}</div>
      <span class="m-dur">12m</span>
      <button class="m-play">▶</button>
    </div>`;
  }).join('');
  return `<div class="page">
    <div class="course-hero">
      <div class="bg t-grad-${c.grad}"></div>
      <div class="course-hero-inner">
        <div class="course-poster t-grad-${c.grad}">${svgIcon(c.icon)}</div>
        <div class="course-info">
          <div class="hero-meta">
            <span class="match">${c.ai ? '✦ In AI rotation' : c.cat}</span><span class="sep"></span>
            <span>${c.modules.length} modules</span><span class="sep"></span>
            <span>${fmtMins(courseMins(c))}</span><span class="sep"></span><span>${c.level}</span>
            <span class="sep"></span><span>★ ${c.rating} · ${c.learners} learners</span>
          </div>
          <h1>${c.title}</h1>
          <p class="desc">${c.desc}</p>
          <div class="hero-actions">
            <button class="btn btn-primary" data-action="play" data-id="${id}">▶&nbsp; ${isDone(id) ? 'Rewatch' : p ? `Resume Module ${(p.mod || 0) + 1}` : 'Start course'}</button>
            <button class="btn btn-glass" data-action="quiz" data-id="${id}">🎯&nbsp; Quiz me</button>
            <button class="btn btn-glass" data-action="ai-overview" data-id="${id}">✦&nbsp; AI Overview</button>
            <button class="btn btn-glass" data-action="toggle-path" data-id="${id}">${inPath(id) ? '✓ In My Path' : '+ My Path'}</button>
          </div>
          ${coursePct(id) > 0 && !isDone(id) ? `<div class="hero-progress"><div class="track"><div class="fill" style="width:${coursePct(id)}%"></div></div><span>${coursePct(id)}% complete</span></div>` : ''}
          ${isDone(id) ? `<div class="hero-progress"><span class="due ok" style="margin:0;">✓ Completed${p.score ? ' · scored ' + p.score + '%' : ''}</span></div>` : ''}
        </div>
      </div>
    </div>
    <div class="rail-head" style="margin-top:14px;"><h2>Modules</h2><span class="hint">Tap any module to play</span></div>
    <div class="module-list">${modules}</div>
    ${railHTML('More in ' + c.cat, 'Related courses', CATALOG.filter(x => x.cat === c.cat && x.id !== id).map(x => cardHTML(x)))}
    ${footerHTML()}</div>`;
}

const footerHTML = () => `
<footer>
  <div class="logo"><span class="logo-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="5.4"/><path d="M12 14.4V21"/><path d="M12 21c-1.5 0-2.6-.6-3.1-1.6M12 21c1.5 0 2.6-.6 3.1-1.6"/></svg></span>EdenRise</div>
  <span>· Learning OS for modern teams</span>
  <div class="links">
    <button data-action="toast-msg" data-msg="Admin console ships in the full product — team roll-ups, content upload, SSO.">Admin console</button>
    <button data-action="ai-open">Help</button>
    <button data-action="toast-msg" data-msg="Demo data lives only in your browser (localStorage).">Privacy</button>
    <button data-action="reset-demo">Reset demo</button>
  </div>
</footer>`;

/* ---------- admin console ---------- */
let uploadedDrafts = [];
function renderAdmin() {
  const atRisk = TEAM.filter(t => t.risk);
  const rows = TEAM.map(t => `
    <tr>
      <td><div class="member"><span class="mi t-grad-${t.grad}">${t.initials}</span><div>${t.name}<div class="mr">${t.role}</div></div></div></td>
      <td style="min-width:160px;"><div class="track" style="width:100%;"><div class="fill" style="width:${t.pct}%"></div></div></td>
      <td>${t.pct}%</td>
      <td>${t.done}</td>
      <td style="color:var(--text-faint);">${t.last}</td>
      <td><span class="status-chip ${t.risk ? 'risk' : 'ok'}">${t.risk ? '⚠ At risk' : '● On track'}</span></td>
      <td><button class="btn btn-glass btn-sm" data-action="nudge" data-name="${t.name}">Nudge</button></td>
    </tr>`).join('');
  const content = [...uploadedDrafts, ...CATALOG.slice(0, 6)].map(c => `
    <div class="content-row">
      <span class="ci t-grad-${c.grad}">${svgIcon(c.icon)}</span>
      <div class="ct"><b>${c.title}</b><span>${c.cat} · ${c.modules.length} modules · ${c.learners || 0} learners</span></div>
      <span class="pub-chip ${c.draft ? 'draft' : 'live'}">${c.draft ? 'DRAFT · AI-built' : 'PUBLISHED'}</span>
      <button class="btn btn-glass btn-sm" data-action="toast-msg" data-msg="Course editor ships in the full product — module reorder, quiz authoring, captions.">Edit</button>
    </div>`).join('');
  const assignments = S.assignments.map((a, i) => {
    const c = courseById(a.courseId);
    return `<div class="assignment-row">📌 <b>${c ? c.title : a.courseId}</b> → ${a.team} · due ${a.due}<button class="ar-x" data-action="unassign" data-idx="${i}" title="Remove">✕</button></div>`;
  }).join('');
  return `<div class="page"><div class="page-pad">
    <h1 class="page-title">Admin console</h1>
    <p class="page-sub">EdenRise workspace · 247 seats · you.re seeing the steward.s view.</p>
    <section class="stats" style="margin:28px 0 0;">
      <div class="stat"><div class="num">247</div><div class="lbl">Active learners</div><div class="delta">▲ 12 this month</div></div>
      <div class="stat"><div class="num">81%</div><div class="lbl">Avg. completion</div><div class="delta">▲ 6% vs last quarter</div></div>
      <div class="stat"><div class="num">1,240h</div><div class="lbl">Learned this month</div><div class="delta">▲ 18% vs May</div></div>
      <div class="stat"><div class="num">${atRisk.length}</div><div class="lbl">Compliance at risk</div><div class="delta warn">⚠ Due in &lt; 7 days</div></div>
    </section>

    <div class="admin-section">
      <h2>People</h2>
      <p class="sect-sub">Sorted by risk. “Nudge” sends a friendly reminder with their next module.</p>
      <div class="team-table"><table>
        <thead><tr><th>Member</th><th>Path progress</th><th></th><th>Done</th><th>Last active</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>

    <div class="admin-section">
      <h2>Content manager</h2>
      <p class="sect-sub">Drop a video — EdenRise AI transcribes it, splits it into modules, and drafts a quiz.</p>
      <div class="dropzone" data-action="upload" id="dropzone">
        <div class="dz-icon">📤</div>
        <div class="dz-t">Drop video, slides or SCORM — or click to simulate an upload</div>
        <div class="dz-s">MP4, MOV, PDF, PPTX · AI builds modules, transcript &amp; quiz automatically</div>
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

/* ---------- router ---------- */
const routes = { home: renderHome, library: renderLibrary, paths: renderPaths, live: renderLive, analytics: renderAnalytics, admin: renderAdmin };
function render() {
  const hash = location.hash || '#/home';
  const [, route, param] = hash.split('/');
  $$('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#/${route}`));
  $('#app').innerHTML = route === 'course' ? renderCourse(param) : (routes[route] || renderHome)();
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
addEventListener('hashchange', render);

/* ---------- GSAP motion (graceful + never leaves content hidden) ---------- */
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const BLOCK_SEL = '.hero-content > *, .hero-side, .pillar, .rail-section, .path-banner, .stats, .module-list, .admin-section, .chart-card, .live-card, .two-col';
function forceVisible() {
  document.querySelectorAll(BLOCK_SEL).forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
}
function initMotion() {
  const G = window.gsap;
  if (!G || reduceMotion) { forceVisible(); return; }
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
  if (playing) startSim(courseById(playing.courseId), playing.mod);
  else startSim({ icon: '🔴', modules: [$('#playerTitle').textContent] }, 0);
});

function openPlayer(courseId, mod) {
  const c = courseById(courseId);
  if (!c) return;
  if (mod == null) mod = (prog(courseId) && !isDone(courseId)) ? (prog(courseId).mod || 0) : 0;
  mod = Math.min(mod, c.modules.length - 1);
  playing = { courseId, mod };
  if (!prog(courseId)) S.progress[courseId] = { mod, pct: 0 };
  stopSim(); simStage.classList.remove('on'); videoEl.style.display = '';
  videoEl.src = vidFor(courseId, mod);
  videoEl.play().catch(() => {});
  $('#playerTitle').textContent = c.title;
  $('#playerSub').textContent = `Module ${mod + 1} of ${c.modules.length} · ${c.modules[mod]}`;
  $('#playerPills').innerHTML = c.modules.map((m, i) => {
    const p = prog(courseId);
    const done = isDone(courseId) || (p && !p.done && i < (p.mod || 0));
    return `<button class="mod-pill ${i === mod ? 'current' : done ? 'done' : ''}" data-action="play" data-id="${courseId}" data-mod="${i}">${done ? '✓ ' : ''}${i + 1}. ${m}</button>`;
  }).join('');
  playerEl.classList.add('open');
  if ($('#notesDrawer').classList.contains('open')) refreshNotesDrawer();
}
function closePlayer() {
  playerEl.classList.remove('open');
  $('#notesDrawer').classList.remove('open');
  stopSim(); simStage.classList.remove('on'); videoEl.style.display = '';
  videoEl.pause(); videoEl.removeAttribute('src'); videoEl.load();
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

function completeModule(courseId, mod) {
  const c = courseById(courseId);
  const p = S.progress[courseId] || (S.progress[courseId] = { mod: 0, pct: 0 });
  if (S.review[courseId] === mod) { delete S.review[courseId]; toast('Review module cleared — nice recovery', '↺'); }
  if (mod >= c.modules.length - 1) {
    p.done = true; p.pct = 100; delete p.mod;
    save(); closePlayer();
    toast(`Course complete: ${c.title} 🎉`, '🏆');
    setTimeout(() => { openTutorWith(`You finished <b>${c.title}</b> — that unlocks the next step on your path. Want the certification quiz now? It's 3 questions.`, ['Quiz me now', 'Build me a path']); }, 700);
  } else {
    p.mod = mod + 1;
    p.pct = Math.round((p.mod / c.modules.length) * 100);
    save();
    toast(`Module ${mod + 1} complete`, '✓');
    openPlayer(courseId, mod + 1);
  }
}

/* ---------- quiz ---------- */
let quiz = null; /* {courseId, qs, idx, sel, score} */
function openQuiz(courseId) {
  const c = courseById(courseId) || courseById('leading-data');
  const qs = QUIZ_BANK[c.cat] || QUIZ_BANK._default;
  quiz = { courseId: c.id, qs, idx: 0, sel: null, score: 0, answered: false };
  $('#quizModal').classList.add('open');
  drawQuiz();
}
function drawQuiz() {
  const c = courseById(quiz.courseId);
  const box = $('#quizBody');
  if (quiz.idx >= quiz.qs.length) {
    const pctScore = Math.round(quiz.score / quiz.qs.length * 100);
    const pass = pctScore >= 70;
    if (pass) { S.quizzesPassed++; }
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
  box.innerHTML = `
    <h3>${c.title} · checkpoint</h3>
    <p class="m-sub">Adaptive quiz — score 70%+ to verify the skill.</p>
    <div class="q-text">${q.q}</div>
    ${q.opts.map((o, i) => `<div class="q-opt" data-opt="${i}"><span class="radio"></span><span>${o}</span></div>`).join('')}
    <div class="q-foot">
      <span class="q-progress">Question ${quiz.idx + 1} of ${quiz.qs.length}</span>
      <span style="flex:1"></span>
      <button class="btn btn-glass btn-sm" data-action="quiz-close">Exit</button>
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
function closePalette() { $('#palette').classList.remove('open'); }
function drawPalette(q) {
  q = q.toLowerCase();
  const courses = CATALOG.filter(c => !q || (c.title + ' ' + c.cat).toLowerCase().includes(q)).slice(0, 6);
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
  if (c && p && !p.done) botSay(`Hey João 👋 You're ${coursePct(c.id)}% through <b>${c.title}</b> — currently on “${c.modules[p.mod || 0]}”. Want a 30-second recap, or shall I quiz you?`);
  else botSay(`Hey João 👋 I can summarize any course, quiz you, or rebuild your learning path. I can see your progress and your goal (<b>${S.goal}</b>) — ask me anything.`);
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
You are talking to João, the founder, whose learning goal is "${S.goal}".

His AI learning path right now:
${pathLines}

${c ? `He currently has "${c.title}" open${p && !p.done ? ` — module ${(p.mod || 0) + 1} of ${c.modules.length}, "${c.modules[p.mod || 0]}", ${coursePct(c.id)}% complete` : ''}. Course description: ${c.desc}` : 'No course is currently open.'}

Deadlines: "Fire Safety on the Land" is required and due in 3 days (it's fire season in the Alentejo); the team series "Living by the Seasons" is due June 30.

Style: warm, encouraging, concise (2-4 sentences unless asked for depth). Refer to his actual progress and path when relevant. You can offer to quiz him — if he agrees, tell him to press the "Quiz me now" button. Never invent courses that aren't in his path or the descriptions above.`;
}
async function askClaude(text) {
  tutorHistory.push({ role: 'user', content: text });
  const typing = document.createElement('div');
  typing.className = 'msg bot typing'; typing.innerHTML = '<span></span><span></span><span></span>';
  $('#aiMsgs').appendChild(typing); $('#aiMsgs').scrollTop = $('#aiMsgs').scrollHeight;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': S.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: S.aiModel || 'claude-opus-4-8',
        max_tokens: 700,
        system: buildTutorSystem(),
        messages: tutorHistory.slice(-12)
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error && err.error.message ? err.error.message : `HTTP ${res.status}`);
    }
    const data = await res.json();
    const reply = data.content.filter(b => b.type === 'text').map(b => b.text).join('\n') || '…';
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
  if (S.apiKey) { askClaude(text); return; }
  scriptedRespond(text);
}
function scriptedRespond(text) {
  const id = currentCourseId(); const c = id && courseById(id);
  const t = text.toLowerCase();
  if (t.includes('quiz')) { botSay(`Loading a checkpoint quiz for <b>${c ? c.title : 'your current course'}</b>… 3 questions, adaptive. Good luck 🎯`); setTimeout(() => openQuiz(id || 'leading-data'), 900); return; }
  if (t.includes('summar') || t.includes('recap')) { botSay(c ? `<b>${c.title}</b> in one breath: ${c.desc} The modules build toward “${c.modules[c.modules.length - 1]}” — and based on your quiz history, pay extra attention to module ${Math.min(3, c.modules.length)}: “${c.modules[Math.min(2, c.modules.length - 1)]}”.` : `Open a course and I'll summarize it with your gaps in mind.`); return; }
  if (t.includes('path')) { botSay(`On it — I rebalanced your path toward <b>${S.goal}</b>. Check the Paths tab; I moved your weakest verified skill earlier and trimmed what you've already proven.`); setTimeout(regenPath, 800); return; }
  if (t.includes('explain') || t.includes('new')) { botSay(c ? `Sure — imagine <b>${c.title.toLowerCase()}</b> as learning to drive: the early modules are mirrors-and-seatbelt basics, the middle ones are real traffic, and the capstone is your driving test. You're ${coursePct(c.id) || 0}% in — solidly “real traffic”. 🚗` : `Happy to — open any course and I'll explain it from zero.`); return; }
  if (t.includes('due') || t.includes('deadline') || t.includes('assigned')) { botSay(`You have <b>Fire Safety on the Land</b> due in 3 days (8 minutes left in your current module — easy win), and the team's <b>Living by the Seasons</b> is due June 30.`); return; }
  botSay(c ? `Good question. In the context of <b>${c.title}</b>: ${c.desc.split('.')[0]}. Want me to turn that into flashcards, or queue the related module?` : `I can summarize courses, quiz you, track deadlines, or rebuild your path — try “what's due?” or “quiz me”.`);
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
    case 'toast-msg': toast(msg, 'ℹ️'); break;
    case 'nudge': toast(`Reminder sent to ${el.dataset.name} with their next module`, '👋'); break;
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
    case 'reset-demo': localStorage.removeItem('edenrise-state'); location.hash = '#/home'; location.reload(); break;
  }
});

/* nav & chrome events */
addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', scrollY > 30), { passive: true });
$('#navSearch').addEventListener('click', openPalette);
$('#avatarBtn').addEventListener('click', e => { e.stopPropagation(); $('#avatarMenu').classList.toggle('open'); });
$('#orgChip').addEventListener('click', () => toast('Workspace switching ships in the full product', '🏢'));
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

addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
  if (e.key === 'Escape') {
    if ($('#palette').classList.contains('open')) closePalette();
    else if ($('#quizModal').classList.contains('open')) { $('#quizModal').classList.remove('open'); render(); }
    else if (playerEl.classList.contains('open')) closePlayer();
    else setTutorOpen(false);
  }
});

/* tutor settings */
function syncTutorStatus() {
  $('#tutorStatus').textContent = S.apiKey
    ? `● Live · ${(S.aiModel || 'claude-opus-4-8').replace('claude-', 'Claude ').replace(/-/g, ' ')}`
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
let ob = { step: 0, role: null, goal: null };
function startOnboarding() {
  ob = { step: 0, role: null, goal: null };
  $('#onboard').classList.add('open');
  drawOnboard();
}
function drawOnboard() {
  const body = $('#obBody');
  $('#obFill').style.width = [33, 66, 100][ob.step] + '%';
  if (ob.step === 0) {
    body.innerHTML = `
      <div class="ob-eyebrow">Step 1 of 3 · Welcome to EdenRise</div>
      <div class="ob-title">What do you do, João?</div>
      <p class="ob-sub">The AI uses your role to seed your first learning path. You can change everything later.</p>
      <div class="ob-grid">${ROLE_OPTIONS.map(r => `
        <div class="ob-option ${ob.role === r.key ? 'sel' : ''}" data-role="${r.key}">
          <span class="oi">${svgIcon(r.icon)}</span><div>${r.label}<div class="od">${r.goals[0]} track &amp; more</div></div>
        </div>`).join('')}
      </div>
      <div class="ob-foot">
        <button class="ob-skip" id="obSkip">Skip — explore on my own</button>
        <span style="flex:1"></span>
        <button class="btn btn-primary" id="obNext" ${ob.role ? '' : 'disabled style="opacity:.5"'}>Continue →</button>
      </div>`;
    body.querySelectorAll('.ob-option').forEach(o => o.addEventListener('click', () => { ob.role = o.dataset.role; drawOnboard(); }));
  } else if (ob.step === 1) {
    const role = ROLE_OPTIONS.find(r => r.key === ob.role) || ROLE_OPTIONS[0];
    const goals = [...new Set([...role.goals, ...Object.keys(GOAL_PRESETS)])].slice(0, 4);
    body.innerHTML = `
      <div class="ob-eyebrow">Step 2 of 3 · Your destination</div>
      <div class="ob-title">Pick a goal to work toward</div>
      <p class="ob-sub">The AI sequences courses toward this goal and re-plans as you prove skills.</p>
      <div class="ob-grid">${goals.map(g => `
        <div class="ob-option ${ob.goal === g ? 'sel' : ''}" data-goal="${g}">
          <span class="oi">${svgIcon(courseById(GOAL_PRESETS[g][0]).icon)}</span><div>${g}<div class="od">${GOAL_PRESETS[g].length} courses · adaptive</div></div>
        </div>`).join('')}
      </div>
      <div class="ob-foot">
        <button class="ob-skip" id="obBack">← Back</button>
        <span style="flex:1"></span>
        <button class="btn btn-primary" id="obNext" ${ob.goal ? '' : 'disabled style="opacity:.5"'}>Build my path ✦</button>
      </div>`;
    body.querySelectorAll('.ob-option').forEach(o => o.addEventListener('click', () => { ob.goal = o.dataset.goal; drawOnboard(); }));
    $('#obBack').addEventListener('click', () => { ob.step = 0; drawOnboard(); });
  } else {
    body.innerHTML = `
      <div class="ob-gen">
        <div class="orb-spin"></div>
        <div class="ob-title" style="font-size:24px;">Building your path to ${ob.goal}</div>
        <div class="gen-line" id="genLine">Reading your role profile…</div>
      </div>`;
    const lines = ['Reading your role profile…', 'Scanning the EdenRise library…', 'Checking skills you can skip…', 'Sequencing 4–6 courses…', 'Done ✓'];
    let i = 0;
    const iv = setInterval(() => {
      i++;
      if (i < lines.length) { $('#genLine').textContent = lines[i]; return; }
      clearInterval(iv);
      S.goal = ob.goal;
      S.path = [...GOAL_PRESETS[ob.goal]];
      S.role = ob.role;
      S.onboarded = true;
      save();
      $('#onboard').classList.remove('open');
      render();
      toast(`Your AI path to ${ob.goal} is ready`, '✦');
      setTimeout(() => { setTutorOpen(true); }, 900);
    }, 750);
  }
  const next = $('#obNext');
  if (next) next.addEventListener('click', () => {
    if (ob.step === 0 && !ob.role) return;
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
  if (b.dataset.m === 'profile') location.hash = '#/analytics';
  if (b.dataset.m === 'onboard') startOnboarding();
  if (b.dataset.m === 'switch') toast('Workspace switching ships in the full product', '🏢');
  if (b.dataset.m === 'reset') { localStorage.removeItem('edenrise-state'); location.hash = '#/home'; location.reload(); }
  if (b.dataset.m === 'signout') toast('SSO sign-out ships in the full product', '👋');
});

/* boot */
render();
if (!S.onboarded) startOnboarding();
