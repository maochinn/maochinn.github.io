"""舊 accent（nhentai 粉紅）vs 新 accent（狂三紅）的並排比對。

畫出色票、條紋帶、以及實際 UI 元件（logo、連結、卡片頂邊）的樣子，
讓人直接看差異，而不是看 hex 想像。

用法：python scripts/accent-compare.py
"""
import colorsys
from PIL import Image, ImageDraw, ImageFont

OUT = ('C:/Users/GinoChang/AppData/Local/Temp/claude/'
       'C--Users-GinoChang-Workspace-website/'
       '8c4dd339-f201-4549-993a-04433c7830f6/scratchpad/accent-compare.png')

BG, PANEL, LINE, MUT = (13, 13, 13), (31, 31, 31), (51, 51, 51), (143, 143, 143)
OLD, OLD_HI = (237, 37, 83), (255, 58, 104)     # #ed2553 / #ff3a68  nhentai
NEW, NEW_HI = (227, 57, 57), (255, 77, 77)      # #e33939 / #ff4d4d  狂三（取樣自禮服）
SAMPLED = (96, 24, 24)                          # #601818 禮服原色（未提亮）

W, H = 1180, 620


def font(sz, bold=False):
    for p in ((r'C:\Windows\Fonts\msjhbd.ttc',) if bold else (r'C:\Windows\Fonts\msjh.ttc',)):
        try:
            return ImageFont.truetype(p, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def contrast(a, b):
    la = 0.2126 * lin(a[0]) + 0.7152 * lin(a[1]) + 0.0722 * lin(a[2])
    lb = 0.2126 * lin(b[0]) + 0.7152 * lin(b[1]) + 0.0722 * lin(b[2])
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def hue(c):
    return colorsys.rgb_to_hsv(*[v / 255 for v in c])[0] * 360


img = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(img)


def column(x0, title, acc, acc_hi, sub):
    d.text((x0, 18), title, font=font(19, True), fill=(255, 255, 255))
    d.text((x0, 44), sub, font=font(12), fill=MUT)

    # 色票
    d.rectangle([x0, 70, x0 + 250, 150], fill=acc)
    d.text((x0 + 10, 78), f'#{acc[0]:02x}{acc[1]:02x}{acc[2]:02x}', font=font(15, True),
           fill=(255, 255, 255))
    d.text((x0 + 10, 100), f'H{hue(acc):.0f}°', font=font(13), fill=(255, 255, 255))
    d.text((x0 + 10, 122), f'對比 {contrast(acc, BG):.2f}:1', font=font(12), fill=(255, 255, 255))
    d.rectangle([x0 + 258, 70, x0 + 380, 150], fill=acc_hi)
    d.text((x0 + 266, 78), f'#{acc_hi[0]:02x}{acc_hi[1]:02x}{acc_hi[2]:02x}',
           font=font(12, True), fill=(20, 20, 20))
    d.text((x0 + 266, 98), 'hover', font=font(11), fill=(20, 20, 20))

    # 條紋帶（紅 8 : 黑 6，45°）
    y = 166
    band = Image.new('RGB', (380, 10), acc)
    bd = ImageDraw.Draw(band)
    for sx in range(-10, 380 + 14, 14):
        bd.line([(sx + 8, 10), (sx + 8 + 10, 0)], fill=BG, width=6)
    img.paste(band, (x0, y))
    d.text((x0, y + 16), '--stripe 條紋帶（紅 8 : 黑 6）', font=font(11), fill=MUT)

    # logo
    y = 212
    d.text((x0, y), 'mao', font=font(30, True), fill=(255, 255, 255))
    wlen = d.textlength('mao', font=font(30, True))
    d.text((x0 + wlen, y), 'chinn', font=font(30, True), fill=acc)

    # 文字連結（accent 當文字用 ⇒ 對比度是硬要求）
    y = 262
    d.text((x0, y), '看作品牆 →', font=font(14, True), fill=acc)
    d.text((x0 + 100, y), '逛 tag →', font=font(14, True), fill=acc)
    ok = contrast(acc, BG) >= 4.5
    d.text((x0 + 190, y + 1), 'AA 通過' if ok else 'AA 不足',
           font=font(11), fill=(90, 200, 120) if ok else (230, 90, 90))

    # who-card 模擬
    y = 296
    d.rectangle([x0, y, x0 + 380, y + 130], fill=PANEL, outline=LINE)
    band = Image.new('RGB', (381, 4), acc)
    bd = ImageDraw.Draw(band)
    for sx in range(-4, 381 + 14, 14):
        bd.line([(sx + 8, 4), (sx + 8 + 4, 0)], fill=BG, width=6)
    img.paste(band, (x0, y))
    d.text((x0 + 14, y + 16), '🎨 繪師  illustrator', font=font(14, True), fill=(255, 255, 255))
    d.text((x0 + 14, y + 42), '畫了十幾年，本命是時崎狂三。同人、原創、', font=font(12), fill=(196, 196, 196))
    d.text((x0 + 14, y + 62), '練習、塗鴉本都在站上，用 tag 宇宙串起來。', font=font(12), fill=(196, 196, 196))
    d.text((x0 + 14, y + 94), '看作品牆 →', font=font(13, True), fill=acc)

    # chip hover
    y = 444
    d.rectangle([x0, y, x0 + 88, y + 28], fill=(60, 60, 60))
    d.text((x0 + 12, y + 6), 'Pixiv', font=font(12, True), fill=(255, 255, 255))
    d.rectangle([x0 + 96, y, x0 + 184, y + 28], fill=acc)
    d.text((x0 + 108, y + 6), 'Pixiv', font=font(12, True), fill=(255, 255, 255))
    d.text((x0 + 192, y + 8), '← hover', font=font(11), fill=MUT)


column(40, '現行：nhentai 粉紅', OLD, OLD_HI, '#ed2553 — 站台沿用 nhentai 的品牌色，與狂三無關')
column(620, '提案：狂三紅', NEW, NEW_HI, '#e33939 — 取樣自〈狂三 禮服〉禮服主色，提亮至 AA')

d.line([(600, 14), (600, H - 60)], fill=(60, 60, 60), width=1)

# 取樣原色說明
y = H - 46
d.rectangle([620, y, 660, y + 30], fill=SAMPLED)
d.text((668, y - 2), f'#601818 ＝ 禮服上取樣的原色（H{hue(SAMPLED):.0f}°）',
       font=font(12), fill=(200, 200, 200))
d.text((668, y + 15), f'對比僅 {contrast(SAMPLED, BG):.2f}:1 → 不能當文字色，故保留色相/彩度提亮至 V0.89',
       font=font(11), fill=MUT)
d.text((40, y - 2), '差異：色相 H346°（帶藍的粉紅） → H0°（純血紅）',
       font=font(13, True), fill=(255, 220, 0))
d.text((40, y + 18), '兩者對比度相當（4.62 vs 4.54），換色不犧牲可讀性',
       font=font(11), fill=MUT)

img.save(OUT)
print(f'{OUT}  ({W}x{H})')
print(f'OLD #ed2553  H{hue(OLD):5.1f}  對比 {contrast(OLD, BG):.2f}:1')
print(f'NEW #e33939  H{hue(NEW):5.1f}  對比 {contrast(NEW, BG):.2f}:1')
print(f'NEW hover #ff4d4d  對比 {contrast(NEW_HI, BG):.2f}:1')
