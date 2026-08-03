#!/usr/bin/env python3
"""
Course footage → transcripts, with no Vimeo token.

WHY THIS SHAPE
  The videos are privacy-restricted on Vimeo and João declined to mint an API
  token — reasonably. Two token-free routes exist and this uses both:
    1. LOCAL MATCH — the raw footage lives on the Ultra Touch SSD. Filenames are
       camera junk (IMG_3991.MOV), but Vimeo's open oEmbed endpoint hands us each
       module's exact duration, and ffprobe hands us each file's. Durations are
       fingerprints: ±2.0s is a match.
    2. EMBED FETCH — for modules with no local file, yt-dlp with the academy's
       own Referer fetches audio from the embed our site is whitelisted for.
       These are our own videos served to our own domain; no credential exists
       to leak. Audio-only (m4a) — transcription needs nothing else.

  Whisper (small) transcribes with auto language detection. Output per module:
    media/transcripts/<courseId>/m<N>.json   segments + words meta (the brain's food)
    media/transcripts/<courseId>/m<N>.vtt    captions (player + accessibility later)
    media/transcripts/manifest.json          status of every module, honest about gaps

USAGE
  python3 scripts/transcribe-pipeline.py             # full run (background it)
  python3 scripts/transcribe-pipeline.py --plan      # match + report, no transcription
  python3 scripts/transcribe-pipeline.py --course fire-truck-training
"""
import argparse, json, re, subprocess, sys, tempfile, unicodedata, urllib.request, pathlib, shutil, time

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT = ROOT / 'brands' / 'edenrise' / 'content.js'
OUT = ROOT / 'media' / 'transcripts'
SSD_DIRS = [pathlib.Path('/Volumes/Ultra Touch/_offload-to-SSD/video-source'),
            pathlib.Path('/Volumes/Ultra Touch/Academy-Promo')]
# Temp audio: SSD when mounted (Mac disk is chronically tight), local scratch
# otherwise — the SSD EJECTED mid-run on 07-31 and took the last six modules'
# fetches with it; the pipeline must survive that disk vanishing.
_SSD_WORK = pathlib.Path('/Volumes/Ultra Touch/Academy-OS/transcribe-work')
WORK = _SSD_WORK if _SSD_WORK.parent.exists() else pathlib.Path.home() / '.cache' / 'academy-transcribe'
TOL = 2.0
VIDEO_EXT = {'.mp4', '.mov', '.m4v', '.mkv', '.webm', '.m4a', '.wav'}


def sh(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def modules_from_content():
    """[{course, mod, vimeoId}] straight out of content.js, no execution."""
    src = CONTENT.read_text()
    out = []
    for m in re.finditer(r"id: '([a-z0-9-]+)',(.*?)(?=\n  \{|\n\];)", src, re.S):
        cid, blob = m.group(1), m.group(2)
        mm = re.search(r"moduleMedia: \[(.*?)\]\s*(?:,|\n)", blob, re.S)
        if not mm:
            continue
        names = re.search(r"modules: \[(.*?)\]", blob, re.S)
        names = re.findall(r"'((?:[^'\\]|\\.)*)'", names.group(1)) if names else []
        for i, v in enumerate(re.finditer(r"\{ type: '(\w+)', id: '([^']+)'(?:, h: '([^']+)')?", mm.group(1))):
            if v.group(1) == 'vimeo':
                out.append({'course': cid, 'mod': i, 'vimeoId': v.group(2), 'h': v.group(3),
                            'modName': (names[i].replace("\\'", "'") if i < len(names) else None)})
    return out


def oembed(vid):
    url = f'https://vimeo.com/api/oembed.json?url=https%3A%2F%2Fvimeo.com%2F{vid}'
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            d = json.load(r)
        return {'duration': d.get('duration'), 'title': d.get('title')}
    except Exception:
        return {'duration': None, 'title': None}


def ffprobe_duration(path):
    r = sh(['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', str(path)])
    try:
        return float(json.loads(r.stdout)['format']['duration'])
    except Exception:
        return None


def local_candidates():
    files = []
    for d in SSD_DIRS:
        if not d.exists():
            continue
        for p in d.rglob('*'):
            if p.suffix.lower() in VIDEO_EXT and not p.name.startswith('._') and p.is_file():
                files.append(p)
    out = []
    for p in files:
        dur = ffprobe_duration(p)
        if dur:
            out.append({'path': p, 'duration': dur})
    return out


def fetch_embed_audio(vimeo_id, dest, h=None):
    """Our video, our whitelisted domain, audio only. The `h` unlisted-hash is
    already public in content.js (the player embeds it); unlisted-tier videos
    403 without it even to their whitelisted domain."""
    if not shutil.which('yt-dlp'):
        return None
    out = dest / f'{vimeo_id}.m4a'
    if out.exists():
        return out
    url = f'https://player.vimeo.com/video/{vimeo_id}' + (f'?h={h}' if h else '')
    sh(['yt-dlp', '--referer', 'https://academy.edenrise.com/',
        '-f', 'bestaudio[ext=m4a]/bestaudio', '-o', str(out), url], timeout=600)
    return out if out.exists() else None


def transcribe(media_path, out_json, out_vtt, model):
    import whisper
    res = model.transcribe(str(media_path), verbose=False)
    lang = res.get('language')
    segs = [{'t0': round(s['start'], 2), 't1': round(s['end'], 2), 'text': s['text'].strip()}
            for s in res.get('segments', []) if s['text'].strip()]
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps({'language': lang, 'segments': segs,
                                    'model': 'whisper-small', 'generatedAt': int(time.time() * 1000)},
                                   ensure_ascii=False, indent=1))
    def ts(t):
        h, rem = divmod(t, 3600); m, s = divmod(rem, 60)
        return f'{int(h):02d}:{int(m):02d}:{s:06.3f}'
    vtt = 'WEBVTT\n\n' + '\n\n'.join(f'{ts(s["t0"])} --> {ts(s["t1"])}\n{s["text"]}' for s in segs)
    out_vtt.write_text(vtt)
    return lang, len(segs)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--plan', action='store_true')
    ap.add_argument('--course')
    a = ap.parse_args()

    mods = modules_from_content()
    if a.course:
        mods = [m for m in mods if m['course'] == a.course]
    print(f'{len(mods)} filmed modules found', flush=True)

    for m in mods:
        m.update(oembed(m['vimeoId']))
    print('oEmbed durations fetched', flush=True)

    cands = local_candidates()
    print(f'{len(cands)} local media candidates probed', flush=True)
    used = set()
    for m in mods:
        m['source'] = None
        if not m['duration']:
            continue
        best = None
        for c in cands:
            if str(c['path']) in used:
                continue
            diff = abs(c['duration'] - m['duration'])
            if diff <= TOL and (best is None or diff < best[0]):
                best = (diff, c)
        if best:
            m['source'] = str(best[1]['path'])
            used.add(m['source'])

    matched = [m for m in mods if m['source']]
    unmatched = [m for m in mods if not m['source']]
    print(f'matched locally: {len(matched)} · needing embed fetch: {len(unmatched)}', flush=True)
    for m in mods:
        tag = 'LOCAL ' + pathlib.Path(m['source']).name if m['source'] else 'EMBED-FETCH'
        print(f"  {m['course']}/m{m['mod']} · {m['title']} · {m['duration']}s · {tag}", flush=True)

    if a.plan:
        return

    WORK.mkdir(parents=True, exist_ok=True)
    import whisper
    print('loading whisper small…', flush=True)
    model = whisper.load_model('small')

    manifest = {'generatedAt': int(time.time() * 1000), 'modules': []}
    mp = OUT / 'manifest.json'
    for m in mods:
        cid, mod = m['course'], m['mod']
        oj = OUT / cid / f'm{mod}.json'
        ov = OUT / cid / f'm{mod}.vtt'
        entry = {'course': cid, 'mod': mod, 'vimeoId': m['vimeoId'], 'title': m.get('modName') or m['title'],
                 'duration': m['duration'], 'status': 'missing', 'language': None}
        try:
            src = pathlib.Path(m['source']) if m['source'] else fetch_embed_audio(m['vimeoId'], WORK, m.get('h'))
            if src and src.exists():
                if oj.exists():
                    entry['status'] = 'already'
                    entry['language'] = json.loads(oj.read_text()).get('language')
                else:
                    print(f'transcribing {cid}/m{mod} ({m["title"]})…', flush=True)
                    lang, n = transcribe(src, oj, ov, model)
                    entry.update(status='done', language=lang, segments=n)
                    print(f'  -> {lang}, {n} segments', flush=True)
            else:
                entry['status'] = 'no-source'
        except Exception as e:
            entry['status'] = f'error: {str(e)[:120]}'
            print(f'  !! {cid}/m{mod}: {e}', flush=True)
        manifest['modules'].append(entry)
        mp.parent.mkdir(parents=True, exist_ok=True)
        mp.write_text(json.dumps(manifest, ensure_ascii=False, indent=1))  # progress survives a kill

    done = sum(1 for x in manifest['modules'] if x['status'] in ('done', 'already'))
    print(f'FINISHED: {done}/{len(mods)} modules transcribed', flush=True)


if __name__ == '__main__':
    main()
