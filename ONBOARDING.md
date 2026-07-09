# Onboard a new client (add a Lumina instance)

Adding a company is **config + content + their own Firebase + their domain** — never a
code fork. Budget ~1–2 hours. Steps you (the operator) must do are marked **[YOU]**;
the rest is brand-pack work.

---

## 1. Their Firebase project **[YOU — Firebase console]**
1. Create a new Firebase project (e.g. `acme-academy`) at console.firebase.google.com.
2. Add a **Web app** → copy its `firebaseConfig` (apiKey, authDomain, projectId, …).
3. **Authentication** → enable **Email/Password** and **Google**.
4. **Authentication → Settings → Authorized domains** → add the client's domain
   (e.g. `learn.acme.com`) and, temporarily, the preview domain.
5. **Firestore** → create database (production mode).
6. Deploy the shared rules to it:
   `firebase deploy --only firestore:rules --project acme-academy`
   (the rules live in `core/firestore.rules` and are the same for every client).
7. (Later) put the client's AI key in `config/org` in *their* Firestore, exactly as
   EdenRise's is — the key never goes in the repo.

## 2. The brand pack
1. Copy `brands/edenrise/` → `brands/acme/`.
2. Edit `brands/acme/brand.js`:
   - `id: 'acme'`, `name`, `academy`, `tagline`, `title`, `ogDesc`, `twDesc`.
   - `domain` + `hostnames: ['learn.acme.com']`.
   - `ethos` — describe the company/school so the AI tutor is grounded correctly.
   - `firebase` — paste the config from step 1.
   - `superadmins` — the client's platform-admin emails.
   - `fonts` — their Google-Fonts link + `display`/`body` stacks.
   - `theme` — their full colour palette (every `--token`). `themeColor`, `favicon`, `ogImage`.
3. Assets → `brands/acme/assets/` (logo, covers, favicon, og-image). *(Stage 2 wires
   per-brand asset paths + the logo/wordmark swap; until then the logo is shared.)*

## 3. Their content
- Give them their own catalog in `brands/acme/content.js` (same shape as `data.js`'s
  `CATALOG` + hooks/PT/quizzes/takeaways), and set `content: 'brands/acme/content.js'`.
  *(Stage 2 formalizes the content split; today the catalog is the shared `data.js`.)*
- Build courses the easy way: sign in as a superadmin → **Studio → paste-a-link** to add
  videos, or edit the content module directly.

## 4. Register + select
- Add the brand script to `index.html` **before** `core/brandkit.js`:
  `<script src="brands/acme/brand.js?v=…"></script>` (multi-domain single deploy), **or**
  select it at build time with `?brand=acme` / a `BRAND` env (per-client deploy).
- Test locally: open `…?brand=acme` — the whole app should recolour + rebrand + point at
  the Acme Firebase project.

## 5. Deploy + domain **[YOU — DNS]**
- Multi-domain host (Netlify/CF Pages): add `learn.acme.com` as a custom domain on the
  same deployment; point the client's DNS (CNAME) at it.
- Verify: visit the live domain — brand correct, sign-in works against *their* Firebase,
  a course plays, and `?brand=` is not needed (hostname selects it).

## 6. Confirm isolation
- Sign up a test user on the client's domain → it appears in the **client's** Firestore,
  never EdenRise's. Anonymous write probes to their Firestore return 403.

---

### Golden rule
If the client needs a behaviour the brand config can't express, add the knob to the
**core** (benefits everyone) — never fork the engine for one client. See `PRODUCT.md`.
