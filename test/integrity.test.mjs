/* ============================================================================
   integrity.test.mjs — invariants that hold across the shipped files.

   These are the cheapest tests in the suite and they catch the most damaging
   class of bug, because every one of them corresponds to something that has
   actually shipped broken:

     · a raw i18n key rendered at the user ("lang_fallback")
     · seven Portuguese entries on an eight-module course → "MÓDULO 8 de 8 ·
       undefined"
     · Portuguese modules left in the old order, so the title said one thing
       while the video played another
     · a Vimeo id deleted upstream, rendering a dead player that records no
       watch time and credits no compliance hour
     · a ?v= marker bumped in index.html but not in sw.js, stranding returning
       browsers on a half-updated app

   None of them are catchable by `node --check`, which is all CI ran before.
   ========================================================================= */
import { execFileSync } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { ROOT, src } from './harness.mjs';

/* Evaluate a pure-data file and hand back its top-level declarations. content.js
   and data.js are plain tables; if either ever starts touching `document` at load
   time this throws with a clear message rather than a mystery. */
function dataFile(rel, names) {
  const code = src(rel);
  try {
    return new Function(`${code}\n;return {${names.join(', ')}};`)();
  } catch (e) {
    throw new Error(`${rel} could not be evaluated as data (${e.message}). If it now needs the DOM, this test needs a stub.`);
  }
}

const SHIPPED_JS = ['core/app.js', 'core/auth.js', 'core/brandkit.js', 'core/ots.js',
  'core/landflow.js', 'data.js', 'sw.js', 'brands/edenrise/content.js', 'brands/edenrise/brand.js'];

export function run(t) {
  /* ---------- 1. everything parses ---------- */
  t.group('syntax');
  for (const f of SHIPPED_JS) {
    if (!existsSync(join(ROOT, f))) { t.ok(`${f} exists`, false, 'missing'); continue; }
    let err = '';
    try { execFileSync(process.execPath, ['--check', join(ROOT, f)], { stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { err = String(e.stderr || e.message).split('\n').slice(0, 2).join(' '); }
    t.ok(`${f} parses`, !err, err);
  }

  /* ---------- 2. cache markers move together ---------- */
  t.group('cache version');
  const idx = src('index.html'), sw = src('sw.js');
  const marks = [...new Set((idx.match(/\?v=edr\d+/g) || []).map(m => m.slice(3)))];
  t.ok('index.html uses exactly one ?v= marker', marks.length === 1,
    marks.length ? `found ${marks.join(', ')} — a partial bump serves a half-updated app` : 'no ?v= marker at all');
  const swV = (sw.match(/edenrise-v(\d+)/) || [])[1];
  const idxV = marks.length === 1 ? marks[0].replace('edr', '') : null;
  t.ok('sw.js VERSION matches index.html marker', !!swV && swV === idxV,
    `sw=${swV} index=${idxV} — returning browsers keep the old shell until these agree`);

  /* every LOCAL asset carries the marker; a missed one is a permanently stale file */
  const unversioned = [...idx.matchAll(/(?:src|href)="(?!https?:|\/\/|#|mailto:)([^"]+)"/g)]
    .map(m => m[1])
    .filter(u => /\.(js|css)$/.test(u.split('?')[0]))
    .filter(u => !u.includes('?v='));
  t.ok('every local js/css in index.html is versioned', unversioned.length === 0, unversioned.join(', '));

  /* ---------- 3. i18n: core never calls a key the tenant has not defined ---- */
  t.group('i18n parity');
  const app = src('core/app.js');
  const dj = src('data.js');
  const called = [...new Set([...app.matchAll(/\bt\('([a-z][a-z0-9_]*)'\)/g)].map(m => m[1]))];
  /* the two language blocks, sliced by their own headers */
  const enAt = dj.indexOf('\n  en: {'), ptAt = dj.indexOf('\n  pt: {');
  t.ok('data.js has both en and pt blocks', enAt > -1 && ptAt > enAt);
  const keysIn = s => new Set([...s.matchAll(/[{,]\s*([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*['"]/g)].map(m => m[1]));
  const en = keysIn(dj.slice(enAt, ptAt)), pt = keysIn(dj.slice(ptAt));
  const missEn = called.filter(k => !en.has(k)), missPt = called.filter(k => !pt.has(k));
  t.ok(`all ${called.length} keys core calls are defined in en`, !missEn.length, missEn.join(', '));
  t.ok(`all ${called.length} keys core calls are defined in pt`, !missPt.length, missPt.join(', '));

  /* ---------- 4. course content lines up with its media ---------- */
  t.group('course content');
  const C = dataFile('brands/edenrise/content.js',
    ['CATALOG', 'REELS', 'QUICKWINS', 'COURSE_PT', 'EDUCATORS']);
  const ids = C.CATALOG.map(c => c.id);
  t.ok('CATALOG has courses', C.CATALOG.length > 0);
  t.ok('course ids are unique', new Set(ids).size === ids.length);

  for (const c of C.CATALOG) {
    const n = (c.modules || []).length;
    if (c.moduleMedia) {
      t.ok(`${c.id}: moduleMedia count matches module titles`, c.moduleMedia.length === n,
        `${c.moduleMedia.length} media vs ${n} titles`);
    }
    if (c.moduleDurations) {
      t.ok(`${c.id}: moduleDurations count matches module titles`, c.moduleDurations.length === n,
        `${c.moduleDurations.length} durations vs ${n} titles`);
    }
    /* a per-language cut may be SHORTER (not yet recorded) but never longer, and
       never longer than the module list — that produced "MÓDULO 8 de 8 · undefined" */
    for (const k of Object.keys(c)) {
      const m = k.match(/^moduleMedia_([a-z]{2})$/);
      if (!m) continue;
      t.ok(`${c.id}: ${k} is not longer than the module list`, c[k].length <= n,
        `${c[k].length} > ${n}`);
      const dk = `moduleDurations_${m[1]}`;
      if (c[dk]) t.ok(`${c.id}: ${dk} matches ${k} length`, c[dk].length === c[k].length,
        `${c[dk].length} durations vs ${c[k].length} videos`);
    }
    /* a duplicated video id means two modules silently play the same lesson */
    const vids = [];
    for (const k of Object.keys(c)) {
      if (!/^moduleMedia(_[a-z]{2})?$/.test(k)) continue;
      for (const e of c[k]) if (e && e.id) vids.push(`${k}:${e.id}`);
    }
    const bare = vids.map(v => v.split(':')[1]);
    const dupes = [...new Set(bare.filter((v, i) => bare.indexOf(v) !== i))];
    t.ok(`${c.id}: no video id used twice`, !dupes.length, dupes.join(', '));
    /* ids are 9-10 digits: a truncated paste renders a dead player, silently */
    const badIds = bare.filter(v => !/^\d{9,10}$/.test(v));
    t.ok(`${c.id}: every video id is well-formed`, !badIds.length, badIds.join(', '));
  }

  /* the Portuguese module titles must describe the same lessons, in order */
  t.group('portuguese parity');
  for (const c of C.CATALOG) {
    const ptc = (C.COURSE_PT || {})[c.id];
    if (!ptc || !ptc.modules) continue;
    t.ok(`${c.id}: PT module count matches EN`, ptc.modules.length === c.modules.length,
      `pt ${ptc.modules.length} vs en ${c.modules.length} — a short list renders "undefined" for the tail`);
  }

  /* ---------- 5. reels ---------- */
  t.group('reels');
  const reels = C.REELS || [];
  t.ok('QUICKWINS is the same library as REELS (one curation state)', C.QUICKWINS === C.REELS);
  t.ok('reel ids are unique', new Set(reels.map(r => r.id)).size === reels.length);
  for (const r of reels) {
    for (const f of ['title', 'hook', 'line']) {
      t.ok(`${r.id}: ${f} has en+pt`, !!(r[f] && r[f].en && r[f].pt));
    }
    t.ok(`${r.id}: deeper points at a real course`, ids.includes(r.deeper), String(r.deeper));
    const q = r.check;
    if (!q) { t.ok(`${r.id}: has a check`, false, 'no check object'); continue; }
    for (const L of ['en', 'pt']) {
      const b = q[L];
      t.ok(`${r.id}: check.${L} is complete`,
        !!(b && b.q && b.q.trim() && Array.isArray(b.opts) && b.opts.length >= 2
           && b.opts.every(o => o && o.trim()) && b.why && b.why.trim()),
        b ? 'a field is blank' : `no ${L} block — a learner in ${L} would be asked another language's question`);
    }
    t.ok(`${r.id}: answer index is in range`,
      Number.isInteger(q.a) && q.a >= 0 && q.a < (q.en.opts || []).length, `a=${q.a}`);
    t.ok(`${r.id}: en and pt offer the same number of options`,
      (q.en.opts || []).length === (q.pt.opts || []).length);
    /* a reel must never be able to credit a training hour */
    t.ok(`${r.id}: is not in CATALOG`, !ids.includes(r.id));
  }

  /* ---------- 6. quiz banks: shaped, and gated ---------- */
  t.group('quiz banks');
  const qdir = join(ROOT, 'knowledge', 'quizzes');
  const banks = existsSync(qdir) ? readdirSync(qdir).filter(f => f.endsWith('.json')) : [];
  t.ok('quiz banks exist', banks.length > 0);
  for (const f of banks) {
    let b;
    try { b = JSON.parse(readFileSync(join(qdir, f), 'utf8')); }
    catch (e) { t.ok(`${f} is valid JSON`, false, e.message); continue; }
    const courseId = f.replace(/\.json$/, '').replace(/\.[a-z]{2}$/, '');
    const course = C.CATALOG.find(c => c.id === courseId);
    t.ok(`${f}: names a real course`, !!course, courseId);
    let total = 0, ungated = 0, malformed = 0, outOfRange = 0;
    for (const [modIdx, qs] of Object.entries(b.modules || {})) {
      if (course && +modIdx >= course.modules.length) outOfRange++;
      for (const q of qs || []) {
        total++;
        if (!q.verified && !q.corrected) ungated++;
        const L = q.en || q.pt;
        const okShape = L && typeof L.q === 'string' && L.q.trim()
          && Array.isArray(L.opts) && L.opts.length >= 2
          && L.opts.every(o => typeof o === 'string' && o.trim())
          && Number.isInteger(q.a) && q.a >= 0 && q.a < L.opts.length;
        if (!okShape) malformed++;
      }
    }
    t.ok(`${f}: ${total} questions, all well-formed`, !malformed, `${malformed} malformed`);
    t.ok(`${f}: every question passed the blind gate`, !ungated,
      `${ungated} of ${total} neither verified nor corrected — an ungated question must not reach a learner`);
    t.ok(`${f}: no module index beyond the course`, !outOfRange, `${outOfRange} orphaned`);
  }

  /* ---------- 7. transcript provenance ----------
     TWO DIFFERENT CLAIMS, kept apart because conflating them cost me a run of
     39 alarming failures that were not what the message said.

     A CONTRADICTION — the transcript names a different video than the one wired
     — is a real defect: the questions were written against another cut. That is
     how the deleted `1218881643` was caught.

     A MISSING source id is weaker: it means provenance was never recorded, so
     the transcript cannot be traced either way. The courses below predate
     vimeo-transcribe.mjs; the old pipeline matched local SSD footage to modules
     by DURATION and stored no id. Re-ingesting them from the API is the fix and
     it is real work, so the debt is named here rather than papered over.

     The exemption is self-cleaning: if an exempt course turns out to record
     provenance after all, the test FAILS and tells you to delete the entry. An
     allowlist nobody is forced to shrink is just a way to hide a growing pile. */
  const LEGACY_UNSOURCED = {
    'alignment-journey': 'transcribed by the pre-API duration-matching pipeline',
    'fire-truck-training': 'transcribed by the pre-API duration-matching pipeline',
  };

  t.group('transcript provenance');
  const tdir = join(ROOT, 'media', 'transcripts');
  const sourced = {}, unsourced = {};
  if (existsSync(tdir)) {
    for (const cdir of readdirSync(tdir)) {
      const course = C.CATALOG.find(c => c.id === cdir);
      if (!course) continue;
      for (const f of readdirSync(join(tdir, cdir)).filter(x => x.endsWith('.json'))) {
        const m = f.match(/^m(\d+)(?:\.([a-z]{2}))?\.json$/);
        if (!m) continue;
        const [, i, lang] = m;
        let tr;
        try { tr = JSON.parse(readFileSync(join(tdir, cdir, f), 'utf8')); } catch { continue; }
        (tr.vimeoId ? sourced : unsourced)[cdir] = ((tr.vimeoId ? sourced : unsourced)[cdir] || 0) + 1;
        const arr = lang ? course[`moduleMedia_${lang}`] : course.moduleMedia;
        if (!arr || !arr[+i] || !tr.vimeoId) continue;
        /* the load-bearing check: never disagree with what the learner is played */
        t.ok(`${cdir}/${f}: matches the wired video`, String(tr.vimeoId) === String(arr[+i].id),
          `transcript ${tr.vimeoId} vs wired ${arr[+i].id} — its questions describe a different cut`);
      }
    }
  }
  for (const cdir of Object.keys({ ...sourced, ...unsourced })) {
    const miss = unsourced[cdir] || 0;
    if (LEGACY_UNSOURCED[cdir]) {
      /* self-cleaning: the exemption must still be needed */
      t.ok(`${cdir}: exemption still applies`, miss > 0,
        `every transcript now records its source — remove "${cdir}" from LEGACY_UNSOURCED`);
    } else {
      t.ok(`${cdir}: every transcript records its source video`, miss === 0,
        `${miss} transcript(s) have no vimeoId, so they cannot be traced to a cut`);
    }
  }
  const debt = Object.keys(LEGACY_UNSOURCED).reduce((n, k) => n + (unsourced[k] || 0), 0);
  if (debt) console.log(`      (known debt: ${debt} legacy transcripts without provenance — re-ingest to clear)`);
}
