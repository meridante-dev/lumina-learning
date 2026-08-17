#!/usr/bin/env node
/* ============================================================================
   Transcript translation — every lesson searchable in BOTH languages.

   The original Whisper transcript is ground truth and is never touched. This
   produces the OTHER language (EN↔pt-PT) per module as m<N>.<lang>.json, with
   machineTranslated:true stamped on the file — the crew must be able to tell a
   trainer's words from a machine's rendering of them. Segment timestamps are
   preserved 1:1 (translation happens per batch of segments, aligned by index),
   so "rever o momento" and LandFlow deep links work identically in either
   language. Native-speaker QA is on the future ledger, not pretended here.

   USAGE  node scripts/translate-transcripts.mjs [--course id]
   ========================================================================= */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TR = join(ROOT, 'media', 'transcripts');
const API = 'https://academy-ai.edenrise.workers.dev';
const onlyCourse = process.argv.includes('--course') ? process.argv[process.argv.indexOf('--course') + 1] : null;

async function translateBatch(texts, from, to) {
  const label = to === 'pt' ? 'European Portuguese (pt-PT: "camião", "está a fazer" — never Brazilian forms)' : 'English';
  const prompt =
`These are consecutive lines from one of our training lesson videos (spoken ${from === 'pt' ? 'Portuguese' : 'English'}). ` +
`Translate each line into ${label} for our team's training materials. Keep line ${'`'}i${'`'} aligned to input line ${'`'}i${'`'}. ` +
`Reply with ONLY a JSON array of strings, same length and order as the input, no prose.

INPUT:
${JSON.stringify(texts)}`;
  /* a stalled connection must fail, not hang the whole run — the first launch
     sat 15 minutes on one silent socket */
  const r = await fetch(API, {
    signal: AbortSignal.timeout(120000),
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://academy.edenrise.com',
               'X-Build-Key': (await import('fs')).readFileSync(process.env.HOME + '/.academy-build-key', 'utf8').trim() },
    body: JSON.stringify({
      context: { brand: 'EdenRise Academy', course: 'training material translation',
                 topics: 'team culture, fire truck operation, land safety, working with AI' },
      maxTokens: 3200,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const d = await r.json();
  /* A spent daily allocation is not a misalignment. Unlabelled, it surfaced as
     "Unexpected end of JSON input" and the splitter fanned 46 doomed retries
     against a wall. Budget errors are fatal to the RUN, not to the batch. */
  if (d && d.error) {
    const e = new Error(`${d.error}: ${String(d.detail || '').slice(0, 120)}`);
    e.fatal = /4006|allocation|quota|rate/i.test(JSON.stringify(d));
    throw e;
  }
  const text = String(d.reply || '');
  const a = text.indexOf('['), b = text.lastIndexOf(']');
  if (a < 0 || b < a) throw new Error('no JSON array in reply: ' + text.slice(0, 80));
  const arr = JSON.parse(text.slice(a, b + 1).replace(/,\s*([\]}])/g, '$1'));
  if (!Array.isArray(arr) || arr.length !== texts.length) {
    const err = new Error(`misaligned: ${texts.length} in, ${Array.isArray(arr) ? arr.length : '?'} out`);
    err.parts = arr; throw err;
  }
  return arr.map(String);
}

/* A 28-line batch makes the 70B drop lines (28 in, 8 out) or split them
   (28 in, 56 out). Retrying the SAME size just fails twice — which is what the
   first run did on 12 of 30 modules. Halve on misalignment instead and recurse:
   smaller batches are the one thing that reliably fixes it, and the split is
   exact because each half is aligned independently. At a single segment the
   model can still return several strings; those are one line's worth of
   translation, so they are rejoined rather than dropped. */
async function translateAligned(texts, from, to) {
  try {
    return await translateBatch(texts, from, to);
  } catch (e) {
    if (e.fatal) throw e;                      // no point splitting against a wall
    if (texts.length === 1) {
      const arr = e.parts;                     // preserved by translateBatch
      if (Array.isArray(arr) && arr.length) return [arr.join(' ')];
      throw e;
    }
    const mid = Math.ceil(texts.length / 2);
    process.stdout.write(`[split ${texts.length}→${mid}] `);
    const a = await translateAligned(texts.slice(0, mid), from, to);
    await new Promise(r => setTimeout(r, 500));
    const b = await translateAligned(texts.slice(mid), from, to);
    return a.concat(b);
  }
}

async function main() {
  const courses = readdirSync(TR).filter(d => !d.includes('.') && (!onlyCourse || d === onlyCourse));
  for (const course of courses) {
    const files = readdirSync(join(TR, course)).filter(f => /^m\d+\.json$/.test(f));
    for (const f of files) {
      const mod = f.replace('.json', '');
      const tr = JSON.parse(readFileSync(join(TR, course, f), 'utf8'));
      const from = tr.language === 'pt' ? 'pt' : 'en';
      const to = from === 'pt' ? 'en' : 'pt';
      const outPath = join(TR, course, `${mod}.${to}.json`);
      if (existsSync(outPath)) { console.log(`${course}/${mod} → ${to} exists, skip`); continue; }
      process.stdout.write(`${course}/${mod} ${from}→${to} (${tr.segments.length} segs) … `);
      try {
        const out = [];
        for (let i = 0; i < tr.segments.length; i += 16) {          // batches keep JSON inside the token budget
          const batch = tr.segments.slice(i, i + 16);
          const texts = await translateAligned(batch.map(s => s.text), from, to);
          batch.forEach((s, j) => out.push({ t0: s.t0, t1: s.t1, text: texts[j] }));
          await new Promise(r => setTimeout(r, 800));
        }
        writeFileSync(outPath, JSON.stringify({
          language: to, machineTranslated: true, translatedFrom: from,
          model: 'llama-3.3-70b@workers-ai', generatedAt: Date.now(), segments: out,
        }, null, 1));
        console.log('done');
      } catch (e) {
        console.log('FAILED: ' + e.message.slice(0, 120));
        if (e.fatal) { console.log('\n⛔ stopping: the run is out of budget. Re-run after the daily reset — finished modules are skipped.'); return; }
      }
    }
  }
}
main();
