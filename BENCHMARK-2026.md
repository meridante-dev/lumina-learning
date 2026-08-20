# Market benchmark — August 2026

Where the learning-platform market actually is, what it is bad at, and what that
means for this build. Sources at the bottom; figures are vendor-reported unless
marked otherwise and should be read as claims, not measurements.

---

## 1 · What the leaders are actually doing

**The AI-native split is now real, not marketing.** Sana Labs is positioned as the
most AI-native architecture (LMS + LXP + authoring + virtual classroom in one),
Docebo as the most production-tested delivery AI, 360Learning as AI *behind the
people who hold the knowledge* — internal experts author, AI accelerates them.
Cornerstone pushes AI across the whole workforce rather than just the learning
surface.

The important one for us is **360Learning's model**: content velocity comes from
subject-matter experts inside the company, not a production studio. That is the
same insight behind our teach-back proposal, arrived at from a different
direction.

**Frontline platforms are winning on completion, and it is not close.**

| platform | claim |
|---|---|
| Axonify | 83% weekly login; 90%+ completion in high-turnover roles |
| Arist | 84% average across 170k+ enrolments; 90%+ at Fortune 500 |
| SC Training (ex-EdApp) | 80%+ on microlearning |

Arist's mechanism matters most to us: it delivers through **SMS, Teams, Slack and
WhatsApp** rather than a portal. That is independent evidence that the LandFlow
front door is the right channel, not a workaround.

**"Learning in the flow of work" has become the consensus position** — embedding
learning in the tools people already use instead of a destination portal. Paired
with agentic AI: buyers are explicitly demanding *real* agentic capability, not
content generation "dressed up with new vocabulary."

---

## 2 · What the market is bad at — our openings

**Dissatisfaction is dominated by limited functionality (42%) and inefficiency
(15%)**, and roughly 60% of organisations are reported to be on an LMS that limits
engagement and creates compliance exposure.

**Reporting tracks completion, not performance.** This comes up as one of the
single biggest administrator complaints. Every platform can say who clicked
finish; almost none can say who can now *do* the thing.

**Completion collapses from system friction, not bad content.** One documented
case: a finance team's completion fell to 45%, and the cause was slow mobile
access and disconnected workflows — not the training itself. This is the strongest
external support for the frictionless thesis behind our design constitution.

**SCORM migration is a recurring crisis**, not a task — broken packages, orphaned
files, undocumented completion thresholds surfacing after go-live.

**AI slop is now a buying objection.** Content that is "technically correct but
educationally weak", buyers flooded with generated material and demanding
transparency, validation and measurable outcomes. Forrester's 2026 framing: trust
is the ultimate currency for B2B buyers.

**Compliance buyers want forensic-grade trails.** The bar being described:
timestamped immutable logs, complete history for any employee on any date,
regulator-accepted export formats, and — under 21 CFR Part 11 — audit entries
**protected from modification by all user classes, including administrators**.

---

## 3 · Where we already lead

Stated plainly, because it is unusual and we under-sell it.

**Our evidence layer is stronger in kind than the mainstream compliance LMS.**
Events are create-only at the database rules level (`allow update, delete: if
false`), hash-chained, anchored to server time, and timestamped into Bitcoin via
OpenTimestamps — with `verify.html` proving a record **without us**. The
21 CFR-style requirement that administrators cannot alter the trail is not a
policy here, it is enforced by the rules and the chain. Vendor-hosted "immutable
logs" are immutable at the vendor's discretion; ours are verifiable by a third
party who does not trust either of us.

**We have a real answer to AI slop.** Every question is generated from that
module's own transcript, then answered blind by a second model against the same
transcript; disagreements are corrected or discarded. The correction rate runs
57–70%, which is the point — the gate is load-bearing, not decorative. No
competitor markets a mechanism at this level of specificity.

**We are already in the flow of work.** LandFlow is a live WhatsApp-native tool
the crew uses, holding 31 lessons and ~4,400 transcript segments, with
`search_lessons` exposed to its agent. Arist's numbers suggest this channel is
worth more than the portal.

**Reels that end.** `FEED_PAUSE_AFTER` is a deliberate refusal of compulsion
mechanics on company time. That is a defensible position, not a missing feature.

---

## 4 · Gaps that block deals

Ordered by how directly they stop a sale.

1. **No xAPI / LRS.** It is on every compliance buyer's checklist. Our ledger is
   better *in kind* but not *interoperable* — a buyer cannot pipe us into their
   existing reporting stack, and procurement reads absence as immaturity.
2. **No SCORM import.** Every prospect already owns content. "Rebuild it all" is a
   deal-killer in mid-market, and migration is where incumbents lose customers —
   we cannot catch them if we cannot receive.
3. **No European Digital Credentials.** Europass EDC and the EU Skills Portability
   Initiative are building exactly the rails our anchored evidence was made for. A
   micro-credential is specified to carry issuer, recipient, competency, criteria,
   **evidence references** and a **verification method** — we already produce all
   six and emit none of them in the standard envelope.
4. **Manager reporting is thin.** The market's loudest complaint is completion-not-
   performance, and we hold the raw material to answer it (capability, Field
   Missions, manager confirmations) without a surface that says it.
5. **No skills taxonomy.** Hiring and L&D have both moved skills-first; we have
   capability tags, which is a start and not a graph.
6. **Content velocity.** Six reel placeholders against a hundred-clip need.
   360Learning's answer is peer authoring; ours should be teach-back.

---

## 5 · The build report

**A · Emit xAPI, keep our ledger as the source of truth.** Every credited event
already exists as a chained record; this is a projection into `actor / verb /
object` statements plus an LRS endpoint. Cheap relative to what it unlocks, and it
converts "you are not a real LMS" into "we speak your format and ours is
verifiable." *Medium.*

**B · SCORM 1.2 / 2004 import.** Unzip, parse the manifest, host the package, wire
launch and completion back into our own event chain. It does not have to be
elegant — it has to exist, or migration conversations end early. *Medium-large.*

**C · The capability passport as a European Digital Credential.** Merge the passport
idea with Europass EDC: role, verified capabilities, hours, and the OTS proof as
the credential's evidence reference and verification method. This is the item with
the widest moat — an EU-recognised, employer-verifiable credential that travels
with the worker, backed by a proof the issuer cannot forge. Nobody at our size is
positioned for it because nobody else anchored their records. *Large.*

**D · A manager surface about performance, not completion.** Who can do what, who
is ready for more, where the gap is — sourced from capability + missions +
confirmations. Directly targets the market's most-cited failure. *Medium.*

**E · Teach-back.** Peer-authored content (360Learning's winning model), a third
evidence type, and the fix for the hundred-clip gap. Already specced. *Large.*

**F · Make the gate visible.** A per-question evidence view: the transcript
excerpt, the timestamp, both models' answers, the verdict. Turns our strongest
technical differentiator into something a buyer can *see* in a demo. This is the
cheapest high-leverage item on the list. *Small.*

**G · An agent that acts, not just answers.** Assign, nudge, report, escalate —
inside WhatsApp, where the crew already is. We are closer to this than most because
LandFlow exists; the trend note is that buyers now distinguish real agentic
behaviour from generated text. *Large, and after A–D.*

### Sequence

**F** first — days, and it makes every demo stronger. Then **A** and **D**
together (they share the event projection). **B** when a migration deal is
actually on the table. **C** as the flagship once the passport exists. **E** and
**G** are the second half of the year.

### What this does not change

The doctrine holds up well against the market: no compulsion mechanics on paid
time, no currency for mandatory training, evidence over engagement theatre,
and one obvious next action rather than a quest board. The market's own failure
data — completion collapsing on friction, reporting that measures clicks — argues
for that position rather than against it.

---

## Sources

- Docebo — [AI learning platforms](https://www.docebo.com/learning-network/blog/ai-learning-platforms/) · [corporate LMS](https://www.docebo.com/learning-network/blog/corporate-learning-management-systems/)
- [LMSPedia — best corporate LMS](https://lmspedia.org/best-corporate-lms/) · [compliance audit evidence](https://lmspedia.org/lms-for-compliance-training-audit-evidence/) · [SCORM migration](https://lmspedia.org/scorm-migration-between-lms-platforms/)
- [Axonify](https://axonify.com/) · [Arist microlearning research](https://arist.com/resources/blogs/microlearning-research-benefits-and-best-practices) · [Brandon Hall on Arist](https://brandonhall.com/breaking-the-2000x-attention-gap-how-arist-is-rewriting-the-rules-of-corporate-learning-delivery/)
- [360Learning — AI learning platforms](https://360learning.com/blog/ai-learning-platforms/) · [Cornerstone — learning in the flow of work](https://www.cornerstoneondemand.com/resources/article/learning-workflow-transformation/)
- [Absorb — agentic AI learning systems](https://www.absorbai.com/blog/agentic-ai-learning-system) · [Vinsys — signs to upgrade your LMS](https://www.vinsys.com/blog/7-key-signs-suggest-l-and-d-need-to-upgrade-lms)
- [Training Industry — what AI means for L&D in 2026](https://trainingindustry.com/magazine/winter-2026/training-industry-special-report-what-ai-means-for-corporate-ld-in-2026/) · [Forrester — trust as B2B currency](https://www.forrester.com/blogs/predictions-2026-trust-will-be-the-ultimate-currency-for-b2b-buyers/)
- [Europass — European Digital Credentials for Learning](https://europass.europa.eu/en/european-digital-credentials-learning) · [Sertifier — micro-credentials 2026](https://sertifier.com/blog/micro-credentials-2026-guide/)
- [Trainery — LMS for compliance training](https://trainery.ai/blog/lms-for-compliance-training) · [eLeaP — compliance LMS comparison](https://www.eleapsoftware.com/lms/best-lms-for-compliance-training/)
