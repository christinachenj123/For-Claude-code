# Prepare screenshots for the training video:
#   - remove the red annotation boxes (fill from surrounding pixels)
#   - blur personal info (names, account)
#   - crop the border off image 3
#   - build image 6 "closed" (download menu not yet open)
# Writes assets/*.png and assets/boxes.json (where each red box was, in output pixel coords).
# Usage: python3 -I tools/preprocess.py  (run from the project folder)
import json, os
import numpy as np
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from imgtools import *

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
