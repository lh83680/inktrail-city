"""一笔画城参赛 Banner 合成：AI 视觉（无文字）+ 程序排版（OFL 字体）→ 1200×675 JPG"""
from PIL import Image, ImageDraw, ImageFont
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = r"output/race2/race_nano-banana-2_candidate_2.png"
FONT = r"../public/assets/fonts/ink-glyphs.ttf"
OUT = r"banner-1200x675.jpg"

W, H = 1200, 675
INK = (31, 27, 22)        # #1F1B16
GOLD = (201, 162, 39)     # #C9A227
CINNABAR = (168, 58, 42)  # #A83A2A
PAPER = (245, 239, 227)   # #F5EFE3

base = Image.open(BASE).convert("RGB")
# 同比例缩放（源 5504x3072 = 16:9；若比例不一则居中裁切）
if abs(base.width / base.height - W / H) > 0.01:
    ratio = W / H
    if base.width / base.height > ratio:
        nw = int(base.height * ratio)
        x = (base.width - nw) // 2
        base = base.crop((x, 0, x + nw, base.height))
    else:
        nh = int(base.width / ratio)
        y = (base.height - nh) // 2
        base = base.crop((0, y, base.width, y + nh))
img = base.resize((W, H), Image.LANCZOS)

d = ImageDraw.Draw(img)
font_title = ImageFont.truetype(FONT, 72)
font_sub = ImageFont.truetype(FONT, 30)
font_tag = ImageFont.truetype(FONT, 20)
font_seal = ImageFont.truetype(FONT, 30)

# 主标（左上留白区）
d.text((72, 84), "一笔画城", font=font_title, fill=INK)
# 副标
d.text((76, 178), "用脚步写一座城", font=font_sub, fill=(60, 52, 44))
# 金色细规线
d.line([(76, 226), (300, 226)], fill=GOLD, width=3)

# 朱砂印（福）
sx, sy, ss = 76, 246, 46
d.rectangle([sx, sy, sx + ss, sy + ss], fill=CINNABAR)
tw, th = d.textbbox((0, 0), "福", font=font_seal)[2:]
d.text((sx + (ss - tw) / 2, sy + (ss - th) / 2 - 2), "福", font=font_seal, fill=PAPER)

# 赛事角标（右下，小字墨色）
tag = "百度地图开发者创作大赛 · 创意应用"
d.text((W - 76 - d.textlength(tag, font=font_tag), H - 44), tag, font=font_tag, fill=(90, 82, 72))

img.save(OUT, "JPEG", quality=92, dpi=(96, 96))
import os
print("saved", OUT, img.size, f"{os.path.getsize(OUT)/1024:.0f}KB")
