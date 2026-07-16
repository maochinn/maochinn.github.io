"""「整站紅黑顛倒」的實地模擬：把真實的封面牆放進四種底色，直接比對。

回答兩個問題：
  1. 刺不刺眼 → 看大面積紅底的實際觀感 + WCAG 對比數字
  2. 會不會傷到畫 → 同時對比效應（紅底把相鄰色往補色推），這才是繪師站的關鍵

用法：python scripts/invert-compare.py
"""
import glob
import os
from PIL import Image, ImageDraw, ImageFont

import yaml

OUT = ('C:/Users/GinoChang/AppData/Local/Temp/claude/'
       'C--Users-GinoChang-Workspace-website/'
       '8c4dd339-f201-4549-993a-04433c7830f6/scratchpad/invert-compare.png')

# 四種方案：(標題, --bg, --card, 文字色, accent, 說明)
SCHEMES = [
    ('A · 現況', (13, 13, 13), (38, 38, 38), (255, 255, 255), (227, 57, 57),
     '黑底 + 狂三紅強調（今天上線的版本）'),
    ('B · 顛倒：深紅底 + 黑強調', (96, 24, 24), (122, 34, 34), (255, 255, 255), (13, 13, 13),
     '字面顛倒。黑強調在紅底上只有 1.52:1 → logo 會消失'),
    ('E · 深紅底 + 金強調 ★', (96, 24, 24), (122, 34, 34), (255, 255, 255), (212, 175, 55),
     '#601818 底 + #d4af37（狂三左眼時鐘的金）6.08:1'),
    ('D · 顛倒：亮紅底', (227, 57, 57), (240, 90, 90), (255, 255, 255), (13, 13, 13),
     '#e33939 直接鋪底 —— 白字 4.28:1 不合格且刺眼'),
]

TW, TH = 132, 188          # 縮圖尺寸
COLS = 4
PAD = 12
CW = PAD + COLS * (TW + 8) + PAD          # 單欄寬
HEAD = 92
WALL_H = 2 * (TH + 30) + 10
PANEL_H = HEAD + WALL_H + 78


def font(sz, bold=False):
    try:
        return ImageFont.truetype(
            r'C:\Windows\Fonts\msjhbd.ttc' if bold else r'C:\Windows\Fonts\msjh.ttc', sz)
    except OSError:
        return ImageFont.load_default()


def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def L(c):
    return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])


def cr(a, b):
    la, lb = L(a), L(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


# 取 8 張 rating=all 的真實封面
covers = []
for d in sorted(glob.glob('src/content/galleries/*/meta.yaml')):
    m = yaml.safe_load(open(d, encoding='utf-8'))
    if m.get('rating') == 'all' and m.get('cover'):
        p = os.path.join(os.path.dirname(d), m['cover'])
        if os.path.exists(p):
            covers.append((m['title'], p))
    if len(covers) >= 8:
        break

thumbs = []
for title, p in covers:
    im = Image.open(p).convert('RGB')
    s = max(TW / im.width, TH / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x = (im.width - TW) // 2
    thumbs.append((title, im.crop((x, 0, x + TW, TH))))

sheet = Image.new('RGB', (CW * 2, PANEL_H * 2), (24, 24, 24))

for i, (name, bg, card, ink, acc, note) in enumerate(SCHEMES):
    panel = Image.new('RGB', (CW, PANEL_H), bg)
    d = ImageDraw.Draw(panel)

    # header 區（模擬 --panel 比 --bg 略亮）
    hp = tuple(min(255, c + 18) for c in bg)
    d.rectangle([0, 0, CW, 46], fill=hp)
    d.text((PAD, 12), 'mao', font=font(20, True), fill=ink)
    wl = d.textlength('mao', font=font(20, True))
    d.text((PAD + wl, 12), 'chinn', font=font(20, True), fill=acc)

    # 條紋帶（紅 8 : 黑 6 或其顛倒）
    band = Image.new('RGB', (CW, 4), acc)
    bd = ImageDraw.Draw(band)
    for sx in range(-4, CW + 14, 14):
        bd.line([(sx + 8, 4), (sx + 8 + 4, 0)], fill=bg, width=6)
    panel.paste(band, (0, 46))

    d.text((PAD, 58), name, font=font(15, True), fill=ink)
    d.text((PAD, 78), note, font=font(10), fill=tuple(
        int(a * .62 + b * .38) for a, b in zip(ink, bg)))

    # 封面牆
    for j, (title, th) in enumerate(thumbs):
        cx = PAD + (j % COLS) * (TW + 8)
        cy = HEAD + (j // COLS) * (TH + 30)
        panel.paste(th, (cx, cy))
        d.rectangle([cx, cy + TH, cx + TW, cy + TH + 22], fill=card)
        d.text((cx + 5, cy + TH + 4), title[:8], font=font(10, True), fill=ink)

    # 對比數字
    y = HEAD + WALL_H + 6
    ok_ink = cr(ink, bg)
    ok_acc = cr(acc, bg)
    d.text((PAD, y), f'白字 on 底 {ok_ink:.2f}:1  ' +
           ('✔ AA' if ok_ink >= 4.5 else '✘ AA 不足'),
           font=font(11, True), fill=(120, 230, 150) if ok_ink >= 4.5 else (255, 140, 140))
    d.text((PAD, y + 18), f'強調色 on 底 {ok_acc:.2f}:1  ' +
           ('✔ AA' if ok_acc >= 4.5 else '✘ AA 不足'),
           font=font(11, True), fill=(120, 230, 150) if ok_acc >= 4.5 else (255, 140, 140))
    # 紅色占畫面比例（粗估：底色若為紅系則幾乎全滿）
    redish = bg[0] > bg[1] * 1.5 and bg[0] > 30
    d.text((PAD, y + 38), f'底色紅調：{"是 → 紅大於黑 ✔" if redish else "否（黑為主）"}',
           font=font(11), fill=ink)

    sheet.paste(panel, ((i % 2) * CW, (i // 2) * PANEL_H))

sheet.save(OUT)
print(f'{OUT}  ({sheet.size[0]}x{sheet.size[1]})')
for name, bg, card, ink, acc, _ in SCHEMES:
    print(f'{name:16s} bg#{bg[0]:02x}{bg[1]:02x}{bg[2]:02x}  '
          f'白字 {cr(ink, bg):5.2f}:1   強調 {cr(acc, bg):5.2f}:1')
