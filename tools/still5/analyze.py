#!/usr/bin/env python3
"""광고주 사진 분석 → photos.json
   크기·방향·밝기·선명도·주요 색·피사체 중심(초점)을 계산해 레이아웃 선택과 자르기에 쓴다.
   python3 -I analyze.py <사진 폴더> <출력 photos.json>"""
import sys, os, json
import numpy as np
from PIL import Image, ImageOps, ImageFilter

EXT = ('.jpg', '.jpeg', '.png', '.webp', '.heic')

def focal(g):
    """가장자리(윤곽) 세기와 채도를 합친 지도에서 무게중심 → 피사체 중심 (0~1)"""
    gy, gx = np.gradient(g)
    e = np.hypot(gx, gy)
    e = np.where(e > np.percentile(e, 80), e, 0)
    h, w = e.shape
    yy, xx = np.mgrid[0:h, 0:w]
    # 가장자리 테두리는 덜 믿음
    wgt = (1 - np.abs(xx / w - .5) * .8) * (1 - np.abs(yy / h - .5) * .8)
    e = e * wgt
    s = e.sum() or 1
    return float((e * xx).sum() / s / w), float((e * yy).sum() / s / h)

def colors(im, k=5):
    q = im.convert('RGB').resize((96, 96)).quantize(colors=k, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()[:k * 3]
    cnt = sorted(q.getcolors(), reverse=True)
    out = []
    for c, i in cnt:
        r, g, b = pal[i * 3:i * 3 + 3]
        out.append({'hex': '#%02X%02X%02X' % (r, g, b), 'share': round(c / 9216, 3)})
    return out

def main(src, dst):
    res = []
    for f in sorted(os.listdir(src)):
        if not f.lower().endswith(EXT):
            continue
        p = os.path.join(src, f)
        try:
            im = ImageOps.exif_transpose(Image.open(p))
        except Exception as e:
            res.append({'file': f, 'error': str(e)}); continue
        w, h = im.size
        sm = im.convert('L').resize((256, max(1, int(256 * h / w))))
        g = np.asarray(sm, dtype=np.float32) / 255
        fx, fy = focal(g)
        sharp = float(np.asarray(sm.filter(ImageFilter.FIND_EDGES), dtype=np.float32).var())
        top = float(g[: g.shape[0] // 3].mean()); bot = float(g[-g.shape[0] // 3:].mean())
        hsv = np.asarray(im.convert('RGB').resize((64, 64)).convert('HSV'), dtype=np.float32) / 255
        res.append({
            'file': f, 'w': w, 'h': h, 'ratio': round(w / h, 3),
            'orient': 'land' if w / h > 1.15 else ('port' if w / h < 0.87 else 'square'),
            'light': round(float(g.mean()), 3), 'topLight': round(top, 3), 'botLight': round(bot, 3),
            'sat': round(float(hsv[..., 1].mean()), 3),
            'sharp': round(sharp, 1), 'small': max(w, h) < 1200,
            'fx': round(fx, 3), 'fy': round(fy, 3),
            'colors': colors(im)
        })
    json.dump(res, open(dst, 'w'), ensure_ascii=False, indent=1)
    print(len(res), '장 분석')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
