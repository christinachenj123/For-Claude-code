# Video 3 (工作区) from the real screen recordings in src/ (all 25 fps):
#   r3_31a.mkv (a: 3.1.2 从技能池载入, 3.1.3 同步到技能池, 3.1.4 上传技能)
#   r3_b.mkv   (b: 3.1.1 创建技能, 3.1.5 保存本地, 删除)
#   r3_c.mkv   (c: 3.2.1 创建知识库)
#   r3_d.mkv   (d: 3.2.2 打开知识库, 我的文档, 解析队列)
# Writes assets/rec3/<key>/NNNN.jpg for the frame ranges the film uses (not in git; rebuild with this script),
# with the signed-in user's name blurred, and assets/rec3/shot_bg.jpg (backdrop for manual screenshots).
# Usage: python3 -I tools/prep_rec3.py   (from the project folder; needs ffmpeg)
import os, shutil, subprocess, tempfile
import numpy as np
from PIL import Image, ImageFilter

OUT = 'assets/rec3'
SRC = {'a': 'src/r3_31a.mkv', 'b': 'src/r3_b.mkv', 'c': 'src/r3_c.mkv', 'd': 'src/r3_d.mkv'}
RANGES = {
    'a': [(80, 640), (1375, 1530), (1578, 1690)],
    'b': [(100, 820), (1160, 1420), (1550, 1625)],
    'c': [(190, 216), (435, 1009)],
    'd': [(50, 1185)],
}
HEADER = (1555, 45, 1860, 92)            # signed-in user's name and department, top right


def blur(a, box, r=9):
    im = Image.fromarray(a)
    im.paste(im.crop(box).filter(ImageFilter.GaussianBlur(r)), box[:2])
    return np.asarray(im)


if os.path.isdir(OUT):
    shutil.rmtree(OUT)
for key, path in SRC.items():
    os.makedirs(os.path.join(OUT, key))
    d = tempfile.mkdtemp()
    subprocess.run(['ffmpeg', '-v', 'quiet', '-i', path, '-vsync', '0', '-q:v', '1', '-start_number', '0',
                    os.path.join(d, '%04d.png')], check=False)
    for f0, f1 in RANGES[key]:
        for i in range(f0, f1 + 1):
            p = os.path.join(d, f'{i:04d}.png')
            if not os.path.exists(p):
                continue
            a = blur(np.asarray(Image.open(p).convert('RGB')), HEADER)
            Image.fromarray(a).save(os.path.join(OUT, key, f'{i:04d}.jpg'), quality=98, subsampling=0)   # near-lossless
    if key == 'd':   # backdrop for screenshots: the knowledge-base list, softened
        a = blur(np.asarray(Image.open(os.path.join(d, '0060.png')).convert('RGB')), HEADER)
        Image.fromarray(a).filter(ImageFilter.GaussianBlur(14)).save(os.path.join(OUT, 'shot_bg.jpg'), quality=90)
    shutil.rmtree(d)
    print(key, len(os.listdir(os.path.join(OUT, key))))
