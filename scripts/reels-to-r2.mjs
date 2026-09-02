#!/usr/bin/env node
/* ============================================================================
   reels-to-r2.mjs — move reel media off the repo and onto Cloudflare R2.

     node scripts/reels-to-r2.mjs --dry        # what would happen
     node scripts/reels-to-r2.mjs              # upload + rewrite content.js
     node scripts/reels-to-r2.mjs --purge      # …and delete the local copies

   WHY R2 AND NOT VIMEO, for reels specifically:

   · armReelCheck fires on the REAL PLAYHEAD (currentTime vs duration), which
     needs a <video> element. Vimeo hands you an iframe with no playhead unless
     you load their SDK, so reels would drop to the visible-time timer that
     exists as the weaker fallback. Hosting choice would quietly downgrade the
     check timing.
   · a Vimeo iframe is ~1 MB of player JS and the feed mounts current ±1 —
     ~3 MB of JavaScript before a single video byte. An R2 mp4 is zero.
   · we already transcode (71 → 26 MB), which is most of what Vimeo would do.
   · egress is free, and 100 clips is ~200 MB ≈ $0.003/month.

   Course modules stay on Vimeo: long-form, adaptive bitrate earns its keep, the
   transcription pipeline runs off their API, and one iframe per lesson page is
   not a feed.

   WHY MOVE AT ALL. 26 MB sits fine in the repo today. But video in git is
   PERMANENT — at a hundred clips that is half a gigabyte of history that every
   clone and every CI run carries forever, and each deploy re-uploads the whole
   site as one artifact. Moving is cheap precisely because media.src is a single
   field per reel: this is a find-and-replace, not a refactor.

   PREREQUISITE: R2 must be enabled once in the Cloudflare dashboard
   (Dashboard → R2 → Enable). wrangler cannot do that for you; it returns
   code 10042 until it is done.
   ========================================================================= */
import { readFileSync, writeFileSync, readdirSync, existsSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'media', 'reels');
const BUCKET = 'edenrise-reels';
const A = process.argv.slice(2);
const DRY = A.includes('--dry'), PURGE = A.includes('--purge');
const arg = (k, d) => { const i = A.indexOf(k); return i > -1 ? A[i + 1] : d; };
/* set once the bucket has a public r2.dev URL or a custom domain */
const BASE = arg('--base', process.env.REELS_BASE || '');

const wr = (...a) => execFileSync('npx', ['--yes', 'wrangler@latest', ...a],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

if (!existsSync(DIR)) { console.error('✗ no media/reels'); process.exit(1); }
/* ONLY WHAT IS ACTUALLY PUBLISHED. media/reels also holds the alternate takes —
   twelve files came in and five are used — and uploading the other seven would
   put unpublished footage on a public URL and bill storage for clips no learner
   can reach. Ask content.js what it references. */
const referenced = new Set();
for (const b of readdirSync(join(ROOT, 'brands'))) {
  const p = join(ROOT, 'brands', b, 'content.js');
  if (!existsSync(p)) continue;
  for (const m of readFileSync(p, 'utf8').matchAll(/media\/reels\/([^'"]+)/g)) referenced.add(m[1]);
}
const all = readdirSync(DIR).filter(f => /\.(mp4|jpg|webp)$/.test(f));
const files = all.filter(f => referenced.has(f));
const skipped = all.filter(f => !referenced.has(f));
if (skipped.length) console.log(`  ${skipped.length} unreferenced file(s) held back: ${skipped.slice(0, 4).join(', ')}${skipped.length > 4 ? '…' : ''}\n`);
const bytes = files.reduce((n, f) => n + readFileSync(join(DIR, f)).length, 0);
console.log(`${files.length} files · ${(bytes / 1048576).toFixed(1)} MB → r2://${BUCKET}\n`);

if (!BASE && !DRY) {
  console.error(`✗ no public base URL.

  1  Cloudflare dashboard → R2 → Enable (one time, needs a card on file;
     the free tier covers this many times over)
  2  npx wrangler r2 bucket create ${BUCKET}
  3  give it a public URL — either the bucket's r2.dev subdomain or a custom
     domain like reels.edenrise.com
  4  re-run with --base https://<that-url>

  Nothing has been uploaded or changed.`);
  process.exit(2);
}

if (DRY) {
  files.slice(0, 6).forEach(f => console.log(`  would upload  ${f}`));
  if (files.length > 6) console.log(`  …and ${files.length - 6} more`);
  console.log(`\n  would rewrite media.src / poster in brands/*/content.js to ${BASE || '<base>'}/…`);
  console.log('  dry run — nothing uploaded, nothing changed.');
  process.exit(0);
}

try { wr('r2', 'bucket', 'create', BUCKET); console.log(`  bucket ${BUCKET} created`); }
catch (e) { console.log(`  bucket ${BUCKET} already exists (or: ${String(e.stderr || '').split('\n').find(Boolean) || 'ok'})`); }

let up = 0;
for (const f of files) {
  const type = f.endsWith('.mp4') ? 'video/mp4' : f.endsWith('.jpg') ? 'image/jpeg' : 'image/webp';
  try {
    /* long cache: the filename changes when the clip does, so these are immutable */
    wr('r2', 'object', 'put', `${BUCKET}/${f}`, '--file', join(DIR, f),
       '--content-type', type, '--cache-control', 'public, max-age=31536000, immutable');
    up++; process.stdout.write(`  ✓ ${f}\n`);
  } catch (e) { console.log(`  ✗ ${f}: ${String(e.stderr || e.message).split('\n').find(Boolean)}`); }
}

/* rewrite every brand's content.js — the whole reason this is cheap */
let rewritten = 0;
for (const b of readdirSync(join(ROOT, 'brands'))) {
  const p = join(ROOT, 'brands', b, 'content.js');
  if (!existsSync(p)) continue;
  const before = readFileSync(p, 'utf8');
  const after = before.replace(/(['"])media\/reels\/([^'"]+)\1/g, `'${BASE.replace(/\/$/, '')}/$2'`);
  if (after !== before) { writeFileSync(p, after); rewritten++; console.log(`  ↻ brands/${b}/content.js`); }
}

console.log(`\n${up}/${files.length} uploaded · ${rewritten} content.js rewritten`);
if (PURGE) { rmSync(DIR, { recursive: true, force: true }); console.log('  local media/reels removed'); }
else console.log('  local copies kept — re-run with --purge once the live site is verified');
console.log(`
  Next: node test/run.mjs, bump ?v= and sw VERSION together, deploy, then curl a
  reel URL to confirm R2 is actually serving it before purging anything.`);
