/* ---------------------------------------------------------------------------
   ots.js — OpenTimestamps, the small honest subset.

   WHY THIS EXISTS (and isn't the npm package): javascript-opentimestamps is a
   Node library — 33 MB installed, require('fs'), and it does not bundle for a
   browser without a pile of shims. This app is zero-dependency vanilla by
   design, so we implement the wire format directly. It is ~250 lines because
   we only need the subset that matters:
      stamp a 32-byte digest → store the proof → upgrade it → verify it.

   CORRECTNESS: this file is not trusted on faith. `core/ots.test.js` runs it
   against the real javascript-opentimestamps library as an ORACLE over the
   library's own fixtures — parse → re-serialize must be byte-identical, and
   the attestations/heights we report must match what the reference reports.

   The proofs produced here are STRUCTURALLY STANDARD: digest --append(nonce)-->
   --sha256--> calendar timestamp, wrapped in the normal detached-file header.
   That means an exported .ots verifies with the official `ots verify` CLI and
   on opentimestamps.org — the point of the exercise is that nobody has to
   trust us, including about our own timestamp code.

   WHAT AN OTS PROOF PROVES: that this exact digest EXISTED at/before a given
   Bitcoin block. It says nothing about whether the underlying claim is true.
   "Provably not back-dated" is honest. "Provably real" is not. --------------- */
(function (root) {
  'use strict';

  /* ---- bytes ---------------------------------------------------------- */
  const hex = b => Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
  const unhex = s => new Uint8Array(s.match(/../g).map(h => parseInt(h, 16)));
  const cat = (...a) => { const n = a.reduce((s, x) => s + x.length, 0), o = new Uint8Array(n); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
  const eq = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  const sha256 = async m => new Uint8Array(await crypto.subtle.digest('SHA-256', m));
  const sha1   = async m => new Uint8Array(await crypto.subtle.digest('SHA-1', m));

  /* ---- RIPEMD-160 ------------------------------------------------------
     WebCrypto has no RIPEMD-160, but real Bitcoin-confirmed OTS proofs use it
     (3 of the reference library's own fixtures do), so "unsupported" would
     mean "cannot verify genuine proofs". It is a fixed, fully-specified 1996
     hash — implemented here and checked against the published test vectors in
     core/ots.test.js, so it is verified rather than merely believed. */
  const RL = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15, 7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8, 3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12, 1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2, 4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13];
  const RR = [5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12, 6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2, 15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13, 8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14, 12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11];
  const SL = [11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8, 7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12, 11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5, 11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12, 9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6];
  const SR = [8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6, 9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11, 9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5, 15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8, 8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11];
  const KL = [0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e];
  const KR = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000];
  const rol = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0;
  function rmdF(j, x, y, z) {
    if (j < 16) return (x ^ y ^ z) >>> 0;
    if (j < 32) return ((x & y) | (~x & z)) >>> 0;
    if (j < 48) return ((x | ~y) ^ z) >>> 0;
    if (j < 64) return ((x & z) | (y & ~z)) >>> 0;
    return (x ^ (y | ~z)) >>> 0;
  }
  function ripemd160(msg) {
    const len = msg.length, pad = ((len % 64) < 56 ? 56 : 120) - (len % 64);
    const buf = new Uint8Array(len + pad + 8);
    buf.set(msg); buf[len] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(buf.length - 8, (len << 3) >>> 0, true);
    dv.setUint32(buf.length - 4, Math.floor(len / 536870912), true);
    let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
    for (let b = 0; b < buf.length; b += 64) {
      const X = []; for (let i = 0; i < 16; i++) X.push(dv.getUint32(b + i * 4, true));
      let al = h0, bl = h1, cl = h2, dl = h3, el = h4, ar = h0, br = h1, cr = h2, dr = h3, er = h4;
      for (let j = 0; j < 80; j++) {
        const r = (j / 16) | 0;
        let t = (al + rmdF(j, bl, cl, dl) + X[RL[j]] + KL[r]) >>> 0;
        t = (rol(t, SL[j]) + el) >>> 0;
        al = el; el = dl; dl = rol(cl, 10); cl = bl; bl = t;
        t = (ar + rmdF(79 - j, br, cr, dr) + X[RR[j]] + KR[r]) >>> 0;
        t = (rol(t, SR[j]) + er) >>> 0;
        ar = er; er = dr; dr = rol(cr, 10); cr = br; br = t;
      }
      const t = (h1 + cl + dr) >>> 0;
      h1 = (h2 + dl + er) >>> 0; h2 = (h3 + el + ar) >>> 0;
      h3 = (h4 + al + br) >>> 0; h4 = (h0 + bl + cr) >>> 0; h0 = t;
    }
    const out = new Uint8Array(20), ov = new DataView(out.buffer);
    [h0, h1, h2, h3, h4].forEach((h, i) => ov.setUint32(i * 4, h >>> 0, true));
    return out;
  }

  /* ---- op + attestation tags (from the reference implementation) ------- */
  const OP = { SHA1: 0x02, RIPEMD160: 0x03, SHA256: 0x08, KECCAK256: 0x67, APPEND: 0xf0, PREPEND: 0xf1, REVERSE: 0xf2, HEXLIFY: 0xf3 };
  const BINARY = new Set([OP.APPEND, OP.PREPEND]);
  const TAG_PENDING = new Uint8Array([0x83, 0xdf, 0xe3, 0x0d, 0x2e, 0xf9, 0x0c, 0x8e]);
  const TAG_BITCOIN = new Uint8Array([0x05, 0x88, 0x96, 0x0d, 0x73, 0xd7, 0x19, 0x01]);
  const HEADER_MAGIC = new Uint8Array([0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00, 0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94]);

  /* ---- reader / writer (varuint is LEB128) ----------------------------- */
  function Reader(b) { this.b = b; this.i = 0; }
  Reader.prototype.byte = function () { if (this.i >= this.b.length) throw new Error('ots: truncated'); return this.b[this.i++]; };
  Reader.prototype.bytes = function (n) { if (this.i + n > this.b.length) throw new Error('ots: truncated'); return this.b.slice(this.i, this.i += n); };
  Reader.prototype.varuint = function () { let v = 0, s = 0, x; do { x = this.byte(); v += (x & 0x7f) * Math.pow(2, s); s += 7; } while (x & 0x80); return v; };
  Reader.prototype.varbytes = function () { return this.bytes(this.varuint()); };
  Reader.prototype.done = function () { return this.i >= this.b.length; };

  function Writer() { this.a = []; }
  Writer.prototype.byte = function (v) { this.a.push(v & 0xff); return this; };
  Writer.prototype.bytes = function (b) { for (const v of b) this.a.push(v); return this; };
  Writer.prototype.varuint = function (v) { do { let x = v % 128; v = Math.floor(v / 128); if (v) x |= 0x80; this.a.push(x); } while (v); return this; };
  Writer.prototype.varbytes = function (b) { this.varuint(b.length); return this.bytes(b); };
  Writer.prototype.out = function () { return new Uint8Array(this.a); };

  /* ---- attestations ---------------------------------------------------- */
  function readAttestation(r) {
    const tag = r.bytes(8), payload = r.varbytes(), p = new Reader(payload);
    if (eq(tag, TAG_PENDING)) return { type: 'pending', uri: new TextDecoder().decode(p.varbytes()) };
    if (eq(tag, TAG_BITCOIN)) return { type: 'bitcoin', height: p.varuint() };
    return { type: 'unknown', tag, payload };
  }
  function writeAttestation(w, a) {
    if (a.type === 'pending') { const p = new Writer().varbytes(new TextEncoder().encode(a.uri)).out(); w.bytes(TAG_PENDING).varbytes(p); }
    else if (a.type === 'bitcoin') { const p = new Writer().varuint(a.height).out(); w.bytes(TAG_BITCOIN).varbytes(p); }
    else w.bytes(a.tag).varbytes(a.payload);
  }
  /* Attestations serialize sorted by (tag, payload) — reproduce that order so
     re-serialization is byte-identical to the reference. */
  function attBytes(a) { const w = new Writer(); writeAttestation(w, a); return w.out(); }
  function attCmp(a, b) { const x = attBytes(a), y = attBytes(b); for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length; }

  /* ---- timestamp tree: parse / serialize ------------------------------
     A node is { atts: [...], ops: [ {tag, arg?, child} ] }. Messages are NOT
     computed here — the byte format is self-delimiting, so parsing stays sync
     and total. Hashing happens in walk(), which is where an unsupported op can
     fail loudly instead of silently producing a wrong answer. */
  function parseNode(r) {
    const node = { atts: [], ops: [] };
    const one = t => {
      if (t === 0x00) node.atts.push(readAttestation(r));
      else {
        const op = { tag: t };
        if (BINARY.has(t)) op.arg = r.varbytes();
        op.child = parseNode(r);
        node.ops.push(op);
      }
    };
    let tag = r.byte();
    while (tag === 0xff) { one(r.byte()); tag = r.byte(); }
    one(tag);
    return node;
  }
  function serializeNode(w, node) {
    const atts = node.atts.slice().sort(attCmp);
    for (let i = 0; i < atts.length - 1; i++) { w.bytes([0xff, 0x00]); writeAttestation(w, atts[i]); }
    if (!node.ops.length) {
      if (atts.length) { w.byte(0x00); writeAttestation(w, atts[atts.length - 1]); }
    } else {
      if (atts.length) { w.bytes([0xff, 0x00]); writeAttestation(w, atts[atts.length - 1]); }
      node.ops.forEach((op, i) => {
        if (i < node.ops.length - 1) w.byte(0xff);
        w.byte(op.tag);
        if (BINARY.has(op.tag)) w.varbytes(op.arg);
        serializeNode(w, op.child);
      });
    }
  }

  /* ---- apply one op ---------------------------------------------------- */
  async function applyOp(op, msg) {
    switch (op.tag) {
      case OP.APPEND:  return cat(msg, op.arg);
      case OP.PREPEND: return cat(op.arg, msg);
      case OP.REVERSE: return msg.slice().reverse();
      case OP.HEXLIFY: return new TextEncoder().encode(hex(msg));
      case OP.SHA256:  return sha256(msg);
      case OP.SHA1:    return sha1(msg);
      case OP.RIPEMD160: return ripemd160(msg);
      /* KECCAK256 is only ever on an Ethereum attestation path, which we do not
         claim to verify. Refusing is the honest answer — but see walk(): one
         unverifiable branch must not blind us to a Bitcoin branch beside it. */
      default: throw new Error('ots: unsupported op 0x' + op.tag.toString(16));
    }
  }

  /* ---- walk: yields every (node, msg) ---------------------------------
     Fault-ISOLATED per branch. A proof can commit to several chains at once;
     an op we cannot compute (e.g. Ethereum's keccak) must fail only its own
     branch. Aborting the whole walk would make us report "no Bitcoin proof"
     for a proof that HAS one — silently understating the evidence. */
  async function walk(node, msg, visit, onError) {
    await visit(node, msg);
    for (const op of node.ops) {
      let next;
      try { next = await applyOp(op, msg); }
      catch (e) { if (onError) onError(e); continue; }
      await walk(op.child, next, visit, onError);
    }
  }

  /* ---- what does this proof currently say? ----------------------------- */
  async function summarize(tree, digest) {
    const pending = [], bitcoin = [], skipped = [];
    await walk(tree, digest, (node, msg) => {
      for (const a of node.atts) {
        if (a.type === 'pending') pending.push({ uri: a.uri, commitment: hex(msg) });
        if (a.type === 'bitcoin') bitcoin.push({ height: a.height, merkleRoot: hex(msg) });
      }
    }, e => skipped.push(e.message));
    return { pending, bitcoin, skipped, unsupported: skipped[0] || null, complete: bitcoin.length > 0 };
  }

  /* ---- merge an upgraded subtree at a matching commitment --------------- */
  async function mergeAt(tree, digest, commitmentHex, upgraded) {
    let merged = false;
    await walk(tree, digest, (node, msg) => {
      if (merged || hex(msg) !== commitmentHex) return;
      node.ops.push(...upgraded.ops);
      for (const a of upgraded.atts) if (a.type !== 'pending') node.atts.push(a);
      merged = true;
    });
    return merged;
  }

  /* ---- detached .ots file (what `ots verify` eats) ---------------------- */
  function fileBytes(digest, tree) {
    const w = new Writer();
    w.bytes(HEADER_MAGIC).varuint(1).byte(OP.SHA256).bytes(digest);
    serializeNode(w, tree);
    return w.out();
  }
  function parseFile(bytes) {
    const r = new Reader(bytes);
    const magic = r.bytes(HEADER_MAGIC.length);
    if (!eq(magic, HEADER_MAGIC)) throw new Error('ots: not a detached proof file');
    r.varuint();                       /* version */
    const op = r.byte();
    if (op !== OP.SHA256) throw new Error('ots: unsupported file hash op');
    const digest = r.bytes(32);
    return { digest, tree: parseNode(r) };
  }

  /* ---- calendars ------------------------------------------------------- */
  const CALENDARS = ['https://a.pool.opentimestamps.org', 'https://b.pool.opentimestamps.org', 'https://finney.calendar.eternitywall.com'];

  /* Stamp a digest. Standard shape: digest --APPEND(nonce)--> --SHA256-->
     commitment, and only the COMMITMENT goes to the calendars — never the
     digest itself. The nonce keeps a learner's ledger head private from a
     third-party calendar operator, which is the same reason upstream does it. */
  async function stamp(digest, opts) {
    const o = opts || {};
    const nonce = crypto.getRandomValues(new Uint8Array(16));
    const commitment = await sha256(cat(digest, nonce));
    const results = await Promise.all(CALENDARS.map(async url => {
      try {
        const res = await fetch(url + '/digest', {
          method: 'POST', body: commitment,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          signal: o.signal
        });
        if (!res.ok) return null;
        return parseNode(new Reader(new Uint8Array(await res.arrayBuffer())));
      } catch (e) { return null; }
    }));
    const live = results.filter(Boolean);
    if (!live.length) throw new Error('ots: no calendar reachable');
    /* one shared node for the commitment, carrying every calendar's path */
    const cnode = { atts: [], ops: [] };
    for (const t of live) { cnode.atts.push(...t.atts); cnode.ops.push(...t.ops); }
    const tree = { atts: [], ops: [{ tag: OP.APPEND, arg: nonce, child: { atts: [], ops: [{ tag: OP.SHA256, child: cnode }] } }] };
    return { tree, calendars: live.length };
  }

  /* Ask each calendar whether its pending commitment made it into Bitcoin. */
  async function upgrade(tree, digest, opts) {
    const o = opts || {};
    const info = await summarize(tree, digest);
    let changed = false;
    for (const p of info.pending) {
      try {
        const res = await fetch(p.uri.replace(/\/$/, '') + '/timestamp/' + p.commitment, { signal: o.signal });
        if (!res.ok) continue;                       /* 404 = not in a block yet */
        const up = parseNode(new Reader(new Uint8Array(await res.arrayBuffer())));
        if (await mergeAt(tree, digest, p.commitment, up)) changed = true;
      } catch (e) { /* calendar down → try again next time */ }
    }
    return { changed, info: await summarize(tree, digest) };
  }

  /* Verify against Bitcoin itself. We compute the block's merkle root from the
     proof, then ask a block explorer what that block's merkle root actually is.
     The explorer is a CONVENIENCE, not a trust root: anyone can re-run this
     against their own node, and the check is stated in the export. */
  const EXPLORERS = ['https://blockstream.info/api', 'https://mempool.space/api'];
  async function verifyBitcoin(att, opts) {
    const o = opts || {};
    for (const api of (o.explorers || EXPLORERS)) {
      try {
        const h = await (await fetch(api + '/block-height/' + att.height, { signal: o.signal })).text();
        if (!/^[0-9a-f]{64}$/i.test(h.trim())) continue;
        const blk = await (await fetch(api + '/block/' + h.trim(), { signal: o.signal })).json();
        /* explorers show hashes reversed (display order); the proof computes
           internal order — reverse ours before comparing. */
        const computed = hex(unhex(att.merkleRoot).reverse());
        return { ok: computed === String(blk.merkle_root).toLowerCase(), height: att.height, block: h.trim(), time: blk.timestamp, source: api, computed, actual: blk.merkle_root };
      } catch (e) { /* try the next explorer */ }
    }
    return { ok: null, height: att.height, reason: 'no explorer reachable' };
  }

  const API = { hex, unhex, sha256, ripemd160, stamp, upgrade, summarize, parseNode, serializeNode, parseFile, fileBytes, verifyBitcoin, Reader, Writer, OP,
    serialize(tree) { const w = new Writer(); serializeNode(w, tree); return w.out(); },
    parse(bytes) { return parseNode(new Reader(bytes)); } };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.OTS = API;
})(typeof self !== 'undefined' ? self : globalThis);
