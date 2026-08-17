#!/usr/bin/env node
/* ============================================================================
   run.mjs — the whole suite. One command, no dependencies, non-zero on failure.

       node test/run.mjs              # everything
       node test/run.mjs integrity    # one file, by name fragment
       node test/run.mjs --list       # what checks exist

   WHY THIS EXISTS
   Before this, every check on this codebase was a scratch file in /tmp that got
   deleted after it passed once. Over a single day that pattern let through: a
   nav-scroll handler clobbered by a regex that matched the wrong occurrence
   (`node --check` passed it), a reel feed keyed on an IntersectionObserver that
   never fires in the embedded webview, a `.avatar` class collision that burst a
   pill onto two lines, Portuguese modules in the old order so the title said one
   thing while the video played another, a `validQuestion` bug across four call
   sites, a Vimeo id that had been deleted upstream, and an admin tab reporting
   0/42 verified questions when the real number was higher.

   Each of those was found by hand. The template turns one escape into an escape
   in every tenant, so hand-checking does not scale. These tests are that day's
   findings made permanent.

   DESIGN RULES
   · zero dependencies — it must run in CI with no install step
   · file-level invariants first: they are the cheapest and the least brittle
   · a test that cannot fail is deleted, not kept for the count
   ========================================================================= */
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const filter = process.argv.slice(2).filter(a => !a.startsWith('--'))[0] || '';
const LIST = process.argv.includes('--list');

let pass = 0, fail = 0;
const failures = [];
let group = '';

const t = {
  group(name) { group = name; if (!LIST) console.log(`\n${name}`); },
  ok(label, cond, detail) {
    if (LIST) { console.log(`  ${group} :: ${label}`); return; }
    if (cond) { pass++; console.log(`  ✓ ${label}`); }
    else {
      fail++; failures.push(`${group} :: ${label}${detail ? ` — ${detail}` : ''}`);
      console.log(`  ✗ ${label}${detail ? `\n      ${detail}` : ''}`);
    }
  },
  eq(label, got, want) {
    const g = JSON.stringify(got), w = JSON.stringify(want);
    this.ok(label, g === w, g === w ? '' : `got ${g}, want ${w}`);
  },
};

const files = readdirSync(HERE).filter(f => f.endsWith('.test.mjs')).sort()
  .filter(f => !filter || f.includes(filter));
if (!files.length) { console.error(`no test files match "${filter}"`); process.exit(2); }

for (const f of files) {
  const mod = await import(join(HERE, f));
  if (typeof mod.run !== 'function') { console.error(`${f} exports no run()`); process.exit(2); }
  try { await mod.run(t); }
  catch (e) {
    fail++; failures.push(`${f} threw: ${e.message}`);
    console.log(`  ✗ ${f} threw before finishing: ${e.message}`);
  }
}

if (LIST) process.exit(0);
console.log(`\n${'─'.repeat(60)}`);
if (fail) {
  console.log(`${pass} passed, ${fail} FAILED\n`);
  failures.forEach(f => console.log(`  · ${f}`));
  console.log('');
  process.exit(1);
}
console.log(`${pass} passed, 0 failed`);
