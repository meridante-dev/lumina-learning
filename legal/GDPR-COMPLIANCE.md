# GDPR Compliance Map — Lumina platform

_2026-07-24 · The operator's working record: what we process, on what basis, what was found in the
code audit, and what was fixed. Companion to `privacy.html` (learner-facing) and `DPA-DRAFT-PT.md`
(client contract). All three go to the lawyer together._

## Roles
- **Controller:** the client organisation (employer/training entity) running an instance.
- **Processor:** the platform operator (Meridante/EdenRise) — hosts, maintains, processes on
  documented instructions. The DPA formalises this.
- EdenRise Academy is the special case where operator == controller.

## Records of processing (Art. 30 — the RoPA)

| Data | Where | Purpose | Legal basis | Retention |
|---|---|---|---|---|
| Account (name, email, photo) | Firebase Auth + `users/{uid}` | provide the service | contract / consent (recorded with `consentAt`) | account life |
| Learning progress (courses, quizzes, XP, streaks, badges, ratings) | `users/{uid}.state`, `leaderboard/{uid}` | training delivery + motivation | contract | account life |
| Evidence ledger (hash-chained events + anchors + OTS proofs) | `users/{uid}/events|anchors|proofs` (create-only) | provable training records | **legal obligation** of the controller (CT art. 131.º; AI Act art. 4.º) + contract | account life; post-employment per controller's legal duty |
| Free text (module notes, application intentions) | `users/{uid}.state` | learner's own workspace | contract | account life |
| Manager confirmations (subject + confirmer identified) | `confirmations/` (create-only) | verified application evidence | legitimate interest + legal obligation | account life; anonymised on author erasure |
| Community posts/replies | `forum_posts/` | peer learning | contract | account life; author anonymised on erasure |
| Error diagnostics (`S._errs`, capped 15, deduped) | `users/{uid}.state` | reliability | legitimate interest | rolling (ring buffer) |

**Not processed:** tracking cookies, third-party analytics (Belong's `measurementId` exists in config
but `getAnalytics` is never called — verified), advertising, sale of data, special categories.

## Sub-processors
| Who | What | Notes |
|---|---|---|
| Google Firebase | auth + database | Belong: `europe-west1` (EU) ✓ · **EdenRise region: VERIFY** (open item) |
| GitHub Pages | static hosting | no personal data at rest; serves JS/HTML |
| Google Fonts | fonts, remote | IP exposed to Google — **self-hosting planned** (open item) |
| Vimeo / YouTube | lesson video | `dnt=1` / `youtube-nocookie` (fixed this audit) |
| OpenTimestamps calendars, block explorers | anchoring/verification | blinded digests only — no personal data by construction |

## The audit (2026-07-24): findings & status

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | `leaderboard` + `forum_posts` + replies were **world-readable** (`allow read: if true`) — learner names/streaks exposed to the open internet, never covered by the consent text | **High** | ✅ FIXED — reads now require sign-in; client verified to degrade gracefully for guests (`.catch`/error→empty) |
| 2 | **Erasure was incomplete**: in-app delete removes the user doc + auth, but Firestore doc-deletion does not touch subcollections, and the evidence ledger is create-only *for clients by design* → orphaned personal records | **High** | ✅ FIXED — `scripts/gdpr-erase.py` (operator-side, owner-token, idempotent, writes an erasure receipt); privacy.html promises the two-step honestly (immediate visible removal; full purge ≤30 days) |
| 3 | Vimeo embeds carried no `dnt` → viewing-tracking by Vimeo | Medium | ✅ FIXED — `dnt=1` on all three embed paths (YouTube already `nocookie`) |
| 4 | No privacy policy existed while collecting personal data (transparency, Art. 13) | High | ✅ FIXED — `privacy.html` live (factual, marked "em revisão jurídica"), linked from the consent moment on the auth gate |
| 5 | Google Fonts loaded remotely → learner IP to Google on every load (see German case law) | Medium | ⚠ OPEN — self-host fonts (touches typography across brands; schedule deliberately) |
| 6 | EdenRise Firestore **region unverified** (Belong confirmed EU). If US-region, the "EU data residency" sales claim is false for the founding instance | **High for the claim** | ⚠ OPEN — verify in console (Project settings → default GCP resource location); if not EU, either migrate (export/import) or scope the claim to new instances until then |
| 7 | Privacy contact address is a placeholder — João hasn't chosen the support/privacy email | Medium | ⚠ OPEN (blocks final policy text) |
| 8 | **Google sign-in recorded no consent** — only the email form wrote `consent/consentAt`; Google users had no demonstrable consent (Art. 7(1)) | High | ✅ FIXED — consent notice + privacy link now precede every entry path on the gate; first sign-in records `consent, consentAt, consentVia` for ALL providers |
| 9 | **Cross-tenant reads**: leaderboard fetched ALL companies' rows (client-side filter only); forum reads unscoped — contradicting the isolation promised in the DPA | High | ✅ FIXED — queries are company-scoped and rules enforce `docCompany == myCompany()` (supers exempt). Residual: reply-reads are auth-only (discoverable only via company-scoped parents); EdenRise legacy docs missing `companyId` vanish from feeds until backfill (blocked on EdenRise reauth) |
| 10 | Tutor was labeled "EdenRise Tutor" — not obviously AI (AI Act **Art. 50** transparency) | Medium | ✅ FIXED — renamed "AI Tutor"/"Tutor de IA" + permanent disclosure line in the panel ("answers can be wrong; verify what matters") |
| 11 | No provider identification (imprint, DL 7/2004 art. 10.º) | Medium | ✅ template added to privacy.html §7 — entity fields pending (same blocker as #7) |

## The append-only vs. Art. 17 resolution (worth understanding once)
The product's value is an immutable record; GDPR grants erasure. These do not conflict:
- **Clients** (learner devices) can never delete evidence — that is the tamper-evidence.
- **The operator** can and must delete it on a valid erasure request — create-only rules bind the
  client SDK surface, not IAM-level operator credentials. `gdpr-erase.py` is that duty, executable
  in minutes, receipt included.
- **Public anchors** (Bitcoin/OTS) hold nonce-blinded SHA-256 digests: after the underlying data is
  erased they are unlinkable to any person and reveal nothing — they are not "personal data
  retained", and this is documented in the learner-facing policy rather than hidden.
- **Retention override:** where the controller has a legal duty to keep training records
  (CT art. 131.º), erasure of those specific records follows the legal retention period — the
  controller's call, named in the DPA.

## Rights implementation matrix
| Right | How it's served | Status |
|---|---|---|
| Access / portability | in-app JSON export + evidence export (open format, vendor-independent verifier) | ✅ live |
| Rectification | profile editing in-app | ✅ live |
| Erasure | in-app delete (immediate) + `gdpr-erase.py` (complete, ≤30 days, receipted) | ✅ live |
| Objection / restriction | via controller contact | procedural (DPA) |
| Complaint | CNPD, named in policy | ✅ documented |
| Consent record | `consent: true, consentAt` at signup + `consent_given` ledger event | ✅ live |
