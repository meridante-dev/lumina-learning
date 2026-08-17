#!/usr/bin/env node
/* ============================================================================
   Transcript → question bank. The quiz methodology, encoded.

   Every question this produces is GROUNDED: it must be answerable from what the
   trainer actually says, and it carries the timestamp (t0) of the moment that
   teaches it — that anchor powers "rever o momento", the button that reopens
   the player four seconds before the answer was spoken.

   Methodology (what "high-quality quiz" means here, and why):
   · RETRIEVAL, not recognition-of-trivia — questions target the lesson's core
     decisions and reasons, never incidental numbers or phrasing.
   · TYPED MIX — recall (what was said) / application (what do you DO) /
     scenario (novel situation, same principle). Application+scenario transfer;
     recall alone doesn't.
   · DISTRACTOR DISCIPLINE — wrong options are plausible real-world mistakes or
     misconceptions the lesson explicitly corrects; never jokes, never "all of
     the above", never grammatical giveaways.
   · ONE defensibly-best answer, with a one-line `why` (feedback is where the
     learning happens; a bare "wrong" teaches nothing).
   · BILINGUAL — EN + pt-PT generated together so both language modes of the
     app ask the same thing.

   Provenance is stamped on every question (gen, model, generatedAt): João's
   call was that generated questions ship everywhere including the legal check,
   so the record must always show what authored them.

   USAGE  node scripts/generate-quizzes.mjs [--course id] [--force]
   ========================================================================= */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TR = join(ROOT, 'media', 'transcripts');
const OUT = join(ROOT, 'knowledge', 'quizzes');
const API = 'https://academy-ai.edenrise.workers.dev';
const args = process.argv.slice(2);
const onlyCourse = args.includes('--course') ? args[args.indexOf('--course') + 1] : null;
/* --lang pt grounds the questions in the PORTUGUESE recording's own transcript
   and writes a separate bank. A bilingual course recorded twice does not say the
   same sentences in the same seconds, so a question generated from the English
   words can be wrong about the Portuguese video — including its t0 anchor. */
const LANG = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : '';
const SFX = LANG ? '.' + LANG : '';
const force = args.includes('--force');

const COURSE_TITLES = {
  'land-team-journey': 'Above the Line',
  'fire-truck-training': 'Fire Truck Training',
  'alignment-journey': 'The EdenRise Alignment Journey',
  'ai-literacy': 'Level Up with AI',
};

function compressTranscript(segs, maxChars = 5200) {
  /* merge micro-segments into ~25s blocks so the prompt stays small but every
     block keeps its start time — the anchor the questions must cite */
  const blocks = [];
  let cur = null;
  for (const s of segs) {
    if (!cur || s.t0 - cur.t0 > 25) { cur = { t0: s.t0, text: s.text }; blocks.push(cur); }
    else cur.text += ' ' + s.text;
  }
  let out = blocks.map(b => `[${Math.round(b.t0)}s] ${b.text}`).join('\n');
  if (out.length > maxChars) out = out.slice(0, maxChars) + '…';
  return out;
}

async function askGateway(prompt, course) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://academy.edenrise.com',
               'X-Build-Key': (await import('fs')).readFileSync(process.env.HOME + '/.academy-build-key', 'utf8').trim() },
    body: JSON.stringify({
      context: { brand: 'EdenRise Academy', course,
                 topics: 'team culture, fire truck operation, land safety, working with AI',
                 ethos: 'A regenerative-living farm and school in the Baixo Alentejo, Portugal.' },
      maxTokens: 3200,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const d = await r.json();
  if (!d.reply) throw new Error('gateway: ' + JSON.stringify(d).slice(0, 200));
  return d.reply;
}

function extractJSON(text) {
  const a = text.indexOf('['), b = text.lastIndexOf(']');
  if (a === -1 || b === -1) throw new Error('no JSON array in reply');
  return JSON.parse(text.slice(a, b + 1)
    .replace(/,\s*([\]}])/g, '$1'));           // trailing commas, the classic
}

function validate(qs) {
  const ok = [];
  for (const q of qs) {
    if (!q || !q.en || !q.pt) continue;
    if (!Array.isArray(q.en.opts) || q.en.opts.length !== 4) continue;
    if (!Array.isArray(q.pt.opts) || q.pt.opts.length !== 4) continue;
    if (typeof q.a !== 'number' || q.a < 0 || q.a > 3) continue;
    if (!['recall', 'application', 'scenario'].includes(q.type)) q.type = 'recall';
    ok.push(q);
  }
  return ok;
}

async function generateModule(course, mod, tr) {
  const lang = tr.language === 'pt' ? 'European Portuguese' : 'English';
  const prompt =
`This is a lesson from our workplace training course "${COURSE_TITLES[course] || course}" (module ${mod + 1}). ` +
`The transcript below is what our trainer says, with [seconds] timestamps. Spoken language: ${lang}.

Create exactly 6 multiple-choice questions to help our team retain and APPLY this lesson. Rules:
- Target the lesson's core decisions, principles and reasons — never trivia, incidental numbers, or phrasing.
- Types: 2 "recall", 2 "application" (what should the worker DO), 2 "scenario" (a new situation testing the same principle).
- Each question: 4 options, exactly ONE defensibly best answer. Wrong options must be PLAUSIBLE real-world mistakes or misconceptions this lesson corrects — no jokes, no "all of the above", no obviously-wrong filler.
- "t0": the [seconds] timestamp of the moment that teaches the answer.
- "why": one sentence explaining the right answer, usable as feedback.
- Write each question in BOTH English and European Portuguese (pt-PT: "camião", never "caminhão").

Reply with ONLY a JSON array, no prose:
[{"type":"recall","t0":45,"a":2,
  "en":{"q":"…","opts":["…","…","…","…"],"why":"…"},
  "pt":{"q":"…","opts":["…","…","…","…"],"why":"…"}}]

TRANSCRIPT:
${compressTranscript(tr.segments)}`;

  const reply = await askGateway(prompt, COURSE_TITLES[course] || course);
  const qs = validate(extractJSON(reply));
  if (qs.length < 4) throw new Error(`only ${qs.length} valid questions`);
  return qs.map(q => ({ ...q, gen: true, model: 'llama-3.3-70b@workers-ai', src: 'whisper-small', generatedAt: Date.now() }));
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const courses = readdirSync(TR).filter(d => !d.includes('.') && (!onlyCourse || d === onlyCourse));
  for (const course of courses) {
    const outPath = join(OUT, `${course}${SFX}.json`);
    const bank = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : { course, lang: LANG || 'default', modules: {} };
    /* match ONLY this language's transcripts: m3.json for the default cut,
       m3.pt.json for the PT cut. Without the anchor, a default run would also
       pick up every translated file and generate duplicate banks. */
    const rx = LANG ? new RegExp('^m(\\d+)\\.' + LANG + '\\.json$') : /^m(\d+)\.json$/;
    const mods = readdirSync(join(TR, course)).filter(f => rx.test(f));
    for (const f of mods) {
      const mod = +f.match(rx)[1];
      if (bank.modules[mod] && !force) { console.log(`${course}/m${mod} — exists, skip`); continue; }
      const tr = JSON.parse(readFileSync(join(TR, course, f), 'utf8'));
      if (!tr.segments || tr.segments.length < 5) { console.log(`${course}/m${mod} — transcript too thin, skip`); continue; }
      process.stdout.write(`${course}/m${mod} … `);
      try {
        bank.modules[mod] = await generateModule(course, mod, tr);
        console.log(`${bank.modules[mod].length} questions`);
        writeFileSync(outPath, JSON.stringify(bank, null, 1));   // progress survives failures
      } catch (e) {
        console.log('FAILED: ' + e.message.slice(0, 140));
      }
      await new Promise(r => setTimeout(r, 1500));   // be a polite free-tier citizen
    }
  }
}
main();
