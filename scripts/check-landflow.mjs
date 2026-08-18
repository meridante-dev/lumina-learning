#!/usr/bin/env node
/* ============================================================================
   check-landflow.mjs — does LandFlow still hold what this repo says it holds?

     node scripts/check-landflow.mjs            # report, exit 1 on drift
     node scripts/check-landflow.mjs --quiet    # exit code only, for cron

   WHY THIS EXISTS
   The Academy pushes its knowledge to LandFlow and then nothing ever checks.
   That gap was found the hard way: LandFlow was serving the transcript of a
   Vimeo video that had been DELETED, and five of eight module titles read
   `, ` or `t Assume, Clarify", ` — the agent's answers to a worker on WhatsApp
   named lessons that way for months. Both were invisible because "the push
   printed 31/31" and nobody compared the two sides afterwards.

   The lesson is the same one the evidence layer taught: a pipeline that only
   reports its own success is not instrumented. The alert IS the control.

   WHAT IT COMPARES  local knowledge/index.json + transcripts  ⟷  D1
     · every module present on both sides
     · titles identical (the corruption above)
     · segment counts identical per lesson (a partial ingest)
     · D1 not older than the local transcript (the stale-cut failure)
     · a real text spot-check, so a matching COUNT cannot mask different WORDS
       — the deleted cut and its replacement both had exactly 122 segments,
       which is precisely how that one hid

   NOT IN CI. It needs Cloudflare credentials, which CI does not have and should
   not. Run it after a push, or on a schedule from a machine that is logged in.
   ========================================================================= */
import { readFileSync, existsSync, statSync } from 'fs';
import { execFileSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TR = join(ROOT, 'media', 'transcripts');
const WORKER_DIR = join(process.env.HOME, 'edenrise-landflow', 'worker');
const QUIET = process.argv.includes('--quiet');
const say = (...a) => { if (!QUIET) console.log(...a); };

function d1(sql) {
  /* --config is REQUIRED: a wrangler.jsonc in $HOME hijacks config discovery
     and this silently targets the wrong account. */
  const out = execFileSync('npx', ['--yes', 'wrangler@latest', 'd1', 'execute', 'landflow',
    '--config', join(WORKER_DIR, 'wrangler.toml'), '--remote', '--json', '--command', sql],
    { cwd: WORKER_DIR, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });
  const j = JSON.parse(out.slice(out.indexOf('[')));
  return j[0].results;
}

const idxPath = join(ROOT, 'knowledge', 'index.json');
if (!existsSync(idxPath)) { console.error('✗ no knowledge/index.json — run scripts/build-knowledge.mjs'); process.exit(2); }
const index = JSON.parse(readFileSync(idxPath, 'utf8'));

/* ---- local side ---------------------------------------------------------- */
const local = new Map();
for (const [course, c] of Object.entries(index.courses)) {
  for (const m of c.modules) {
    let segs = 0, newest = 0, sample = null;
    for (const f of [`m${m.mod}.json`, `m${m.mod}.en.json`, `m${m.mod}.pt.json`]) {
      const p = join(TR, course, f);
      if (!existsSync(p)) continue;
      const tr = JSON.parse(readFileSync(p, 'utf8'));
      segs += tr.segments.length;
      newest = Math.max(newest, statSync(p).mtimeMs);
      if (!sample && tr.segments.length > 4) sample = tr.segments[Math.floor(tr.segments.length / 2)].text.trim();
    }
    local.set(`${course}/${m.mod}`, { course, mod: m.mod, title: m.title, segs, newest, sample });
  }
}

/* ---- remote side --------------------------------------------------------- */
let rows;
try {
  rows = d1(`SELECT l.course_id, l.mod, l.title, l.updated_at,
    (SELECT COUNT(*) FROM lesson_segments s WHERE s.lesson_id = l.id) AS segs FROM lessons l;`);
} catch (e) {
  console.error('✗ could not read D1 — is wrangler logged in?\n  ' + String(e.message).split('\n')[0]);
  process.exit(2);
}
const remote = new Map(rows.map(r => [`${r.course_id}/${r.mod}`, r]));

/* ---- compare ------------------------------------------------------------- */
const problems = [];
for (const [key, L] of local) {
  const R = remote.get(key);
  if (!R) { problems.push(`${key}: MISSING from LandFlow — the agent cannot cite this lesson at all`); continue; }
  if (R.title !== L.title) problems.push(`${key}: title drift — D1 "${R.title}" vs repo "${L.title}"`);
  if (R.segs !== L.segs) problems.push(`${key}: ${R.segs} segments in D1 vs ${L.segs} locally`);
  const remoteAt = Date.parse((R.updated_at || '').replace(' ', 'T') + 'Z');
  if (remoteAt && L.newest > remoteAt + 60000) {
    problems.push(`${key}: D1 copy predates the local transcript (${new Date(remoteAt).toISOString().slice(0, 16)} < ${new Date(L.newest).toISOString().slice(0, 16)}) — LandFlow is serving an older cut`);
  }
}
for (const key of remote.keys()) {
  if (!local.has(key)) problems.push(`${key}: in LandFlow but NOT in this repo — an orphan from a renamed or removed module`);
}

/* ---- the words, not just the counts --------------------------------------
   A matching segment count proves nothing: the deleted Science of Gratitude cut
   and its replacement BOTH had exactly 122 segments, which is how that hid.

   So compare a content signature — the total character length of a lesson's
   stored text. It costs one query for the whole database, needs no string
   interpolation (an escaped LIKE against real transcript text is both fragile
   and an injection shape), and two different recordings agreeing on segment
   count AND total character count is not a coincidence worth worrying about. */
let sigChecked = 0;
const sigs = new Map(d1(`SELECT l.course_id || '/' || l.mod AS k, SUM(LENGTH(s.text)) AS chars
   FROM lessons l JOIN lesson_segments s ON s.lesson_id = l.id GROUP BY 1;`)
  .map(r => [r.k, r.chars]));
for (const [key, L] of local) {
  if (!remote.has(key)) continue;
  let localChars = 0;
  for (const f of [`m${L.mod}.json`, `m${L.mod}.en.json`, `m${L.mod}.pt.json`]) {
    const p = join(TR, L.course, f);
    if (!existsSync(p)) continue;
    for (const s of JSON.parse(readFileSync(p, 'utf8')).segments) localChars += (s.text || '').length;
  }
  sigChecked++;
  const remoteChars = sigs.get(key);
  if (remoteChars !== localChars) {
    problems.push(`${key}: stored text differs — ${remoteChars} characters in D1 vs ${localChars} locally (same count can still be a different cut)`);
  }
}

say(`\nlocal ${local.size} modules  ⟷  LandFlow ${remote.size} lessons   (content signature checked on ${sigChecked})`);
if (!problems.length) {
  say('\n✓ LandFlow matches this repo — titles, counts, freshness and sampled text.\n');
  process.exit(0);
}
console.log(`\n✗ ${problems.length} problem(s):\n`);
problems.forEach(p => console.log('  · ' + p));
console.log('\n  Fix: node scripts/build-knowledge.mjs && node scripts/push-knowledge.mjs\n');
process.exit(1);
