# Design constitution — the declutter laws

_2026-07-26. Written after a measured UI/UX/copy roast found the product had grown feature-first:
every capability we shipped acquired a caption explaining why it existed. These are the laws that
keep it premium. Break one only with a reason written down here._

## The diagnosis (measured, not felt)

| | Before | After | Target |
|---|---|---|---|
| Distinct font sizes (CSS) | **42** | **10** (7 tokens + 3 hero) | ≤8 |
| Border-radius values | **20** | **4** | 4 |
| Box-making CSS rules | 169 | consolidated via layer | ~12 components |
| Chip/badge classes | **26** | 3 treatments | 3 |
| Decorative emoji (data.js) | **78** | **2** | 0 |
| Decorative emoji (app.js) | **110** | **0** | 0 |
| Words on Progress screen | **476** | **342** | <350 |
| Font sizes on Progress | **20** | **7** | ≤8 |
| Chips on one course card | up to **7** | **1** | 1 |
| Hero CTAs | 3 + 1 text link | **2** | 2 |

**Root cause:** the repeating pattern was `header → explanatory subtitle → boxed content →
encouragement line`. Four layers where premium products use two. The UI explained itself instead of
being self-evident — a product built by people proud of the mechanism, for people who just want to
learn.

## The laws

**1 · Two layers, never four.** A section is a header and its content. No explanatory subtitle unless
it carries information the header cannot. No encouragement line — the number is the feedback.
("▲ Keep it alive", "▲ Nice work" are deleted; do not reintroduce them.)

**2 · Metrics are type and space, not tiles.** A dashboard number needs air, not a frame. `.stat` has
no background, no border, no radius.

**3 · Separate with space and darkness, not outlines.** Netflix has ~zero visible borders. Rows carry
`border: 1px solid transparent` and reveal an edge on hover only.

**4 · One box family.** If two containers look alike, they are one component. Never a box inside a
box: a panel inside a section wrapper is one box too many.

**5 · Type scale of 7** — 11 / 13 / 15 / 18 / 22 / 30 / 42, plus the hero one-offs (54/64/84).
Half-pixel sizes (12.5, 13.5) are banned: 112 rules once fought over differences nobody can see.

**6 · Radius scale of 4** — 6 (tight) / 10 (default) / 14 (large) / 99 (pill). Nothing above 14px
except pills; big radii read as "bubbles", not premium.

**7 · One chip, one job.** Three treatments only: neutral (quiet pill), accent (gold, text-led),
state (colour ONLY — no background, no border). A course card shows **at most one** chip, chosen by
signal: must-do > AI-chosen > new. A chip that repeats adjacent text is deleted.

**8 · One warm accent.** Gold `--accent`, used sparingly and mostly as *text*. Amber `#fbbf24` was a
second unrelated warm hue — gone. Cool blue-greys (`rgba(17,17,27)` and friends) were leftovers from
another theme in a warm green UI — gone.

**9 · Emoji are functional or absent.** Allowed: ⚠ ℹ ▶ 🔒 🔴 ✓ ✕ ⤓ ★ (status/controls). Banned:
🌿 🌱 🎉 👋 🎯 🛡 🎓 🧭 💡 🃏 — 188 occurrences removed. Never end a string with a decorative emoji.

**10 · Say it once.** The audit found the same idea stated 4–5 times ("answers come from your
courses" ×4, verified-competency rules ×4, GDPR reassurance ×5). One canonical place per idea.

**11 · Plain words over our vocabulary.** The learner is a housekeeper or a land worker, not a
product manager. Applied renames: *Verified Competency → **Proven*** · *Cockpit → **Ask about your
team*** · *Compliance command → **Training hours*** · *evidence events → **records*** · *chain
intact → **verified*** · *Bitcoin anchoring → **timestamped***. Keep the mechanism in the docs, not
in the UI.

**12 · Never brag about the mechanism.** "Featured Program · Curated for you by AI" became
**"For you"**. Users care what it does for them, not how it was made.

## Where the laws live in code
- `core/styles.css` — two appended blocks: **PREMIUM LAYER** and **PREMIUM LAYER 2**. Reversible by
  deletion; nothing above them was rewritten except mechanical scale-snapping.
- `core/app.js` — `cardHTML()` single-chip rule; hero markup; stat tiles without `.delta`.
- `data.js` — tightened strings; emptied padding subtitles (`.sect-sub:empty` collapses them).

## Two traps this pass hit — read before editing
1. **Verify at runtime, not by grep.** A duplicate key (`course_details`) landed twice in the EN block;
   grep found the first, the browser used the second, and an English session rendered "Detalhes".
   `comm_members` had the same bug pre-existing. Check `UI.en.x` / `UI.pt.x` in the console.
2. **The service worker will lie to you.** After a CSS/JS edit, bump `?v=` **and** the `sw.js`
   VERSION together, or you will screenshot the old build and believe your change failed.
3. **Not every nested box is clutter.** `.level-ring-in`'s background *is* the donut hole; removing
   it turned the level ring into a solid pie. Verify visually before deleting a nested surface.
