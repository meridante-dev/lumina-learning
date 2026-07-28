# Release Plan — from "built" to "released"

_2026-07-26. Verified state, not remembered state: EdenRise live `edr86`, Belong live `bel15`.
Companions: SELLABILITY.md (commercial gap map) · IMPLEMENT.md (engineering runbook) ·
legal/GDPR-COMPLIANCE.md (findings) · OFFER.md (committed pricing)._

## The two releases (they have different gates — don't blur them)
1. **Learner release** — real people finishing real courses on EdenRise + Belong.
   Blocked by: almost nothing technical. Blocked by *people*.
2. **Commercial release** — selling instances to third parties.
   Blocked by: the lawyer, and by having zero proof-of-use to show.

Everything below is sequenced so #1 produces the evidence that makes #2 credible.

---

## 🔴 GATE 0 — Stop the live exposure (today, ~5 min)

**Verified this morning, unauthenticated, no credentials:** EdenRise's Firestore returns
**5 leaderboard rows and 1 forum post to anonymous callers.** Belong, with the same code but
*deployed* rules, correctly returns 403. The fix is written, tested (19/19 + 6/6 rule tests), and
live on Belong — it has simply never reached EdenRise because the CLI is authenticated as the
Meridante account, which has no rights on `edenrise-academy`.

This is real learners' names and streaks readable by anyone who knows the project id. It is also
the *same deploy* that carries the R0 tenancy fix, the create-only evidence rules, and the
company-scoped reads.

| | |
|---|---|
| **You (2 min)** | `cd ~/Workflows/lumina-prototype && firebase login --reauth` → pick the Google account that owns **edenrise-academy** |
| **Me (3 min)** | `firebase deploy --only firestore:rules --project edenrise-academy` → re-run the anonymous read (must flip to 403) → re-run the rules test API → confirm a signed-in learner can still read their own board |
| **Also unlocked** | EdenRise Firestore **region check** (GDPR finding #6 — gates the "EU data residency" sales claim) and the legacy `companyId` backfill |

**Nothing else on this page matters as much. Everything downstream assumes it's done.**

---

## 🟠 GATE 1 — First real learners (this week)

The product's central claim is *provable* learning. Current server-side proof:
**EdenRise 0 evidence events · Belong 0 users, 0 events.** Thirty-plus shipped versions, zero
completions. This is the gap that makes every sales conversation hypothetical.

**1 · Activate the EdenRise Land Team** 🧑 — *the highest-value action available to you.*
Mandate the team's 40h continuous training onto the platform. They already exist, the courses
already exist (19-video Alignment Journey + Land Team Journey with real Vimeo content), the
compliance obligation is already real. No sale required, no budget, no permission.

**2 · Belong's lesson videos** 🧑 client → 🤖 me. Belong is live, backed, GDPR-correct, and
teaches nothing: 7 courses with real copy and **zero video**. One list of Vimeo/YouTube IDs per
module unblocks it in under an hour.

**3 · Answer the flagship's module 8** 🧑 — one question: *what does ESIP stand for?* It's the only
placeholder question in the 19-module set (I refused to invent it).

**Gate 1 exit criteria — the numbers that end the hypothetical:**
- ≥5 learners with a server-side evidence event
- ≥1 **Verified Competency** earned end-to-end (completion + applied scenario + 7-day retention)
- ≥1 Bitcoin anchor confirmed in a block
- ≥1 manager confirmation recorded
- First measured **completion rate** (the north star, currently unmeasured)

Run `python3 scripts/ops-report.py` each Monday. That's the whole ritual.

---

## 🟡 GATE 2 — Commercially sellable (2 weeks)

**4 · The lawyer** 🧑 — *the critical path, and it hasn't started.* Every compliance artifact says
"em validação jurídica". You cannot invoice a compliance product on unreviewed wording. The pack is
ready to hand over in one email: `legal/TERMS-DRAFT-PT.md`, `legal/DPA-DRAFT-PT.md`,
`legal/GDPR-COMPLIANCE.md`, `privacy.html`, `legal/TRAINING-RECORDS-LEGAL.md`. Ask them for three
things only: (a) sign off the 40h + Art.4 artifact wording, (b) approve ToS/DPA, (c) confirm the
internal-certificate framing.

**5 · Three decisions only you can make** 🧑 — each blocks visible product text:
- **Entity details** (legal name, NIPC, address) → imprint in privacy.html + DPA + ToS
- **Support/privacy email** → policy, one-pager, DPA, welcome docs
- **Confirm or change the price** — €399/mo + €1,500 setup, founding 3×€199 (OFFER.md). Committed, not yet blessed.

**6 · Demo tenant** 🤖 (task #31, ~half a day) — a seeded fictional brand with realistic learners
and one completed evidence journey, so the 10-minute sales walkthrough never touches a real
client's data. Needed before the *first* demo, not the tenth.

**7 · The website** 🤖 — brief is written and committed
(`collateral/WEBSITE-BUILDER-BRIEF.md`, paste-ready `/website-builder` instruction in §5). Best run
*after* Gate 1 so the site can state real numbers instead of promises.

**8 · Art.4 outreach** 🧑 — the one-pager (`collateral/art4-prontidao-pt.html`) is print-ready and
its dates are verified. **Enforcement was 2 August 2026 — that date has now passed**, so the
framing shifts from "get ready" to "you are now in scope and undocumented." Still honest, still
urgent, no fear-mongering. Gate 2 is when this can go out safely (legal sign-off first).

---

## 🟢 GATE 3 — Scale-ready (30–60 days, before client #3)

**9 · Cloudflare Pages migration** (IMPLEMENT.md Step 4 — the last open engineering step).
Kills two compounding taxes: `core/` is hand-copied per brand (7 syncs so far, now scripted but
still copies) and GitHub Pages has no SLA and isn't intended for commercial hosting. Also unlocks
Workers → RFC-3161 timestamping, webhooks, an AI proxy that hides client API keys.
**Trigger: client #3, or the first time a sync bites us.**

**10 · Remaining GDPR items** — Google Fonts self-hosting (learner IP → Google on every load),
EdenRise region verification (Gate 0 unlocks it), privacy contact (Gate 2).

**11 · Accessibility audit completion** — shipped: focus-visible, full keyboard operation,
reduced-motion. Open: contrast audit across both palettes, ARIA landmark sweep, alt text on course
art, skip-to-content. Needed before any public-sector buyer; target a self-declared WCAG 2.1 AA
*partial*-conformance statement that is honest about gaps.

**12 · Operational hardening** — org-level data export + a **proven** backup/restore (currently
neither documented nor tested), plus a status page and the 48h support promise made real.
Bus factor is 1; the mitigation is SOPs, and `PROVISIONING.md` is the pattern to extend.

---

## 🔵 GATE 4 — The completion engine (continuous, north-star work)

The research loop's ranked queue still holds validated, unshipped directions — all aimed at the
only metric that decides renewals. In loop order:

| Dir | What | Why it's next |
|---|---|---|
| #6 | **Per-lesson drop-off bar** | Turns completion into something debuggable — shows exactly where learners quit |
| #7 | **At-risk rule engine + nudges** | JMIR Formative Research 2023 (AB-BA crossover, n=39 adults): reminders naming the learner's CURRENT and TARGET page raised on-time completion 53% -> 64%. Short + specific + progress-anchored; effects decay with repetition, so trigger them, don't schedule them |
| #3 | **Socratic tutor prompt** (answer-refusal, step-gating) | Harvard RCT: +0.73–1.3 SD from *prompt pedagogy, not model size* — nearly free |
| #5 | **Post-completion review surface** | Spaced retrieval; also defends against the −17% "metacognitive laziness" AI-help trap |
| #2 | Onboarding commitment + streak freeze | Loss-aversion mechanics, no backend |
| #4 | Micro-units <6 min enforced in authoring | Video attention data (Guo/edX) |
| #10 | Department Digest → auto-course | The genuine differentiator; no incumbent turns live org data into a weekly course |

**Backlog worth naming:** cohort/scheduled-start mode is the single strongest completion mechanic
found, but it's structural (scheduling + social layer) — a v2 conversation. NB: the vendor cohort
numbers behind that claim are unauditable; cite Reich & Ruiperez-Valiente (Science 2019, 3.13% vs 46%
verified) for the commitment effect instead.

---

## Parallel, already running
- **NGO funding study** (Codex, `~/lumina-ngo-funding-research/`) — determines whether an NGO track
  and its pricing tier exist at all. Don't invent NGO pricing before it lands.
- **Academy intel loop** — weekday research feeding the QUEUE. Keep shipping from the top.

---

## Kill / narrow criteria (decide at day 90, honestly)
If by day 90 there are not **(a)** ≥3 paying pilots, **(b)** one instance with weekly-active
learners, and **(c)** a signed-off legal pack — narrow the product: sell the **Art.4 + 40h evidence
pack as a standalone compliance tool**. Same moat, far shorter sales cycle, no LMS adoption risk.

## The honest summary
The engineering is ahead of the evidence. Nothing on Gate 1 requires code — it requires five people
finishing a course. The single highest-leverage hour available to you this week is not a feature: it
is the reauth in Gate 0, followed by telling the Land Team to log in.
