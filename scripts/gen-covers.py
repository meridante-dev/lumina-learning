#!/usr/bin/env python3
"""Generate course covers that survive being 298px wide.

The previous set was drawn at 1280x720 with ~1px strokes: rendered into a card
thumbnail those strokes fall below a quarter of a pixel and the poster reads as
an empty dark rectangle. An audit found five of the six cards above the fold on
the Library were blank — for a learning platform the impression is not
"restrained art direction", it is "there is no content in here".

So: draw for the size it is actually seen at. Thick strokes (14-22 units on a
1280x720 canvas ≈ 3-5px at card scale), one large motif per category rather
than a fine illustration, and a duotone wash mixed from the tenant's own accent
so a cover belongs to whichever brand ships it. SVG, so it is ~2KB and stays
crisp on the course page at 5x the size.

  python3 scripts/gen-covers.py <brand-dir> <accent> <accent2> <bg>
"""
import hashlib
import os
import re
import sys

W, H = 1280, 720


def seeded(cid, salt=''):
    return int(hashlib.sha1((cid + salt).encode()).hexdigest(), 16)


def motif(cat, cid, a, a2):
    """One bold, legible shape family per category. Composition varies by id so
    two courses in the same category never look like the same picture."""
    r = seeded(cid)
    ox = 140 + (r % 260)          # horizontal drift
    oy = 60 + ((r >> 8) % 120)    # vertical drift
    s = 0.85 + ((r >> 16) % 40) / 100.0
    g = f'<g transform="translate({ox},{oy}) scale({s:.2f})" fill="none" stroke-linecap="round" stroke-linejoin="round">'
    e = '</g>'
    W_ = 18   # stroke weight — the whole point of this rewrite

    if cat in ('Land & Soil',):
        return g + f'''
      <path d="M60 380 H820" stroke="{a2}" stroke-width="{W_}" opacity=".9"/>
      <path d="M60 470 H820" stroke="{a2}" stroke-width="{W_}" opacity=".45"/>
      <path d="M300 380 V150" stroke="{a}" stroke-width="{W_+4}"/>
      <path d="M300 250 C300 250 210 210 190 120" stroke="{a}" stroke-width="{W_}"/>
      <path d="M300 300 C300 300 400 270 430 180" stroke="{a}" stroke-width="{W_}"/>
      <circle cx="300" cy="120" r="46" stroke="{a}" stroke-width="{W_}"/>''' + e
    if cat in ('Water & Climate',):
        return g + f'''
      <path d="M40 300 C160 210 280 390 400 300 S640 210 760 300" stroke="{a}" stroke-width="{W_+4}"/>
      <path d="M40 410 C160 320 280 500 400 410 S640 320 760 410" stroke="{a2}" stroke-width="{W_}" opacity=".7"/>
      <path d="M400 90 C400 90 330 190 330 230 a70 70 0 0 0 140 0 C470 190 400 90 400 90Z" stroke="{a2}" stroke-width="{W_}"/>''' + e
    if cat in ('Food & Forest',):
        return g + f'''
      <path d="M240 520 V220" stroke="{a}" stroke-width="{W_+6}"/>
      <path d="M240 330 L120 210 M240 330 L360 210 M240 430 L140 340 M240 430 L340 340" stroke="{a}" stroke-width="{W_}"/>
      <circle cx="600" cy="250" r="120" stroke="{a2}" stroke-width="{W_}" opacity=".8"/>
      <path d="M600 130 V370 M480 250 H720" stroke="{a2}" stroke-width="{W_-4}" opacity=".5"/>''' + e
    if cat in ('Nature Connection', 'Wellbeing'):
        return g + f'''
      <circle cx="380" cy="280" r="150" stroke="{a}" stroke-width="{W_+2}"/>
      <circle cx="380" cy="280" r="230" stroke="{a2}" stroke-width="{W_-6}" opacity=".55"/>
      <path d="M380 130 C300 220 300 340 380 430 C460 340 460 220 380 130Z" stroke="{a2}" stroke-width="{W_}"/>''' + e
    if cat in ('Stewardship', 'Leadership'):
        return g + f'''
      <path d="M120 480 L360 140 L600 480Z" stroke="{a}" stroke-width="{W_+4}"/>
      <path d="M250 480 L420 240 L590 480" stroke="{a2}" stroke-width="{W_}" opacity=".7"/>
      <circle cx="620" cy="150" r="52" stroke="{a2}" stroke-width="{W_}"/>''' + e
    if cat in ('Craft & Hands',):
        return g + f'''
      <rect x="140" y="200" width="300" height="300" rx="28" stroke="{a}" stroke-width="{W_+2}"/>
      <path d="M140 320 H440 M290 200 V500" stroke="{a2}" stroke-width="{W_-4}" opacity=".6"/>
      <path d="M520 500 L680 200" stroke="{a2}" stroke-width="{W_+2}"/>''' + e
    # Community and anything unmapped
    return g + f'''
      <circle cx="300" cy="260" r="86" stroke="{a}" stroke-width="{W_+2}"/>
      <circle cx="470" cy="360" r="86" stroke="{a2}" stroke-width="{W_+2}"/>
      <circle cx="620" cy="260" r="86" stroke="{a}" stroke-width="{W_+2}" opacity=".65"/>
      <path d="M300 260 L470 360 L620 260" stroke="{a2}" stroke-width="{W_-6}" opacity=".5"/>''' + e


def cover(cid, cat, accent, accent2, bg):
    r = seeded(cid, 'bg')
    angle = 100 + (r % 60)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="{cat}">
  <defs>
    <linearGradient id="w" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate({angle} .5 .5)">
      <stop offset="0" stop-color="{accent}" stop-opacity=".30"/>
      <stop offset=".55" stop-color="{accent2}" stop-opacity=".12"/>
      <stop offset="1" stop-color="{bg}" stop-opacity="1"/>
    </linearGradient>
    <radialGradient id="v" cx=".5" cy=".45" r=".78">
      <stop offset=".55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".55"/>
    </radialGradient>
  </defs>
  <rect width="{W}" height="{H}" fill="{bg}"/>
  <rect width="{W}" height="{H}" fill="url(#w)"/>
  {motif(cat, cid, accent, accent2)}
  <rect width="{W}" height="{H}" fill="url(#v)"/>
</svg>
'''


def main(brand_dir, accent, accent2, bg):
    content = None
    for p in ('brands/%s/content.js' % brand_dir, brand_dir):
        if os.path.exists(p):
            content = p
            break
    if not content:
        sys.exit('no content.js at ' + brand_dir)
    src = open(content).read()
    explicit = set(re.findall(r"id:\s*'([a-z0-9-]+)'[^}]*?poster:", src, re.S))
    courses = re.findall(r"\{\s*id:\s*'([a-z0-9-]+)'[^}]*?cat:\s*'([^']+)'[^}]*?\}", src, re.S)
    os.makedirs('media/covers', exist_ok=True)
    n = 0
    for cid, cat in courses:
        if cid in explicit:
            continue                      # real artwork already assigned
        open('media/covers/%s.svg' % cid, 'w').write(cover(cid, cat, accent, accent2, bg))
        n += 1
    print('%d covers written (%d courses had real artwork already)' % (n, len(explicit)))


if __name__ == '__main__':
    main(*sys.argv[1:5])
