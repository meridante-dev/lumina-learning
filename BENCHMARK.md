# Lumina vs the market — evidence & compliance benchmark

_2026-07-17 · research-grounded (sources linked) · updated as the market moves._

## The claim we compete on
Regulator/auditor expectations for training records, per current compliance-LMS guidance:
**timestamped, immutable, version-controlled records, exportable in a tamper-evident format that does
not require the LMS vendor's software to read** ([LMSPedia audit-evidence guide](https://lmspedia.org/lms-for-compliance-training-audit-evidence/),
[Coggno inspector-reporting guide](https://coggno.com/blog/compliance-lms-audit-trail-inspector-reporting-capabilities/),
[Atrixware on tamper-resistant audit logs](https://www.atrixware.com/blog/wp/how-an-audit-trail-ensures-training-integrity-in-regulated-environments-9w8s/)).

Lumina now ships exactly that stack — most incumbents ship a reporting UI instead:

| Capability | Lumina (today) | Docebo | 360Learning | LearnWorlds |
|---|---|---|---|---|
| Append-only learning-event record | ✅ hash-chained (SHA-256), client + create-only Firestore | audit log (internal) | audit log (internal) | reports |
| Tamper-evidence an auditor can check | ✅ chain breaks on any edit | vendor-trust | vendor-trust | vendor-trust |
| **Verify WITHOUT the vendor** | ✅ `verify.html` + documented algorithm | ❌ | ❌ | ❌ |
| Client-owned evidence export | ✅ one-click JSON per learner | CSV/report exports | CSV | CSV |
| Verified-Competency (completion + scenario + delayed recall) | ✅ first-class metric | ❌ (completion-centric) | ❌ | ❌ |
| On-the-job application rate (L3 seed) | ✅ 7/14/30-day check-ins | partial (surveys, enterprise) | partial | ❌ |
| PT 40h legal artifacts (Art. 131.º, RU Anexo C) | ✅ native | ❌ | ❌ | ❌ |
| **EU AI Act Art.4 path + evidence pack** | ✅ (enforcement 2 Aug 2026) | ❌ (content marketplace only) | ❌ | ❌ |
| White-label + own domain | ✅ standard (per instance) | enterprise add-on | add-on | higher tiers |

## Pricing anchors (validates the flat-instance band)
- 360Learning: from **$8/user/month** ([comparison](https://360learning.com/blog/docebo-vs-360learning/)) → 50 users ≈ $400/mo *before* compliance add-ons.
- Docebo: custom, **≈ $25k/year** entry before implementation ([Capterra](https://www.capterra.com/p/127213/Docebo/)).
- LearnWorlds: from **$99/month** ([Capterra compare](https://www.capterra.com/compare/143513-230567/LearnWorlds-vs-360Learning)) — creator-focused, no compliance evidence layer.

→ **Lumina at €299–499/mo flat per instance (WL + domain + compliance included)** undercuts Docebo ~5-10×,
matches 360Learning's mid-team cost while including what they charge enterprise money for, and sells an
outcome none of them export: *provable* learning.

## Art.4 window (verified facts — use these numbers, not others)
- Obligation applicable since **2 Feb 2025**; national enforcement from **2 Aug 2026**
  ([EC AI-literacy FAQ](https://digital-strategy.ec.europa.eu/en/faqs/ai-literacy-questions-answers),
  [artificialintelligenceact.eu Art. 4](https://artificialintelligenceact.eu/article/4/)).
- No mandated format — an internal documented training record suffices → our pack is the right shape.
- Penalty exposure via national regimes (tiers up to €7.5M / 1% cited in analyses — soften in copy;
  the pitch is "be ready + documented", not fear-mongering).

## The anchoring ladder (honesty about our own tamper-evidence)
1. ✅ **Today:** client hash chain (internal consistency) + server create-only mirror + chain-head anchors
   pinned to Firestore **server time** (back-dating detectable). *Requires rules deploy.*
2. **Next:** [OpenTimestamps](https://opentimestamps.org/) Bitcoin anchoring of chain heads — verified
   feasible fully in-browser (free calendars, no keys, [JS lib](https://github.com/opentimestamps/javascript-opentimestamps)).
   Then the record is provable against a public blockchain, not just our database.
3. **Later:** RFC-3161 TSA countersignatures via a Cloudflare Worker (pairs with the hosting migration).

_Rule for sales copy: never claim more than the tier that is actually deployed._
