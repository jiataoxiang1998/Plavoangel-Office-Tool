import os
import sys
import argparse
import codecs
from PIL import Image, ImageDraw, ImageFont, ImageChops

try:
    from psd_tools import PSDImage
    from psd_tools.api.layers import PixelLayer
    PSD_AVAILABLE = True
except ImportError:
    PSD_AVAILABLE = False
    print("WARNING: psd_tools not available, PSD will not be generated")

BASE_W = 3402
BASE_H = 3175

OPEN_BOX = (30, 390, 960, 700)
BACK_BOX = (1055, 390, 960, 700)
MAIN_BOX = (480, 1390, 2260, 950)

COLOR_START_X = 1980
COLOR_START_Y = 250
COLOR_W = 440
COLOR_H = 355
COLOR_GAP_X = 20
COLOR_GAP_Y = 16

TEXT_COLOR = (30, 30, 30)


def smart_crop(img):
    if img is None:
        return None
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
    diff = ImageChops.difference(img, bg).convert("L")
    bbox = diff.point(lambda x: 255 if x > 10 else 0).getbbox()
    return img.crop(bbox) if bbox else img


def paste_adaptive(canvas, img, x, y, max_w, max_h):
    if img is None:
        return None

    iw, ih = img.size
    ratio = iw / ih

    if ratio > 1.8:
        scale = max_w / iw
    else:
        scale = min(max_w / iw, max_h / ih)

    nw = int(iw * scale)
    nh = int(ih * scale)

    img = img.resize((nw, nh), Image.Resampling.LANCZOS)

    px = x + (max_w - nw) // 2
    py = y + (max_h - nh) // 2

    canvas.paste(img, (px, py), img)
    return px, py, nw, nh


def load_img(folder, name):
    for ext in [".jpg", ".png", ".jpeg", ".JPG", ".PNG"]:
        p = os.path.join(folder, name + ext)
        if os.path.exists(p):
            return Image.open(p).convert("RGBA")
    return None


def read_info(folder):
    d = {}
    p = os.path.join(folder, "INFO.txt")
    if os.path.exists(p):
        for line in open(p, encoding="utf-8"):
            if ":" in line:
                k, v = line.strip().split(":", 1)
                d[k.strip().upper()] = v.strip()
    return d


def get_font(size):
    font_paths = [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/simhei.ttf",
        "C:/Windows/Fonts/simsun.ttc"
    ]
    for f in font_paths:
        if os.path.exists(f):
            try:
                return ImageFont.truetype(f, size)
            except:
                continue
    return ImageFont.load_default()


def create_text_block(info, font, gap=30):
    lines = [
        info.get("SIZE", ""),
        info.get("UNIT", ""),
        info.get("BOX", "")
    ]

    widths = [font.getbbox(t)[2] for t in lines]
    max_w = max(widths) if widths else 0
    h = (font.size + gap) * len(lines)

    img = Image.new("RGBA", (max_w + 10, h), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)

    y = 0
    for t in lines:
        draw.text((0, y), t, fill=TEXT_COLOR, font=font)
        y += font.size + gap

    return img


def create_itemno(text, font):
    w = font.getbbox(text)[2]
    h = font.size + 10
    img = Image.new("RGBA", (w + 10, h), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((0, 0), text, fill=TEXT_COLOR, font=font)
    return img


def process_product(product_folder, output_dir, template_path):
    name = os.path.basename(product_folder)

    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template not found: {template_path}")

    canvas = Image.open(template_path).convert("RGBA")
    draw = ImageDraw.Draw(canvas)

    W, H = canvas.size
    sx = W / BASE_W
    sy = H / BASE_H

    def sc(x, y, w, h):
        return int(x * sx), int(y * sy), int(w * sx), int(h * sy)

    info = read_info(product_folder)

    f_main = get_font(int(90 * sy))
    f_color = get_font(int(48 * sy))

    layer_images = []

    img_open = smart_crop(load_img(product_folder, "OPEN"))
    if img_open:
        result = paste_adaptive(canvas, img_open, *sc(*OPEN_BOX))
        if result:
            resized = resize_for_psd(img_open, result[2], result[3])
            layer_images.append((resized, "OPEN", result[:2], result[2], result[3]))

    img_back = smart_crop(load_img(product_folder, "BACK"))
    if img_back:
        result = paste_adaptive(canvas, img_back, *sc(*BACK_BOX))
        if result:
            resized = resize_for_psd(img_back, result[2], result[3])
            layer_images.append((resized, "BACK", result[:2], result[2], result[3]))

    img_main = smart_crop(load_img(product_folder, "MAIN"))
    if img_main:
        result = paste_adaptive(canvas, img_main, *sc(*MAIN_BOX))
        if result:
            resized = resize_for_psd(img_main, result[2], result[3])
            layer_images.append((resized, "MAIN", result[:2], result[2], result[3]))

    files = os.listdir(product_folder)
    colors = [f for f in files if f.lower().endswith((".jpg", ".png"))
              and os.path.splitext(f)[0].upper() not in {"OPEN", "BACK", "MAIN", "INFO"}]

    for i, f in enumerate(sorted(colors)[:6]):
        col = i % 3
        row = i // 3

        cx = int((COLOR_START_X + col * (COLOR_W + COLOR_GAP_X)) * sx)
        cy = int((COLOR_START_Y + row * (COLOR_H + COLOR_GAP_Y + 80)) * sy)
        cw = int(COLOR_W * sx)
        ch = int(COLOR_H * sy)

        stem = os.path.splitext(f)[0]
        img = smart_crop(load_img(product_folder, stem))

        result = paste_adaptive(canvas, img, cx, cy, cw, ch)
        if not result:
            continue

        px, py, nw, nh = result
        label = stem.upper().lstrip("0123456789_- ")
        resized = resize_for_psd(img, nw, nh)
        layer_images.append((resized, label, (px, py), nw, nh))

        draw.text(
            (px + nw // 2, py + nh + int(25 * sy)),
            label,
            fill=TEXT_COLOR,
            font=f_color,
            anchor="ms"
        )

    item_img = create_itemno(info.get("ITEM NO", ""), f_main)
    canvas.paste(item_img, (int(650 * sx), int(2950 * sy)), item_img)

    info_img = create_text_block(info, f_main, gap=int(30 * sy))
    canvas.paste(info_img, (int(2600 * sx), int(2750 * sy)), info_img)

    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, name + ".jpg")
    canvas.convert("RGB").save(output_path, quality=95)

    print(f"OK:{output_path}")

    if PSD_AVAILABLE:
        try:
            create_psd(name, layer_images, W, H, sx, sy, output_dir, info, template_path)
        except Exception as e:
            print(f"PSD Error: {type(e).__name__}: {e}")

    return output_path


def resize_for_psd(img, target_w, target_h):
    if img is None:
        return None
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    if img.size[0] == target_w and img.size[1] == target_h:
        return img
    return img.resize((target_w, target_h), Image.Resampling.LANCZOS)


def create_psd(name, layer_images, W, H, sx, sy, output_dir, info, template_path):
    template = Image.open(template_path).convert('RGBA')
    draw = ImageDraw.Draw(template)

    f_main = get_font(int(90 * sy))
    f_color = get_font(int(48 * sy))

    for item in layer_images:
        if len(item) == 5:
            img, label, pos, nw, nh = item
        else:
            img, label, pos = item
            nw, nh = None, None
        
        if not label.startswith('OPEN') and not label.startswith('BACK') and not label.startswith('MAIN') and pos:
            px, py = pos
            draw.text(
                (px + nw // 2, py + nh + int(25 * sy)),
                label,
                fill=TEXT_COLOR,
                font=f_color,
                anchor="ms"
            )
    
    item_img = create_itemno(info.get("ITEM NO", ""), f_main)
    template.paste(item_img, (int(650 * sx), int(2950 * sy)), item_img)

    info_img = create_text_block(info, f_main, gap=int(30 * sy))
    template.paste(info_img, (int(2600 * sx), int(2750 * sy)), info_img)

    psd = PSDImage.new('RGBA', (W, H), color=(255, 255, 255, 255))
    
    bg_layer = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    psd.append(PixelLayer.frompil(bg_layer, psd, name='background', top=0, left=0))
    
    template_layer = template.convert('RGBA')
    psd.append(PixelLayer.frompil(template_layer, psd, name='template', top=0, left=0))

    for item in layer_images:
        if len(item) == 5:
            img, label, pos, nw, nh = item
        else:
            img, label, pos = item
            nw, nh = None, None
        
        if img is None:
            continue
        try:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            img_rgba = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            img_rgba.paste(img, (pos[0], pos[1]), img)
            
            layer = PixelLayer.frompil(img_rgba, psd, name=f'{label}', top=0, left=0)
            psd.append(layer)
        except Exception as e:
            print(f"Layer Error: {label} - {e}")

    psd_path = os.path.join(output_dir, f"{name}.psd")
    psd.save(psd_path)
    print(f"PSD:{psd_path}")


sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, errors='replace')
sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, errors='replace')

parser = argparse.ArgumentParser()
parser.add_argument('-i', '--input', required=True)
parser.add_argument('-o', '--output', required=True)
parser.add_argument('-t', '--template', required=True)
args = parser.parse_args()

process_product(args.input, args.output, args.template)