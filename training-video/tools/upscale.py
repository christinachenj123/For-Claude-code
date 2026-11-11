# Make 2x versions of every prepared screenshot (assets/*.png → assets/hd/*.png).
# Lanczos resampling plus a light unsharp mask: sharper text when the camera zooms in,
# without inventing detail (no AI upscaling, which can distort Chinese characters).
import glob, os
from PIL import Image, ImageFilter

os.makedirs('assets/hd', exist_ok=True)
for p in sorted(glob.glob('assets/*.png')):
    im = Image.open(p).convert('RGB')
    big = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
    big = big.filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=2))
    big.save(os.path.join('assets/hd', os.path.basename(p)), optimize=True)
    print(os.path.basename(p), big.size)
