#!/usr/bin/env python3
"""Convert clinic JPGs to optimized JPG + WebP derivatives."""
from pathlib import Path
try:
    from PIL import Image
except ImportError:
    raise SystemExit('Install Pillow: pip3 install pillow')

ROOT = Path(__file__).resolve().parents[1] / 'assets' / 'images' / 'clinic'
NAMES = [
    'hero-lounge', 'reception-desk', 'reception-wide',
    'waiting-sofas', 'lounge-chairs', 'lounge-portal',
]
MAX_EDGE = 1800
JPEG_QUALITY = 82
WEBP_QUALITY = 78

def find_source(stem: str):
    for ext in ('.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG'):
        p = ROOT / f'{stem}{ext}'
        if p.exists():
            return p
    return None

def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    done = 0
    for stem in NAMES:
        src = find_source(stem)
        if not src:
            print(f'Missing: {stem}.*')
            continue
        im = Image.open(src).convert('RGB')
        w, h = im.size
        scale = min(1.0, MAX_EDGE / max(w, h))
        if scale < 1:
            im = im.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
        jpg = ROOT / f'{stem}.jpg'
        webp = ROOT / f'{stem}.webp'
        im.save(jpg, 'JPEG', quality=JPEG_QUALITY, optimize=True, progressive=True)
        im.save(webp, 'WEBP', quality=WEBP_QUALITY, method=6)
        print(f'OK {stem}: {im.size[0]}x{im.size[1]} -> jpg+webp')
        done += 1
    # OG cover from hero if present
    hero = ROOT / 'hero-lounge.jpg'
    if hero.exists():
        im = Image.open(hero).convert('RGB')
        im = im.resize((1200, 630), Image.Resampling.LANCZOS)
        out = ROOT.parent / 'og-cover.jpg'
        im.save(out, 'JPEG', quality=84, optimize=True)
        print(f'OK og-cover.jpg')
    print(f'Done ({done}/{len(NAMES)})')

if __name__ == '__main__':
    main()
