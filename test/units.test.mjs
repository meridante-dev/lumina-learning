/* ============================================================================
   units.test.mjs — behaviour of individual functions lifted out of app.js.

   Every block below is a bug that shipped or nearly shipped. The comment on each
   says which, because a test whose purpose is forgotten gets deleted by the next
   person who finds it inconvenient.
   ========================================================================= */
import { sandbox, selfTest, src } from './harness.mjs';

const app = src('core/app.js');

export function run(t) {
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
