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
  const r = await fetch(API, {
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
  const text = String(d.reply || '');
  const a = text.indexOf('['), b = text.lastIndexOf(']');
  const arr = JSON.parse(text.slice(a, b + 1).replace(/,\s*([\]}])/g, '$1'));
  if (!Array.isArray(arr) || arr.length !== texts.length) throw new Error(`misaligned: ${texts.length} in, ${arr.length} out`);
  return arr.map(String);
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
        for (let i = 0; i < tr.segments.length; i += 28) {          // batches keep JSON inside the token budget
          const batch = tr.segments.slice(i, i + 28);
          const texts = await translateBatch(batch.map(s => s.text), from, to);
          batch.forEach((s, j) => out.push({ t0: s.t0, t1: s.t1, text: texts[j] }));
          await new Promise(r => setTimeout(r, 800));
        }
        writeFileSync(outPath, JSON.stringify({
          language: to, machineTranslated: true, translatedFrom: from,
          model: 'llama-3.3-70b@workers-ai', generatedAt: Date.now(), segments: out,
        }, null, 1));
        console.log('done');
      } catch (e) { console.log('FAILED: ' + e.message.slice(0, 120)); }
    }
  }
}
main();
