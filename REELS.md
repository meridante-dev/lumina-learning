# Reels — the runbook

From a folder of raw clips to reels live in the app, with transcripts, text
lessons and verified checks. The hosting is already set up; sections 1–2 are the
loop you repeat for each new batch.

---

## 0 · What already exists (done 2026-09-02, nothing to redo)

**Hosting: Cloudflare Pages, free tier, no card.** R2 needs a payment method;
Pages does not, and it is the same account, dashboard and wrangler auth — the
existing token already had `pages (write)`, so no re-authorisation was needed.

    project   edenrise-reels
    url       https://edenrise-reels.pages.dev
    limits    unlimited bandwidth · 25 MiB per file · 20,000 files
    headers   _headers sets max-age=31536000, immutable (Pages defaults to
              max-age=0, must-revalidate — a round trip on every play)

`media/reels/` is gitignored. Video never enters the repo again.

**Why not the alternatives**

| | why not |
|---|---|
| **R2** | needs a card. Otherwise ideal; `scripts/reels-to-r2.mjs` is written and waiting if you ever enable it |
| **Vimeo** | an iframe has no playhead, and `armReelCheck` fires on `video.currentTime` vs `duration`. Reels would drop to the weaker visible-time timer. Also ~1 MB of player JS per iframe, and the feed mounts current ±1 |
| **Google Drive** | no stable direct URL (virus-scan interstitials), per-file download quotas that make a clip vanish when it gets popular, and the embed is an iframe — same playhead loss as Vimeo plus fragility |
| **Git / Pages repo** | video in git is permanent: every clone and CI run carries it forever |

Course modules stay on **Vimeo** — long-form, adaptive bitrate earns its keep,
the transcription pipeline runs off their API, and one iframe on a lesson page is
not a feed. The hybrid is deliberate.

---

## 0b · Batch 2 (2026-09-04) — staged PENDING
The 28 clips sitting in `reels-source/Vertical/` (outside `Approved/`) were transcoded,
transcribed and grouped by script on the SSD (`Academy-OS/work/reels-batch/`). They
collapse to **8 new scripts**, now in `content.js` with `approved: false` and on the CDN:
`agreed-values · three-solutions · three-words · agreed-not-told · standards-vs-expectations ·
clean-the-site · who-did-it · great-teammates`. Approve them in Studio → Quick wins.
Not staged, on purpose: `own-the-outcome-5` and `standards.mp4` are new takes of the
already-published *Own The Outcome* and *Defining Excellence* scripts; the ten
`raise-the-energy-12…21` files and `own-the-outcome-6/7` are ten takes of ONE script
(now `great-teammates`); `standards-1/2/3` and `the-invitation-1` carry no speech
(music only — text-on-screen reels need a different path, the forge cannot read them).

## 1 · Add a batch of new clips

**a. Optimise for delivery.** Masters stay in Drive/SSD; the web copy is a
separate artifact. ~6 MB for 20s is about 2.4 Mbps — more than a phone on a farm
needs. This took the first batch from 71 MB to 26 MB with no visible loss.

    mkdir -p media/reels
    for f in /path/to/new/*.mp4; do
      s=$(basename "$f" .mp4 | tr '[:upper:] ' '[:lower:]-' | sed 's/[^a-z0-9-]//g')
      ffmpeg -y -i "$f" -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p \
        -c:a aac -b:a 96k -ac 1 -movflags +faststart "media/reels/$s.mp4"
      ffmpeg -y -ss 1.2 -i "$f" -frames:v 1 -vf scale=540:-2 -q:v 6 "media/reels/$s.jpg"
    done

**b. Check for duplicate takes BEFORE publishing.** The first batch was twelve
files and five lessons — `own-the-outcome-3` and `-4` were 99.6% identical, and
three takes existed of two other scripts. Publishing all twelve would have handed
a learner the same reel three times. Transcribe first, group by script, keep the
fullest take.

**c. Stub them into `brands/<brand>/content.js`** with id, media, poster, theme
and `deeper`. Nothing else — the engine writes the rest.

**d. Run the engine.** Transcribes with local Whisper, then writes the title,
hook, promise line, the text lesson and the check from that clip's own words, and
answers the check blind against the same transcript with a second model.

    node scripts/reel-forge.mjs --course <course> --ingest
    node scripts/reel-forge.mjs --course <course> --ingest --lang pt

Output lands in `knowledge/reels/` as **proposals**. Read them. Machine-translated
transcripts are refused outright: a `pt` transcript must hold words a Portuguese
speaker actually said. Portuguese *text* generated from an English recording is
localisation and is fine — those reels carry `videoLang:'en'` and the player says so.

**e. Paste the approved output into `content.js`.**

---

## 2 · Publish

    node scripts/reels-to-r2.mjs --dry            # confirm which files go up
    # (despite the name it now targets the Pages CDN — see section 3)

    cd /tmp && mkdir -p reelcdn && cp media/reels/<published files> reelcdn/
    cd reelcdn && npx wrangler pages deploy . --project-name edenrise-reels \
      --branch main --commit-dirty=true

Then point `content.js` at the CDN, bump `?v=edrN` in `index.html` **and**
`VERSION` in `sw.js` together, run `node test/run.mjs`, push, and curl the live
site for the new marker (`DEPLOY.md`).

**Only upload what `content.js` references.** `media/reels/` also holds unused
alternate takes; putting those on a public URL publishes footage nobody chose.

**Reels stay pending until approved.** Curation defaults to pending by design, so
a new reel reaches nobody until it is approved in Studio → Quick wins.

---

## 3 · Loose ends worth doing once

- **Custom domain.** `reels.edenrise.com` instead of the `pages.dev` subdomain —
  a DNS record on a zone you already run through Cloudflare. Do it once and a
  future hosting change never touches `content.js` again.
- **Rename `scripts/reels-to-r2.mjs`.** It targets Pages now; the name is a
  leftover from when R2 was the plan. Its file-selection logic (upload only what
  is referenced) is the part worth keeping.
- **Range requests.** Pages answers a Range request with 200 and the whole file
  rather than 206. Irrelevant for a 20-second muted clip that loops from zero and
  never seeks; it would matter for long-form, which is why modules stay on Vimeo.
