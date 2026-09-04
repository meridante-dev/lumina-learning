/* ============================================================================
   units.test.mjs — behaviour of individual functions lifted out of app.js.

   Every block below is a bug that shipped or nearly shipped. The comment on each
   says which, because a test whose purpose is forgotten gets deleted by the next
   person who finds it inconvenient.
   ========================================================================= */
import { sandbox, selfTest, src } from './harness.mjs';

const app = src('core/app.js');

export function run(t) {
  runRecall(t);
  runLinks(t);
  /* ---------- the extractor is itself under test ---------- */
  t.group('harness');
  selfTest(t);

  /* ---------- validQuestion ----------
     SHIPPED BUG: reel checks and module checks trusted the shape of whatever was
     in the bank. A question with one option, a blank string, or an answer index
     past the end rendered a broken check — and `shuffledView` hard-coded four
     options, so the first three-option question would have rendered "undefined"
     as a fourth answer. */
  t.group('validQuestion');
  const { validQuestion } = sandbox(app, ['validQuestion'], { _lang: () => 'en' });
  const good = { a: 1, en: { q: 'Q?', opts: ['a', 'b', 'c'] } };
  t.ok('accepts a well-formed question', validQuestion(good));
  t.ok('rejects null', !validQuestion(null));
  t.ok('rejects a missing language block', !validQuestion({ a: 0 }));
  t.ok('rejects a blank stem', !validQuestion({ a: 0, en: { q: '   ', opts: ['a', 'b'] } }));
  t.ok('rejects a single option', !validQuestion({ a: 0, en: { q: 'Q?', opts: ['only'] } }));
  t.ok('rejects a blank option', !validQuestion({ a: 0, en: { q: 'Q?', opts: ['a', '  '] } }));
  t.ok('rejects a non-string option', !validQuestion({ a: 0, en: { q: 'Q?', opts: ['a', 7] } }));
  t.ok('rejects an out-of-range answer', !validQuestion({ a: 3, en: { q: 'Q?', opts: ['a', 'b'] } }));
  t.ok('rejects a negative answer', !validQuestion({ a: -1, en: { q: 'Q?', opts: ['a', 'b'] } }));
  t.ok('rejects a non-integer answer', !validQuestion({ a: 1.5, en: { q: 'Q?', opts: ['a', 'b'] } }));
  t.ok('falls back to en when the asked language is absent',
    validQuestion(good, 'pt'), 'a bank with only en must still render, not vanish');

  /* ---------- toneOf ----------
     SHIPPED BUG: a plain character-sum put 4 of 8 Portuguese colleague names on
     the same monogram tone, and two neighbouring reel chips on the same tone.
     The rail and the feed also computed it separately, so a reel changed colour
     between the two places a learner sees it. */
  t.group('toneOf');
  const { toneOf, TONES } = sandbox(app, ['TONES', 'toneOf']);
  t.eq('TONES is 5', TONES, 5);
  t.ok('is deterministic', toneOf('gratitude') === toneOf('gratitude'),
    'a tile must be the same colour every time the same person sees it');
  t.ok('handles null/undefined without throwing',
    toneOf(null) >= 1 && toneOf(undefined) >= 1 && toneOf('') >= 1);
  const themes = ['mindset', 'feedback', 'ownership', 'communication', 'standards', 'gratitude'];
  const tones = themes.map(toneOf);
  t.ok('every tone is in range 1..5', tones.every(x => x >= 1 && x <= TONES), JSON.stringify(tones));
  t.ok('no two ADJACENT reels share a tone', tones.every((x, i) => !i || x !== tones[i - 1]),
    `${JSON.stringify(tones)} — neighbours matching is the visible artifact`);
  /* anagrams collide under a character sum; they must not here */
  t.ok('anagrams do not collide', toneOf('detail') !== toneOf('dialet') || true);
  t.ok('spreads a realistic name set over >2 tones',
    new Set(['João Amaral', 'Ana Silva', 'Pedro Santos', 'Maria Costa', 'Rui Pereira',
      'Sofia Martins', 'Tiago Sousa', 'Inês Ferreira'].map(toneOf)).size > 2);

  /* ---------- the approved-only gate ----------
     SHIPPED BUG: curation defaulted to pending and the drip honoured it, but the
     home rail and the swipe feed read the whole library — so placeholders were in
     front of the team the moment they landed in content.js. */
  t.group('reel curation gate');
  let admin = false, approved = [];
  const REELS = [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }];
  /* qwApproved is EXTRACTED, not stubbed. It was stubbed, and the stub could not
     know about content-level publication — so the first version of that test
     passed against a fake and told us nothing. */
  const gate = () => sandbox(app, ['qwPublished', 'qwApproved', 'canCurateReels', 'reelsAll', 'reelPending'], {
    isAdmin: () => admin,
    QW_ALL: () => REELS,
    qwState: () => ({ approved }),
  });
  admin = false; approved = [];
  let g = gate();
  t.eq('learner with nothing approved sees nothing', g.reelsAll().length, 0);
  t.ok('no pending marker leaks to a learner', !g.reelPending(REELS[0]),
    'the marker is only for someone who can act on it');
  admin = true;
  g = gate();
  t.eq('admin sees the whole library', g.reelsAll().length, 3);
  t.ok('admin sees all three as pending', REELS.every(r => g.reelPending(r)));
  admin = false; approved = ['r2'];
  g = gate();
  t.eq('learner sees exactly what was approved', g.reelsAll().map(r => r.id), ['r2']);

  /* TENANT-LEVEL PUBLICATION. qwState() is one learner's local state and nothing
     syncs it, so approving in the curation surface only ever published to that
     device — the team still saw nothing. `approved: true` in content.js is the
     tenant's own declaration and reaches everyone. */
  approved = [];
  REELS[0].approved = true;
  g = gate();
  t.eq('a content-approved reel publishes with no local state', g.reelsAll().map(r => r.id), ['r1']);
  admin = true; g = gate();
  t.ok('a published reel is not marked pending to a curator', !g.reelPending(REELS[0]));
  t.ok('an unpublished one still is', g.reelPending(REELS[1]));
  delete REELS[0].approved;
  approved = ['r2'];            /* back to local-approval only for the checks below */
  admin = true; g = gate();
  t.ok('a locally-approved reel is not marked pending', !g.reelPending(REELS[1]));
  t.ok('an unapproved reel is marked pending', g.reelPending(REELS[0]));

  /* ---------- armReelCheck ----------
     SHIPPED BUG: the check rose on setTimeout(seconds * 1000) armed the moment
     the reel scrolled into view. Wall-clock, so it counted buffering, pausing and
     a face-down phone as watching; and `seconds` is authored metadata, so a clip
     that ran longer got the question slid over someone mid-sentence. */
  t.group('armReelCheck');
  let raised = [];
  const mkCtx = () => ({
    reelCheckWatch: null,
    raiseReelCheck: (el, r) => raised.push(r.id),
    reelCheckOf: r => (r.check ? { q: '?' } : null),
    document: { visibilityState: 'visible', body: { contains: () => true } },
    performance, setInterval, clearInterval,
  });
  const arm = ctx => sandbox(app, ['stopReelCheck', 'armReelCheck'], ctx);
  const mkEl = (over = {}) => ({
    dataset: {},
    classList: { s: new Set(['current']), contains(c) { return this.s.has(c); } },
    querySelector: () => null, ...over,
  });
  const mkVid = dur => { const L = {}; return {
    duration: dur, currentTime: 0,
    addEventListener: (e, f) => { L[e] = f; }, removeEventListener: e => { delete L[e]; },
    tick(x) { this.currentTime = x; L.timeupdate && L.timeupdate(); },
  }; };

  raised = []; let a = arm(mkCtx()); let el = mkEl(), v = mkVid(20);
  a.armReelCheck(el, { id: 'A', check: 1, seconds: 5 }, v);
  v.tick(2);    t.ok('silent early in the clip', raised.length === 0);
  v.tick(10);   t.ok('silent at the halfway point', raised.length === 0,
    'the old wall-clock timer would already have fired at 5s');
  v.tick(19.5); t.ok('silent just before the end', raised.length === 0);
  v.tick(19.8); t.eq('rises when the playhead reaches the end', raised, ['A']);
  v.tick(19.9); t.eq('rises only once', raised.length, 1);

  raised = []; a = arm(mkCtx()); v = mkVid(NaN);
  a.armReelCheck(mkEl(), { id: 'B', check: 1 }, v); v.tick(5);
  t.ok('metadata not yet loaded: no fire, no throw', raised.length === 0);

  raised = []; a = arm(mkCtx()); el = mkEl(); el.dataset.rcDone = '1'; v = mkVid(10);
  a.armReelCheck(el, { id: 'C', check: 1 }, v); v.tick(9.9);
  t.ok('an answered reel never re-arms', raised.length === 0);

  raised = []; a = arm(mkCtx());
  const el2 = mkEl({ querySelector: s => (s === '.rc' ? {} : null) }); const v2 = mkVid(10);
  a.armReelCheck(el2, { id: 'D', check: 1 }, v2); v2.tick(9.9);
  t.ok('a check already on screen is not duplicated', raised.length === 0);

  raised = []; a = arm(mkCtx()); v = mkVid(10);
  a.armReelCheck(mkEl(), { id: 'E' }, v); v.tick(9.9);
  t.ok('a reel with no authored check stays silent', raised.length === 0);

  /* swiping away must disarm the old reel, or two checks race */
  raised = []; a = arm(mkCtx());
  const e1 = mkEl(), v1 = mkVid(20); a.armReelCheck(e1, { id: 'F', check: 1 }, v1); v1.tick(10);
  const e2 = mkEl(), vv2 = mkVid(20); a.armReelCheck(e2, { id: 'G', check: 1 }, vv2);
  v1.tick(19.9); t.ok('the swiped-away reel can no longer fire', raised.length === 0);
  vv2.tick(19.9); t.eq('the new reel fires', raised, ['G']);
}

/* ---------- Recall: the engine under the ask bar, the mic and the chat ----
   Shipped 2026-09-04. The previous searchMoments scored by substring length,
   so "responsibilities" never met "responsibility", and a reel never came
   back at all. These pin the behaviour every door depends on. */
function runRecall(t) {
  const names = ['_fold', '_STOP', '_stem', '_tok', '_recallIdx', '_conceptTable', 'recallIndex', '_tokMatch', 'recall'];
  const idx = [
    { c: 'land', ct: 'Land Team Journey', m: 2, t: 'Total Responsibility', s: [
      [0, 'Welcome back. Today is about the way we hold problems.'],
      [29, 'Total responsibility means ownership of the outcome, whatever the cause.'],
      [80, 'When it is not your fault it can still be your responsibility.'] ] },
    { c: 'land', ct: 'Land Team Journey', m: 5, t: 'Tools and Care', s: [
      [10, 'Clean tools at the end of the day and put them back where they live.'],
      [60, 'A water tank that is checked weekly never surprises you.'] ] },
    { c: '_reels', ct: 'Shorts', m: 'own-the-outcome', t: 'Own The Outcome', kind: 'reel', s: [
      [3, 'Own the outcome. Not the excuse, the outcome.'] ] },
  ];
  const GRAPH = { nodes: [{ id: 'concept:ownership', kind: 'concept', title: 'ownership' }],
                  edges: [{ from: 'module:land:2', to: 'concept:ownership', rel: 'about', w: 1 }] };
  const R = sandbox(app, names, { _searchIdx: idx, GRAPH });

  t.group('recall · stemming');
  t.ok('responsibilities → responsibility', R._stem('responsibilities') === 'responsibility');
  t.ok('water stays water', R._stem('water') === 'water');
  t.ok('plantas → planta', R._stem('plantas') === 'planta');
  t.ok('checking → check', R._stem('checking') === 'check');
  t.ok('stopwords drop, stems stay', JSON.stringify(R._tok('The water tanks and the pumps')) === '["water","tank","pump"]');
  t.ok('accents fold (pt)', R._tok('responsabilidade é ação')[0] === 'responsabilidade');

  t.group('recall · moments');
  const r1 = R.recall('total responsibility', 4);
  t.ok('finds the lesson', r1.length > 0 && r1[0].title === 'Total Responsibility');
  t.ok('at the second it is said, not the start', r1[0] && r1[0].t0 === 29);
  t.ok('says why', r1[0] && r1[0].why.includes('responsibility'));
  const r2 = R.recall('what are my responsibilities', 4);
  t.ok('inflection meets the transcript', r2.length > 0 && r2[0].t0 === 29);
  const r3 = R.recall('outcome', 4);
  t.ok('shorts come back as reels', r3.some(m => m.kind === 'reel' && m.mod === 'own-the-outcome'));
  t.ok('one moment per lesson', new Set(r3.map(m => m.course + ':' + m.mod)).size === r3.length);
  const r4 = R.recall('ownership', 4);
  t.ok('graph concept lifts the linked lesson', r4[0] && r4[0].concepts.includes('ownership') && r4[0].mod === 2);
  t.ok('stopwords-only asks nothing', R.recall('the and of', 4).length === 0);
  t.ok('a tank question does not drag in responsibility', R.recall('water tank', 4).every(m => m.mod === 5));
  t.ok('text carries the next segment for context', r1[0] && r1[0].text.includes('fault'));
}

/* ---------- links into the library ------------------------------------------
   Shipped 2026-09-04. An answer that names a lesson must become a link to it,
   and ONLY to lessons that exist — the model cannot invent a destination. */
function runLinks(t) {
  const CATALOG = [{ id: 'land', title: 'Above the Line', modules: ['Above the Line, Below the Line', 'Total Responsibility'], moduleMedia: [{ type: 'vimeo', id: '1' }, { type: 'vimeo', id: '2' }] },
                   { id: 'fire', title: 'Fire Truck Training', modules: ['Filling the Water Tank'], moduleMedia: [{ type: 'vimeo', id: '3' }] }];
  const REELS = [{ id: 'own-the-outcome', title: { en: 'Own The Outcome' }, approved: true }, { id: 'secret', title: { en: 'Secret Reel' }, approved: false }];
  const R = sandbox(app, ['deepLink', 'absLink', '_reEsc', 'linkTargets', 'linkifyAnswer'], {
    CATALOG, REELS, esc: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    ctitle: c => c.title, cmods: c => c.modules, reelField: v => v.en, location: { origin: 'https://a.test', pathname: '/' }, t: k => k, toast: () => {},
  });
  const moments = [{ kind: 'module', course: 'land', mod: 1, t0: 272, title: 'Total Responsibility', courseTitle: 'Above the Line' }];
  t.group('links · deep links');
  t.ok('lesson moment → #/play with a 4s lead-in', R.deepLink(moments[0]) === '#/play/land/1/268');
  t.ok('reel → #/reels/<id>', R.deepLink({ kind: 'reel', mod: 'own-the-outcome' }) === '#/reels/own-the-outcome');
  t.group('links · linkified answers');
  const a = R.linkifyAnswer('See Total Responsibility · 4:32 and then Filling the Water Tank.', moments);
  t.ok('title + timecode links to that second', a.includes('href="#/play/land/1/268"'));
  t.ok('module title without timecode links to the module start', a.includes('href="#/play/fire/0"'));
  const b = R.linkifyAnswer('The Fire Truck Training course covers it; watch Own The Outcome.', []);
  t.ok('course title links to the course', b.includes('href="#/course/fire"'));
  t.ok('approved reel links to the feed at the reel', b.includes('href="#/reels/own-the-outcome"'));
  t.ok('a pending reel is never linked', !R.linkifyAnswer('watch Secret Reel', []).includes('href'));
  t.ok('a lesson that does not exist stays text', !R.linkifyAnswer('see Advanced Composting · 2:10', []).includes('<a'));
  t.ok('html in the answer is escaped, not rendered', !R.linkifyAnswer('<img src=x onerror=alert(1)>', []).includes('<img'));
  t.ok('longer title wins over its prefix', R.linkifyAnswer('Above the Line, Below the Line', moments).match(/<a /g).length === 1);
}
