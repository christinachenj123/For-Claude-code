# Prepare screenshots for the training video:
#   - remove the red annotation boxes (fill from surrounding pixels)
#   - blur personal info (names, account)
#   - crop the border off image 3
#   - build image 6 "closed" (download menu not yet open)
# Writes assets/*.png and assets/boxes.json (where each red box was, in output pixel coords).
# Usage: python3 -I tools/preprocess.py  (run from the project folder)
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
    """Remove hollow red rectangles; keep filled red things (icons, badges)."""
    m = red_mask(a)
    boxes, kill = [], np.zeros(m.shape, bool)
    keep = np.zeros(m.shape, bool)
    for p in components(m):
        y1, x1 = p.min(0)
        y2, x2 = p.max(0)
        area = (x2 - x1 + 1) * (y2 - y1 + 1)
        ys, xs = p[:, 0], p[:, 1]
        edge = (np.minimum.reduce([ys - y1, y2 - ys, xs - x1, x2 - xs]) <= 4).mean()
        if (x2 - x1) > 14 and (y2 - y1) > 10 and len(p) < 0.45 * area and edge > 0.9:
            boxes.append([int(x1), int(y1), int(x2), int(y2)])
            # the box line plus its anti-aliased, reddish fringe
            H, W = m.shape
            yy, xx = np.mgrid[0:H, 0:W]
            d = np.minimum.reduce([np.abs(yy - y1), np.abs(yy - y2), np.abs(xx - x1), np.abs(xx - x2)])
            inside = (yy >= y1 - 3) & (yy <= y2 + 3) & (xx >= x1 - 3) & (xx <= x2 + 3)
            r, g, b = a[..., 0], a[..., 1], a[..., 2]
            ring = inside & (d <= 3)
            mm = np.zeros(m.shape, bool)
            mm[p[:, 0], p[:, 1]] = True
            kill |= mm | (ring & (b - g < 50))
            # saturated UI (a button hugging the box) is kept, but not used as a fill source
            keep |= ring & (b - g >= 50) & ~mm
    if boxes:
        k = dilate(kill, grow) if grow else kill
        kept = a[keep].copy()
        a = fill(a, k | keep)
        a[keep] = kept
    return a, boxes


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


boxes = {}

# image 3: portal home. Crop the teal border, blur the user name, remove the red box.
a = load('image3.jpeg')[42:487, 48:1304]
a, boxes['img3'] = remove_boxes(a)
a = blur_rect(a, 1140, 8, 1215, 48, 7)
save(a, 'img3.png')

# image 4: platform pop-up inside the portal.
a = load('image4.jpeg')
a, boxes['img4'] = remove_boxes(a)
save(a, 'img4.png')

# image 5: platform page with the download menu open.
a = load('image5.jpeg')
a, boxes['img5'] = remove_boxes(a)
save(a, 'img5.png')

# image 6: micro-portal page, menu open. Blur the user name.
a = load('image6.png')
orig6 = a.copy()
a, boxes['img6'] = remove_boxes(a, grow=0)
a = blur_rect(a, 1058, 8, 1092, 32, 6)
save(a, 'img6.png')
# closed version: remove the menu (with its shadow). The text line it hid is redrawn in the page.
c = row_interp(a, 536, 262, 680, 387)
for y in range(359, 374):  # text row: blend clean rows above and below instead
    k = (y - 358) / 16
    c[y, 536:675] = c[358, 536:675] * (1 - k) + c[374, 536:675] * k
    c[y, 675:680] = orig6[y, 675:680]
save(c, 'img6_closed.png')

# image 7: login window. Blur the account; also make an empty version (no account, no password).
a = load('image7.png')
a = blur_rect(a, 388, 137, 466, 164, 7)
save(a, 'img7.png')
e = a.copy()
e[137:165, 386:636] = a[150, 600].copy()
e[207:234, 386:636] = a[220, 600].copy()
save(e, 'img7_empty.png')

json.dump(boxes, open(os.path.join(OUT, 'boxes.json'), 'w'), indent=1)
print(json.dumps(boxes))
