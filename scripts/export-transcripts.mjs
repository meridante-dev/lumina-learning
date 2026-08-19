#!/usr/bin/env node
/* ============================================================================
   export-transcripts.mjs — the transcripts as readable .txt, for handing off.

     node scripts/export-transcripts.mjs                 # everything
     node scripts/export-transcripts.mjs --course land-team-journey
     node scripts/export-transcripts.mjs --lang pt
     node scripts/export-transcripts.mjs --out ~/Desktop/transcripts

   The JSON in media/transcripts/ is the working format: per-segment, with start
   and end times, built for the player and the quiz gate. Nobody reads it. This
   writes the same words as prose a person can actually work with — a translator,
   a scriptwriter, a lawyer, a client.

   THE ONE THING THIS FILE EXISTS TO GET RIGHT
   Not every Portuguese transcript is Portuguese. Above the Line was RECORDED
   twice, so its .pt files are native Whisper transcripts of a Portuguese
   presenter. The other courses' .pt files are MACHINE TRANSLATIONS of the
   English — the same meaning, but not words anyone said, and every timestamp in
   them belongs to the English cut.

   Handing those two kinds over in one folder without saying which is which is
   how a machine translation ends up quoted as a person's words. So each file
   states its own provenance in a header, machine-translated files carry a
   warning at the top, and their filenames say so too. If that seems heavy-
   handed: the whole product is a claim about records being what they say they
   are.
   ========================================================================= */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TR = join(ROOT, 'media', 'transcripts');
const A = process.argv.slice(2);
const arg = k => { const i = A.indexOf(k); return i > -1 ? A[i + 1] : null; };
const ONLY_COURSE = arg('--course');
const ONLY_LANG = arg('--lang');
const OUT = (arg('--out') || join(ROOT, 'exports', 'transcripts')).replace(/^~/, process.env.HOME);

/* titles from the catalogue, evaluated not parsed (see build-knowledge.mjs for
   why: a regex over content.js corrupted five module titles for months) */
const INDEX_HTML = readFileSync(join(ROOT, 'index.html'), 'utf8');
const BRAND = (() => {
  const m = INDEX_HTML.match(/["']([^"']*brands\/[^/"']+\/)content\.js/);
  if (m && existsSync(join(ROOT, m[1] + 'content.js'))) return m[1];
  const found = readdirSync(join(ROOT, 'brands')).filter(d => existsSync(join(ROOT, 'brands', d, 'content.js')));
  return `brands/${found[0]}/`;
})();
const { CATALOG, COURSE_PT } = new Function(
  `${readFileSync(join(ROOT, BRAND + 'content.js'), 'utf8')}
   ;return {CATALOG, COURSE_PT: typeof COURSE_PT !== 'undefined' ? COURSE_PT : {}};`)();

const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const safe = s => String(s).replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, ' ').trim();

/* Whisper segments are a few seconds each — one timestamp per segment is
   unreadable. Group into paragraphs that break on a sentence end after ~25s. */
function prose(segments) {
  const paras = [];
  let buf = [], start = segments[0]?.t0 ?? 0;
  for (const s of segments) {
    buf.push(s.text.trim());
    const long = s.t1 - start >= 25;
    const ends = /[.!?…]["')\]]?$/.test(s.text.trim());
    if (long && ends) { paras.push(`[${mmss(start)}]  ${buf.join(' ')}`); buf = []; start = s.t1; }
  }
  if (buf.length) paras.push(`[${mmss(start)}]  ${buf.join(' ')}`);
  return paras.join('\n\n');
}

function header(courseTitle, modNo, modTitle, tr, translated) {
  const dur = tr.durationSec || Math.round(tr.segments.at(-1)?.t1 || 0);
  const L = [
    courseTitle,
    `Module ${modNo} — ${modTitle}`,
    '',
    `Language        ${(tr.language || '?').toUpperCase()}`,
    `Source          ${translated ? 'MACHINE TRANSLATION of the English recording' : 'transcript of the actual recording (Whisper)'}`,
  ];
  if (tr.vimeoId) L.push(`Video           vimeo.com/${tr.vimeoId}${tr.vimeoName ? `  ("${tr.vimeoName}")` : ''}`);
  L.push(`Length          ${mmss(dur)}`, `Segments        ${tr.segments.length}`);
  const out = ['='.repeat(72), ...L, '='.repeat(72)];
  if (translated) {
    out.push('',
      '⚠  THESE ARE NOT WORDS ANYONE SPOKE.',
      '   This course was recorded in English only. The text below was machine',
      '   translated, and every timestamp belongs to the English cut. Safe to read',
      '   for meaning; do NOT quote it as what the presenter said, and do not use',
      '   it to build questions or subtitles without a human pass.');
  }
  return out.join('\n') + '\n\n';
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let files = 0, words = 0;
const summary = [];

for (const course of CATALOG) {
  const dir = join(TR, course.id);
  if (!existsSync(dir)) continue;
  if (ONLY_COURSE && course.id !== ONLY_COURSE) continue;
  const cDir = join(OUT, safe(course.title));
  mkdirSync(cDir, { recursive: true });
  const combined = [];

  for (const f of readdirSync(dir).sort((a, b) => {
    const n = x => +((x.match(/^m(\d+)/) || [])[1] ?? 0);
    return n(a) - n(b) || a.localeCompare(b);
  })) {
    const m = f.match(/^m(\d+)(?:\.([a-z]{2}))?\.json$/);
    if (!m) continue;
    const [, modS, langSfx] = m;
    const mod = +modS;
    const tr = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const lang = tr.language || langSfx || 'en';
    if (ONLY_LANG && lang !== ONLY_LANG) continue;
    const translated = tr.machineTranslated === true;

    /* Portuguese module titles when we have them, so a PT file reads as PT */
    const ptTitles = (COURSE_PT[course.id] || {}).modules;
    const title = (lang === 'pt' && ptTitles && ptTitles[mod]) || course.modules[mod] || `Module ${mod + 1}`;

    const body = header(course.title, mod + 1, title, tr, translated) + prose(tr.segments) + '\n';
    const name = `${String(mod + 1).padStart(2, '0')} - ${safe(title)}${translated ? ` [${lang} MACHINE-TRANSLATED]` : ` [${lang}]`}.txt`;
    writeFileSync(join(cDir, name), body);
    files++;
    words += body.split(/\s+/).length;
    combined.push(body);
    /* durationSec is absent on transcripts from the pre-API pipeline, so fall
       back to the last segment's end time — otherwise the README's total
       silently counts only the newer courses (it read 81 minutes for what is
       actually several hours) */
    summary.push({ course: course.title, mod: mod + 1, lang, translated, title,
      secs: tr.durationSec || Math.round(tr.segments.at(-1)?.t1 || 0) });
  }
  if (combined.length) writeFileSync(join(cDir, `_ALL - ${safe(course.title)}.txt`), combined.join('\n\n' + '─'.repeat(72) + '\n\n'));
}

/* a README, because a folder of transcripts with no provenance is how the
   machine-translated ones get mistaken for the real thing */
const nat = summary.filter(s => !s.translated), mt = summary.filter(s => s.translated);
const totalMin = Math.round(summary.reduce((a, s) => a + s.secs, 0) / 60);
writeFileSync(join(OUT, 'README.txt'), `EdenRise Academy — video transcripts
Exported ${new Date().toISOString().slice(0, 10)} from the Academy repo.

${files} files · ${summary.length} transcripts · ~${totalMin} minutes of video · ~${words.toLocaleString()} words

WHAT IS IN HERE
One folder per course. One .txt per module per language, plus an _ALL file with
that course's modules end to end. Each transcript is timestamped in [m:ss] at
roughly 25-second paragraphs, against its own recording.

TWO KINDS OF PORTUGUESE — THIS IS THE IMPORTANT PART
  · ${nat.filter(s => s.lang === 'pt').length} files are NATIVE Portuguese: that course was recorded a second
    time with a Portuguese presenter, and the text is a transcript of that
    recording. Timestamps are true against the Portuguese video.
  · ${mt.length} files are MACHINE TRANSLATIONS of the English. The meaning is
    there; the words are not anyone's. Their timestamps belong to the ENGLISH
    cut. These are marked in the filename and carry a warning at the top.
    Do not quote them as speech, subtitle from them, or build questions on them
    without a human pass.

BY COURSE
${[...new Set(summary.map(s => s.course))].map(c => {
  const rows = summary.filter(s => s.course === c);
  const langs = [...new Set(rows.map(r => r.lang))].map(l => {
    const n = rows.filter(r => r.lang === l);
    const t = n.filter(r => r.translated).length;
    return `${l}: ${n.length}${t ? ` (${t} machine-translated)` : ''}`;
  }).join(' · ');
  return `  ${c}\n    ${langs}`;
}).join('\n')}

ACCURACY
Machine transcription (Whisper). Reliable on structure and wording, and it does
mishear names, jargon and numbers. Read it as a very good draft, not a legal
record — for anything that has to be exact, check it against the video.
`);

console.log(`\n✓ ${files} files → ${OUT}`);
console.log(`  ${nat.length} from real recordings · ${mt.length} machine-translated (labelled)`);
console.log(`  ~${totalMin} minutes of video, ~${words.toLocaleString()} words\n`);
