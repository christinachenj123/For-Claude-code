# Video 3 (工作区): prepare screenshots 19–37.
#   - remove red annotation boxes, blur the user name in the header
#   - skill_clean: the skills page with nothing open (img20 + the left half of img19, which is the
#     same page shifted 1 px; the strip both screenshots cover is rebuilt from same-column cards)
#   - img37_empty: the knowledge-base chat before the question is sent
# Usage: python3 -I tools/preprocess3.py   (from the project folder)
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from imgtools import *

boxes = {}


def header_name(a):
    W = a.shape[1]
    return blur_rect(a, W - 220, 42, W - 58, 86, 8)


def prep(i, name=None, blur=True):
    a = load(f'image{i}.png')
    a, boxes[name or f'img{i}'] = remove_boxes(a)
    if blur:
        a = header_name(a)
    save(a, (name or f'img{i}') + '.png')
    return a


for i in range(19, 38):
    prep(i, blur=i not in (19, 24))   # 19: drawer covers the header; 24: header already blurred by the modal

# ---------- skill_clean ----------
from PIL import Image
opened = lambda n: np.asarray(Image.open(os.path.join(OUT, n)).convert('RGB')).astype(np.float32)
a20, a19 = opened('img20.png'), opened('img19.png')
# both screenshots have the same dark overlay on the page (dialog / drawer open; their pixels match).
# Fitted against img23's sidebar, which has none: obs = 0.55 * orig. The native title bar (y < 37) has none.
undim = lambda a: np.clip((a + np.array([0.46, 0.38, 0.37])) / np.array([0.5506, 0.5503, 0.5499]), 0, 255)
a20 = a20.copy(); a20[37:] = undim(a20[37:])
a19 = a19.copy(); a19[37:] = undim(a19[37:])
# The dialog also casts a soft shadow ~30 px around it. img19 has no dialog, so on the left side the
# shadow is a20 / a19 exactly; the same falloff (it is symmetric) is divided out on the right side.
a19al = a20.copy()
a19al[:, 1:a19.shape[1] + 1] = a19[:a20.shape[0], :a20.shape[1] - 1]       # img19 x = img20 x - 1
ratio = np.clip(a20.mean(2) / np.maximum(a19al.mean(2), 1), 0.3, 1.0)
def profile(vals):
    return np.clip(np.median(vals, axis=0), 0.3, 1.0)
DL, DT, DB = 339, 138, 528                       # dialog left, top, bottom edges
pL = profile(np.stack([ratio[y, DL - 1::-1][:40] for y in range(220, 470, 5)]))          # by distance left of the edge
pT = profile(np.stack([ratio[DT - 1::-1, x][:40] for x in range(420, 720, 5)]))          # above the top edge
pB = profile(np.stack([ratio[DB + 1:DB + 41, x] for x in range(420, 720, 5)]))          # below the bottom edge
DR = 938
for y in range(DT - 40, DB + 41):
    for x in range(757, DR + 41):
        f = 1.0
        if y < DT: f *= pT[min(39, DT - 1 - y)]
        if y > DB: f *= pB[min(39, y - DB - 1)]
        if x > DR: f *= pL[min(39, x - DR - 1)]
        a20[y, x] = np.clip(a20[y, x] / f, 0, 255)
c = a20.copy()
X0, X1, Y0, Y1 = 300, 940, 98, 570            # the pool dialog and its shadow (left part comes from img19)
# left of the drawer: the same page from img19 (img19 x = img20 x - 1)
c[Y0:Y1, X0:757] = a19[Y0:Y1, X0 - 1:756]
# the strip neither screenshot shows (x 757..940)
S0 = 757
WHITE = a20[300, 1000].copy()
for y in range(DT, 152):                         # toolbar rows under the dialog's top edge: buttons are
    c[y, S0:X1] = a20[260 - y, S0:X1]            # symmetric about y = 130
c[152:230, S0:X1] = WHITE                        # panel between toolbar and cards
sel_l, sel_r = 694, 894                          # "按标签筛选" box: left end from img19, assumed 200 px wide
for x in range(S0, sel_r - 10):
    c[176:220, x] = a19al[176:220, 701]
for k in range(10):
    c[176:220, sel_r - 10 + k] = a19al[176:220, sel_l + 9 - k]
# card 2 (row 1, col 2): same layout as card 1 beside it (497 px to the left, from img19)
for y in range(229, DB + 1):
    c[y, S0:X1] = a19al[y, S0 - 497:X1 - 497]
c[262:322, 786:880] = WHITE                      # its icon, title and description text are unknown: blank
c[330:362, 786:X1] = WHITE
for y in range(480, 522):
    c[y, 797:X1] = a19al[y, 690]                 # description box fill (right of card 1's text)
save(c, 'skill_clean.png')

# skill_after: the same page once the new custom skill exists. Card 2 takes the custom-skill layout of
# travel-guide in img23 (icon, 自定义 tag, 所有 / 几秒前), 224 px higher and 497 px to the right.
# Its title and description are drawn by tools/compose3.mjs.
a23 = opened('img23.png')
d = c.copy()
for y in range(231, 474):
    d[y, 757:1228] = a23[y + 224, 260:731]
d[330:354, 786:1000] = WHITE                     # old title + tag (redrawn later)
for y in range(480, 522):
    d[y, 797:1188] = a19al[y, 690]               # empty description box (the old text tail removed)
save(d, 'skill_after_base.png')

# ---------- img37_empty: KB chat before sending ----------
a = opened('img37.png')
e = a.copy()
e[252:664, 452:1232] = a[268, 900]                               # message area → panel white
e[300:352, 254:448] = a[380, 350]                                # conversation item → list background
save(e, 'img37_empty.png')

json.dump(boxes, open(os.path.join(OUT, 'boxes3.json'), 'w'), indent=1)
print('ok')
