# Shared image helpers for preprocessing screenshots.
import json, os
import numpy as np
from PIL import Image, ImageFilter

SRC, OUT = 'src', 'assets'
os.makedirs(OUT, exist_ok=True)


def load(name):
    return np.asarray(Image.open(os.path.join(SRC, name)).convert('RGB')).astype(np.float32)


def save(a, name):
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(os.path.join(OUT, name))


def red_mask(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (r > 150) & (r - g > 70) & (r - b > 70)


def components(m, min_pts=40):
    H, W = m.shape
    seen = np.zeros_like(m)
    out = []
    for y0, x0 in zip(*np.nonzero(m)):
        if seen[y0, x0]:
            continue
        st = [(y0, x0)]
        seen[y0, x0] = True
        pts = []
        while st:
            y, x = st.pop()
            pts.append((y, x))
            for dy in (-2, -1, 0, 1, 2):
                for dx in (-2, -1, 0, 1, 2):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and not seen[yy, xx]:
                        seen[yy, xx] = True
                        st.append((yy, xx))
        if len(pts) >= min_pts:
            out.append(np.array(pts))
    return out


def dilate(m, r):
    o = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            o |= np.roll(np.roll(m, dy, 0), dx, 1)
    return o


def fill(a, mask):
    """Onion-peel fill: each masked pixel takes the mean of its known neighbours."""
    a = a.copy()
    known = ~mask
    H, W = mask.shape
    while not known.all():
        acc = np.zeros_like(a)
        cnt = np.zeros(mask.shape, np.float32)
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1)):
            k = np.roll(np.roll(known, dy, 0), dx, 1)
            v = np.roll(np.roll(a, dy, 0), dx, 1)
            acc += v * k[..., None]
            cnt += k
        new = (~known) & (cnt > 0)
        if not new.any():
            break
        a[new] = acc[new] / cnt[new][:, None]
        known = known | new
    return a


def remove_boxes(a, grow=2):
    """Remove hollow red rectangles; keep filled red things (icons, badges).

    Directional repair: the box line and anything outside it are copied from the background just
    outside the box; the anti-aliased fringe inside the line is copied from just inside. Nothing is
    averaged across the line, so a button the box hugs keeps its edge and its colour does not smear.
    """
    m = red_mask(a)
    H, W = m.shape
    out = a.copy()
    boxes = []
    for p in components(m):
        y1, x1 = p.min(0)
        y2, x2 = p.max(0)
        area = (x2 - x1 + 1) * (y2 - y1 + 1)
        ys, xs = p[:, 0], p[:, 1]
        edge = (np.minimum.reduce([ys - y1, y2 - ys, xs - x1, x2 - xs]) <= 4).mean()
        if not ((x2 - x1) > 14 and (y2 - y1) > 10 and len(p) < 0.45 * area and edge > 0.9):
            continue
        boxes.append([int(x1), int(y1), int(x2), int(y2)])
        lw = max(1, int(m[y1:y1 + 8, (x1 + x2) // 2].sum()))   # line width
        inner = lw + 2                                         # line + inner fringe
        r_, g_, b_ = a[..., 0], a[..., 1], a[..., 2]
        reddish = dilate(m, 2) & (r_ - np.maximum(g_, b_) > 5)   # only the line and its red fringe change
        cy = lambda v: min(H - 1, max(0, v))
        cx = lambda v: min(W - 1, max(0, v))
        for y in range(max(0, y1 - 3), min(H, y2 + 4)):
            for x in range(max(0, x1 - 3), min(W, x2 + 4)):
                d = {'t': y - y1, 'b': y2 - y, 'l': x - x1, 'r': x2 - x}
                side = min(d, key=d.get)
                dist = d[side]
                if dist >= inner or dist < -3 or not reddish[y, x]:
                    continue
                if dist < lw:      # the line itself, and the fringe outside it → background outside
                    k = 4
                    src = {'t': (cy(y1 - k), x), 'b': (cy(y2 + k), x), 'l': (y, cx(x1 - k)), 'r': (y, cx(x2 + k))}[side]
                else:              # the fringe inside the line → content just inside
                    k = inner + 1
                    src = {'t': (cy(y1 + k), x), 'b': (cy(y2 - k), x), 'l': (y, cx(x1 + k)), 'r': (y, cx(x2 - k))}[side]
                out[y, x] = a[src]
    return out, boxes


def blur_rect(a, x1, y1, x2, y2, radius=6):
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    region = im.crop((x1, y1, x2, y2)).filter(ImageFilter.GaussianBlur(radius))
    im.paste(region, (x1, y1))
    return np.asarray(im).astype(np.float32)


def row_interp(a, x1, y1, x2, y2):
    """Fill a rectangle by blending, row by row, the pixels just left and right of it."""
    a = a.copy()
    w = x2 - x1
    t = (np.arange(w) + 0.5) / w
    for y in range(y1, y2):
        L, R = a[y, x1 - 1], a[y, x2]
        a[y, x1:x2] = L[None] * (1 - t[:, None]) + R[None] * t[:, None]
    return a


