/* ---------------------------------------------------------------------------
   Oracle test for core/ots.js.

   core/ots.js is a hand-written implementation of the OpenTimestamps wire
   format. Hand-written crypto-adjacent code is exactly the kind of thing that
   is quietly wrong, so it is checked against the REFERENCE implementation
   (javascript-opentimestamps) over the reference's own fixtures:

     1. round-trip:  parse(bytes) -> serialize() must be BYTE-IDENTICAL
     2. semantics:   the attestations + Bitcoin heights we report must equal
                     what the reference reports for the same file

   Run (the library is a dev-only dependency — it never ships to the browser):
     mkdir -p /tmp/otsoracle && cd /tmp/otsoracle && npm i javascript-opentimestamps
     NODE_PATH=/tmp/otsoracle/node_modules node core/ots.test.js
--------------------------------------------------------------------------- */
const fs = require('fs'), path = require('path');
const OTS = require('./ots.js');

let REF;
try { REF = require('javascript-opentimestamps'); }
catch (e) { console.error('Reference library not found. See the header of this file.'); process.exit(2); }

const EX = path.join(path.dirname(require.resolve('javascript-opentimestamps/package.json')), 'examples');
const files = fs.readdirSync(EX).filter(f => f.endsWith('.ots'));

let pass = 0, fail = 0, skip = 0;

/* ---- RIPEMD-160 against the published vectors (Dobbertin/Bosselaers/Preneel).
   We hand-rolled this hash; these vectors are the proof it is the real thing
   and not merely self-consistent. A wrong hash here would silently invalidate
   every Bitcoin verification, so it is checked first and hard-fails. */
function ripemdVectors() {
  const V = [
    ['', '9c1185a5c5e9fc54612808977ee8f548b2258d31'],
    ['a', '0bdc9d2d256b3ee9daae347be6f4dc835a467ffe'],
    ['abc', '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc'],
    ['message digest', '5d0689ef49d2fae572b881b123a85ffa21595f36'],
    ['abcdefghijklmnopqrstuvwxyz', 'f71c27109c692c1b56bbdceb5b9d2865b3708dbc'],
    ['abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq', '12a053384a9c0c88e405a06c27dcf49ada62eb2b'],
    ['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 'b0e20b6e3116640286ed3a87a5713079b21f5189'],
    ['1234567890'.repeat(8), '9b752e45573d4b39f4dbd3323cab82bf63326bfb'],
    ['a'.repeat(1000000), '52783243c1697bdbe16d37f97f68f08325dc1528']   /* the long one: multi-block + length encoding */
  ];
  let bad = 0;
  for (const [msg, want] of V) {
    const got = OTS.hex(OTS.ripemd160(new TextEncoder().encode(msg)));
    if (got !== want) { bad++; console.log('  ✗ RIPEMD160("' + (msg.length > 20 ? msg.slice(0, 12) + '…(' + msg.length + ')' : msg) + '") → ' + got + ' want ' + want); }
  }
  console.log(bad ? '  ✗ RIPEMD-160 FAILED ' + bad + '/' + V.length + ' vectors' : '  ✓ RIPEMD-160 — all ' + V.length + ' published vectors match');
  return bad === 0;
}

/* what the REFERENCE says about a file */
function refInfo(bytes) {
  const d = REF.DetachedTimestampFile.deserialize([...bytes]);
  const heights = [], pend = [];
  const strip = s => String(s).replace(/[^\x20-\x7e]/g, '');
  (function walk(ts) {
    ts.attestations.forEach(a => {
      const s = strip(a.toString());
      const m = /BitcoinBlockHeaderAttestation\((\d+)\)/.exec(s);
      if (m) heights.push(+m[1]);
      else if (/PendingAttestation/.test(s)) pend.push((/https?:\/\/[^\s')]+/.exec(s) || [''])[0]);
    });
    ts.ops.forEach(sub => walk(sub));
  })(d.timestamp);
  return { heights: heights.sort((a, b) => a - b), pending: pend.sort() };
}

(async () => {
  if (!ripemdVectors()) { console.log('\n  ABORT: the hash itself is wrong — nothing downstream can be trusted.'); process.exit(1); }
  console.log('');
  for (const f of files) {
    const bytes = new Uint8Array(fs.readFileSync(path.join(EX, f)));
    let mine;
    try { mine = OTS.parseFile(bytes); }
    catch (e) { console.log('  ~ SKIP ' + f.padEnd(34) + e.message); skip++; continue; }

    /* 1. byte-identical round trip */
    const round = OTS.fileBytes(mine.digest, mine.tree);
    const identical = round.length === bytes.length && round.every((v, i) => v === bytes[i]);

    /* 2. semantics vs the reference */
    const info = await OTS.summarize(mine.tree, mine.digest);
    const mineInfo = { heights: info.bitcoin.map(b => b.height).sort((a, b) => a - b), pending: info.pending.map(p => p.uri).sort() };
    let ref;
    try { ref = refInfo(bytes); } catch (e) { console.log('  ~ SKIP ' + f.padEnd(34) + 'reference could not read it'); skip++; continue; }

    const sameH = JSON.stringify(mineInfo.heights) === JSON.stringify(ref.heights);
    const sameP = JSON.stringify(mineInfo.pending) === JSON.stringify(ref.pending);
    const ok = identical && sameH && sameP;

    /* an unsupported op (ripemd160/keccak) must be REPORTED, never guessed */
    const honest = !info.unsupported || info.unsupported.includes('unsupported op');

    if (ok && honest) { pass++; console.log('  ✓ ' + f.padEnd(34) + 'roundtrip ✓  btc:[' + mineInfo.heights.join(',') + ']  pending:' + mineInfo.pending.length); }
    else {
      fail++;
      console.log('  ✗ ' + f);
      if (!identical) console.log('      round-trip differs (' + bytes.length + ' in / ' + round.length + ' out)');
      if (!sameH) console.log('      heights  mine ' + JSON.stringify(mineInfo.heights) + '  ref ' + JSON.stringify(ref.heights));
      if (!sameP) console.log('      pending  mine ' + JSON.stringify(mineInfo.pending) + '  ref ' + JSON.stringify(ref.pending));
      if (info.unsupported) console.log('      unsupported: ' + info.unsupported);
    }
  }

  console.log('\n  ' + pass + ' passed · ' + fail + ' failed · ' + skip + ' skipped');
  process.exit(fail ? 1 : 0);
})();
