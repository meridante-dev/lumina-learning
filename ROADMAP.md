# EdenRise Learning Platform — Roadmap

> **North-star metric: course completion rate.**
> Everything below is justified by one question — *does it get more people to finish more learning?*
> Gamification, nudges, leader visibility and department digests are all levers on that one number.

Two big jobs the platform is really doing:
1. **Grow people** — make learning stick (completion), including leadership growth.
2. **Un-silo the organisation** — reconnect departments (Landcare, Building, Bethel, Harvey…) so people feel plugged into the whole, not just their corner.

---

## Epic A — Gamification & motivation engine  *(the completion driver)*
The core bet: subtle, tasteful gamification on every course lifts completion, and we tune it *by* completion data.

- **Points / XP** for real progress: module complete, quiz passed, streak day, path step finished.
- **Subtle per-course gamification** — progress rings, streaks, “X of Y modules”, a small badge on finish. *Elegant, less-is-more — never Candy-Crush.*
- **Leaderboard (“Leader’s board”)** — team + org, weekly reset so it never feels hopeless. Points, light “games”/challenges.
- **Reward cultural connection & growth** — badges/kudos for learning, helping others, cross-department curiosity (not just raw hours).
- **Duolingo-style nudges** — quirky, meme-y: *“Ana just passed you on the board 🌿”* → WhatsApp / email / push. **Consent-gated (GDPR).**
- **Completion-rate analytics** — measure which mechanics move the number, and design the gamification *from* that data.

## Epic B — Leader’s cockpit  *(visibility)*
Extends the existing Admin console.
- **Leader’s hours** — who’s watching what, time spent, per person and per team.
- **Team completion dashboard** — at-risk learners, one-click nudge (ties to Epic A).
- Role-aware: a leader sees their team; an admin sees the org.

## Epic C — Auth & identity  *(“work on the login”)*
- **Real login** — magic-link / SSO (Firebase Auth). Turns the demo into a real multi-user product.
- **Profiles & roles** — learner / leader / admin.
- **GDPR by design** — explicit consent for tracking, nudges and any personal data; data-access & delete controls. This gates nudges and leader visibility.

## Epic D — Learning paths & leadership
- **Redesign “Your AI Learning Path”** — you flagged this; make it cleaner and more motivating (progress-forward, not a list).
- **Leadership pathways** — deliberately designed tracks for growing leaders.
- Adaptive sequencing tuned to completion, not just topic.

## Epic E — UI refinement  *(elegant, less is more)*
- **More minimalistic view** across the app — calm, editorial, fewer elements per screen.
- **“My Progress” tab** — click one tab, instantly see my hours, streak, points, badges, path.

## Epic F — The silo-breaker: Department Digests  *(the differentiator)*
The most novel piece. Problem: too many departments, people feel unplugged from each other.
- **Per-department live feed** curated from **ClickUp** — what’s happening in Landcare, Building, Bethel, Harvey.
- **Auto-generated 2–3 min video digest per department**, published into the learning platform like a course.
- **The funnel (agent pipeline):**
  ```
  ClickUp meta-scan  →  agent writes the video script  →  Claude builds the video  →  publishes to EdenRise
  ```
- Outcome: anyone can watch a short, warm update on any department and feel connected to the whole.

## Epic G — AI & architecture
- **Benchmark more advanced LLMs / real LLM architecture** — for the tutor, the department-digest script-writer, and summarisation. Pick models per job on quality + cost.

## Cross-cutting
- **GDPR / consent** everywhere data or nudges are involved — get consent first.
- **Design language:** elegant, minimal, EdenRise-branded (Cormorant + forest/gold/sage). Restraint signals quality.

---

## Suggested sequencing

| Phase | What | Why first | Needs backend? |
|---|---|---|---|
| **1** | Gamification MVP (points, streaks, badges, **Leader’s board**) + **My Progress tab** + redesigned AI-path card + minimalist polish | Directly targets the north-star metric; fully buildable in the current no-backend app for immediate impact | No |
| **2** | **Login/auth** + GDPR consent (Firebase) | Makes it real & multi-user; unlocks per-person data | Yes |
| **3** | Leader’s cockpit (real per-user hours & completion) | Depends on auth/data from Phase 2 | Yes |
| **4** | Department Digests funnel (ClickUp → agent → Claude video → platform) | The differentiator, but heaviest; needs the agent pipeline + ClickUp access | Yes |
| **Ongoing** | Nudges (needs consent + send channel), LLM benchmarking, leadership pathways | Layer in as auth + consent land | — |

**Recommendation:** start **Phase 1**. It's the most direct hit on completion rate, it's the set of things we can make beautiful and real *today* in the current app (no accounts needed), and it makes the platform feel alive before we take on auth and the ClickUp video engine.
