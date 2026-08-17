#!/usr/bin/env node
/* ============================================================================
   Answer-key verification — the automated gate between "generated" and "asked".

   WHY IT EXISTS
   First sampled batch: 1 of 3 questions carried a WRONG answer key (the model
   marked "Fazer perguntas" as what characterises being below the line). João's
   decision was that generated questions ship everywhere, including the check
   that credits legal hours — that decision assumed the keys are RIGHT. A wrong
   key isn't a gating-policy question, it's a defect: it would mark correct
   learners wrong inside the art. 131.º evidence chain.

   THE GATE (no human in the loop, and none needed)
   For each question, a fresh model call gets the transcript excerpt around t0
   and answers the question BLIND — it never sees the generator's key.
     · verifier agrees with key          → verified:true, keep
     · verifier disagrees → second blind run:
         both runs agree with each other → the key was wrong; FIX it to the
                                           consensus, corrected:true
         runs disagree                   → the question is ambiguous; DROP it.
                                           An ambiguous question is worse than
                                           one fewer question.
   Every surviving question carries its audit: verified / corrected flags stay
   in the bank and flow into the check's evidence record.

   USAGE  node scripts/verify-quizzes.mjs [--course id]
   ========================================================================= */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QDIR = join(ROOT, 'knowledge', 'quizzes');
const TR = join(ROOT, 'media', 'transcripts');
const API = 'https://academy-ai.edenrise.workers.dev';
const onlyCourse = process.argv.includes('--course') ? process.argv[process.argv.indexOf('--course') + 1] : null;
/* the gate must read the SAME transcript the question was written from: a PT
   question blind-verified against the English words would be graded on a video
   the learner never watched. */
const LANG = process.argv.includes('--lang') ? process.argv[process.argv.indexOf('--lang') + 1] : '';
const SFX = LANG ? '.' + LANG : '';

async function blindAnswer(excerpt, q) {
  const prompt =
`From our training lesson transcript below, answer the quiz question. Reply with ONLY the number (0, 1, 2 or 3) of the best option — nothing else.

TRANSCRIPT EXCERPT:
${excerpt}

QUESTION: ${(LANG && q[LANG] ? q[LANG] : q.en).q}
${(LANG && q[LANG] ? q[LANG] : q.en).opts.map((o, i) => i + ': ' + o).join('\n')}`;
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://academy.edenrise.com',
               'X-Build-Key': (await import('fs')).readFileSync(process.env.HOME + '/.academy-build-key', 'utf8').trim() },
    body: JSON.stringify({
      context: { brand: 'EdenRise Academy', course: 'training quiz verification',
                 topics: 'team culture, fire truck operation, land safety, working with AI' },
      maxTokens: 64,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const d = await r.json();
  const m = String(d.reply || '').match(/[0-3]/);
  return m ? +m[0] : null;
}

function excerptAround(segs, t0, win = 75) {
  const s = segs.filter(x => x.t0 >= t0 - win && x.t0 <= t0 + win);
  return (s.length ? s : segs.slice(0, 12)).map(x => x.text).join(' ').slice(0, 2600);
}

async function main() {
  const rxBank = LANG ? new RegExp('^(.+)\\.' + LANG + '\\.json$') : /^([^.]+)\.json$/;
  const courses = readdirSync(QDIR).map(f => (f.match(rxBank) || [])[1])
    .filter(Boolean).filter(c => !onlyCourse || c === onlyCourse);
  for (const course of courses) {
    const path = join(QDIR, `${course}${SFX}.json`);
    const bank = JSON.parse(readFileSync(path, 'utf8'));
    let kept = 0, fixed = 0, dropped = 0;
    for (const [mod, qs] of Object.entries(bank.modules)) {
      let tr;
      try { tr = JSON.parse(readFileSync(join(TR, course, `m${mod}${SFX}.json`), 'utf8')); }
      catch { continue; }
      const survivors = [];
      for (const q of qs) {
        if (q.verified || q.corrected) { survivors.push(q); continue; }   // idempotent re-runs
        const ex = excerptAround(tr.segments, q.t0 || 0);
        const v1 = await blindAnswer(ex, q);
        if (v1 === q.a) { q.verified = true; survivors.push(q); kept++; }
        else {
          const v2 = await blindAnswer(ex, q);
          if (v1 != null && v1 === v2) {
            console.log(`  fixed ${course}/m${mod}: "${q.en.q.slice(0, 60)}" key ${q.a} -> ${v1}`);
            q.a = v1; q.corrected = true; survivors.push(q); fixed++;
          } else {
            console.log(`  DROP ${course}/m${mod}: "${q.en.q.slice(0, 60)}" (gen=${q.a}, v1=${v1}, v2=${v2})`);
            dropped++;
          }
        }
        await new Promise(r => setTimeout(r, 900));
      }
      bank.modules[mod] = survivors;
      writeFileSync(path, JSON.stringify(bank, null, 1));
    }
    console.log(`${course}: ${kept} verified · ${fixed} corrected · ${dropped} dropped`);
  }
}
main();
