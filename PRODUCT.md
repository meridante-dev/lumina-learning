# Lumina — the white-label learning-platform core

**One engine, many companies.** Lumina is a productized, premium LMS. Each client is a
thin **instance** (brand + content + config + its own Firebase project + its own domain)
on top of the **shared core**. Fixing or improving the core improves *every* client at
once — client work compounds into the product instead of fragmenting it.

> Working product name: **Lumina** (the repo's origin name). Rename freely.

---

## The core/instance contract (the rule that makes the funnel work)

1. **The core contains ZERO client-specific code.** No client name, colour, course,
   or Firebase project ever appears in `core/`.
2. **A client is only config + content + assets.** Everything a company needs to look
   and feel different lives in `brands/<id>/`.
3. **If a client needs something the core can't express, you do NOT fork.** You add a
   *config option* (or a capability behind a flag) to the core — which then benefits
   all clients. This is how every engagement builds the product.

If you ever find yourself editing `core/` for one specific client, stop — that need
belongs in the brand config surface. Extend the surface, not a fork.

---

## Repository layout

```
core/                 ← THE PRODUCT (shared, versioned; fix once → all clients get it)
  app.js              engine: routing, rendering, every feature
  auth.js             Firebase auth + Firestore + multi-tenant scoping (reads window.BRAND)
  brandkit.js         brand LOADER — selects the active brand by hostname, applies it
  styles.css          component styles (colour/font tokens come from the brand)
  firestore.rules     security rules (shared)
brands/               ← INSTANCES (one folder per client, no logic)
  edenrise/
    brand.js          the brand pack (see schema below) — registers into window.EdenBrands
    content.js        this client's course catalog        (Stage 2 — currently root data.js)
    assets/           logo, covers, og-image, favicon      (Stage 2 — currently root)
index.html            the shell (shared)
sw.js                 offline app-shell + cache (shared; must stay at repo root for scope)
data.js               course content + i18n framework      (Stage 2: split core i18n vs brand content)
VERSION · CHANGELOG.md · PRODUCT.md · ONBOARDING.md
```

**Load order (index.html `<head>`):** `brands/<id>/brand.js` (registers config) →
`core/brandkit.js` (selects + applies theme/identity before paint) → `core/styles.css`.
Then in `<body>`: `data.js` → `core/app.js` → `core/auth.js`.

**Selection:** by `location.hostname` (each brand lists its `hostnames`), with a
`?brand=<id>` override for local/preview. Default = the founding brand (`edenrise`).

---

## Brand config schema (`brands/<id>/brand.js`)

Everything a client can set. No logic — pure data.

| Field | Type | What it does |
|-------|------|--------------|
| `id` | string | Stable key (folder name). |
| `name` / `academy` | string | Company name / product name shown in UI + tutor. |
| `tagline` / `title` | string | Marketing line / browser `<title>`. |
| `ogDesc` / `twDesc` | string | Open-Graph / Twitter descriptions. |
| `domain` / `hostnames[]` | string / [] | Canonical domain + the hostnames that select this brand. |
| `lang` | 'en' \| 'pt' | Default language. |
| `ethos` | string | The world/school description the AI tutor is grounded in. |
| `firebase` | object | **This client's OWN Firebase project** config. |
| `superadmins[]` | string[] | Platform-admin emails for this client. |
| `themeColor` | hex | Mobile browser chrome colour. |
| `favicon` / `ogImage` | url | Per-brand icons/share image. |
| `fonts` | `{ link, display, body }` | Google-Fonts href + the two font-family stacks. |
| `theme` | object | The CSS colour tokens (`--bg`, `--accent`, …) — a full palette. |
| `content` | path | This client's course-catalog module. |

The `theme` keys map 1:1 to the CSS variables the whole UI reads, so a full rebrand
(dark→light, forest→any palette) is just this object.

---

## Deploy topology (how separate domains share one source)

- **Recommended for many clients:** host on **Netlify / Cloudflare Pages** — one repo,
  one deployment, *multiple custom domains*. `brandkit.js` picks the brand by hostname,
  and each brand hits its **own Firebase project**, so data is fully isolated while the
  frontend code is shared. Adding a client = add a `brands/<id>/` + point their DNS.
- **Per-client isolation (max):** give each client its own deploy (same repo, a
  `BRAND` build env selecting its brand). More deploys to manage; total uptime isolation.
- **GitHub Pages** (current) allows one custom domain per site, so multi-brand needs
  either a multi-domain host (above) or a per-client mirror.

Data isolation is by **separate Firebase projects per client** (not by deploy) — that
holds under any of the topologies above.

---

## Versioning

- `VERSION` = core semver. Bump on core changes; record in `CHANGELOG.md`.
- Clients pin/upgrade a known-good core version.
- `v=edrNN` in index.html/sw.js is the per-deploy cache-buster — unrelated to semver.

See **ONBOARDING.md** for the step-by-step "add a new client" runbook.
