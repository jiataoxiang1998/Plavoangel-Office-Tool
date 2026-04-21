from PIL import Image
import sys
import argparse
import os
import tempfile
from rembg import remove, new_session

parser = argparse.ArgumentParser()
parser.add_argument('-u', '--input', required=True)
parser.add_argument('-o', '--output', required=True)
parser.add_argument('--padding', type=int, default=20)
parser.add_argument('--alpha-matting', type=int, default=1)
parser.add_argument('--alpha-matting-foreground-threshold', type=int, default=260)
parser.add_argument('--alpha-matting-background-threshold', type=int, default=20)
parser.add_argument('--alpha-matting-erode-size', type=int, default=5)
parser.add_argument('--post-process-mask', type=int, default=1)
args = parser.parse_args()

session = new_session('isnet-general-use')

img = Image.open(args.input)
output = remove(
    img,
    session=session,
    alpha_matting=bool(args.alpha_matting),
    alpha_matting_foreground_threshold=args.alpha_matting_foreground_threshold,
    alpha_matting_background_threshold=args.alpha_matting_background_threshold,
    alpha_matting_erode_size=args.alpha_matting_erode_size,
    post_process_mask=bool(args.post_process_mask)
)

output = trim_padding(output, args.padding)

if output.mode == 'RGBA':
    pass
elif output.mode == 'RGB':
    background = Image.new('RGBA', output.size, (255, 255, 255, 0))
    background.paste(output, mask=output.split()[3] if len(output.split()) > 3 else None)
    output = background

output.save(args.output, 'PNG')
print("OK")


def trim_padding(img, padding=20):
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    alpha = img.split()[3]

    bbox = alpha.getbbox()
    if bbox is None:
        return img

    left, top, right, bottom = bbox

    new_left = max(0, left - padding)
    new_top = max(0, top - padding)
    new_right = min(img.width, right + padding)
    new_bottom = min(img.height, bottom + padding)

    return img.crop((new_left, new_top, new_right, new_bottom))
