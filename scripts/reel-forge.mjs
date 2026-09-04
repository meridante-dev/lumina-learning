#!/usr/bin/env node
/* ============================================================================
   reel-forge.mjs — turn transcribed video into reels that are real lessons.

     node scripts/reel-forge.mjs --course land-team-journey --mod 0
     node scripts/reel-forge.mjs --course land-team-journey --lang pt
     node scripts/reel-forge.mjs --course land-team-journey --per 2
     node scripts/reel-forge.mjs --course land-team-journey --dry

   WHY THIS EXISTS, AND WHY IT MINES RATHER THAN RECORDS
   The brief was: every reel should be transcribed automatically and become a
   lesson with text and the learning mechanics around it. The obstacle is that
   all six reels in the catalogue are `media: {type:'soon'}` — there is no reel
   footage, so an auto-transcribe pipeline would have nothing to run on.

   There are, however, ~308 minutes of video already transcribed, and inside a
   six-minute lesson there are usually two or three passages that are complete
   thoughts on their own. So this cuts reels OUT of what exists: find a
   self-contained 20-60 second window, and write the reel FROM THE WORDS ACTUALLY
   SPOKEN IN IT.

   When standalone reel footage does arrive, stage 0 transcribes it with the same
   Whisper path the modules use and the rest of this file is unchanged. Mining is
   the path that produces something today.

   THE GROUNDING RULE, which is the whole point
   Title, hook, lesson text and check are all generated from one passage and
   nothing else — not the module, not the course, not the model's general sense
   of the topic. The check is then answered BLIND against that same passage by a
   second model, exactly like the course questions: agreement ships it,
   disagreement corrects or discards. A reel that teaches something the trainer
   did not say is worse than no reel, because it is quotable.

   LANGUAGE IS NOT A TRANSLATION STEP. A PT reel is forged from the PT
   transcript of the PT recording. Where a course was only recorded in English,
   this refuses to forge PT reels rather than translating one — the timestamps
   would belong to another video and the words to nobody.

   OUTPUT IS A PROPOSAL, NOT A PUBLICATION. Everything lands in
   knowledge/reels/<course>.<lang>.json for a human to read. Nothing reaches a
   learner until it is pasted into content.js and approved in the curation
   surface, which already defaults to pending.
   ========================================================================= */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
// Heavy files never touch the Mac disk — the SSD is the workdir. Refuse loudly
// rather than falling back silently: a fallback is how the Mac hit 119 MB free.
const SSD_WORK = '/Volumes/Ultra Touch/Academy-OS/work';
if (!existsSync('/Volumes/Ultra Touch')) { console.error('✗ Ultra Touch SSD not mounted — plug it in; heavy work does not run from the Mac disk.'); process.exit(2); }


const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TR = join(ROOT, 'media', 'transcripts');
const OUT = join(ROOT, 'knowledge', 'reels');
const API = 'https://academy-ai.edenrise.workers.dev';
const A = process.argv.slice(2);
const arg = (k, d) => { const i = A.indexOf(k); return i > -1 ? A[i + 1] : d; };
const COURSE = arg('--course');
const ONLY_MOD = arg('--mod') != null ? +arg('--mod') : null;
const LANG = arg('--lang', 'en');
const PER = +arg('--per', 2);
const DRY = A.includes('--dry');
if (!COURSE) { console.error('usage: reel-forge.mjs --course <id> [--mod N] [--lang pt] [--per 2] [--dry]'); process.exit(1); }

/* ---------- the catalogue, evaluated (never regex — see build-knowledge.mjs) */
const INDEX_HTML = readFileSync(join(ROOT, 'index.html'), 'utf8');
const BRAND = (() => {
  const m = INDEX_HTML.match(/["']([^"']*brands\/[^/"']+\/)content\.js/);
  if (m && existsSync(join(ROOT, m[1] + 'content.js'))) return m[1];
  const f = readdirSync(join(ROOT, 'brands')).filter(d => existsSync(join(ROOT, 'brands', d, 'content.js')));
  return `brands/${f[0]}/`;
})();
const { CATALOG } = new Function(readFileSync(join(ROOT, BRAND + 'content.js'), 'utf8') + ';return {CATALOG}')();
const course = CATALOG.find(c => c.id === COURSE);
if (!course) { console.error(`✗ no course "${COURSE}"`); process.exit(1); }

async function ask(prompt, maxTokens = 2400) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://academy.edenrise.com',
               'X-Build-Key': readFileSync(process.env.HOME + '/.academy-build-key', 'utf8').trim() },
    body: JSON.stringify({
      context: { brand: 'EdenRise Academy', course: COURSE,
                 topics: 'team culture, fire truck operation, land safety, working with AI',
                 ethos: 'A regenerative-living farm and school in the Baixo Alentejo, Portugal.' },
      maxTokens, messages: [{ role: 'user', content: prompt }],
    }),
  });
  const d = await r.json();
  if (!d.reply) throw new Error('gateway: ' + JSON.stringify(d).slice(0, 180));
  return d.reply;
}
const grabJSON = (txt, open = '[', close = ']') => {
  const a = txt.indexOf(open), b = txt.lastIndexOf(close);
  if (a < 0 || b < 0) throw new Error('no JSON in reply');
  return JSON.parse(txt.slice(a, b + 1).replace(/,\s*([\]}])/g, '$1'));
};
/* Ask once, and if the reply is not valid JSON ask again with the failure quoted
   back. Writing Portuguese made the model drop quotes around values — `"hook": A
   cultura …` — which killed four of five reels on the first PT run. One retry
   that shows it the parse error recovers nearly all of them, and costs a call
   only when something actually broke. */
async function askJSON(prompt, maxTokens) {
  try { return grabJSON(await ask(prompt, maxTokens)); }
  catch (e) {
    const strict = prompt + `\n\nYour previous reply could not be parsed: ${String(e.message).slice(0, 120)}.
Return ONLY a valid JSON array. EVERY string value must be wrapped in double quotes, including accented text. No prose before or after.`;
    return grabJSON(await ask(strict, maxTokens));
  }
}

/* ---------- candidate windows ------------------------------------------------
   A reel has to start and finish like a thought, or it reads as an offcut. So a
   window may only begin on a segment that follows a sentence end, and must end
   on one. Length 20-60s: under 20 there is no idea, over 60 it is a lecture. */
function windows(segs) {
  const endsSentence = i => /[.!?…]["')\]]?\s*$/.test((segs[i].text || '').trim());
  const out = [];
  for (let i = 0; i < segs.length; i++) {
    if (i > 0 && !endsSentence(i - 1)) continue;              /* start cleanly */
    for (let j = i; j < segs.length; j++) {
      const dur = segs[j].t1 - segs[i].t0;
      if (dur < 18) continue;
      if (dur > 62) break;
      if (!endsSentence(j)) continue;                          /* end cleanly */
      const text = segs.slice(i, j + 1).map(s => s.text.trim()).join(' ');
      if (text.split(/\s+/).length < 45) continue;             /* too thin to teach */
      out.push({ t0: +segs[i].t0.toFixed(1), t1: +segs[j].t1.toFixed(1), dur: Math.round(dur), text });
      break;                                                   /* shortest clean window from i */
    }
  }
  /* THIN OUT OVERLAPS BEFORE THE MODEL EVER SEES THEM.
     The first run produced two reels from 45.3-65.3s and 49.6-72.8s — sixteen
     shared seconds, both titled "Below the Line", the second essentially a
     subset of the first. The model was not at fault: it was handed a list where
     most entries were near-duplicates of their neighbours, because a clean
     window exists at almost every sentence boundary. Offer only windows that do
     not overlap, so "pick the best two" cannot mean "pick the same idea twice". */
  const kept = [];
  for (const w of out) {
    if (kept.some(k => w.t0 < k.t1 && k.t0 < w.t1)) continue;
    kept.push(w);
  }
  return kept;
}

const PT = LANG === 'pt';
const forgePrompt = (title, cands) => `You are building short vertical video lessons ("reels") for frontline workers, cut from a longer training video.

Below are ${cands.length} candidate passages, each a VERBATIM transcript excerpt from the lesson "${title}". Pick the ${PER} that work best as standalone 20-60 second lessons: one complete, useful idea that makes sense to someone who has not seen the rest of the video.

For each one you pick, write${PT ? ' IN EUROPEAN PORTUGUESE' : ''}:
  "i"       the passage number you picked
  "theme"   one lowercase word for the topic
  "title"   max 6 words, plain, no colon
  "hook"    ONE sentence that makes someone stop scrolling. It must be a claim the passage actually supports.
  "line"    ONE sentence saying what they will get from it.
  "lesson"  2-3 sentences a worker can READ INSTEAD OF WATCHING and still get the idea. Plain language, concrete, no filler. This is the text of the lesson.
  "check"   one multiple-choice question testing whether they can APPLY the idea, with:
              "q"    the question
              "opts" exactly 3 options
              "a"    index (0-2) of the correct one
              "why"  one sentence explaining why it is right

ABSOLUTE RULE: everything you write must be supported by the words in the passage you picked. Do not add advice, statistics, or examples that are not there. If a passage does not contain a complete idea, do not pick it.

Return ONLY a JSON array of ${PER} objects.

${cands.map((c, n) => `--- PASSAGE ${n} (${c.dur}s) ---\n${c.text}`).join('\n\n')}`;

const verifyPrompt = (passage, q) => `Read this transcript passage and answer the question using ONLY what it says.

PASSAGE:
${passage}

QUESTION: ${q.q}
${q.opts.map((o, i) => `${i}. ${o}`).join('\n')}

Reply with ONLY the number of the correct option.`;


/* ===== STAGE 0 — REAL REEL FOOTAGE ==========================================
   `--ingest` is the path for reels that are their own recordings rather than
   passages cut out of a longer lesson. It is the one the brief actually asked
   for; mining existed because there was no footage yet.

   For each reel in content.js that has real media and no lesson: pull the audio,
   transcribe it with the same local Whisper the modules use, then forge the
   lesson and the check from THAT transcript and gate them the same way. A reel
   is a lesson with a shorter runtime, not a different kind of object, so it gets
   the same treatment and the same burden of proof.

   The transcript is kept at media/transcripts/_reels/<id>.<lang>.json so a reel's
   words are as auditable as a module's — the coverage audit, the evidence view
   and the knowledge index all read transcripts from one place. */
async function transcribeReel(reel, lang) {
  const dir = join(TR, '_reels');
  mkdirSync(dir, { recursive: true });
  const out = join(dir, `${reel.id}${lang === 'pt' ? '.pt' : ''}.json`);
  if (existsSync(out)) return JSON.parse(readFileSync(out, 'utf8'));

  const m = reel.media || {};
  let src = null;
  if (m.type === 'mp4') src = m.src.startsWith('http') ? m.src : join(ROOT, m.src);
  else if (m.type === 'vimeo') {
    /* same API path as vimeo-transcribe.mjs: smallest rendition, audio only */
    const tok = readFileSync(process.env.HOME + '/.vimeo-token', 'utf8').trim();
    const r = await fetch(`https://api.vimeo.com/videos/${m.id}?fields=name,duration,download`,
      { headers: { Authorization: 'Bearer ' + tok }, signal: AbortSignal.timeout(30000) });
    const d = await r.json();
    if (d.error) throw new Error(d.error);
    const rend = (d.download || []).filter(x => x.link).sort((a, b) => (a.size || 0) - (b.size || 0))[0];
    if (!rend) throw new Error('no download rendition — token needs the video_files scope');
    src = rend.link;
  } else throw new Error(`media type "${m.type}" cannot be transcribed`);

  const tmp = join(SSD_WORK, 'reel-forge'); mkdirSync(tmp, { recursive: true });
  const wav = join(tmp, `${reel.id}${lang}.wav`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-vn', '-ac', '1', '-ar', '16000', wav],
    { stdio: ['ignore', 'pipe', 'pipe'] });
  execFileSync('whisper', [wav, '--model', 'small', '--output_format', 'json', '--output_dir', tmp, '--verbose', 'False'],
    { stdio: ['ignore', 'pipe', 'pipe'] });
  const j = JSON.parse(readFileSync(wav.replace(/\.wav$/, '.json'), 'utf8'));
  const doc = {
    reel: reel.id, language: j.language || lang, machineTranslated: false, native: true,
    source: m.type === 'vimeo' ? 'vimeo-api' : 'file', generatedAt: Date.now(),
    segments: (j.segments || []).map(s => ({ t0: +s.start.toFixed(2), t1: +s.end.toFixed(2), text: s.text.trim() })),
  };
  writeFileSync(out, JSON.stringify(doc, null, 1));
  rmSync(wav, { force: true });
  return doc;
}

async function ingestRealReels() {
  const { REELS } = new Function(readFileSync(join(ROOT, BRAND + 'content.js'), 'utf8')
    + ';return {REELS: typeof REELS !== "undefined" ? REELS : []}')();
  const todo = REELS.filter(r => r.media && r.media.type !== 'soon' && !(r.lesson && r.lesson[LANG]));
  const soon = REELS.filter(r => !r.media || r.media.type === 'soon');
  console.log(`${REELS.length} reels · ${todo.length} with footage and no ${LANG} lesson · ${soon.length} still placeholders`);
  if (!todo.length) {
    console.log(soon.length
      ? '\nNothing to ingest yet. Wire real media on a reel (mp4 src, or a vimeo id) and re-run.'
      : '\nEvery reel already has a lesson.');
    return [];
  }
  const made = [];
  for (const reel of todo) {
    process.stdout.write(`  ${reel.id} … `);
    /* LOCALISING TEXT IS NOT TRANSLATING A TRANSCRIPT.
       A transcript labelled pt must only ever hold words a Portuguese speaker
       actually said — that is a provenance claim. A title, hook, lesson and
       check are OUR words about the clip, so writing them in Portuguese from an
       English recording is ordinary localisation. The video stays English and
       the reel records videoLang so the UI can say so, the same way a module
       with no PT cut does. */
    let tr, srcLang = LANG;
    try { tr = await transcribeReel(reel, LANG); }
    catch (e) {
      const enPath = join(TR, '_reels', `${reel.id}.json`);
      if (PT && existsSync(enPath)) { tr = JSON.parse(readFileSync(enPath, 'utf8')); srcLang = 'en'; }
      else { console.log(`✗ transcribe: ${String(e.message).slice(0, 90)}`); continue; }
    }
    if (PT && srcLang === 'en') process.stdout.write('from EN recording · ');
    process.stdout.write(`${tr.segments.length} segments · `);
    const text = tr.segments.map(s => s.text).join(' ').trim();
    if (text.split(/\s+/).length < 25) { console.log('✗ too little speech to teach from'); continue; }
    const dur = Math.round(tr.segments.at(-1)?.t1 || reel.seconds || 30);

    let p;
    try { p = (await askJSON(forgePrompt(reel.id, [{ t0: 0, t1: dur, dur, text }])))[0]; }
    catch (e) { console.log(`✗ forge: ${e.message}`); continue; }
    const q = p && p.check;
    if (!q || !Array.isArray(q.opts) || q.opts.length !== 3 || !Number.isInteger(q.a)) { console.log('✗ malformed check'); continue; }
    let v;
    try { v = parseInt((await ask(verifyPrompt(text, q), 12)).match(/\d/)?.[0], 10); }
    catch (e) { console.log('✗ verify failed'); continue; }
    let audit;
    if (v === q.a) audit = 'verified';
    else if (Number.isInteger(v) && v >= 0 && v < 3) { q.a = v; audit = 'corrected'; }
    else { console.log('✗ verifier gave no usable answer — discarded'); continue; }

    made.push({
      id: reel.id, seconds: dur, theme: (p.theme || reel.theme || 'general').toLowerCase(),
      title: { [LANG]: p.title }, hook: { [LANG]: p.hook }, line: { [LANG]: p.line },
      lesson: { [LANG]: p.lesson },
      check: { type: 'application', a: q.a, [LANG]: { q: q.q, opts: q.opts, why: q.why },
               audit, model: 'gateway', src: 'transcript' },
      media: reel.media, deeper: reel.deeper || null,
      ...(srcLang !== LANG ? { videoLang: srcLang } : {}),
      source: { reel: reel.id, lang: LANG, videoLang: srcLang, seconds: dur },
    });
    console.log(`✓ ${audit}  "${p.title}"`);
  }
  return made;
}

/* ---------- run --------------------------------------------------------------- */
const sfx = PT ? '.pt' : '';
if (A.includes('--ingest')) {
  const made = await ingestRealReels();
  if (made.length) {
    mkdirSync(OUT, { recursive: true });
    const f = join(OUT, `_reels${sfx}.json`);
    writeFileSync(f, JSON.stringify({ lang: LANG, generatedAt: Date.now(), reels: made }, null, 1));
    console.log(`\n${made.length} reel lesson(s) → ${f}`);
    console.log('  PROPOSALS ONLY — read them, then paste into content.js.');
  }
  process.exit(0);
}
const mods = ONLY_MOD != null ? [ONLY_MOD] : (course.modules || []).map((_, i) => i);
const media = PT ? (course.moduleMedia_pt || []) : (course.moduleMedia || []);
const forged = [];

for (const mod of mods) {
  const f = join(TR, COURSE, `m${mod}${sfx}.json`);
  if (!existsSync(f)) { console.log(`m${mod}: no ${LANG} transcript — skipped`); continue; }
  const tr = JSON.parse(readFileSync(f, 'utf8'));
  if (tr.machineTranslated) {
    /* the words are nobody's and the timestamps belong to another cut */
    console.log(`m${mod}: ${LANG} transcript is machine-translated — REFUSED (record it, do not translate it)`);
    continue;
  }
  const vid = media[mod];
  if (!vid || !vid.id) { console.log(`m${mod}: no ${LANG} video wired — skipped`); continue; }

  const cands = windows(tr.segments || []);
  const title = (course.modules || [])[mod] || `Module ${mod + 1}`;
  console.log(`m${mod} "${title}" — ${cands.length} clean windows`);
  if (!cands.length) continue;
  if (DRY) { cands.slice(0, 3).forEach(c => console.log(`    ${c.t0}-${c.t1}s (${c.dur}s) ${c.text.slice(0, 78)}…`)); continue; }

  let picks;
  try { picks = await askJSON(forgePrompt(title, cands.slice(0, 14))); }
  catch (e) { console.log(`    ✗ forge failed: ${e.message}`); continue; }

  for (const p of picks) {
    const c = cands[p.i];
    if (!c) { console.log('    ✗ picked a passage that does not exist — dropped'); continue; }
    const q = p.check || {};
    if (!Array.isArray(q.opts) || q.opts.length !== 3 || !Number.isInteger(q.a)) { console.log('    ✗ malformed check — dropped'); continue; }
    /* THE GATE: answer it blind against the same passage */
    let v;
    try { v = parseInt((await ask(verifyPrompt(c.text, q), 12)).match(/\d/)?.[0], 10); }
    catch (e) { console.log('    ✗ verify failed — dropped'); continue; }
    let audit;
    if (v === q.a) audit = 'verified';
    else if (Number.isInteger(v) && v >= 0 && v < 3) { q.a = v; audit = 'corrected'; }
    else { console.log(`    ✗ "${p.title}" — verifier gave no usable answer, discarded`); continue; }

    /* A CHECK THAT CAN BE ANSWERED BY MATCHING STRINGS IS NOT A CHECK.
       If the correct option appears near-verbatim in the passage and the wrong
       ones do not, a learner can score it by recognition without understanding
       anything. Flagged rather than dropped — the human curating decides, and a
       flag they can see beats a silent rejection they cannot. */
    const norm = t => String(t).toLowerCase().replace(/[^a-z0-9\u00c0-\u017f ]/g, '').replace(/\s+/g, ' ').trim();
    const hay = norm(c.text);
    const inPassage = i => { const o = norm(q.opts[i]); return o.length > 8 && hay.includes(o); };
    const giveaway = inPassage(q.a) && ![0, 1, 2].filter(i => i !== q.a).some(inPassage);
    if (giveaway) console.log(`      ⚠ answer appears verbatim in the passage — recognition, not application`);

    forged.push({
      id: `${COURSE}-m${mod}-${c.t0}`.replace(/\./g, '_'),
      seconds: c.dur, theme: (p.theme || 'general').toLowerCase(),
      title: { [LANG]: p.title }, hook: { [LANG]: p.hook }, line: { [LANG]: p.line },
      lesson: { [LANG]: p.lesson },
      check: { type: giveaway ? 'recall' : 'application', a: q.a,
               [LANG]: { q: q.q, opts: q.opts, why: q.why },
               audit, ...(giveaway ? { giveaway: true } : {}), model: 'gateway', src: 'transcript' },
      media: { type: 'vimeo', id: vid.id, ...(vid.h ? { h: vid.h } : {}), start: c.t0, end: c.t1 },
      deeper: COURSE,
      source: { course: COURSE, mod, t0: c.t0, t1: c.t1, lang: LANG, passage: c.text },
    });
    console.log(`    ✓ ${audit.padEnd(9)} ${c.t0}-${c.t1}s  "${p.title}"`);
  }
}

if (DRY) { console.log('\ndry run — no model calls, no files written.'); process.exit(0); }
mkdirSync(OUT, { recursive: true });
const outFile = join(OUT, `${COURSE}${sfx}.json`);
writeFileSync(outFile, JSON.stringify({ course: COURSE, lang: LANG, generatedAt: Date.now(), reels: forged }, null, 1));
console.log(`\n${forged.length} reel(s) → ${outFile}`);
console.log(`  ${forged.filter(r => r.check.audit === 'verified').length} agreed · ${forged.filter(r => r.check.audit === 'corrected').length} corrected`);
console.log('  PROPOSALS ONLY — read them, then paste into content.js. Curation still defaults to pending.');
