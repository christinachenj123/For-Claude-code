# Find red annotation boxes in a screenshot. Prints bounding boxes of red connected components.
import sys, numpy as np
from PIL import Image
def find(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(int)
    r,g,b = a[...,0],a[...,1],a[...,2]
    m = (r>180)&(g<90)&(b<90)&(r-g>110)
    H,W = m.shape
    seen = np.zeros_like(m)
    boxes=[]
    ys,xs = np.nonzero(m)
    for y0,x0 in zip(ys,xs):
        if seen[y0,x0]: continue
        st=[(y0,x0)]; seen[y0,x0]=1; pts=[]
        while st:
            y,x=st.pop(); pts.append((y,x))
            for dy in(-2,-1,0,1,2):
                for dx in(-2,-1,0,1,2):
                    yy,xx=y+dy,x+dx
                    if 0<=yy<H and 0<=xx<W and m[yy,xx] and not seen[yy,xx]:
                        seen[yy,xx]=1; st.append((yy,xx))
        p=np.array(pts)
        y1,x1=p.min(0); y2,x2=p.max(0)
        if len(pts)>40 and (x2-x1)>10 and (y2-y1)>6:
            boxes.append((int(x1),int(y1),int(x2),int(y2),len(pts)))
    return boxes
for f in sys.argv[1:]:
    print(f.split('/')[-1], find(f))
