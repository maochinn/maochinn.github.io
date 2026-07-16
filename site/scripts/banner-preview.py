"""模擬 hero banner 的實際渲染，用來肉眼比對裁切與文字可讀性。

複製 CSS 的行為：object-fit: cover + object-position: 50% P% + 雙層漸層，
再把文字區的實際佔位畫上去，確認白色棋盤格不會頂到字。

用法：python scripts/banner-preview.py [P ...]      預設 60（定案值）
"""
import sys
from PIL import Image, ImageDraw, ImageFont

SRC = 'src/content/galleries/78990595/01.png'
OUT = ('C:/Users/GinoChang/AppData/Local/Temp/claude/'
       'C--Users-GinoChang-Workspace-website/'
       '8c4dd339-f201-4549-993a-04433c7830f6/scratchpad/banner-preview.png')

CW, CH = 1180, 460
BG = (13, 13, 13)
ACCENT = (237, 37, 83)
CANDIDATES = [int(a) for a in sys.argv[1:]] or [60]


def font(sz, bold=False):
    for p in (r'C:\Windows\Fonts\msjhbd.ttc' if bold else r'C:\Windows\Fonts\msjh.ttc',
              r'C:\Windows\Fonts\arialbd.ttf' if bold else r'C:\Windows\Fonts\arial.ttf'):
        try:
            return ImageFont.truetype(p, sz)
        except OSError:
            continue
    return ImageFont.load_default()


src = Image.open(SRC).convert('RGB')
IW, IH = src.size
scale = max(CW / IW, CH / IH)
SW, SH = round(IW * scale), round(IH * scale)
scaled = src.resize((SW, SH), Image.LANCZOS)


def ramp(stops, n):
    out = []
    for i in range(n):
        t = i / max(n - 1, 1)
        for j in range(len(stops) - 1):
            t0, a0 = stops[j]
            t1, a1 = stops[j + 1]
            if t0 <= t <= t1:
                f = (t - t0) / (t1 - t0) if t1 > t0 else 0
                out.append(round(255 * (a0 + (a1 - a0) * f)))
                break
    return out


# CSS: 90deg .95/0 .93/26 .78/40 .35/54 .05/80 .02/100  —— 與 global.css 同步
LG = Image.new('L', (CW, 1))
LG.putdata(ramp([(0, .95), (.26, .93), (.40, .78), (.54, .35), (.80, .05), (1, .02)], CW))
LG = LG.resize((CW, CH))

# CSS: linear-gradient(0deg, bg 0%, transparent 30%)  —— 0deg 由下往上
col = ramp([(0, 1.0), (.30, 0.0), (1, 0.0)], CH)[::-1]
BGm = Image.new('L', (1, CH))
BGm.putdata(col)
BGm = BGm.resize((CW, CH))

flat = Image.new('RGB', (CW, CH), BG)
tiles = []
for P in CANDIDATES:
    off = round((SH - CH) * P / 100)
    t = scaled.crop((round((SW - CW) / 2), off, round((SW - CW) / 2) + CW, off + CH))
    t = Image.composite(flat, t, LG)
    t = Image.composite(flat, t, BGm)
    d = ImageDraw.Draw(t)

    # 文字區實際佔位（padding 16px、align-items: flex-end、padding-bottom 26px）
    x, base = 16, CH - 26
    d.text((x, base - 150), 'maochinn', font=font(60, True), fill=(255, 255, 255))
    d.text((x, base - 78), '資工碼農 / 毒瘤畫手 / 狂三我婆', font=font(21, True), fill=(255, 255, 255))
    d.text((x, base - 46), '畫圖的圖學工程師。這裡是我的作品與文章全集 —— 圖集、技術筆記、隨手塗鴉。',
           font=font(13), fill=(207, 207, 207))
    for i, lbl in enumerate(['44 圖集', '240 文章', '2235 動態', '64 影片']):
        bx = x + i * 104
        d.rectangle([bx, base - 24, bx + 96, base], outline=(51, 51, 51), fill=(31, 31, 31))
        d.text((bx + 9, base - 19), lbl, font=font(12), fill=(200, 200, 200))

    # 條紋帶收邊（紅 8 : 黑 6，45°）——先畫在 6px 高的獨立圖上再貼，
    # 直接在 t 上畫對角線會蓋滿整張（斜線跨越整個高度）
    band = Image.new('RGB', (CW, 6), ACCENT)
    bd = ImageDraw.Draw(band)
    for sx in range(-6, CW + 14, 14):
        bd.line([(sx + 8, 6), (sx + 8 + 6, 0)], fill=BG, width=6)
    t.paste(band, (0, CH - 6))

    d = ImageDraw.Draw(t)
    d.text((14, 8), f'object-position-y: {P}%  (原圖 {off/SH:.0%}–{(off+CH)/SH:.0%})',
           font=font(13, True), fill=(255, 220, 0))
    tiles.append(t)

sheet = Image.new('RGB', (CW, (CH + 10) * len(tiles)), (40, 40, 40))
for i, t in enumerate(tiles):
    sheet.paste(t, (0, i * (CH + 10)))
sheet.save(OUT)
print(f'{OUT}  ({sheet.size[0]}x{sheet.size[1]})  P={CANDIDATES}')
