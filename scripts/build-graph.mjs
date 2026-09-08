#!/usr/bin/env node
/* ============================================================================
   build-graph.mjs — the knowledge as a graph, not a list.

     node scripts/build-graph.mjs            → knowledge/graph.json

   WHAT WAS THERE BEFORE: 31 module nodes with tags, five reels pointing one way
   at a course, and nothing pointing at anything else. Ask "what else covers
   this" and the honest answer was a flat list. A wiki whose pages do not link is
   a folder.

   NODES   course · module · reel · concept (a tag promoted to a first-class node)
   EDGES   module  —in→       course        the catalogue, verbatim
           reel    —deeper→   course        from content.js, verbatim
           node    —about→    concept       every tag
           reel    —beside→   module        COMPUTED: the lesson this clip sits
                                            next to, by what is actually said
           module  —related→  module        COMPUTED: cross-course, by content

   HOW "COMPUTED" IS COMPUTED, and why it is this and not a model. Similarity is
   Jaccard over each node's top content words from its own transcript (search.json
   carries every segment). Deterministic, reproducible in a code review, zero
   model calls, and it can never invent a link — two nodes are related because
   the trainer used the same vocabulary in both, which is what "related" means
   in a training library. A model could propose richer edges later; it would sit
   on top of this, not replace it.

   Thresholds are deliberately conservative. A graph with a link between
   everything is the list again, drawn as a ball of string.
   ========================================================================= */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const K = JSON.parse(readFileSync(join(ROOT, 'knowledge', 'index.json'), 'utf8'));
const SEARCH = JSON.parse(readFileSync(join(ROOT, 'knowledge', 'search.json'), 'utf8'));

const STOP = new Set(`the and for you your that this with have from are was were what when how why not can will just like our their they them there then than into onto out very much more most been being we is it in of to on at as by an or if do does did about also because which would could should where who whom these those than them some any all each every both either neither only other such
que com para uma umas uns não nos nas dos das este esta isto isso aqui ali mais menos muito pouco como quando onde porque também pelo pela seus suas vamos vai ser estar tem têm foi eram são está estão fazer feito depois antes agora sempre nunca todos todas cada qual quais coisa coisas pessoa pessoas sobre entre até desde então assim mesmo mesma outros outras
going thing things really people something someone actually maybe okay right yeah going want know think make made take give said says`.split(/\s+/));

/* top-N content words of a node, from its own transcript */
const bag = segs => {
  const f = new Map();
  for (const [, text] of segs) for (const w of String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z]+/)) {
    if (w.length < 4 || STOP.has(w)) continue;
    f.set(w, (f.get(w) || 0) + 1);
  }
  return new Set([...f.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(e => e[0]));
};
const jaccard = (a, b) => { let i = 0; for (const w of a) if (b.has(w)) i++; return i / (a.size + b.size - i || 1); };

const nodes = [], edges = [], id = new Map();
const add = (nid, n) => { if (!id.has(nid)) { id.set(nid, n); nodes.push({ id: nid, ...n }); } };
const link = (from, to, rel, w = 1) => edges.push({ from, to, rel, w: +w.toFixed(3) });

/* ---- verbatim structure ---- */
for (const [cid, c] of Object.entries(K.courses)) {
  add(`course:${cid}`, { kind: 'course', title: c.title });
  for (const m of c.modules) {
    const mid = `module:${cid}:${m.mod}`;
    add(mid, { kind: 'module', title: m.title, course: cid, mod: m.mod, url: m.url, seconds: m.durationSec });
    link(mid, `course:${cid}`, 'in');
    for (const t of m.tags || []) { add(`concept:${t}`, { kind: 'concept', title: t }); link(mid, `concept:${t}`, 'about'); }
  }
}
for (const r of K.reels || []) {
  const rid = `reel:${r.id}`;
  add(rid, { kind: 'reel', title: r.title, seconds: r.seconds, url: r.url, videoLang: r.videoLang, published: r.published });
  if (r.deeper && id.has(`course:${r.deeper}`)) link(rid, `course:${r.deeper}`, 'deeper');
  for (const t of r.tags || []) { add(`concept:${t}`, { kind: 'concept', title: t }); link(rid, `concept:${t}`, 'about'); }
}

/* ---- computed, from what was actually said ---- */
const bags = new Map();
for (const e of SEARCH) {
  const nid = e.kind === 'reel' ? `reel:${e.m}` : `module:${e.c}:${e.m}`;
  if (id.has(nid)) bags.set(nid, bag(e.s));
}
const mods = [...bags.keys()].filter(k => k.startsWith('module:'));
const reels = [...bags.keys()].filter(k => k.startsWith('reel:'));

/* reel —beside→ module: the lesson it sits next to.
   NOT Jaccard. A twenty-second clip has ~40 content words; a six-minute lesson
   has hundreds. Their symmetric overlap is tiny even when the clip is lifted
   straight from the lesson — the first run found ZERO links. The right question
   is asymmetric: how much of the REEL's vocabulary does the module contain?
   That is containment, |reel ∩ module| / |reel|, against a wider module bag.
   Top 2 above 0.25. */
const wide = new Map();
for (const e of SEARCH) if (e.kind !== 'reel') {
  const nid = `module:${e.c}:${e.m}`; if (!id.has(nid)) continue;
  const f = new Map();
  for (const [, text] of e.s) for (const w of String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z]+/)) {
    if (w.length < 4 || STOP.has(w)) continue; f.set(w, (f.get(w) || 0) + 1);
  }
  wide.set(nid, new Set([...f.entries()].sort((a, b) => b[1] - a[1]).slice(0, 160).map(x => x[0])));
}
const contain = (small, big) => { let i = 0; for (const w of small) if (big.has(w)) i++; return i / (small.size || 1); };
let beside = 0;
for (const r of reels) {
  const scored = mods.map(m => [m, contain(bags.get(r), wide.get(m) || bags.get(m))]).filter(x => x[1] >= 0.25)
    .sort((a, b) => b[1] - a[1]).slice(0, 2);
  for (const [m, w] of scored) { link(r, m, 'beside', w); beside++; }
}
/* module —related→ module: symmetric, cross-course welcome. Top 3 above 0.12. */
let related = 0; const seen = new Set();
for (const a of mods) {
  const scored = mods.filter(b => b !== a).map(b => [b, jaccard(bags.get(a), bags.get(b))])
    .filter(x => x[1] >= 0.12).sort((x, y) => y[1] - x[1]).slice(0, 3);
  for (const [b, w] of scored) {
    const key = [a, b].sort().join('|'); if (seen.has(key)) continue; seen.add(key);
    link(a, b, 'related', w); related++;
  }
}

const stats = {
  nodes: { course: 0, module: 0, reel: 0, concept: 0 }, edges: {},
};
for (const n of nodes) stats.nodes[n.kind]++;
for (const e of edges) stats.edges[e.rel] = (stats.edges[e.rel] || 0) + 1;
const orphans = nodes.filter(n => n.kind !== 'concept' && !edges.some(e => e.from === n.id || e.to === n.id)).map(n => n.id);


/* ===== SEMANTIC EDGES ==========================================================
   If the vector index exists, every lesson gets a centroid (mean of its
   windows' unit vectors) and the three most similar OTHER lessons become
   'similar' edges with the cosine as weight — computed from what the trainer
   said, not from shared tags. The lexical 'related' edges stay; the UI reads
   both. */
try {
  const meta = JSON.parse(readFileSync('knowledge/windows.json', 'utf8'));
  const raw = new Int8Array(readFileSync('knowledge/vectors.bin').buffer.slice(0));
  const cent = {};
  meta.win.forEach(([key], i) => {
    const c = cent[key] || (cent[key] = new Float64Array(meta.dims));
    for (let j = 0; j < meta.dims; j++) c[j] += raw[i * meta.dims + j] * meta.scale[i];
  });
  const keys = Object.keys(cent).map(k => { const v = cent[k]; let n = 0; for (const x of v) n += x * x; n = Math.sqrt(n) || 1; for (let j = 0; j < v.length; j++) v[j] /= n; return k; });
  const nodeId = k => (k.startsWith('reel:') ? k : 'module:' + k);
  let added = 0;
  for (const a of keys) {
    const sims = keys.filter(b => b !== a && !b.startsWith('reel:') && !a.startsWith('reel:')).map(b => { let d = 0; const va = cent[a], vb = cent[b]; for (let j = 0; j < va.length; j++) d += va[j] * vb[j]; return [d, b]; })
      .sort((x, y) => y[0] - x[0]).slice(0, 3).filter(([d]) => d >= 0.62);
    for (const [d, b] of sims) {
      if (edges.some(e => e.rel === 'similar' && ((e.from === nodeId(a) && e.to === nodeId(b)) || (e.from === nodeId(b) && e.to === nodeId(a))))) continue;
      edges.push({ from: nodeId(a), to: nodeId(b), rel: 'similar', w: +d.toFixed(3) }); added++;
    }
  }
  stats.edges.similar = added;
  console.log(`  semantic: ${added} module↔module (similar) edges from ${keys.length} lesson centroids`);
} catch (e) { console.log('  semantic edges skipped:', String(e.message).slice(0, 60)); }

writeFileSync(join(ROOT, 'knowledge', 'graph.json'), JSON.stringify({ generatedAt: Date.now(), nodes, edges, stats, orphans }, null, 1));
console.log(`knowledge/graph.json: ${nodes.length} nodes, ${edges.length} edges`);
console.log(`  nodes  ${Object.entries(stats.nodes).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
console.log(`  edges  ${Object.entries(stats.edges).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
console.log(`  computed: ${beside} reel→module (beside), ${related} module↔module (related)`);
console.log(orphans.length ? `  ⚠ ${orphans.length} unlinked: ${orphans.join(', ')}` : '  every course, module and reel is linked to something');
