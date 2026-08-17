#!/usr/bin/env node
/* ============================================================================
   wire-course.mjs — rewire a course's modules from a pasted list.

     node scripts/wire-course.mjs land-team-journey videos.txt          # dry run
     node scripts/wire-course.mjs land-team-journey videos.txt --apply

   WHY THIS EXISTS
   Vimeo folders are private, there is no API token on this machine, and video
   IDs are the one thing that must never be guessed: a wrong id does not error,
   it silently plays the wrong lesson to a real team and the training record
   still says they completed the right one. So the ids come from a human, and
   this file removes every other opportunity for error.

   INPUT — one line per module, in playback order. Blank lines and # ignored.

     1. Above the Line, Below the Line | 1206810959 | h=abc123def | 5:06
     2. No Failure, Only Feedback      | 1206811136 |             | 4:29

   Only the ID is required. The `h=` hash is needed for PRIVATE videos (it is
   what lets the embed play without a login); omit it for unlisted-with-link.
   Duration may be m:ss or minutes — it becomes moduleDurations, and the real
   m:ss is kept in a comment so the rounding is auditable.

   WHAT IT CHECKS BEFORE WRITING ANYTHING
   · ids are 9-10 digits and unique (a duplicated id = the same video twice,
     which is the most common paste error and invisible once deployed)
   · hashes look like hashes
   · every line parses; a malformed line stops the run rather than silently
     dropping a module
   · the count is reported against the current course so a 7→6 change is a
     decision you confirm, not a diff you discover later
   · titles with apostrophes are emitted double-quoted — "Don't Assume,
     Clarify" is already in this catalogue and would break a single-quoted array

   AFTER APPLYING
     1. re-run the transcript pipeline for this course (new videos, new words)
     2. re-generate + BLIND-VERIFY its questions — a check written against the
        old cut is worse than no check
     3. bump ?v= and sw VERSION together, deploy, curl the live marker
   ========================================================================= */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'brands', 'edenrise', 'content.js');
const [courseId, listFile] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const APPLY = process.argv.includes('--apply');
if (!courseId || !listFile) {
  console.error('usage: wire-course.mjs <courseId> <list.txt> [--apply]');
  process.exit(1);
}

/* ---------- parse ---------- */
const lines = readFileSync(listFile, 'utf8').split('\n')
  .map(l => l.trim()).filter(l => l && !l.startsWith('#'));
const mods = [];
for (const [i, raw] of lines.entries()) {
  const line = raw.replace(/^\s*\d+\s*[.)]\s*/, '');          // strip "1." / "1)"
  const parts = line.split('|').map(x => x.trim());
  const title = parts[0];
  const id = (parts[1] || '').replace(/^.*vimeo\.com\//, '').replace(/\/.*$/, '').replace(/\D/g, '');
  const hashRaw = (parts[2] || '').replace(/^h=/, '').trim();
  const durRaw = (parts[3] || '').trim();
  if (!title) { console.error(`✗ line ${i + 1}: no title — "${raw}"`); process.exit(1); }
  if (!/^\d{9,10}$/.test(id)) { console.error(`✗ line ${i + 1}: "${parts[1] || ''}" is not a Vimeo id (need 9-10 digits) — "${raw}"`); process.exit(1); }
  if (hashRaw && !/^[a-zA-Z0-9]{6,20}$/.test(hashRaw)) { console.error(`✗ line ${i + 1}: "${hashRaw}" does not look like a private hash`); process.exit(1); }
  let mins = null, exact = null;
  if (durRaw) {
    const m = durRaw.match(/^(\d+):(\d{1,2})$/);
    if (m) { exact = `${m[1]}:${m[2].padStart(2, '0')}`; mins = Math.max(1, Math.round(+m[1] + +m[2] / 60)); }
    else if (/^\d+$/.test(durRaw)) mins = +durRaw;
    else { console.error(`✗ line ${i + 1}: "${durRaw}" is not m:ss or minutes`); process.exit(1); }
  }
  mods.push({ title, id, hash: hashRaw || null, mins, exact });
}
const dupes = mods.map(m => m.id).filter((id, i, a) => a.indexOf(id) !== i);
if (dupes.length) { console.error(`✗ duplicated video id(s): ${[...new Set(dupes)].join(', ')} — the same video would play for two modules`); process.exit(1); }

/* ---------- locate the course block ---------- */
const src = readFileSync(CONTENT, 'utf8');
const at = src.indexOf(`id: '${courseId}'`);
if (at < 0) { console.error(`✗ no course "${courseId}" in ${CONTENT}`); process.exit(1); }
const blockStart = src.lastIndexOf('{', at);
const blockEnd = src.indexOf('\n  },', at);
if (blockEnd < 0) { console.error('✗ could not find the end of the course block'); process.exit(1); }
const block = src.slice(blockStart, blockEnd);

const curTitles = (block.match(/modules: \[([\s\S]*?)\]/) || [, ''])[1]
  .match(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g) || [];
const curIds = [...block.matchAll(/id: '(\d{9,10})'/g)].map(m => m[1]);

/* ---------- emit ---------- */
const q = s => s.includes("'") ? JSON.stringify(s) : `'${s.replace(/\\/g, '\\\\')}'`;
const modulesLine = `    modules: [${mods.map(m => q(m.title)).join(', ')}],`;
const haveDur = mods.every(m => m.mins != null);
const durLine = haveDur
  ? `    moduleDurations: [${mods.map(m => m.mins).join(', ')}],   /* real Vimeo lengths: ${mods.map(m => m.exact || m.mins + 'm').join(' ')} */`
  : null;
const mediaLine = `    moduleMedia: [\n${mods.map((m, i) =>
  `      { type: 'vimeo', id: '${m.id}'${m.hash ? `, h: '${m.hash}'` : ''} }${i < mods.length - 1 ? ',' : ' '}   /* ${i + 1}. ${m.title} */`
).join('\n')}\n    ]`;

let out = block;
out = out.replace(/ {4}modules: \[[\s\S]*?\],/, modulesLine);
if (durLine) out = out.replace(/ {4}moduleDurations: \[[^\]]*\],(\s*\/\*[^*]*\*\/)?/, durLine);
out = out.replace(/ {4}moduleMedia: \[[\s\S]*?\n {4}\]/, mediaLine);

/* ---------- report ---------- */
console.log(`${courseId}: ${curTitles.length} modules → ${mods.length}`);
if (curTitles.length !== mods.length) console.log(`  ⚠ the module COUNT changes — confirm that is intended`);
console.log('\n  #  module                                   id           hash    len');
mods.forEach((m, i) => {
  const was = curIds[i];
  const flag = was === m.id ? ' ' : was ? '~' : '+';
  console.log(`  ${flag}${i + 1}  ${m.title.slice(0, 38).padEnd(38)} ${m.id}  ${(m.hash || '—').padEnd(7)} ${m.exact || (m.mins ? m.mins + 'm' : '—')}`);
});
const removed = curIds.filter(id => !mods.some(m => m.id === id));
if (removed.length) console.log(`\n  removed video ids: ${removed.join(', ')}`);
console.log('\n  ~ = different video in this slot   + = new slot');

if (!APPLY) { console.log('\n  dry run — re-run with --apply to write.'); process.exit(0); }

writeFileSync(CONTENT, src.slice(0, blockStart) + out + src.slice(blockEnd));
console.log(`\n  ✓ ${CONTENT} written`);
console.log(`
  Next, in order — a new cut invalidates the words AND the questions:
    1. python3 scripts/transcribe-pipeline.py --course ${courseId}
    2. node scripts/generate-quizzes.mjs --course ${courseId}
    3. node scripts/verify-quizzes.mjs   --course ${courseId}     # the blind gate
    4. node scripts/build-knowledge.mjs && node scripts/push-knowledge.mjs
    5. bump ?v= in index.html AND VERSION in sw.js together, commit, push,
       then curl the live site for the new marker (DEPLOY.md)`);
