# Lumina — Learning OS for Teams

A premium, Netflix-style corporate learning platform prototype, powered by AI learning paths and an AI tutor. Built as a zero-dependency, single-page app (vanilla HTML/CSS/JS) — just open `index.html` in a browser, no build step.

![status](https://img.shields.io/badge/stage-prototype-7c5cff) ![build](https://img.shields.io/badge/build-zero%20dependencies-2dd4bf)

## What it is

Lumina is a vibe-coded answer to platforms like Uscreen/Thinkific/Vimeo OTT, reimagined for **businesses hosting their own learning content**. It pairs a cinematic dark "Netflix for learning" front end with genuinely adaptive AI features.

## Features

**Learner experience**
- Cinematic hero, hover-lift course cards, scroll-snap content rails
- Full course pages with module lists, resume points, and related courses
- A real video player (streams sample video; falls back to a simulated lesson stage in sandboxed environments) that tracks progress, auto-advances modules, and persists everything to `localStorage`
- Adaptive quizzes that actually score — pass verifies a skill, fail re-queues the tricky module into your path
- AI learning paths with a live stepper, "why this order" rationale, and a real "regenerate path" re-planner
- ⌘K command palette, notes + timestamped AI transcript in the player

**AI tutor (genuinely Claude-powered)**
- Bring-your-own Anthropic API key (stored only in the browser, sent only to `api.anthropic.com`)
- System prompt is built live from your real state: goal, full path with statuses, the open course/module, your %, and deadlines
- Falls back to scripted demo replies when no key is set — safe to demo to anyone

**Admin / B2B side**
- Onboarding wizard that generates a starter AI path from role + goal
- Admin console: org KPIs, a people table with at-risk flags and "nudge", a simulated AI content-ingestion dropzone (transcribe → chapter → modules → quiz), and an assignment composer that pushes assignments onto learners' home rails

## Run it

```bash
# any static server works — e.g.
python3 -m http.server 4173
# then open http://localhost:4173
```

Or just double-click `index.html`.

## Stack & files

- `index.html` — app shell, overlays (player, quiz, palette, onboarding, tutor)
- `styles.css` — full design system (dark, glassmorphic, `Space Grotesk` + `Inter`)
- `app.js` — router, state, player, quiz engine, palette, AI tutor, admin, onboarding
- `data.js` — demo catalog, quiz bank, team, seed state

No frameworks, no build, no dependencies. State persists in `localStorage` (footer → "Reset demo" to clear).

## Roadmap → production

The natural path to a deployable product:
- **Framework**: port components to Next.js
- **Auth + data**: Firebase Auth + Firestore (replaces `localStorage`)
- **Video**: Mux or Cloudflare Stream for real upload/transcode/HLS (the admin dropzone's "AI ingestion" maps to their transcode + transcript APIs)
- **Tutor**: move the Claude API call server-side so keys never live in the browser
- **Billing**: Stripe for business subscriptions

## License

Prototype — all rights reserved (for now).

🤖 Built with [Claude Code](https://claude.com/claude-code)
