# Video 1 from the real screen recordings (src/rec_a.mkv = 方式一, src/rec_b.mkv = 方式二).
# Writes assets/rec1/ (not in git; rebuild with this script):
#   A/NNNN.jpg, B/NNNN.jpg  the frames the film uses, with the long URL query erased and names blurred
#   A_hold.jpg   portal at 常用工具 with the cursor erased (a synthetic cursor clicks the card here)
#   A_modal.jpg  the platform pop-up with the cursor erased
#   B_page.jpg   the platform page with the cursor erased
#   B_blank.jpg  the same tab before the page loads: blank content, empty address bar, no tab title
#   taskbar.jpg  the real Windows taskbar (for the desktop scene)
# Usage: python3 -I tools/prep_rec1.py   (from the project folder; needs ffmpeg)
import os, shutil, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from imgtools import fill

OUT = 'assets/rec1'
A_RANGE, B_RANGE = (29, 313), (199, 348)          # frames used (25 fps); the rest is the recorder window
A_MODAL = 178                                     # first frame with the platform pop-up
SWITCHES = {'A': [(256, 259)], 'B': [(279, 282)]}   # sub-menu switches (last old frame, first full new frame)


def frames(mkv):
    d = tempfile.mkdtemp()
    subprocess.run(['ffmpeg', '-v', 'quiet', '-i', mkv, '-q:v', '1', '-start_number', '0',
                    os.path.join(d, '%04d.png')], check=False)
    return d


def blur(a, x1, y1, x2, y2, r=7):
    im = Image.fromarray(a)
    im.paste(im.crop((x1, y1, x2, y2)).filter(ImageFilter.GaussianBlur(r)), (x1, y1))
    return np.asarray(im)


def erase_query(a, x0, x1=1664):
    """Erase the URL after the path (session parameters) inside Chrome's address field."""
    a = a.copy()
    field = a[54:77, x0:x1].reshape(-1, 3)
    vals, counts = np.unique(field, axis=0, return_counts=True)
    a[54:77, x0:x1] = vals[counts.argmax()]       # the field's background colour
    return a


def clean(a, src, i):
    if src == 'A':
        a = erase_query(a, 452)
        a = blur(a, 1488, 106, 1548, 140)            # name in the portal header
        if i >= A_MODAL:
            a = blur(a, 1500, 256, 1556, 292)        # name in the platform header (pop-up)
    else:
        a = erase_query(a, 391, 1684)
        a = blur(a, 1500, 102, 1558, 138)            # name in the platform header
    return a


def erase_cursor(a, tip, patch=None):
    """Remove the mouse pointer whose tip is at `tip`: copy from `patch` (same page) or fill around it."""
    x, y = tip
    box = (slice(y - 3, y + 24), slice(x - 3, x + 17))
    a = a.copy()
    if patch is not None:
        a[box] = patch[box]
        return a
    m = np.zeros(a.shape[:2], bool)
    m[box] = True
    return np.clip(fill(a.astype(np.float32), m), 0, 255).astype(np.uint8)


def save(a, name):
    Image.fromarray(a).save(os.path.join(OUT, name), quality=93)


if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT + '/A'); os.makedirs(OUT + '/B')
load = lambda d, i: np.asarray(Image.open(os.path.join(d, f'{i:04d}.png')).convert('RGB'))

for src, mkv, (f0, f1) in (('A', 'src/rec_a.mkv', A_RANGE), ('B', 'src/rec_b.mkv', B_RANGE)):
    d = frames(mkv)
    for i in range(f0, f1 + 1):
        save(clean(load(d, i), src, i), f'{src}/{i:04d}.jpg')
    if src == 'A':
        save(erase_cursor(clean(load(d, 120), 'A', 120), (1731, 622)), 'A_hold.jpg')
        save(erase_cursor(clean(load(d, A_MODAL), 'A', A_MODAL), (861, 598)), 'A_modal.jpg')
        save(load(d, 100)[1040:1080], 'taskbar.jpg')
        top = erase_cursor(clean(load(d, 30), 'A', 30), (1731, 622))
        save(top, 'A_top.jpg')                                         # portal home, pointer erased
        field = top.copy()
        field[50:81, 118:1660] = field[52, 1500]                       # address field emptied (typing)
        save(field, 'A_field.jpg')
        blank = field.copy()
        blank[88:1040] = 255                                           # a new tab: nothing loaded
        vals, counts = np.unique(blank[8:38, 44:252].reshape(-1, 3), axis=0, return_counts=True)
        blank[8:38, 44:252] = vals[counts.argmax()]                     # tab without title or icon
        save(blank, 'A_blank.jpg')
    else:
        page = erase_cursor(clean(load(d, 199), 'B', 199), (867, 395), patch=clean(load(d, 125), 'B', 125))
        save(page, 'B_page.jpg')
        blank = page.copy()
        blank[88:1040] = 255                                           # nothing loaded yet
        blank[50:81, 118:1660] = blank[52, 1500]                       # empty address field
        vals, counts = np.unique(blank[8:38, 44:252].reshape(-1, 3), axis=0, return_counts=True)
        blank[8:38, 44:252] = vals[counts.argmax()]                     # tab without title or icon
        save(blank, 'B_blank.jpg')
    # The page's own sub-menu switch shows ~2 frames with no menu (the dark-blue banner behind it shows
    # through) and a half-transparent new menu. Replace them with a crossfade between the frames around them.
    for old, new in SWITCHES[src]:
        a0 = np.asarray(Image.open(os.path.join(OUT, f'{src}/{old:04d}.jpg'))).astype(np.float32)
        a1 = np.asarray(Image.open(os.path.join(OUT, f'{src}/{new:04d}.jpg'))).astype(np.float32)
        for i in range(old + 1, new):
            k = (i - old) / (new - old)
            save((a0 * (1 - k) + a1 * k).astype(np.uint8), f'{src}/{i:04d}.jpg')
    shutil.rmtree(d)
print('frames:', len(os.listdir(OUT + '/A')), len(os.listdir(OUT + '/B')))
