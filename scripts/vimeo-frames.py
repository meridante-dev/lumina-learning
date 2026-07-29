#!/usr/bin/env python3
"""
Pull course artwork straight from the footage on Vimeo. No manual frame-grabbing.

WHY A TOKEN IS NEEDED
  The unauthenticated routes do not give you a usable frame:
    - oEmbed (no auth) returns only the video's ACTIVE poster, which for these
      videos is the branded title card — text we already render in our own type.
    - player.vimeo.com/video/<id>/config 403s, because the videos are privacy-
      restricted to the academy domain. That is correct behaviour, not a bug.
  The supported automated route is the Vimeo API: ask it to cut a frame at a
  timecode, then download that frame at up to 2560px.

CREDENTIAL — never pass it on the command line, never commit it:
    export VIMEO_TOKEN="..."        # scopes: public private video_files edit
  Create at https://developer.vimeo.com/apps -> your app -> Authentication.

USAGE
    python3 scripts/vimeo-frames.py --dry-run          # show what it would do
    python3 scripts/vimeo-frames.py --course fire-truck-training --at 0.42
    python3 scripts/vimeo-frames.py --all              # every filmed course

  --at is a FRACTION of the video's duration (0.42 = 42% in), which lands past
  the title card and intro on every clip regardless of length. Pass --seconds
  to give an absolute timecode instead.

OUTPUT
    media/covers/<course-id>-frame.webp     2560px-sourced, quality 84
  It never overwrites an existing cover; wiring a course to the new frame is a
  deliberate edit in content.js, so a bad auto-cut can never silently ship.
"""
import argparse, json, os, re, sys, time, urllib.request, urllib.error, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT = ROOT / 'brands' / 'edenrise' / 'content.js'
OUTDIR = ROOT / 'media' / 'covers'
API = 'https://api.vimeo.com'


def die(msg, code=1):
    print(f'error: {msg}', file=sys.stderr)
    sys.exit(code)


def api(path, token, method='GET', body=None):
    req = urllib.request.Request(API + path, method=method)
    req.add_header('Authorization', 'Bearer ' + token)
    req.add_header('Accept', 'application/vnd.vimeo.*+json;version=3.4')
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, data, timeout=45) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        detail = e.read().decode('utf-8', 'replace')[:300]
        die(f'{method} {path} -> HTTP {e.code}\n{detail}')


def courses_with_vimeo():
    """Parse content.js for (course-id, [vimeo ids]) without executing it."""
    src = CONTENT.read_text()
    out = []
    # split on course boundaries: each object starts with `id: '<slug>',`
    parts = re.split(r"\n\s*id: '([a-z0-9-]+)',", src)
    for i in range(1, len(parts), 2):
        cid, blob = parts[i], parts[i + 1]
        vids = re.findall(r"type: 'vimeo', id: '(\d+)'", blob)
        if vids:
            out.append((cid, vids))
    return out


def pick_frame(video_id, token, frac, seconds, dry):
    if not token:
        # dry-run with no credential: report the plan, touch nothing
        at = seconds if seconds is not None else f'{frac:.0%} in'
        print(f'    video {video_id} -> would cut at {at}  (no VIMEO_TOKEN set)')
        return None
    meta = api(f'/videos/{video_id}', token)
    dur = meta.get('duration') or 0
    name = meta.get('name', '?')
    at = seconds if seconds is not None else round(dur * frac, 2)
    at = max(0.0, min(at, max(dur - 1, 0)))
    print(f'    video {video_id} "{name}" {dur}s -> cutting at {at}s')
    if dry:
        return None
    # ask Vimeo to render a frame at that timecode
    pic = api(f'/videos/{video_id}/pictures', token, 'POST', {'time': at, 'active': False})
    uri = pic.get('uri', '')
    for _ in range(12):                       # rendering is async
        got = api(uri, token)
        if got.get('status') == 'available':
            links = got.get('sizes', [])
            if links:
                base = links[-1]['link'].split('?')[0]
                return re.sub(r'-d_\d+$', '-d_2560', base) if re.search(r'-d_\d+$', base) else base
        time.sleep(2.5)
    die(f'frame for {video_id} never became available')


def save_webp(url, dest):
    from PIL import Image
    import io
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read()
    im = Image.open(io.BytesIO(raw)).convert('RGB')
    im.save(dest, 'WEBP', quality=84, method=6)
    print(f'    wrote {dest.relative_to(ROOT)}  {im.size[0]}x{im.size[1]}  {dest.stat().st_size//1024}KB')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--course'); ap.add_argument('--all', action='store_true')
    ap.add_argument('--at', type=float, default=0.42, help='fraction of duration (default .42)')
    ap.add_argument('--seconds', type=float, default=None, help='absolute timecode, overrides --at')
    ap.add_argument('--module', type=int, default=1, help='1-based module to sample (default 1)')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()

    token = os.environ.get('VIMEO_TOKEN', '').strip()
    if not token and not a.dry_run:
        die('VIMEO_TOKEN is not set. See the header of this file — export it, do not paste it into a command.')

    found = courses_with_vimeo()
    if not found:
        die('no courses with vimeo media found in content.js')
    targets = [c for c in found if a.all or c[0] == a.course]
    if not targets:
        die(f'no match. filmed courses: {", ".join(c for c, _ in found)}')

    OUTDIR.mkdir(parents=True, exist_ok=True)
    for cid, vids in targets:
        print(f'\n{cid}  ({len(vids)} filmed modules)')
        idx = min(max(a.module, 1), len(vids)) - 1
        url = pick_frame(vids[idx], token, a.at, a.seconds, a.dry_run) if token or a.dry_run else None
        if a.dry_run or not url:
            continue
        dest = OUTDIR / f'{cid}-frame.webp'
        if dest.exists():
            print(f'    skip, exists: {dest.name} (delete it to regenerate)')
            continue
        save_webp(url, dest)

    print('\nNothing was wired automatically. Point a course at its new frame in '
          'brands/edenrise/content.js (poster: / heroArt:) once you have looked at it.')


if __name__ == '__main__':
    main()
