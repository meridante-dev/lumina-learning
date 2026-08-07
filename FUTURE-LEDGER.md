# FUTURE LEDGER — everything deferred, in one place
*Kept per João's standing instruction ("keep listing everything we'll need to address in the future").
Updated 2026-08-03. Remove items only when done, never when merely old.*

## Legal (blocked on or feeding the lawyer — Part 6 of the compliance spec)
- **Send Part 6 to a Portuguese employment lawyer** (tasks #32/#43). Everything below marked ⚖️ inherits its answer.
- ⚖️ Q4: is watch-time + assessment sufficient evidence for async hours? Our capture is built; the *claim* waits.
- ⚖️ Q5: HACCP/SST employer-delivery. `fire-truck-training` carries `regime: 'SST'` and every surface prints "regime próprio — não dispensado" until answered.
- REQ-L-005/006/007 — crédito de horas radar, termination-liability figure, 10% coverage monitor (task #38).
- REQ-L-008 — annual training-plan generator with worker-consultation record (task #42).
- REQ-L-009 — Relatório Único Anexo C export (task #39). Results column now exists (assessment scores).
- Part 4.2 sweep — add "confirm with your legal adviser" to OFFER.md, B2B site, Art.4 one-pager (task #43).
- DPIA before any tenant pilot (CNPD Regulamento 798/2018 — worker data).
- Human spot-review of generated questions. They are blind-verified (two-model agreement), but a native
  PT reader should sample ~20 for tone/clarity. All carry `gen/verified/corrected` provenance.
- `WATCH_MIN_COVERAGE = 0.75` is a product gate, not a legal threshold — revisit after Q4.

## Ecosystem (Academy ⇄ LandFlow)
- **person_training bridge** — push "who is trained on what, with evidence" from the Academy's
  trainingLog into LandFlow's person-graph, so the walkie-talkie can answer "who can drive the truck?"
  This is the reverse half of the unification; ingest route pattern already proven.
- **Auto-push on deploy** — `push-knowledge.mjs` is manual; add it to the Pages workflow (needs the
  ingest key as a GitHub secret) so new lessons flow to LandFlow without a human.
- **Translation QA** — all machine translations are labelled `machineTranslated:true`; a native speaker
  pass upgrades them. EN↔PT batches align by segment index; misaligned batches fail loudly.
- **VTT captions in the player + uploaded to Vimeo** — the .vtt files exist for all 30 modules;
  the player doesn't show them yet, and Vimeo upload needs either the UI or a token.
- **Transcripts are public on GitHub Pages.** Same exposure as the embed hashes already in content.js,
  fine for EdenRise; for paying tenants transcripts must move behind auth (Firestore or Worker).
- **ai-literacy has no filmed media** — no transcripts, no V2 bank; its check falls back to the
  acknowledgment path. Film it (or attach media) and the whole pipeline picks it up automatically.
- Belong tenant has none of this content — their courses are unfilmed; pipeline is brand-generic.
- Live-fire test of the brain: message the bot "como encho o tanque do camião?" and confirm it quotes
  the lesson + links the minute (needs Telegram, i.e., João).

## Infrastructure debts
- **`~/wrangler.jsonc` + `~/package.json` in the HOME directory hijack wrangler's config discovery**
  for any project without its own package.json. This sent deploys/secrets to a stray worker named
  `joaoamaral` today (rolled back to its 2026-07-14 version; stray INGEST_KEY secret deleted).
  Rename or remove those home-dir files, or add `package.json` to every worker dir.
  Until then: always `npx wrangler … --config wrangler.toml` inside ~/edenrise-landflow/worker.
- The Academy's in-app tutor STILL calls providers with client-side keys — wire it to the
  academy-ai gateway (the gateway exists precisely for this; the B2B widget already uses the pattern).
- BUILD_KEY / INGEST_KEY rotation procedure (both are `openssl rand` values in ~/.academy-build-key
  and ~/.landflow-ingest-key, mirrored as Worker secrets).
- Demo tenant (task #31) and the Vimeo frames idea (dropped — no token; embed-fetch now exists and
  could cut real key frames from the fetched video if ever wanted).

## Quiz/learning refinements
- Option-position balance audit across banks (shuffle-at-render already kills the bias in practice).
- Visual/phone QA of the new check overlay, review session, and loop chips (logic is verified;
  pixels eyeballed only on desktop).
- Spaced-review push nudges (the queue exists; nudge-mailer could mention due reviews).
- Per-skill mastery from check results (data now exists per question type + capability).

## From the Craveiral/Belong discovery (Lykke, 6 Aug — extract in ~/craveiral-belong)
- Course `kind: formation | howto` split + reference library surface (task #51). The legal line
  is structure+record, not topic — LEGAL-40H-LINE.md corrects the in-meeting framing.
- **Nepali** subtitles/translation (staff langs EN/PT/NE) once Belong content exists.
- 15-min "power punch" app-usage course, tenant-generic.
- Manager-delegated per-department learning paths (admin UI over GOAL_PRESETS).
- LandFlow **WhatsApp front door** for Craveiral (they are WhatsApp-native; priced +€30/mo):
  inter-department router with human-in-loop, follow-up reminders, cleaners' checklist variant.
- Claude skills transfer kit for Lykke (Whisper/ElevenLabs/video→SOP) + in-person AI training.
- Belong instance has ZERO filmed content — the whole EdenRise pipeline (film→Whisper→quiz-gen→
  verify→brain) is proven and waiting; Alina's wine course is the agreed quick win.
- Correction discipline: João's in-meeting "AI Act released 2 weeks ago" is wrong (Art.4 applies
  since Feb 2025; GPAI 2 Aug 2026) — proposals must use the spec's sourced dates.
