# Provisioning a new client instance — the SOP

_Target: **live in < 1 day, < 2 h of human time.** Timed baseline: Belong (2026-07) took ~1 day
spread over sessions; each step below carries its measured cost. Update timings per client._

## Phase 1 · Repo + brand (🤖 ~40 min)
1. New repo `meridante-dev/<client>-academy` from the current lumina-learning main.
2. `brands/<id>/brand.js` — id, names, palette, fonts, logoSvg, domain, **placeholder Firebase**
   (`apiKey: '<CLIENT>_DEMO'`) and `superadmins: []`. The app auto-runs in honest preview mode
   (guard verified live) — sellable demo state from minute one.
3. `brands/<id>/content.js` — catalog skeleton + branded SVG covers (text-free, center-composed).
4. `index.html` per-brand head (title/OG/fonts/`?v=<id>1`), `sw.js` VERSION `<id>-v1`.
5. GitHub Pages on, push, verify live marker per DEPLOY.md.

## Phase 2 · Their backend (🧑 client/us ~10 min console + 🤖 ~15 min)
Follow **GO-LIVE.md** (kept generic in each brand repo): create Firebase project → web app →
paste config into `brand.js` (sign-in auto-returns) → enable Email+Google auth → authorize the
Pages domain → Firestore in **europe-west1** → set `superadmins` in brand.js **and** the
`isSuper()` allowlist in `core/firestore.rules` → `firebase login --reauth` →
`firebase deploy --only firestore:rules --project <id>` → **verify with the rules test API**
(the release-fetch + simulated-requests routine; never trust "Deploy complete!" alone).

## Phase 3 · Content + proof (🧑 client supplies, 🤖 wires)
Video IDs per module → wire `moduleMedia` → **write course-specific COURSE_QUIZ entries**
(checkpoints/pretests only fire on course-specific questions — the guard blocks generic banks) →
end-to-end proof: real signup on the live domain, one module completed, server-stamped event +
anchor confirmed in Firestore. **An instance without this proof is not "live."**

## Phase 4 · Commercial wrapper (🧑)
Order form + invoice (Moloni), support email in the client's welcome doc, entry in the ops report.

---

## ⚠️ Per-deployment divergences (things a core sync must NEVER clobber)
Maintained automatically by `scripts/sync-core.sh` — which exists because a plain `cp` of the
rules file would have replaced Belong's admin allowlist with EdenRise's. **Always sync with the
script, never by hand:**

| Item | Where | Why it diverges |
|---|---|---|
| `isSuper()` email allowlist | `core/firestore.rules` | Each Firebase project has its own admins (script preserves it) |
| Brand config incl. `superadmins`, `firebase` | `brands/<id>/brand.js` | Identity of the instance (script never touches `brands/`) |
| Cache versions | `index.html` `?v=`, `sw.js` VERSION | Independent release cadence per instance |
| Head metadata / CNAME | `index.html`, repo settings | Per-domain |
| `data.js` i18n | `data.js` | Patched per-brand; script diffs and warns, never copies |

## Weekly ops cadence (the north star, actually reviewed)
Every Monday: `python3 scripts/ops-report.py` → users, server-side evidence events/anchors/proofs,
confirmations per instance. Falling evidence-event counts = learners not finishing = the only
number that matters. 5 min; no dashboard needed until >5 clients.
