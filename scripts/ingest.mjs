#!/usr/bin/env node
/* ============================================================================
   ingest.mjs — ONE command. Any module that appears gets transcribed, brained,
   quizzed and gated. Run it after wiring a video; run it on a schedule; run it
   twice and the second run does nothing.

     node scripts/ingest.mjs                                # everything missing
     node scripts/ingest.mjs --course land-team-journey
     node scripts/ingest.mjs --lang pt
     node scripts/ingest.mjs --dry                          # what would it do

   THE FOUR STAGES, per course × language × module:

     1 TRANSCRIBE  the module's own Vimeo audio, Whisper locally
     2 QUIZ        questions grounded in THAT transcript
     3 GATE        each question answered blind from the transcript; agreement
                   ships it, disagreement corrects or DISCARDS it
     4 BRAIN       knowledge index + search, pushed to LandFlow

   IDEMPOTENT BY CONSTRUCTION. Every stage's "already done" test is the artefact
   it produces, so nothing is recomputed and a half-finished run resumes. That is
   what makes it safe to attach to a cron or a post-deploy hook.

   LANGUAGE IS A FIRST-CLASS DIMENSION, not a translation step. A course recorded
   twice has two sets of words at two sets of timestamps; the PT questions are
   generated from the PT transcript and gated against the PT transcript. Machine
   translation is a fallback for reading, never a basis for asking.

   ORDER IS NOT NEGOTIABLE. Gate before brain, because the brain publishes to
   LandFlow and an unverified question must never reach a learner through a side
   door. Transcribe before quiz, obviously. And the whole chain stops on a budget
   error rather than marking every remaining module failed.
   ========================================================================= */
import { readFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { execFileSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TR = join(ROOT, 'media', 'transcripts');
const QZ = join(ROOT, 'knowledge', 'quizzes');
const A = process.argv.slice(2);
const arg = k => { const i = A.indexOf(k); return i > -1 ? A[i + 1] : null; };
const ONLY = arg('--course');
const ONLY_LANG = arg('--lang');
const DRY = A.includes('--dry');

const content = readFileSync(join(ROOT, 'brands', 'edenrise', 'content.js'), 'utf8');

/* what the CATALOGUE says exists — the app's own truth, so ingest can never
   disagree with what a learner is actually shown */
function courses() {
  const out = [];
  for (const m of content.matchAll(/\n    id: '([a-z0-9-]+)',/g)) {
    const at = m.index, end = content.indexOf('\n  },', at);
    const blk = content.slice(at, end < 0 ? undefined : end);
    const titles = (blk.match(/modules: \[([\s\S]*?)\]/) || [, ''])[1]
      .match(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g) || [];
    const langs = { '': mediaIds(blk, 'moduleMedia') };
    for (const lm of blk.matchAll(/moduleMedia_([a-z]{2}): \[/g)) langs[lm[1]] = mediaIds(blk, 'moduleMedia_' + lm[1]);
    out.push({ id: m[1], titles: titles.map(s => s.slice(1, -1)), langs });
  }
  return out.filter(c => !ONLY || c.id === ONLY);
}
function mediaIds(blk, key) {
  const m = blk.match(new RegExp(key + ': \\[([\\s\\S]*?)\\n    \\]'));
  if (!m) return [];
  /* ONE ENTRY PER MEDIA OBJECT, not per line. Splitting on newlines counted the
     comment lines inside the array as slots, which shifted every module index by
     one: the planner then looked for m1..m7 where m0..m6 existed, reported work
     that was already done, and printed coverage one short. Match the objects.
     'soon' placeholders yield null — they hold a slot but have no video, and
     must not be reported as a missing transcript for the rest of time. */
  return (m[1].match(/\{[^{}]*\}/g) || []).map(o => (o.match(/id: '(\d{9,10})'/) || [])[1] || null);
}

function run(cmd, args, label) {
  if (DRY) { console.log(`    would run: ${cmd} ${args.join(' ')}`); return true; }
  try {
    const out = execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 });
    const tail = out.trim().split('\n').slice(-3).join('\n      ');
    if (tail) console.log('      ' + tail);
    if (/out of budget|allocation|4006/i.test(out)) { console.log('\n⛔ budget exhausted — stopping. Re-run after the reset; finished work is skipped.'); process.exit(3); }
    return true;
  } catch (e) {
    const msg = String((e.stdout || '') + (e.stderr || e.message)).trim().split('\n').slice(-3).join(' | ');
    console.log(`      ✗ ${label} failed: ${msg.slice(0, 200)}`);
    return false;
  }
}

const plan = [];
for (const c of courses()) {
  for (const [lang, ids] of Object.entries(c.langs)) {
    if (ONLY_LANG && lang !== ONLY_LANG) continue;
    if (!ONLY_LANG && lang && !existsSync(join(TR, c.id))) { /* still fine */ }
    const sfx = lang ? '.' + lang : '';
    for (let i = 0; i < ids.length; i++) {
      if (!ids[i]) continue;                                  // no video in this slot
      const trFile = join(TR, c.id, `m${i}${sfx}.json`);
      if (!existsSync(trFile)) plan.push({ kind: 'transcribe', course: c.id, lang, mod: i, title: c.titles[i] });
    }
    const bank = join(QZ, `${c.id}${sfx}.json`);
    const b = existsSync(bank) ? JSON.parse(readFileSync(bank, 'utf8')) : { modules: {} };
    for (let i = 0; i < ids.length; i++) {
      if (!ids[i]) continue;
      const qs = b.modules[i] || [];
      if (!qs.length) plan.push({ kind: 'quiz', course: c.id, lang, mod: i, title: c.titles[i] });
      else if (qs.some(q => !q.verified && !q.corrected)) plan.push({ kind: 'gate', course: c.id, lang, mod: i, title: c.titles[i] });
    }
  }
}

console.log(`ingest — ${plan.length} thing(s) to do${DRY ? '  (dry run)' : ''}\n`);
if (!plan.length) { console.log('  ✓ every wired module is transcribed, quizzed and gated.'); }
const group = k => [...new Set(plan.filter(p => p.kind === k).map(p => p.course + '|' + p.lang))];

/* stage 1 — transcribe (per course+lang; the script itself skips what exists) */
for (const key of group('transcribe')) {
  const [course, lang] = key.split('|');
  const n = plan.filter(p => p.kind === 'transcribe' && p.course === course && p.lang === lang).length;
  console.log(`  1 transcribe  ${course}${lang ? ' [' + lang + ']' : ''} — ${n} module(s)`);
  run('node', ['scripts/vimeo-transcribe.mjs', course, ...(lang ? ['--lang', lang] : [])], 'transcribe');
}
/* stage 2 — questions, grounded in the transcript just produced */
for (const key of [...group('quiz')]) {
  const [course, lang] = key.split('|');
  console.log(`  2 quiz        ${course}${lang ? ' [' + lang + ']' : ''}`);
  run('node', ['scripts/generate-quizzes.mjs', '--course', course, ...(lang ? ['--lang', lang] : [])], 'generate');
}
/* stage 3 — THE GATE. Nothing reaches a learner unverified. */
for (const key of [...new Set([...group('quiz'), ...group('gate')])]) {
  const [course, lang] = key.split('|');
  console.log(`  3 gate        ${course}${lang ? ' [' + lang + ']' : ''}  (blind verification)`);
  run('node', ['scripts/verify-quizzes.mjs', '--course', course, ...(lang ? ['--lang', lang] : [])], 'verify');
}
/* stage 4 — the brain, once, after the gate */
if (plan.length && !DRY) {
  console.log('  4 brain       knowledge index + search');
  run('node', ['scripts/build-knowledge.mjs'], 'build-knowledge');
  if (existsSync(process.env.HOME + '/.landflow-ingest-key')) run('node', ['scripts/push-knowledge.mjs'], 'push-knowledge');
  else console.log('      (no landflow ingest key — brain built locally, not pushed)');
}

/* ---------- coverage, stated rather than assumed ---------- */
console.log('\ncoverage');
for (const c of courses()) {
  for (const [lang, ids] of Object.entries(c.langs)) {
    if (ONLY_LANG && lang !== ONLY_LANG) continue;
    const sfx = lang ? '.' + lang : '';
    const wired = ids.filter(Boolean).length;
    let tr = 0, ver = 0;
    const bank = join(QZ, `${c.id}${sfx}.json`);
    const b = existsSync(bank) ? JSON.parse(readFileSync(bank, 'utf8')) : { modules: {} };
    for (let i = 0; i < ids.length; i++) {
      if (!ids[i]) continue;
      if (existsSync(join(TR, c.id, `m${i}${sfx}.json`))) tr++;
      const qs = b.modules[i] || [];
      if (qs.length && qs.every(q => q.verified || q.corrected)) ver++;
    }
    const bar = n => `${n}/${wired}`;
    console.log(`  ${(c.id + (lang ? ' [' + lang + ']' : '')).padEnd(30)} transcribed ${bar(tr).padEnd(6)} gated ${bar(ver)}${ver === wired && wired ? '  ✓' : ''}`);
  }
}
console.log('\nRe-run any time — every stage skips what already exists.');
