#!/usr/bin/env node
/* ============================================================================
   build-vectors.mjs — the semantic index. Every transcript is cut into ~40-word
   windows (segment-aligned, so a window has a start second), each window is
   embedded with bge-m3 through the gateway's /embed (build key, batches of 64),
   L2-normalised, and quantised to int8 with one scale per vector. Output:
     knowledge/vectors.bin   Int8 [n × dims]
     knowledge/windows.json  { model, dims, n, scale:[…], win:[[key, t0, i0, i1], …] }
   i0/i1 index into that lesson's segment list in search.json, so the client
   rebuilds the window text without a second copy of the transcripts.
   Multilingual on purpose: a Portuguese question finds an English window.
   ========================================================================= */
import { readFileSync, writeFileSync } from 'fs';
const KEY = readFileSync(process.env.HOME + '/.academy-build-key', 'utf8').trim();
const GW = 'https://academy-ai.edenrise.workers.dev/embed';
const S = JSON.parse(readFileSync('knowledge/search.json', 'utf8'));
const TARGET = 40;
const win = [], texts = [];
for (const mod of S) {
  const key = (mod.kind === 'reel' ? 'reel:' : mod.c + ':') + mod.m;
  let i0 = 0, words = 0, buf = [];
  mod.s.forEach(([t0, text], i) => {
    buf.push(text); words += text.split(/\s+/).length;
    if (words >= TARGET || i === mod.s.length - 1) {
      win.push([key, Math.round(mod.s[i0][0]), i0, i]); texts.push(`${mod.t}: ${buf.join(' ')}`);
      i0 = i + 1; words = 0; buf = [];
    }
  });
}
console.log(`${win.length} windows from ${S.length} lessons`);
const vecs = [];
for (let b = 0; b < texts.length; b += 64) {
  const batch = texts.slice(b, b + 64);
  let ok = false;
  for (let attempt = 0; attempt < 4 && !ok; attempt++) {
    try {
      const r = await fetch(GW, { method: 'POST', headers: { 'content-type': 'application/json', 'X-Build-Key': KEY }, body: JSON.stringify({ texts: batch }), signal: AbortSignal.timeout(90000) });
      const d = await r.json();
      if (!d.vectors || d.vectors.length !== batch.length) throw new Error(d.error || 'short batch');
      vecs.push(...d.vectors); ok = true;
      process.stdout.write(`\r  embedded ${vecs.length}/${texts.length}`);
    } catch (e) { process.stdout.write(`\n  retry ${attempt + 1}: ${String(e.message).slice(0, 60)}\n`); await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); }
  }
  if (!ok) { console.error('\n✗ gave up'); process.exit(1); }
}
const dims = vecs[0].length, n = vecs.length;
const q = new Int8Array(n * dims), scale = new Float32Array(n);
for (let i = 0; i < n; i++) {
  const v = vecs[i]; const norm = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1;
  let mx = 0; for (const x of v) mx = Math.max(mx, Math.abs(x / norm));
  scale[i] = mx / 127;
  for (let j = 0; j < dims; j++) q[i * dims + j] = Math.round((v[j] / norm) / scale[i]);
}
writeFileSync('knowledge/vectors.bin', Buffer.from(q.buffer));
writeFileSync('knowledge/windows.json', JSON.stringify({ model: 'bge-m3', dims, n, generatedAt: new Date().toISOString(), scale: [...scale].map(x => +x.toPrecision(5)), win }));
console.log(`\nknowledge/vectors.bin ${(q.byteLength / 1e6).toFixed(2)} MB · windows.json ${n} windows × ${dims}d`);
