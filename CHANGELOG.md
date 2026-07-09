# Changelog — Lumina core

All notable changes to the shared learning-platform engine. Every instance
(EdenRise, and future clients) inherits every core change. SemVer · Keep a Changelog.

## [1.0.0] — 2026-07-09 — Productized white-label core

### Architecture
- **Shared `core/` engine + per-client `brands/<id>/` instance packs.** Core contains
  zero client-specific code; a client is only config + content + assets + its own
  Firebase project + domain (see `PRODUCT.md`).
- **Brand loader** (`core/brandkit.js`): selects a brand by hostname (`?brand=` override),
  applies its theme tokens + `<head>` identity before first paint; exposes `window.BRAND`.
- `core/auth.js` reads the Firebase project + superadmins from the active brand;
  `core/app.js` tutor voice reads the brand name/academy/ethos. EdenRise-safe fallbacks
  throughout — if the brand layer fails to load, the founding app still runs.
- Product scaffolding: `VERSION`, `PRODUCT.md` (config schema + core/instance contract),
  `ONBOARDING.md` (add-a-client runbook).

### Feature set at 1.0 (all shared, all clients inherit)
Adaptive AI learning paths · AI tutor (hint/coach/explain/practice, grounded, honest-by-
default, inspectable memory, admin guardrails) · AI-first land-adapted quizzes + flag-a-
question · in-video checkpoints · review deck + practice-what-you-missed · certificates ·
assignments + sequential unlock · field missions · community forum · live sessions ·
leaderboard / XP / streaks / badges · learning story · admin **Studio** (paste-a-link
course builder) · **Manager Dashboard** · **40h PT training-compliance** pack + RGPD docs ·
multi-tenant companies/invites · centered responsive layout · PWA + offline shell · EN/pt-PT.

### Instances
- **edenrise** — founding instance, `academy.edenrise.com`. Catalog: *The EdenRise
  Alignment Journey*, *Above the Line*, *Fire Truck Training*, + the regenerative-living
  library.

---
_Pre-1.0 history is in git (the EdenRise Academy build, `v=edr01…edr70`)._
