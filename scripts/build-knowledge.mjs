#!/usr/bin/env node
/* ============================================================================
   The knowledge substrate — one manifest both worlds consume.

   knowledge/index.json is the canonical map of everything the Academy knows,
   per module: tags, capability, regime, key moments, transcript inventory.
   The Academy reads it (search, future features), the LandFlow push reads it
   (scripts/push-knowledge.mjs), and a human can read it in a code review.

   THE TAGGING SYSTEM — deterministic on purpose:
   · capability tags from the course's skill mapping (content.js — the same
     mapping the legal job-relevance gate uses, so the brain and the law agree),
   · content tags = top TF keywords from the module's own transcript, EN+PT
     stopworded, diacritics folded. Reproducible with zero model calls; a
     model-written editorial layer can come later without breaking anything.
   · KEY MOMENTS = the verified quiz anchors: each question's t0 is, by
     construction, a second of video that teaches something worth asking about.

   USAGE  node scripts/build-knowledge.mjs
   ========================================================================= */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TR = join(ROOT, 'media', 'transcripts');
const QZ = join(ROOT, 'knowledge', 'quizzes');
/* ---- the catalogue, EVALUATED not parsed --------------------------------
   This block used to pull titles, skills and regimes out of content.js with
   regexes. That produced a live data-corruption bug: the module-title matcher
   accepted only single-quoted strings, but "Don't Assume, Clarify" is DOUBLE
   quoted precisely because it contains an apostrophe. The matcher latched onto
   the ' inside "Don't" and every title after it shifted — module 3 became
   `t Assume, Clarify", `, modules 4-6 became `, `, and module 7 fell off the
   end into the "Module N" fallback. Those names were pushed to LandFlow and are
   what the agent reads back to a worker on WhatsApp.

   content.js is pure data, so evaluating it removes that entire class of bug
   rather than patching one regex. The brand folder is resolved from index.html
   (the app's own truth) instead of hard-coded, so this script is not welded to
   the founding tenant either. */
const INDEX_HTML = readFileSync(join(ROOT, 'index.html'), 'utf8');
const BRAND_DIR = (() => {
  const m = INDEX_HTML.match(/["']([^"']*brands\/[^/"']+\/)content\.js/);
  if (m && existsSync(join(ROOT, m[1] + 'content.js'))) return m[1];
  const dir = join(ROOT, 'brands');
  const found = existsSync(dir) ? readdirSync(dir).filter(d => existsSync(join(dir, d, 'content.js'))) : [];
  if (found.length === 1) return `brands/${found[0]}/`;
  throw new Error('build-knowledge: cannot resolve the brand content.js');
})();
const CONTENT = (() => {
  const code = readFileSync(join(ROOT, BRAND_DIR + 'content.js'), 'utf8');
  try {
    return new Function(`${code}\n;return {CATALOG, COURSE_SKILLS: typeof COURSE_SKILLS !== 'undefined' ? COURSE_SKILLS : {}, COURSE_REGIME: typeof COURSE_REGIME !== 'undefined' ? COURSE_REGIME : {}};`)();
  } catch (e) {
    throw new Error(`build-knowledge: ${BRAND_DIR}content.js no longer evaluates as data (${e.message})`);
  }
})();

const COURSE_TITLES = Object.fromEntries(CONTENT.CATALOG.map(c => [c.id, c.title]));
const MOD_NAMES = Object.fromEntries(CONTENT.CATALOG.map(c => [c.id, c.modules || []]));
const SKILLS = CONTENT.COURSE_SKILLS || {};
const REGIME = CONTENT.COURSE_REGIME || {};

const STOP = new Set(`the and for you your that this with have from are was were what when how why not can will
just like our their they them there then than into onto out very much more most been being them we is it in of to on at as by an or if do does did
que com para uma umas uns não nos nas dos das este esta isto isso aqui ali mais menos muito pouco como quando onde porque também pelo pela seus suas
vamos vai ser estar tem têm foi eram são está estão fazer feito depois antes agora sempre nunca todos todas cada qual quais coisa coisas pessoa pessoas
sobre entre até desde porque porquê então assim mesmo mesma outros outras
also where going here there because really actually thing things right know want need make comes come look looking
well yeah okay gonna little bit lot different important goes said says take takes put trying try
vou vais aqui acolá realmente atenção verdade situação exemplo maneira forma parte ainda
temos posso podes pode podem foram estas estes essa esse essas esses minha meu tua teu sua seu`.split(/\s+/));

function tagsFrom(segments, n = 8) {
  const freq = {};
  for (const s of segments) {
    for (const w of s.text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/)) {
      if (w.length < 4 || STOP.has(w)) continue;
      freq[w] = (freq[w] || 0) + 1;
    }
  }
  return Object.entries(freq).filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1]).slice(0, n).map(([w]) => w);
}

const index = { generatedAt: Date.now(), courses: {} };
for (const course of readdirSync(TR).filter(d => !d.includes('.'))) {
  const quiz = existsSync(join(QZ, `${course}.json`)) ? JSON.parse(readFileSync(join(QZ, `${course}.json`), 'utf8')) : null;
  const mods = [];
  for (const f of readdirSync(join(TR, course)).filter(x => /^m\d+\.json$/.test(x))) {
    const mod = +f.match(/m(\d+)/)[1];
    const tr = JSON.parse(readFileSync(join(TR, course, f), 'utf8'));
    const other = ['en', 'pt'].find(l => existsSync(join(TR, course, `m${mod}.${l}.json`)));
    const qs = quiz?.modules?.[mod] || [];
    mods.push({
      mod,
      title: MOD_NAMES[course]?.[mod] || `Module ${mod + 1}`,
      language: tr.language,
      translated: other || null,
      segments: tr.segments.length,
      durationSec: Math.round(tr.segments.at(-1)?.t1 || 0),
      capability: SKILLS[course]?.[0] || null,
      tags: [...new Set([...(SKILLS[course] || []), ...tagsFrom(tr.segments)])],
      regime: REGIME[course] || null,
      summary: tr.segments.slice(0, 3).map(s => s.text).join(' ').slice(0, 260),
      url: `https://academy.edenrise.com/#/play/${course}/${mod}`,
      moments: qs.filter(q => q.t0 != null).map(q => ({
        t0: q.t0, teaches: (q.en?.q || '').slice(0, 120),
        audit: q.verified ? 'verified' : q.corrected ? 'corrected' : 'unaudited',
      })),
      questions: qs.length,
    });
  }
  index.courses[course] = { title: COURSE_TITLES[course] || course, modules: mods.sort((a, b) => a.mod - b.mod) };
}

mkdirSync(join(ROOT, 'knowledge'), { recursive: true });
writeFileSync(join(ROOT, 'knowledge', 'index.json'), JSON.stringify(index, null, 1));

/* knowledge/search.json — the app's client-side ask index: every transcript
   segment (original + translations when present) in one compact fetch, so
   "how do I fill the tank?" can answer with real moments and no AI at all. */
const search = [];
for (const [course, c] of Object.entries(index.courses)) {
  for (const m of c.modules) {
    const segs = [];
    const files = [`m${m.mod}.json`, `m${m.mod}.en.json`, `m${m.mod}.pt.json`];
    for (const f of files) {
      const fp = join(TR, course, f);
      if (!existsSync(fp)) continue;
      for (const sg of JSON.parse(readFileSync(fp, 'utf8')).segments)
        segs.push([Math.round(sg.t0), sg.text]);
    }
    search.push({ c: course, ct: c.title, m: m.mod, t: m.title, s: segs });
  }
}
writeFileSync(join(ROOT, 'knowledge', 'search.json'), JSON.stringify(search));
console.log(`knowledge/search.json: ${search.length} modules, ${search.reduce((a, x) => a + x.s.length, 0)} segments`);
const total = Object.values(index.courses).reduce((a, c) => a + c.modules.length, 0);
console.log(`knowledge/index.json: ${Object.keys(index.courses).length} courses, ${total} modules`);
