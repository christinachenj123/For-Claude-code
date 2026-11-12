# Video 2 (会话区) from the real screen recordings in src/:
#   r2_21.mov (2.1, 30 fps), r2_221.mkv (2.2.1), r2_223b.mkv (2.2.3 联网检索), r2_223a.mkv (2.2.3 额度),
#   r2_224.mkv (2.2.4 密码箱), r2_225.mkv (2.2.5 附件; rebuilt from a damaged file, starts 7.2 s into the take)
# Writes assets/rec2/<key>/NNNN.jpg for the frame ranges the film uses (not in git; rebuild with this script),
# with personal information blurred, and assets/rec2/shot_bg.jpg (a soft backdrop for manual screenshots).
# Usage: python3 -I tools/prep_rec2.py   (from the project folder; needs ffmpeg)
import os, shutil, subprocess, tempfile
import numpy as np
from PIL import Image, ImageFilter

OUT = 'assets/rec2'
SRC = {'21': 'src/r2_21.mov', '221': 'src/r2_221.mkv', '223b': 'src/r2_223b.mkv',
       '223a': 'src/r2_223a.mkv', '224': 'src/r2_224.mkv', '225': 'src/r2_225.mkv'}
RANGES = {   # frames used (inclusive), per recording
    '21': [(0, 340), (350, 525), (955, 1160), (1530, 1670)],
    '221': [(28, 310), (1090, 1225)],
    '223b': [(38, 300), (395, 445), (2435, 2620)],
    '223a': [(66, 310)],
    '224': [(40, 300)],
    '225': [(0, 200)],
}
HEADER = (1600, 45, 1860, 92)            # signed-in user's name and department, top right


def blur(a, box, r=9):
    im = Image.fromarray(a)
    x1, y1, x2, y2 = box
    im.paste(im.crop(box).filter(ImageFilter.GaussianBlur(r)), (x1, y1))
    return np.asarray(im)


def regions(key, i):
    """Boxes to blur in frame i of recording key."""
    out = [HEADER]
    if key == '21':
        if 310 <= i < 447:
            out.append((500, 190, 1340, 360))        # chat output quoting workspace paths (staff number)
        if i >= 447:                                  # 智能体管理 table: workspace paths contain the staff number
            out.append((812, 200, 1400, 565) if not (987 <= i <= 1606) else (1285, 200, 1400, 565))
    if key == '221' and i < 87:
        out.append((812, 200, 1400, 565))
    if key == '223a' and i >= 112:                    # 用户中心
        out += [(385, 200, 500, 250), (392, 428, 462, 458), (392, 466, 482, 498)]   # name, 姓名, 员工编号
    return out


def frames(mkv, d):
    subprocess.run(['ffmpeg', '-v', 'quiet', '-i', mkv, '-vsync', '0', '-q:v', '1', '-start_number', '0',
                    os.path.join(d, '%04d.png')], check=False)


if os.path.isdir(OUT):
    shutil.rmtree(OUT)
for key, path in SRC.items():
    os.makedirs(os.path.join(OUT, key))
    d = tempfile.mkdtemp()
    frames(path, d)
    for f0, f1 in RANGES[key]:
        for i in range(f0, f1 + 1):
            p = os.path.join(d, f'{i:04d}.png')
            if not os.path.exists(p):
                continue
            a = np.asarray(Image.open(p).convert('RGB'))
            for b in regions(key, i):
                a = blur(a, b)
            Image.fromarray(a).save(os.path.join(OUT, key, f'{i:04d}.jpg'), quality=92)
    if key == '223b':   # backdrop for screenshots: the chat page, softened
        a = np.asarray(Image.open(os.path.join(d, '0040.png')).convert('RGB'))
        a = blur(a, HEADER)
        Image.fromarray(a).filter(ImageFilter.GaussianBlur(14)).save(os.path.join(OUT, 'shot_bg.jpg'), quality=90)
    shutil.rmtree(d)
    print(key, len(os.listdir(os.path.join(OUT, key))))
