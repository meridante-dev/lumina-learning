#!/usr/bin/env node
/* ============================================================================
   vimeo-transcribe.mjs — transcribe a course straight from Vimeo, via the API.

     node scripts/vimeo-transcribe.mjs land-team-journey

   WHY THIS REPLACES THE OLD PATH
   transcribe-pipeline.py matched local SSD footage to modules by duration, and
   fell back to scraping the embed. Both were workarounds for having no Vimeo
   token. With a token the video files are addressable directly, which removes
   the guessing: the module's OWN id resolves to that module's OWN audio. No
   duration matching, no chance of transcribing the wrong lesson — which is the
   failure the old path could not fully rule out.

   AUDIO ONLY, STREAMED. ffmpeg reads the smallest rendition over HTTP and writes
   16 kHz mono — what Whisper wants anyway. A 4-minute lesson costs a few MB
   instead of the 93 MB the 1080p rendition would have.

   Whisper runs LOCALLY: transcription of internal training footage should not
   need to leave the machine, and it costs nothing per minute.
   ========================================================================= */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const courseId = process.argv[2];
if (!courseId) { console.error('usage: vimeo-transcribe.mjs <courseId>'); process.exit(1); }
const TOKEN = readFileSync(process.env.HOME + '/.vimeo-token', 'utf8').trim();
const OUT = join(ROOT, 'media', 'transcripts', courseId);
const TMP = join(ROOT, '.tmp-audio');
mkdirSync(OUT, { recursive: true }); mkdirSync(TMP, { recursive: true });

/* module ids straight from the catalogue — the app's own truth, so the
   transcript index can never drift from the module index */
const content = readFileSync(join(ROOT, 'brands', 'edenrise', 'content.js'), 'utf8');
const at = content.indexOf(`id: '${courseId}'`);
const block = content.slice(at, content.indexOf('\n  },', at));
const titles = (block.match(/modules: \[([\s\S]*?)\]/)[1]
  .match(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g) || []).map(s => s.slice(1, -1));
const media = [...block.matchAll(/id: '(\d{9,10})'/g)].map(m => m[1]);
if (titles.length !== media.length) { console.error(`✗ ${titles.length} titles vs ${media.length} videos — fix content.js first`); process.exit(1); }
console.log(`${courseId}: ${media.length} modules\n`);

async function api(id) {
  const r = await fetch(`https://api.vimeo.com/videos/${id}?fields=name,duration,download`, {
    headers: { Authorization: 'Bearer ' + TOKEN }, signal: AbortSignal.timeout(30000) });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  const rends = (d.download || []).filter(x => x.link).sort((a, b) => (a.size || 0) - (b.size || 0));
  if (!rends.length) throw new Error('no download rendition — token needs the video_files scope');
  return { name: d.name, duration: d.duration, link: rends[0].link, mb: Math.round((rends[0].size || 0) / 1e6) };
}

for (const [i, vid] of media.entries()) {
  const out = join(OUT, `m${i}.json`);
  if (existsSync(out)) { console.log(`m${i} ${titles[i]} — transcript exists, skip`); continue; }
  process.stdout.write(`m${i} ${titles[i]} (${vid}) … `);
  try {
    const v = await api(vid);
    const wav = join(TMP, `${courseId}-m${i}.wav`);
    /* audio only, 16k mono — streamed, never the full video file */
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', v.link,
      '-vn', '-ac', '1', '-ar', '16000', wav], { stdio: ['ignore', 'pipe', 'pipe'] });
    process.stdout.write('whisper … ');
    execFileSync('whisper', [wav, '--model', 'small', '--output_format', 'json',
      '--output_dir', TMP, '--verbose', 'False'], { stdio: ['ignore', 'pipe', 'pipe'] });
    const j = JSON.parse(readFileSync(wav.replace(/\.wav$/, '.json'), 'utf8'));
    writeFileSync(out, JSON.stringify({
      module: i, title: titles[i], vimeoId: vid, vimeoName: v.name,
      language: j.language || 'en', durationSec: v.duration,
      source: 'vimeo-api', generatedAt: Date.now(),
      segments: (j.segments || []).map(s => ({ t0: +s.start.toFixed(2), t1: +s.end.toFixed(2), text: s.text.trim() })),
    }, null, 1));
    rmSync(wav, { force: true });
    console.log(`✓ ${j.language} · ${(j.segments || []).length} segments`);
  } catch (e) { console.log(`FAILED: ${String(e.message).slice(0, 120)}`); }
}
try { rmSync(TMP, { recursive: true, force: true }); } catch (e) {}
console.log(`\ntranscripts in ${OUT}
Next:  node scripts/generate-quizzes.mjs --course ${courseId}
       node scripts/verify-quizzes.mjs   --course ${courseId}     # the blind gate
       node scripts/build-knowledge.mjs`);
