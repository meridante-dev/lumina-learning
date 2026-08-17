/* ============================================================================
   harness.mjs — run a function out of core/app.js without a browser.

   WHY THIS EXISTS
   core/app.js is one ~8,000-line classic script, not a module: nothing is
   exported and half of it touches `document`. So a unit test has two options —
   load the whole file in a fake DOM, or lift the one function under test out of
   the source and run it against stubs. This does the second.

   The naive version of this (indexOf the declaration, indexOf the next '}')
   is how you end up testing the wrong code, silently. A brace inside a string,
   a comment, a template literal or a regex ends the extraction early and you
   get a syntax error — or worse, a function that parses and is not the one you
   meant. So extract() runs a real scanner that knows about single- and
   double-quoted strings, template literals (including nested substitutions),
   line and block comments, and regex literals — any of which may contain a
   brace that is data rather than structure.

   (The first version of this very comment demonstrated the problem: it listed a
   block-comment delimiter as an example, which closed the comment early and
   broke the file. The scanner exists because that class of mistake is easy.)

   COST OF BEING WRONG is high enough that the scanner has its own tests
   (selfTest below, run as part of the suite). A test harness that is not itself
   tested is a source of false confidence, which is worse than no tests.

   This is deliberately a stopgap. The real fix is splitting app.js into modules
   with an export surface — see NEXT-LEVEL Phase 2. When that lands, most of
   this file should be deleted and replaced with plain imports.
   ========================================================================= */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const src = f => readFileSync(join(ROOT, f), 'utf8');

/* ---------- the scanner ---------- */
/* Walk forward from `i`, returning the index just past the matching close of the
   brace/bracket that starts at `i`. Skips over anything where a brace is data
   rather than structure. */
export function matchBrace(s, i) {
  const open = s[i];
  const close = { '{': '}', '(': ')', '[': ']' }[open];
  if (!close) throw new Error(`matchBrace: expected a bracket at ${i}, got ${JSON.stringify(open)}`);
  let depth = 0;
  for (let p = i; p < s.length; p++) {
    const c = s[p], n = s[p + 1];
    /* comments */
    if (c === '/' && n === '/') { p = s.indexOf('\n', p); if (p < 0) break; continue; }
    if (c === '/' && n === '*') { p = s.indexOf('*/', p + 2) + 1; if (p < 1) break; continue; }
    /* strings + templates. Templates can nest ${ ... } containing anything,
       including more templates, so recurse through the substitution. */
    if (c === "'" || c === '"') { p = endOfQuote(s, p); continue; }
    if (c === '`') { p = endOfTemplate(s, p); continue; }
    /* regex literal, distinguished from division by what precedes it */
    if (c === '/' && isRegexStart(s, p)) { p = endOfRegex(s, p); continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (!depth) return p + 1; }
  }
  throw new Error(`matchBrace: unbalanced ${open} starting at ${i}`);
}

function endOfQuote(s, i) {
  const q = s[i];
  for (let p = i + 1; p < s.length; p++) {
    if (s[p] === '\\') { p++; continue; }
    if (s[p] === q) return p;
  }
  throw new Error(`unterminated string at ${i}`);
}

function endOfTemplate(s, i) {
  for (let p = i + 1; p < s.length; p++) {
    if (s[p] === '\\') { p++; continue; }
    if (s[p] === '`') return p;
    if (s[p] === '$' && s[p + 1] === '{') { p = matchBrace(s, p + 1) - 1; continue; }
  }
  throw new Error(`unterminated template at ${i}`);
}

/* A '/' starts a regex only where a value is expected. Look back past
   whitespace: if the previous meaningful char can END an expression, this is
   division. */
function isRegexStart(s, i) {
  for (let p = i - 1; p >= 0; p--) {
    const c = s[p];
    if (/\s/.test(c)) continue;
    if (/[A-Za-z0-9_$)\]]/.test(c)) {
      /* `return /re/` and `typeof /re/` are regexes despite ending in a letter */
      const word = (s.slice(Math.max(0, p - 10), p + 1).match(/[A-Za-z]+$/) || [''])[0];
      return ['return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'do', 'else'].includes(word);
    }
    return true;                     /* operator, comma, brace, etc. → regex */
  }
  return true;
}

function endOfRegex(s, i) {
  let inClass = false;
  for (let p = i + 1; p < s.length; p++) {
    const c = s[p];
    if (c === '\\') { p++; continue; }
    if (c === '[') inClass = true;
    else if (c === ']') inClass = false;
    else if (c === '/' && !inClass) return p;
    else if (c === '\n') throw new Error(`unterminated regex at ${i}`);
  }
  throw new Error(`unterminated regex at ${i}`);
}

/* ---------- extraction ---------- */
/* Pull out the full source text of a top-level declaration by name.
   Handles:  function f(...) {...}   const f = (...) => {...}   const f = x => expr
   Returns the declaration text, ready to be eval'd. */
export function extract(source, name) {
  const patterns = [
    new RegExp(`^\\s*(?:async\\s+)?function\\s+${name}\\s*\\(`, 'm'),
    new RegExp(`^\\s*(?:const|let|var)\\s+${name}\\s*=`, 'm'),
  ];
  for (const re of patterns) {
    const m = re.exec(source);
    if (!m) continue;
    const start = m.index + (source[m.index] === '\n' ? 1 : 0);
    if (/function/.test(m[0])) {
      const brace = source.indexOf('{', m.index + m[0].length - 1);
      return source.slice(start, matchBrace(source, brace));
    }
    /* `const name = ...` — find the end of the initializer. If it opens a brace
       or paren-arrow body, brace-match it; otherwise run to the statement end. */
    let p = m.index + m[0].length;
    while (/\s/.test(source[p])) p++;
    /* arrow with a parenthesised/braced body somewhere: scan tokens until we
       hit a top-level ';' or a newline that ends the statement */
    let depth = 0;
    for (; p < source.length; p++) {
      const c = source[p], n = source[p + 1];
      if (c === '/' && n === '/') { p = source.indexOf('\n', p) - 1; continue; }
      if (c === '/' && n === '*') { p = source.indexOf('*/', p + 2); continue; }
      if (c === "'" || c === '"') { p = endOfQuote(source, p); continue; }
      if (c === '`') { p = endOfTemplate(source, p); continue; }
      if (c === '/' && isRegexStart(source, p)) { p = endOfRegex(source, p); continue; }
      if ('{(['.includes(c)) { p = matchBrace(source, p) - 1; continue; }
      if (c === ';' && !depth) return source.slice(start, p + 1);
      if (c === '\n' && !depth) {
        /* a bare newline ends it only if the next meaningful line starts a new
           statement rather than continuing this one */
        const rest = source.slice(p + 1).match(/^\s*([^\s])/);
        if (!rest || !'.?:+-*/&|,'.includes(rest[1])) return source.slice(start, p);
      }
    }
    return source.slice(start);
  }
  throw new Error(`extract: no top-level declaration named "${name}"`);
}

/* Blank out comments, keeping offsets and line count intact.

   Structural tests that grep source MUST run on this, not on the raw text. Two
   of the first such checks failed against correct code because this codebase
   documents its own history: syncLedger's comment quotes the exact line that was
   removed ("if (cursor >= L.length) return;"), so a regex looking for that line
   found the tombstone and reported the bug as still present. Good comments
   actively break naive source matching. */
export function stripComments(s) {
  let out = '';
  for (let p = 0; p < s.length; p++) {
    const c = s[p], n = s[p + 1];
    if (c === '/' && n === '/') {
      const e = s.indexOf('\n', p); const stop = e < 0 ? s.length : e;
      out += ' '.repeat(stop - p); p = stop - 1; continue;
    }
    if (c === '/' && n === '*') {
      const e = s.indexOf('*/', p + 2); const stop = e < 0 ? s.length : e + 2;
      /* keep newlines so line numbers still line up in any failure message */
      out += s.slice(p, stop).replace(/[^\n]/g, ' '); p = stop - 1; continue;
    }
    if (c === "'" || c === '"') { const e = endOfQuote(s, p); out += s.slice(p, e + 1); p = e; continue; }
    if (c === '`') { const e = endOfTemplate(s, p); out += s.slice(p, e + 1); p = e; continue; }
    if (c === '/' && isRegexStart(s, p)) { const e = endOfRegex(s, p); out += s.slice(p, e + 1); p = e; continue; }
    out += c;
  }
  return out;
}

/* Comment stripper for firestore.rules, which is NOT JavaScript.

   stripComments() must not be used on it: `match /databases/{database}/documents`
   is a PATH, and a JS-aware scanner reads those slashes as the start of a regex
   literal and then throws on the unterminated result. The rules language only has
   // and /* *SLASH* comments and simple quoted strings, so a smaller stripper is
   both sufficient and correct here. */
export function stripRulesComments(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .split('\n')
    .map(line => {
      /* drop // to end-of-line, but never inside a quoted string */
      let q = null;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
        if (c === "'" || c === '"') { q = c; continue; }
        if (c === '/' && line[i + 1] === '/') return line.slice(0, i);
      }
      return line;
    })
    .join('\n');
}

/* Build a callable sandbox: extract `names` from `source`, evaluate them with
   `stubs` in scope, and hand back the resulting functions. */
export function sandbox(source, names, stubs = {}) {
  const code = names.map(n => extract(source, n)).join('\n');
  const keys = Object.keys(stubs);
  const body = `${code}\n;return {${names.join(', ')}};`;
  try {
    return new Function(...keys, body)(...keys.map(k => stubs[k]));
  } catch (e) {
    throw new Error(`sandbox(${names.join(', ')}) failed: ${e.message}`);
  }
}

/* ---------- the harness tests itself ---------- */
export function selfTest(t) {
  const cases = [
    ['brace in a string',      `function f() { const s = "}"; return 1; }`,            1],
    ['brace in a template',    'function f() { const s = `${ {a:1} } }`; return 2; }',  2],
    ['brace in a comment',     `function f() { /* } */ return 3; }`,                    3],
    ['brace in a line comment',`function f() { // }\n return 4; }`,                     4],
    ['brace in a regex',       `function f() { return /[{]/.test("{") ? 5 : 0; }`,       5],
    ['division not regex',     `function f() { const a=8, b=2; return a/b+1; }`,         5],
    ['nested templates',       'function f() { return `a${`b${ {x:1}.x }`}` === "ab1" ? 6 : 0; }', 6],
    ['regex after return',     `function f() { return /x{1}/.source === "x{1}" ? 7 : 0; }`, 7],
  ];
  for (const [label, code, want] of cases) {
    const got = sandbox(code, ['f'])/**/.f();
    t.ok(`harness: ${label}`, got === want, `expected ${want}, got ${got}`);
  }
  /* arrow-const extraction */
  t.ok('harness: arrow const', sandbox(`const g = x => x * 2;`, ['g']).g(21) === 42);
  t.ok('harness: arrow const with braces',
    sandbox(`const g = (x) => { return x + 1; };`, ['g']).g(1) === 2);
  /* a missing name must throw rather than silently return nothing */
  let threw = false;
  try { extract('const a = 1;', 'nope'); } catch (e) { threw = true; }
  t.ok('harness: unknown name throws', threw);
}
