# Training Records & Certificates — the legal benchmark

_2026-07-24 · What Portuguese/EU law expects from training logs and certificates, what the platform
now does about it, and the claims we must never make. For the lawyer pack alongside GDPR-COMPLIANCE._

## 1 · Certificates: what we may and may not claim

**The line that matters in Portugal:** *certified* professional training (with «certificado de
formação profissional» issued through the official systems) belongs to **DGERT-certified training
entities**. The platform's clients are (normally) employers running **internal continuous training** —
fully legitimate under Código do Trabalho art. 131.º, but its certificates are **internal**.

**Implemented accordingly (every certificate tier, both languages):**
> «Certificado interno de formação, emitido pela entidade no âmbito da formação contínua (art. 131.º
> CT). Não constitui certificação profissional emitida por entidade formadora certificada.»

Never remove that footer. Never use «certificado de formação profissional» in product copy. If a
client IS a DGERT-certified entity, that's their wording to add under their own responsibility —
note in the order form.

**eIDAS note:** our verification codes + hash-chain evidence are *internal integrity* mechanisms and
public timestamp proofs. They are **not** qualified electronic signatures/seals/timestamps under
eIDAS — never describe them with eIDAS vocabulary. ("Provably not back-dated" remains accurate.)

## 2 · The certificate set (shipped)

| Tier | Trigger | Distinguishing content |
|---|---|---|
| Course | course completed | course, hours, date |
| Journey | journey completed | stages, hours, date |
| Compliance annual | NIF on profile | year hours vs 40h target, **verification code**, `cert_issued` ledger event |
| **Verified Competency** ★ | ledger proves completion **+ applied scenario + delayed retention (≥7d)** | evidence lines (incl. **manager confirmation** when present), record head-hash, public verifier URL |

All print-grade (A4 landscape, brand-themed, vector), saved as PDF from the print dialog; issuance
itself is written to the evidence ledger. The Verified tier is the honest differentiator: the paper
points at the proof rather than replacing it.

## 3 · The hour log (Registo Individual de Formação — shipped)

CT arts. 131.º/132.º: the employer must keep a training record per worker and provide certification
of hours (notably on contract termination). The platform now produces, per learner:
- **Individual hour log** (print doc): date · action · mode · hours, year totals vs the 40h target,
  identity block (name/NIF/department/company), sourced from the chained learning-event record.
- Plus the existing CSV register (`registo-presencas`) and the **Relatório Único** training annex
  aggregate for the employer's filing.

## 4 · Accessibility (EAA / EN 301 549) — benchmark & status

The **European Accessibility Act** applies to consumer-facing digital services from **28 June 2025**;
B2B workforce platforms sit outside its direct core scope, but (a) employers owe reasonable
accommodation to workers with disabilities, (b) public-sector clients require EN 301 549, and (c) it
is a sales objection either way. Benchmark: **WCAG 2.1 AA**.

**Shipped in this pass:** visible `:focus-visible` outlines everywhere · keyboard activation
(Enter/Space) for every focusable action element incl. quiz options · `prefers-reduced-motion`
respected globally.
**Open (schedule as an a11y audit):** full contrast audit against both brand palettes · aria
landmarks/labels sweep · alt text for course art · screen-reader pass over the player and quiz flows
· skip-to-content link. Target: self-declared WCAG 2.1 AA partial-conformance statement, honest
about gaps, before any public-sector deal.

## 5 · Standing wording rules (sales + product)
1. Artifacts = **documentation support** for the employer's obligations — never "certification",
   never legal advice, never eIDAS terms.
2. The 40h target is the **employer's** duty; the platform records and evidences it.
3. Verified tier claims exactly what the ledger holds — completion, scenario, delayed retention,
   (optionally) manager confirmation — and nothing more.
