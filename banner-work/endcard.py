# -*- coding: utf-8 -*-
"""一笔画城 60s 主视频片尾卡：宣纸底 + 真实编译路线（福@北京快照）+ 程序排版。
输出 1920x1080 PNG，供 ffmpeg 推拉动成定格段。"""
import json, math, random, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

FONT = r"C:/Users/lh836/Documents/Qoder/2026-09-27/181b0239/public/assets/fonts/ink-glyphs.ttf"
# ink-glyphs 是字形编译用的子集字体，缺全部拉丁字母与标点；正文/数据行必须用全量字体
FONT_TEXT = r"C:/Windows/Fonts/NotoSerifSC-VF.ttf"
SNAP = r"C:/Users/lh836/Documents/Qoder/2026-09-27/181b0239/src/data/snapshots.json"
OUT = r"D:/video_output/inktrail-city/kf/endcard.png"
URL = "inktrail-city-ntvxzygae05.qoder.website"

W, H = 1920, 1080
INK = (31, 27, 22)        # #1F1B16
INK_SOFT = (74, 66, 56)
GOLD = (201, 162, 39)     # #C9A227
CINNABAR = (168, 58, 42)  # #A83A2A
PAPER = (245, 239, 227)   # #F5EFE3

random.seed(42)

# ---------- 宣纸底（纤维噪点） ----------
base = Image.new("RGB", (W, H), PAPER)
noise = Image.effect_noise((W // 2, H // 2), 14).resize((W, H), Image.BILINEAR)
noise = noise.filter(ImageFilter.GaussianBlur(0.6))
base = Image.blend(base, Image.merge("RGB", (noise, noise, noise)), 0.05)

card = base.copy()
d = ImageDraw.Draw(card, "RGBA")

# ---------- 左侧排版区 / 右侧路线区 ----------
PANEL_W = 1240          # 右侧路线面板宽
ROUTE_X0, ROUTE_Y0 = W - PANEL_W, 0

snap = json.load(open(SNAP, encoding="utf-8"))
route = snap["route"]

# 路线 bbox 与等经距投影
pts = [(p["lng"], p["lat"]) for seg in route["segments"] for p in (seg["from"], seg["to"])]
pts += [(p["lng"], p["lat"]) for st in route["idealStrokes"] for p in st]
lngs = [p[0] for p in pts]; lats = [p[1] for p in pts]
k = math.cos((sum(lats) / len(lats)) * math.pi / 180)

def project(lng, lat):
    x = (lng - lngs[0]) * 111320 * k
    y = (lat - lats[0]) * 110540
    return x, y

wp = [project(*p) for p in pts]
wxs = [p[0] for p in wp]; wys = [p[1] for p in wp]
span_x = max(wxs) - min(wxs); span_y = max(wys) - min(wys)

# 路线面板内边距与等比缩放（福字偏方，横向铺开面板上限）
MARGIN = 150
avail_w, avail_h = PANEL_W - MARGIN * 2, H - MARGIN * 2
scale = min(avail_w / span_x, avail_h / span_y)
left = ROUTE_X0 + MARGIN + (avail_w - span_x * scale) / 2
top = MARGIN + (avail_h - span_y * scale) / 2 + span_y * scale

def to_px(x, y):
    return (left + (x - min(wxs)) * scale, top - (y - min(wys)) * scale)

route_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
rd = ImageDraw.Draw(route_layer)

def draw_stroke(points, color, width):
    pxs = [to_px(*project(p["lng"], p["lat"])) for p in points]
    rd.line(pxs, fill=color, width=width, joint="curve")

# 理想墨骨（浅墨衬底，视觉重心让给真实编译的金路线）
for st in route["idealStrokes"]:
    draw_stroke(st, (31, 27, 22, 55), 7)

# 金路线（光晕 + 实线）
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
for seg in route["segments"]:
    for pl, col, wd in (((seg["from"], seg["to"]), (201, 162, 39, 70), 22),):
        gd.line([to_px(*project(pl[0]["lng"], pl[0]["lat"])),
                 to_px(*project(pl[1]["lng"], pl[1]["lat"]))], fill=col, width=wd)
glow = glow.filter(ImageFilter.GaussianBlur(9))
card = Image.alpha_composite(card.convert("RGBA"), glow)
card = Image.alpha_composite(card, route_layer)
d = ImageDraw.Draw(card)

for seg in route["segments"]:
    a = to_px(*project(seg["from"]["lng"], seg["from"]["lat"]))
    b = to_px(*project(seg["to"]["lng"], seg["to"]["lat"]))
    d.line([a, b], fill=GOLD + (255,), width=5)

# 朱砂起点/终点
if route["segments"]:
    s0 = to_px(*project(route["segments"][0]["from"]["lng"], route["segments"][0]["from"]["lat"]))
    d.ellipse([s0[0] - 9, s0[1] - 9, s0[0] + 9, s0[1] + 9], fill=CINNABAR + (255,))

# 面板左侧宣纸 soft 分隔（RGBA 混合模式）
sep = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(sep, "RGBA")
for i in range(46):
    sd.line([(ROUTE_X0 + i, 0), (ROUTE_X0 + i, H)], fill=(31, 27, 22, 6))
sep = sep.filter(ImageFilter.GaussianBlur(6))
card = Image.alpha_composite(card, sep)
d = ImageDraw.Draw(card, "RGBA")

# ---------- 左栏排版 ----------
TX = 120
COL_W = 520                      # 左栏可用宽（路线面板自 x=680 起）
font_title = ImageFont.truetype(FONT, 150)
font_sub = ImageFont.truetype(FONT, 52)
font_seal = ImageFont.truetype(FONT, 64)
font_line = ImageFont.truetype(FONT_TEXT, 36)
font_foot = ImageFont.truetype(FONT_TEXT, 28)
font_note = ImageFont.truetype(FONT_TEXT, 26)


def fit_font(text, path, size, limit):
    """Latin 串按可用宽自动缩号，避免压到路线面板。"""
    while size > 16 and ImageDraw.Draw(Image.new("RGB", (8, 8))).textlength(text, font=ImageFont.truetype(path, size)) > limit:
        size -= 1
    return ImageFont.truetype(path, size)


font_url = fit_font(URL, FONT_TEXT, 30, COL_W)

ty = 250
d.text((TX, ty), "一笔画城", font=font_title, fill=INK)
ty += 190
d.text((TX + 6, ty), "用脚步写一座城", font=font_sub, fill=INK_SOFT)
ty += 96
d.line([(TX + 6, ty), (TX + 420, ty)], fill=GOLD, width=4)
ty += 66
for ln in ("写一个字，", "编译成一条真实的城市路线。"):
    d.text((TX + 6, ty), ln, font=font_line, fill=INK_SOFT)
    ty += 58

# 朱砂福印
sx, sy, ss = TX + 6, ty + 40, 84
d.rectangle([sx, sy, sx + ss, sy + ss], fill=CINNABAR)
tw, th = d.textbbox((0, 0), "福", font=font_seal)[2:]
d.text((sx + (ss - tw) / 2, sy + (ss - th) / 2 - 6), "福", font=font_seal, fill=PAPER)

# 底部：赛事署名 + 演示地址
fy = H - 150
d.line([(TX + 6, fy - 26), (TX + 420, fy - 26)], fill=(31, 27, 22, 60), width=2)
d.text((TX + 6, fy), "百度地图开发者创作大赛 · 参赛作品", font=font_foot, fill=INK_SOFT)
d.text((TX + 6, fy + 44), URL, font=font_url, fill=GOLD)

# ---------- 右下角数据小注（数值全部取自快照，不写字面量） ----------
note = (f"福 @ {snap['cityId']} · {len(route['segments'])}段 · "
        f"{route['distanceM'] / 1000:.1f}km · 保真度 {route['fidelity'] * 100:.0f}%")
d.text((W - 60 - d.textlength(note, font=font_note), H - 54), note, font=font_note, fill=(74, 66, 56, 200))

# ---------- 字形覆盖自检：子集字体的缺字会静默消失，必须显式拦截 ----------
def uncovered(font, text):
    return {c for c in text if c.strip() and font.getmask(c).getbbox() is None}


bad = []
for fnt, txt in ((font_title, "一笔画城"), (font_sub, "用脚步写一座城"), (font_seal, "福"),
                 (font_line, "写一个字，编译成一条真实的城市路线。"),
                 (font_foot, "百度地图开发者创作大赛 · 参赛作品"), (font_url, URL), (font_note, note)):
    miss = uncovered(fnt, txt)
    if miss:
        bad.append((fnt.path, "".join(sorted(miss))))
if bad:
    for p, m in bad:
        print("GLYPH MISSING", p, "->", m)
    raise SystemExit("endcard: font lacks glyphs, refusing to write a card with dropped characters")

card.convert("RGB").save(OUT, "PNG")
import os
print("saved", OUT, card.size, f"{os.path.getsize(OUT)/1024:.0f}KB")
print("note:", note, "| url px:", round(d.textlength(URL, font=font_url)))
