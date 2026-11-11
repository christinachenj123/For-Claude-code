# Video 2 (会话区): prepare screenshots 8–18.
#   - remove red annotation boxes (and the orange box some screenshots have on the maximise button)
#   - blur personal info (user name in the header, name / staff number, mailbox account)
#   - build "before" states: menu closed (img8), model list closed (img11)
# Usage: python3 -I tools/preprocess2.py   (from the project folder)
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from imgtools import *


def orange_box(a):
    """The orange square some screenshots show around the maximise button (top right)."""
    H, W = a.shape[:2]
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (r > 200) & (g > 120) & (g < 200) & (b < 90)
    m[60:] = False
    m[:, :W - 120] = False
    if m.sum() < 30:
        return a
    return fill(a, dilate(m, 2))


def header_name(a):
    """Blur the signed-in user's name and organisation in the client header."""
    W = a.shape[1]
    return blur_rect(a, W - 220, 42, W - 58, 86, 8)


boxes = {}


def client(name, out, extra=None):
    a = load(name)
    a = orange_box(a)
    a, boxes[out] = remove_boxes(a)
    a = header_name(a)
    if extra:
        a = extra(a)
    save(a, out + '.png')
    return a


a8 = client('image8.png', 'img8')
a9 = client('image9.png', 'img9')
a10 = client('image10.png', 'img10')

# img8 with the agent menu closed: the sidebar under the menu comes from img10 (same layout)
a11raw = load('image11.png')
c = a8.copy()
c[160:512, 0:236] = a10[160:512, 0:236]
c[160:512, 236:280] = a11raw[160:512, 236:280]   # left margin of the chat panel (blank in both)
save(c, 'img8_closed.png')


def no_tooltip(a):
    # the "模型选择" hover tooltip in the header
    m = np.zeros(a.shape[:2], bool)
    m[64:86, 990:1058] = True
    return fill(a, m)


a11 = client('image11.png', 'img11', no_tooltip)
c = a11.copy()
c[138:305, 925:1185] = 255                # model list and its shadow → the white chat panel
save(c, 'img11_closed.png')

client('image12.png', 'img12')
client('image13.png', 'img13')


def img14_extra(a):
    # other user's name (this screenshot has no title bar), and the "激活 Windows" watermark
    a = blur_rect(a, 1160, 2, 1315, 32, 8)
    m = np.zeros(a.shape[:2], bool)
    m[636:676, 1140:1300] = True
    return fill(a, m)


a = load('image14.png')
a, boxes['img14'] = remove_boxes(a)
save(img14_extra(a), 'img14.png')


def img15_extra(a):
    a = blur_rect(a, 390, 434, 450, 458, 7)    # 姓名
    a = blur_rect(a, 390, 473, 500, 497, 7)    # 员工编号
    return a


client('image15.png', 'img15', img15_extra)
client('image16.png', 'img16', lambda a: blur_rect(a, 566, 444, 694, 462, 6))   # mailbox account
client('image17.png', 'img17')
client('image18.png', 'img18')

json.dump(boxes, open(os.path.join(OUT, 'boxes2.json'), 'w'), indent=1)
print(json.dumps(boxes))
