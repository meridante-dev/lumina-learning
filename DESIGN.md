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

## Pass 2 — Library, Community, cockpit (2026-07-26)

| Surface | Before | After |
|---|---|---|
| Library | 110 boxes, 58 chips, "AI PATH" on 5/6 cards, subtitle bragging "sequenced by EdenRise AI" | artwork-led cards (no frame), text-tab filters, **0** badge noise, subtitle "24 courses" |
| Community | 4 stacked sidebar boxes, channel rail styled 4 different ways, composer wrapping a bordered input | **3 visible borders**, one rail treatment, hairline-separated sidebar |
| Cockpit (Admin › People) | boxed manager tiles each holding a ring, "🛡 Compliance command", 8 verbose subtitles | de-boxed metrics, **"Training hours"**, subtitles tightened, "Companies ✦" → "Companies" |

Additions to the laws:
- **13 · A label on everything is not a label.** "AI PATH" appeared on nearly every card, so it
  carried no information. A chip must mark the exception, never the rule.
- **14 · The artwork is the card.** Course cards have no background and no border — the poster
  provides the visual mass, the text sits on the page (Netflix). Hover brightens the art.
- **15 · Filters are navigation, not buttons.** Text tabs with one accent underline for the active
  one; never a row of 11 pills.

**Known nit (not fixed):** the no-data placeholder is an em-dash rendered at display size (42px),
which reads like a glitch on an empty cockpit. Correct behaviour, wrong weight — dim it when a real
empty state is expected.

## Pass 3 — "cinematic depth" (Dream Motion adaptation, 2026-07-26)

Reference: the Dream Motion Framer template (AI-SaaS landing page). Its *structure* was adopted, not
its layout or its cool palette — it is a marketing funnel (hero → showcase → bento → pricing → FAQ
→ CTA) and this is an app. What transferred:

| Template idea | How it landed here |
|---|---|
| Bento grid | Progress top row is now a composed 6-column bento: one large feature tile (level/XP) + four tiles of **varied** widths (364/175/175/364). No markup change — `.prog-mini` uses `display: contents` so its children join the parent grid. |
| Cinematic stage light | `body::before` paints a warm key light (top-left), a secondary fill (top-right) and a floor bounce, all from **brand tokens** (`--accent`, `--accent-2`) so Belong inherits terracotta automatically. `body::after` adds a gentle vignette. |
| Glass surfaces | Elevated panels are `linear-gradient` + `backdrop-filter: blur()` + a 6% white hairline — light, not outline. |
| Section rhythm | `.admin-section` margin 64 → **96px**; section headers 22 → 30px. |
| Showcase framing | The hero's AI-path panel became glass with a deep shadow, so it reads as a floating product surface. |
| Scroll choreography | IntersectionObserver reveals on sections/rails. **The hidden class is applied by script**, never in markup — if JS fails nothing is invisible. `forceVisible()` settles them so screenshots stay truthful. Reduced-motion opts out entirely. |

**Law 16 · A bento is not a box farm.** Pass 1 removed *many uniform small* boxes. A bento returns
surfaces deliberately: **few, large, varied, made of light**. Uniformity is the enemy, not the tile.

**Law 17 · Depth comes from light, not from borders.** Gradient washes, blur and shadow do the work
that 172 outlines used to attempt.

## Pass 4 — the educator (2026-08-07)

The first cut of "Your educator" was built to taste and broke six laws at once. Recorded because the
failure mode is instructive: **a new component written in isolation reaches for containers**, and
every container it reached for was already illegal here.

| Law | What it did | Rebuilt as |
|---|---|---|
| 1 | "The people who know it best" under the band header | header alone; the faces are the subtitle |
| 3 | bordered card in the player, bordered pill on the hero | no border, no background — type on darkness |
| 4 | a box inside the player box | the strip has no box at all |
| 5 | eight half-pixel sizes (14.5 / 12.5 / 10.5 …) | 11 / 13 / 15 / 18 / 22 only |
| 7 | disclosure chip with fill **and** border | colour-only state chip |
| 9 | a decorative ◇ on the badge | deleted |

Also: the monogram tints were saturated teal/terracotta — a second palette smuggled into a warm
green UI (law 8). They are now five low-saturation earths that read as tonal, not colour-coded.

Two things the pixels caught that the DOM did not: the badge's modifier class `avatar` collided with
the existing `.avatar` chip (34px grid) and burst the pill into two lines; and a 118px tile broke
"Land & machinery" into a hanging "LAND &". Neither is visible in an assertion.

**Law 20 — a component is not premium because it is decorated.** Every box, border, gradient and
shadow the first cut added had to be removed to make it look expensive. Reach for type and space
first; a container needs a reason.

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

## Law 18 — opacity is a contrast tax, and it is always paid by the smallest text

Every faint style in this product was authored twice: a token (`--text-faint`,
5.32:1 on `--bg` — passes AA) and then an `opacity` multiplier on top of it in a
premium layer. The multiplier is invisible in review and decisive in measurement:
`.ai-foot` 3.21:1, `.stat .delta` 3.32:1, `.sect-sub` 3.71:1, `.ai-gear` ~3.1:1.
All of them small text, all of them below the 4.5:1 floor.

The worst case was the EU AI Act Art. 50 disclosure — the one line the regulation
requires to be "clear and distinguishable" — rendered as the faintest text on the
screen. **Set the colour, never dim it.** If a thing should be quieter, give it a
quieter token.

## Law 19 — a white-label token that isn't derived is a bug waiting for a tenant

`--on-cta` was a fixed dark green while `--cta` derived from the tenant's accent.
Correct for sage and amber; **1.64:1 on a corporate navy, 1.59:1 on a deep
purple** — an unreadable primary button on every screen. `core/brandkit.js` now
picks the on-colour from the accent's own luminance and warns at load when a
tenant's pair cannot reach AA. Any future token pairing brand colour with text
gets the same treatment: derive it, and make the console say so when it fails.
