# Lumina — Sellability & Scalability Audit (the honest one)

_2026-07-24 · Fable-window brain-pass. Companion to BENCHMARK.md (market position) and IMPLEMENT.md
(engineering runbook). This is the commercial gap map: what stands between "impressive engine" and
"product a stranger pays for monthly." 9 days to EU AI Act Art.4 enforcement (2 Aug 2026)._

---

## Verdict

**You have a differentiated product engine that is not yet a sellable product.** The differentiation is
real and — unusually — *verified*: tamper-evident, Bitcoin-anchored, vendor-independently-checkable
learning records + manager-confirmed application + native PT-40h/Art.4 artifacts, none of which Docebo,
360Learning, or LearnWorlds ship (BENCHMARK.md). The engine is productized (core/brands split, two live
instances, provisioning proven at Belong). What's missing is almost entirely **commercial scaffolding and
proof-of-life**: zero paying customers, zero production evidence events, no legal wrapper, no billing, no
SLA-able hosting, and a flagship course whose #1 engagement mechanic misfires. None of these are
months of work. Most are days. But they are the difference between demo and product.

**The one asymmetric asset with a clock on it:** Art.4 enforcement lands in 9 days. Every EU company
using AI owes documented AI-literacy training, and almost none have it. You own a turnkey answer with a
provable record. This window is the cheapest customer-acquisition story you will ever have — and it is
perishable as a *novelty hook* even though the obligation persists.

---

## What you actually have (assets, verified this month)

1. **The evidence moat** — 3 rungs live, all tested: server-true append-only ledger (19/19 rules tests),
   OpenTimestamps Bitcoin anchoring (oracle-tested vs the reference implementation, real blocks verified),
   manager-confirm separate chain (10/10 rules tests). No incumbent has any rung.
2. **Productized white-label** — one core, per-brand config; Belong stood up on its own Firebase in
   ~1 day including an honest "preview mode" degradation state. The funnel works.
3. **Compliance artifacts** — PT 40h (art. 131.º) + Art.4 evidence pack, EN/PT, generated from real data.
4. **A benchmarked price gap** — €299–499/mo flat sits 5–10× under Docebo with more compliance capability.
5. **A research loop** (~/academy-intel-loop) that already ranks build directions by completion impact,
   plus a live NGO-funding study (Codex) covering a second market.

## The liabilities nobody should varnish

1. **Zero proof-of-life.** 6 users, 0 server-side evidence events, the live Belong signup→module→
   server-event loop still unproven end-to-end. You sell *provable learning* and cannot yet show one
   production-proven record. This is the single most important gap and it costs ~an afternoon with the
   EdenRise Land Team.
2. **The compliance claim is legally unsigned.** Every artifact says "em validação jurídica." You cannot
   charge for a compliance product whose legal wording no lawyer has confirmed. Lawyer sign-off is *the*
   critical-path item — everything Art.4 waits on it.
3. **Engagement lags the moat.** The #1-ranked completion mechanic (in-video checks) is dead on 21/24
   EdenRise courses and would ask off-topic questions on the 19-video flagship; Belong's 6 courses have
   **zero video**. A buyer renews for completion rates, not for cryptography.
4. **Hosting is not contract-grade.** GitHub Pages is not intended for commercial SaaS hosting and
   carries no SLA; Firebase Spark quotas are pilot-scale. Fine for now; not defensible in a paid contract.
   The planned Cloudflare migration (IMPLEMENT.md step 4) fixes both *and* kills the 2-repo core-drift
   tax (5+ hand-syncs already; per-deploy `isSuper()` divergence protected only by a comment).
5. **No commercial wrapper at all** (verified today): no ToS, privacy policy, DPA, order form, pricing
   page, invoice flow, support channel, status page, or onboarding SOP beyond GO-LIVE.md's seed.
6. **Bus factor = 1** (João + AI). Mitigation is SOPs, not headcount — the GO-LIVE.md pattern applied to
   every recurring operation.

---

## Gap map

### A. BUILD (product) — ~2–3 weeks of work total, sequenced
| Gap | Why it matters | Size |
|---|---|---|
| Flagship checkpoint questions (19 modules) + never-gate-on-generic guard | Turns on the #1 completion mechanic where the only real video is; feeds evidence real retrieval events | 1–2 d content + hrs code |
| Belong course video wiring | Client is live but not teaching; blocks their launch | hrs (client must supply IDs) |
| Prove the loop in prod (1 signup, 1 module, server event + anchor) | The demo-able proof of the entire moat | 1 h |
| Per-brand default `companyId` (Belong learners stamped "edenrise") | Cosmetic now, wrong in a sold product; leaks founding-tenant naming | hrs |
| Cloudflare Pages migration (one deploy → many domains) + Blaze w/ budget alerts | Contract-grade hosting, kills core drift, unlocks Workers (RFC-3161, webhooks) | 1–2 d |
| Org-level data export + documented backup/restore | B2B buyers and GDPR both ask; you already export per-learner | 1 d |
| Error observability (even minimal client error beacon → one dashboard) | You currently learn about breakage from hanka's WhatsApp | hrs |
| AI-tutor cost policy per tenant (client key vs metered) | Unpriced marginal cost hiding in the tutor | decision + hrs |

### B. SHIP (packaging) — the actual product wrapper
1. **Legal pack** (lawyer): ToS, privacy, **DPA** (processor role, EU regions), order form, and sign-off
   on the 40h/Art.4 artifact wording. Without this there is no invoice-able product. *~1 week external.*
2. **Pricing, committed:** €399/mo flat per instance + €1,500 setup (white-label, domain, seeded
   content, compliance pack). Founding-pilot variant: €199/mo locked 12 months for 3 clients in exchange
   for case-study rights + logo. Annual = 2 months free. NGO tier: wait for the Codex study.
3. **The demo tenant** — a seeded, fictional-brand instance with realistic learners, one completed
   evidence journey, and the verifier: the 10-minute sales walkthrough that needs no live client's data.
4. **Buyer-facing collateral:** BENCHMARK.md rewritten as a 1-page "provable learning" PDF + an Art.4
   readiness one-pager (PT) — the Meridante lead engine already has somewhere to send them.
5. **Case study #1 = EdenRise** — requires liability #1 fixed (real Land-Team usage) to have numbers.
6. **Support definition:** a support email + 48h response promise + a status page. Small, but it's what
   "product" means to a buyer.

### C. PROCESS (operating model)
1. **Provisioning SOP:** GO-LIVE.md generalized to a checklist with a target: *new client live in <1 day,
   <2h of human time.* Measure it on client #3.
2. **Core-sync discipline until Cloudflare lands:** every sync PR checks the per-deploy list
   (isSuper emails, brand config) — automate the check, don't trust the comment.
3. **Weekly ops cadence:** completion rate + evidence-event count per instance reviewed weekly (the
   north star is completion; it is currently reviewed never).
4. **Billing:** manual first — Moloni invoice + SEPA/transfer. Stripe only when >5 clients.
5. **The intel loop stays the R&D engine** — its QUEUE already ranks by completion impact; keep shipping
   from the top.

---

## Critical path (sequenced, with the Art.4 clock)

**Days 0–9 (to 2 Aug):** lawyer engagement on artifact wording + legal pack ⭢ EdenRise Land Team
activated (proof-of-life + first case-study data) ⭢ flagship checkpoint questions ⭢ Art.4 one-pager out
through Meridante's lead engine (pitch: "be ready + documented", never fear-mongering) ⭢ Belong videos
requested from client.
**Days 10–30:** Cloudflare migration + Blaze ⭢ demo tenant ⭢ pricing page on meridante.ai ⭢ ToS/DPA
finalized ⭢ first 2 pilot conversations from Art.4 outreach ⭢ org export + error beacon.
**Days 31–90:** 3 founding pilots signed ⭢ EdenRise case study with completion + verified-competency
numbers ⭢ provisioning SOP timed on a real client ⭢ NGO go/no-go from the Codex study ⭢ revisit pricing
with n=real.

**Gates (kill/narrow criteria):** if by day 90 there are not (a) ≥3 paying pilots, (b) one instance with
weekly-active learners, and (c) a signed-off legal pack — narrow the product: sell the **Art.4/40h
evidence pack as a standalone compliance tool** (the moat without the LMS), which has a shorter sales
cycle and the same differentiator.

## Decisions only João can make
1. **Beachhead:** PT SMEs via Meridante (recommended — the machine exists) vs NGO track — don't run both
   until the Codex study lands.
2. **Price:** commit to the €399/€1,500/€199-founding structure or name different numbers — but commit.
3. **Lawyer:** who, and this week. It gates everything Art.4.
4. **EdenRise activation:** mandate the Land Team's 40h hours onto the platform (it is the case study).
