#!/usr/bin/env node
/* ============================================================================
   Academy → LandFlow. The moment the two systems become one ecosystem.

   Reads knowledge/index.json + the transcripts and POSTs every lesson into the
   LIVE LandFlow worker's /api/knowledge/ingest. After this runs, the crew's
   walkie-talkie can answer "como encho o tanque do camião?" by quoting the
   trainer and linking the exact minute in the Academy player.

   Auth: X-Ingest-Key from ~/.landflow-ingest-key (same pattern as the build
   key — generated locally, stored as a Worker secret, in no repo). Idempotent:
   the worker upserts lessons and replaces segments, so re-run freely.

   Segments pushed: the ORIGINAL language plus the machine translation when it
   exists, labelled — the brain answers in the asker's language and quotes
   whichever transcript matches.

   USAGE  node scripts/push-knowledge.mjs [--worker https://landflow.….workers.dev]
   ========================================================================= */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TR = join(ROOT, 'media', 'transcripts');
const argv = process.argv.slice(2);
const WORKER = argv.includes('--worker') ? argv[argv.indexOf('--worker') + 1]
  : 'https://landflow.edenrise.workers.dev';
const KEY = readFileSync(process.env.HOME + '/.landflow-ingest-key', 'utf8').trim();

const index = JSON.parse(readFileSync(join(ROOT, 'knowledge', 'index.json'), 'utf8'));
const lessons = [];
for (const [course, c] of Object.entries(index.courses)) {
  for (const m of c.modules) {
    const segs = [];
    const orig = JSON.parse(readFileSync(join(TR, course, `m${m.mod}.json`), 'utf8'));
    for (const s of orig.segments) segs.push({ t0: s.t0, t1: s.t1, lang: orig.language, text: s.text });
    for (const l of ['en', 'pt']) {
      const p = join(TR, course, `m${m.mod}.${l}.json`);
      if (existsSync(p)) for (const s of JSON.parse(readFileSync(p, 'utf8')).segments)
        segs.push({ t0: s.t0, t1: s.t1, lang: l, text: s.text });
    }
    lessons.push({
      course, mod: m.mod, title: m.title, courseTitle: c.title,
      lang: m.language, tags: m.tags, capability: m.capability, regime: m.regime,
      summary: m.summary, url: m.url, durationMin: Math.round(m.durationSec / 6) / 10,
      segments: segs,
    });
  }
}

/* one lesson per request — segment payloads are chunky and D1 writes are row-by-row */
let ok = 0, fail = 0;
for (const L of lessons) {
  const r = await fetch(WORKER + '/api/knowledge/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Ingest-Key': KEY },
    body: JSON.stringify({ lessons: [L] }),
  });
  const d = await r.json().catch(() => ({}));
  if (r.ok && d.ok) { ok++; process.stdout.write(`✓ ${L.course}/m${L.mod} (${d.segments} segs)\n`); }
  else { fail++; console.log(`✗ ${L.course}/m${L.mod}: ${r.status} ${JSON.stringify(d).slice(0, 120)}`); }
}
console.log(`pushed ${ok}/${lessons.length}${fail ? ` · ${fail} FAILED` : ''}`);
