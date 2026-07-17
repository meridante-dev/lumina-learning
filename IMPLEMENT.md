# Implementation runbook — the four open steps

_Written 2026-07-17. Live state: EdenRise `v=edr77`, Belong `v=bel5`._
_Order matters: step 1 unlocks the value already built; 2–4 build on it._
_Legend: 🧑 = only you can do it · 🤖 = Claude does it · ⏱ = rough wall-clock._

---

## Step 1 · Deploy the Firestore rules — ✅ DONE (2026-07-17, ruleset 794135b1, released 10:33Z)

> **Verified live:** the released ruleset contains the events/anchors blocks, and 19/19 simulated
> rule tests pass via the Firebase rules test API — 8 ledger (create ✓, update/delete/cross-read/
> anonymous all denied) + 11 tenancy (no regression: own-doc read/write, super read, config/org
> tenant isolation, leaderboard own-row-only, public forum/leaderboard reads).
> Server-side counts at deploy time: **0 events / 0 anchors** — correct, since the rules went live
> at 10:33 and no signed-in learner has been active since. Populates on the next module completion.

<details><summary>original instructions (kept for reference)</summary>


**Why this is first:** all the server-truth code is already live in production and running on
every sync — but it hits `permission-denied`, catches it, and quietly waits. The ledger is
therefore still *client-held*. This deploy is the single switch that makes it server-true.
Nothing else on this list matters as much.

The CLI is currently logged out (verified: `Authentication Error: Your credentials are no
longer valid`). Run, from anywhere:

```bash
cd ~/Workflows/lumina-prototype
firebase login --reauth
```

A browser opens → pick the Google account that owns **edenrise-academy** → allow.

**Then deploy. The `--project` flag is NOT optional** — the global alias points at a different
project (`caa-africa`), and without the flag you would push EdenRise's rules onto it:

```bash
firebase deploy --only firestore:rules --project edenrise-academy
```

Expected tail: `✔ Deploy complete!`

### Verify it actually took (don't trust the CLI's word)

1. Console → https://console.firebase.google.com/project/edenrise-academy/firestore/rules —
   confirm you see the `match /events/{eventId}` and `match /anchors/{anchorId}` blocks with
   `allow update, delete: if false;`.
2. Real end-to-end check: open https://academy.edenrise.com, sign in, complete any module,
   then in Firestore → Data → `users/{your-uid}/events` — documents should appear, each with a
   `recordedAt` set by the **server**, plus one doc under `anchors`.
3. Prove immutability: in the console, try to edit a field on an `events` doc and save. It must
   be **refused**. (The console writes as an admin, so it *will* succeed there — the correct
   test is the client. Simpler proof: in the browser console on the live site, a `setDoc` to an
   existing event returns `permission-denied`.)

**What if events don't appear:** the cursor is per-device at
`localStorage['eden-ledger-synced-<uid>']`. It only advances on success, so nothing is ever
lost — but a device that already had a stuck cursor will retry from the right place on the next
flush. Force one by completing a module. If still empty, check the browser console for the
Firestore error code and send it to me.

**Rollback:** rules are versioned in the Firebase console (Rules → history) — one click to
restore the previous set. The app tolerates either state, so a rollback breaks nothing.

> ⚠️ **Note this deploy also ships the Phase-5 multi-tenancy rules**, which have been written
> and untested-in-prod for a while. That's the one real risk in this step. After deploying,
> click through as (a) a normal EdenRise learner and (b) a super-admin (info@edenrise.com) and
> confirm the Admin + Analytics pages still load. If tenancy rules misbehave, roll back and
> tell me — I'll split the two rule sets into separate deploys.

</details>

---

## Step 2 · OpenTimestamps anchoring 🤖 ⏱ ~half a day

**What it buys:** today the record is provable against *our database*. After this, each chain
head is provable against the **Bitcoin blockchain** — no trust in EdenRise required at all.
This is the strongest version of the claim we already sell, and it's free.

**Why it's genuinely worth it:** it converts "trust our server timestamps" into "check it
yourself against a public ledger" — the thing no incumbent (Docebo, 360Learning, LearnWorlds)
can say. It's also the last rung where we can *increase* the claim without adding a vendor.

**How it works:** the [JS library](https://github.com/opentimestamps/javascript-opentimestamps)
submits the head hash to free public calendar servers, which return a `.ots` proof. The proof
is *incomplete* for ~1–2 hours until the Bitcoin block confirms, then upgrades to a complete
proof. Free, no keys, no account.

Plan:
1. Vendor the OTS bundle into `core/vendor/` (no CDN — keeps the zero-dependency promise and
   the CSP clean).
2. On anchor creation, submit `head.hash` → store the returned `.ots` bytes (base64) on the
   anchor doc as `otsProof`, plus `otsStatus: 'pending'`.
3. A lazy upgrade pass on next sign-in: for pending anchors older than ~2h, ask the calendar to
   upgrade → store the complete proof → `otsStatus: 'confirmed'` + `btcBlock`.
4. Include the proof in the evidence export.
5. Teach `verify.html` to verify it — **and to be honest about the three states**: no proof /
   pending / confirmed-in-Bitcoin-block-N.
6. Update BENCHMARK.md's ladder to mark tier 2 shipped.

**Honest caveat I'd want you to know:** this proves a record *existed at a time*. It does not
prove it's *true*. Sales copy must say "provably not back-dated", never "provably real".

**Blocked by:** step 1 (anchors need to exist server-side first).

---

## Step 3 · Manager-confirm on application check-ins 🤖 ⏱ ~2–3 hours

**What it buys:** right now the application rate is *self-reported* — a learner says "I applied
it". That's a soft L3. One tap from a manager turns it into confirmed evidence, which is what
makes "% applied on the job" defensible in front of an auditor or a buyer.

Plan:
1. When a learner logs `application_checkin` with `applied: true`, surface it in the manager's
   team view as a pending confirmation row (learner · course · their commitment text · date).
2. Manager taps **Confirm** / **Didn't see it** → writes a `application_confirmed` ledger event
   **on the learner's chain**, carrying `by: <manager uid>`.
3. Split the metric into **self-reported** vs **confirmed** everywhere it appears. Never merge
   them into one number.
4. Evidence export + verifier show the confirmer.

**One design question I need your call on:** a manager writing to a learner's chain means the
learner's ledger has a second author. The clean fix is a *separate* manager chain per learner
that references learner event hashes, rather than appending into theirs. It's slightly more
work and much more defensible. **I'd recommend the separate chain** — tell me if you disagree
and I'll do the simple version.

**Blocked by:** nothing. Can run in parallel with step 2.

---

## Step 4 · Cloudflare Pages migration 🧑 + 🤖 ⏱ ~1–2 hours, mostly waiting on DNS

**What it buys:** kills the two problems that will otherwise get worse with every client:
- **Core drift.** `core/` is currently *copied* into each brand repo and hand-synced (4× so
  far). Every client added multiplies the copies. One deploy serving many domains ends this.
- **GitHub Pages queue roulette.** We've already lost time to a Pages outage and stuck builds.

It also unlocks Workers, which is the prerequisite for RFC-3161 timestamping (tier 3) and for
any future server-side work (webhooks, SSO, an AI proxy that hides API keys).

**Do this when you add client #3**, or sooner if a Belong sync bites us again. It's the right
move but it is not urgent, and it touches live DNS — so it should be a calm, deliberate hour,
not a squeezed-in one.

Plan:
1. 🤖 Restructure to one repo, many brands (the `brands/<id>/` layout already supports this —
   it was designed for exactly this migration).
2. 🧑 Connect the repo in the Cloudflare dashboard (needs your account + a git authorization).
3. 🤖 Brand routing is already hostname-based (`location.hostname` → brand, `?brand=` override),
   so multi-domain works with no code change.
4. 🧑 DNS: point `academy.edenrise.com` at Cloudflare. **This is the one genuinely risky move on
   the list** — do it with a low TTL set beforehand, and keep GitHub Pages live until the new
   host is verified serving the right version. Rollback = revert the DNS record.
5. Verify each domain serves its own brand, then retire the duplicated `core/`.

**Ordering note:** do this *after* step 1. Deploying rules to a moving target is avoidable pain.

---

## The honest short version

- **Step 1 is the only one that matters today.** ~3 minutes of your time turns a built-but-
  dormant system on. Everything else is an enhancement to something that already works.
- **Steps 2 and 3 are mine** — say go and they're done; they need no decision from you except
  the manager-chain question in step 3.
- **Step 4 is a "when it hurts" job**, not a today job.
