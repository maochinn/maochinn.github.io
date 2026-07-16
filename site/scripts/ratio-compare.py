"""「6 紅 : 3 純黑 : 1 金」vs 現況的實地比對，並實測三色的實際佔比。

重點：卡片／header／邊框都是純黑 ⇒ 圖與內文仍站在中性黑上，
紅只出現在牆面。順便數出畫面上三色的真實像素佔比，驗證有沒有真的 6:3:1。

用法：python scripts/ratio-compare.py
"""
import glob
import io
import os
import sys

import yaml
from PIL import Image, ImageDraw, ImageFont

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

OUT = ('C:/Users/GinoChang/AppData/Local/Temp/claude/'
       'C--Users-GinoChang-Workspace-website/'
       '8c4dd339-f201-4549-993a-04433c7830f6/scratchpad/ratio-compare.png')

# (標題, bg, panel/card=純黑?, ink, accent, mut, 說明)
SCHEMES = [
    ('A · 現況（今天上線）', (13, 13, 13), (31, 31, 31), (38, 38, 38),
     (255, 255, 255), (227, 57, 57), (143, 143, 143),
     '黑底 + 狂三紅強調'),
    ('F · 6 紅 : 3 純黑 : 1 金 ★', (96, 24, 24), (0, 0, 0), (0, 0, 0),
     (255, 255, 255), (212, 175, 55), (192, 154, 154),
     '紅牆 + 純黑卡片/邊框 + 金點綴'),
]

TW, TH = 138, 196
COLS = 4
PAD = 14
CW = PAD + COLS * (TW + 9) + PAD
HEAD = 100
WALL_H = 2 * (TH + 32) + 12
PANEL_H = HEAD + WALL_H + 92


def font(sz, bold=False):
    try:
        return ImageFont.truetype(
            r'C:\Windows\Fonts\msjhbd.ttc' if bold else r'C:\Windows\Fonts\msjh.ttc', sz)
    except OSError:
        return ImageFont.load_default()


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

sheet = Image.new('RGB', (CW * 2, PANEL_H), (26, 26, 26))
stats = []

for i, (name, bg, panel, card, ink, acc, mut, note) in enumerate(SCHEMES):
    p = Image.new('RGB', (CW, PANEL_H), bg)
    d = ImageDraw.Draw(p)

    # header（純黑面板）
    d.rectangle([0, 0, CW, 48], fill=panel)
    d.text((PAD, 13), 'mao', font=font(21, True), fill=ink)
    wl = d.textlength('mao', font=font(21, True))
    d.text((PAD + wl, 13), 'chinn', font=font(21, True), fill=acc)
    for j, nav in enumerate(['首頁', '關於', '部落格']):
        d.text((PAD + 150 + j * 54, 17), nav, font=font(12, True), fill=(204, 204, 204))

    # 條紋帶：黑 8 : 金 6
    band = Image.new('RGB', (CW, 5), (0, 0, 0))
    bd = ImageDraw.Draw(band)
    for sx in range(-5, CW + 14, 14):
        bd.line([(sx + 8, 5), (sx + 8 + 5, 0)], fill=acc, width=6)
    p.paste(band, (0, 48))

    d.text((PAD, 62), name, font=font(15, True), fill=ink)
    d.text((PAD, 82), note, font=font(10), fill=mut)

    # 封面牆：卡片底＝純黑
    for j, (title, th) in enumerate(thumbs):
        cx = PAD + (j % COLS) * (TW + 9)
        cy = HEAD + (j // COLS) * (TH + 32)
        d.rectangle([cx - 1, cy - 1, cx + TW + 1, cy + TH + 25], fill=card,
                    outline=(0, 0, 0))
        p.paste(th, (cx, cy))
        d.text((cx + 5, cy + TH + 5), title[:8], font=font(10, True), fill=ink)

    # 三色佔比實測
    px = list(p.getdata())
    def near(c, t, tol=26):
        return all(abs(a - b) <= tol for a, b in zip(c, t))
    n_red = sum(1 for c in px if near(c, bg) and bg[0] > bg[1] * 1.4)
    n_blk = sum(1 for c in px if near(c, (0, 0, 0), 18))
    n_gold = sum(1 for c in px if near(c, acc, 40))
    tot = len(px)
    stats.append((name, n_red / tot, n_blk / tot, n_gold / tot))

    y = HEAD + WALL_H + 8
    d.text((PAD, y), f'紅 {n_red/tot:.0%}   純黑 {n_blk/tot:.0%}   金 {n_gold/tot:.1%}',
           font=font(13, True), fill=ink)
    d.text((PAD, y + 24), '（含縮圖本身的像素，僅供粗估）', font=font(10), fill=mut)
    d.text((PAD, y + 44), '圖站在純黑上 → 中性展示不受紅牆影響' if bg[0] > 40
           else '圖站在黑底上（現況）', font=font(11), fill=acc)

    sheet.paste(p, (i * CW, 0))

sheet.save(OUT)
print(f'{OUT}  ({sheet.size[0]}x{sheet.size[1]})')
for n, r, b, g in stats:
    print(f'{n:26s} 紅 {r:5.1%}  黑 {b:5.1%}  金 {g:4.1%}')
