# WEBSITE BRIEF — the B2B site selling white-label academies

_Prepared 2026-07-26 from the full build record. Self-contained: everything the website builder needs
is in this file. The paste-ready instruction is at the bottom._

## 0 · Who is selling, to whom
**Seller:** our organisation ("the venture" — entity name pending; working label **Lumina**, sold
through Meridante; use `[ENTITY]` placeholders where the legal name would appear).
**Buyer:** Portuguese/EU companies (10–200 people) that must train their workforce — and since
**2 Aug 2026** must *prove* AI-literacy training (EU AI Act Art. 4). Secondary audience: NGOs/social
organisations (a funding study is underway; do not build NGO-specific pricing into the site).
**One-sentence pitch:** *A premium learning academy under your brand — that can prove, to an
auditor, that the learning actually happened and reached the work.*

## 1 · The product (all real, all live — nothing aspirational)
Two live instances: **academy.edenrise.com** (founding brand) and
**meridante-dev.github.io/belong-academy** (first white-label client). Zero-dependency vanilla web
app; EU-region data for new instances; new client live in under a day.

**Learner experience (the "Netflix" layer):** dark cinematic home with hero + editorial course
rails · adaptive paths & journeys with capstones · in-video knowledge checks that pause playback
(only ever course-specific questions) · pre-tests · spaced-retrieval flashcards · streaks, XP,
badges, company-scoped leaderboard · community forum + live sessions · field missions
(photo-proof, real-world) · AI role-play coach (practice the hard conversation) · **AI tutor** with
5 modes including "teach the AI" — clearly labelled as AI, EN + pt-PT throughout, offline-capable
PWA, mobile-first (zero horizontal overflow at 375px), accessibility pass (focus-visible, full
keyboard operation, reduced-motion).

**The moat — provable learning (each rung live and tested):**
1. Every learning event enters an **append-only, SHA-256 hash-chained record**.
2. Mirrored to **create-only** server storage — not even the operator's clients can edit it.
3. Chain heads **anchored into Bitcoin** (OpenTimestamps) — provably **not back-dated**.
4. **Verifiable without us**: one-click evidence export + a public verifier page that recomputes
   the chain in the browser; exported `.ots` proofs verify with the official OTS tools.
5. **Verified Competency** — completion + applied scenario + delayed retention (≥7 days), optional
   **manager confirmation** ("I saw them apply it") on a separate cross-referenced chain.
6. Four certificate tiers, print-grade, brand-themed — the top tier cites its own evidence hash
   and verifier URL. *The paper points at the proof.*

**Compliance layer (PT/EU):** Portugal 40h/year continuous-training register + individual hour log
+ Relatório Único annex + annual certificate with verification code · **EU AI Act Art. 4 course
(PT/EN) + exportable evidence pack** · GDPR-native: consent recorded on every entry path, tenant
isolation enforced at the database, no tracking cookies/analytics/ads, video in privacy modes,
30-day complete-erasure with receipt, public privacy policy.

## 2 · Verified market facts (cite these, never invent others)
- Art. 4 applicable since **2 Feb 2025**; national enforcement from **2 Aug 2026** (EC AI-literacy
  FAQ; Regulation (EU) 2024/1689). Pitch is **"be ready + documented" — never fear/fines copy.**
- Compliance guidance asks for records "exportable in a tamper-evident format that does not require
  the vendor's software to read" — exactly what we ship; incumbents ship vendor-trust logs.
- Anchors: Docebo ≈ $25k/yr entry · 360Learning from ~$8/user/mo · LearnWorlds from $99/mo — none
  carry vendor-independent verification, verified competency, PT-40h or Art.4 artifacts.
- **Pricing (public):** €399/month flat per instance + €1,500 setup; annual = 2 months free;
  **founding programme: 3 slots at €199/month locked 12 months** (case study + monthly feedback
  call). Client brings their own AI API key.

## 3 · Honest-claims guardrails (hard rules for ALL copy)
1. "Provably **not back-dated**" ✓ — "provably real/true" ✗.
2. Artifacts are **documentation support** for the employer's obligations — never "certification",
   never legal advice, never eIDAS vocabulary ("qualified signature/seal/timestamp" banned).
3. Internal training certificates ≠ DGERT certified-entity professional certification.
4. Claim only deployed capability. No invented testimonials, logos, or usage numbers — the platform
   is pre-revenue with 2 live instances; say "founding programme", not "trusted by hundreds".
5. GDPR wording mirrors privacy.html (consent at entry, isolation, erasure ≤30 days).

## 4 · Design direction
**Cinematic dark premium** — the site should *feel like the product*: near-black warm ground,
one metallic accent (brass/gold family), editorial serif display + clean grotesque body, restrained
GSAP motion (timeline hero reveal, ScrollTrigger storytelling, one cursor-follow moment), film-grain
subtlety over flat black. NOT: purple gradients, centered-hero-plus-three-cards, Inter/Roboto,
emoji-driven feature grids. Bilingual-ready (PT primary market, EN toggle acceptable v1).

**Conversion flow (single page, one action):**
HERO — "A sua academia. Com a sua marca. Com prova." + live-demo CTA →
THE PROOF — interactive centrepiece: a mock evidence chain that verifies before your eyes
(recreate the verifier moment; screenshot assets available) →
THE EXPERIENCE — Netflix-style rails montage of the learner UX (screenshots from the live demos) →
THE CLOCK — Art. 4 dates as calm facts (three date cards pattern already designed in
`collateral/art4-prontidao-pt.html` — reuse its content) →
WHAT'S INCLUDED — engine, compliance layer, evidence ladder, white-label →
PRICING — €399 flat + founding 3×€199 (scarcity is real; keep it factual) →
FAQ (honest limits incl. "not legal advice", "internal certificates") →
FINAL CTA — book a demo (contact: `[SUPPORT-EMAIL — pending]`; no forms that promise what we
can't do; simple mailto or Cal link placeholder).

**Assets available:** both live academies (link them) · verify.html live · the Art.4 one-pager
(copy source) · Verified Competency certificate design (recreate or screenshot) · brand marks per
academy. The site itself needs its own neutral product identity, not EdenRise's or Belong's.

**Footer/legal:** links to Privacy Policy (adapt privacy.html), imprint placeholders
`[ENTIDADE/NIPC/morada/email]`, "© [ENTITY]". No cookie banner needed (no tracking — say so
proudly). Local SEO/GEO: PT keywords ("formação literacia IA empresas", "registo 40h formação",
"academia formação marca própria"), LocalBusiness/Product schema, meta PT+EN.

## 5 · Paste-ready instruction

> Use the **/website-builder** skill with the **ui-ux-pro-max** engine. Build a single-file static
> premium landing page in **Portuguese (pt-PT)** for the product described in
> `collateral/WEBSITE-BUILDER-BRIEF.md` (read it fully first — product facts, verified market
> claims, pricing, honest-claims guardrails, and the section-by-section conversion flow are all
> defined there and are binding). Design: cinematic dark premium that feels like the product —
> editorial serif + grotesque, one brass accent, GSAP timeline + ScrollTrigger motion,
> transform/opacity only, prefers-reduced-motion respected. The centrepiece is the PROOF section:
> an animated evidence-chain verification moment. Every legal/compliance sentence must pass the
> brief's guardrails §3 verbatim — when in doubt, claim less. Placeholders `[ENTITY]`,
> `[SUPPORT-EMAIL]`, imprint fields stay visibly bracketed. Grade against the 8-point checklist
> before presenting; then a mobile pass; then show me. Do not deploy anywhere without asking.
