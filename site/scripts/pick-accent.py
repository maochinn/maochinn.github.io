"""從〈狂三 禮服〉取樣紅裙主色，並檢驗它當 --accent 的對比度。

現行 --accent 是 #ed2553 ＝ nhentai 的品牌粉紅，跟狂三無關。
這裡改從使用者自己畫的狂三身上取真正的紅，再驗證是否還能當文字色用。

WCAG 對比度需求：--accent 有拿來當文字（.who-go a、.logo b、.empty b），
所以在 --bg (#0d0d0d) 上至少要 4.5:1（AA 一般文字）。

用法：python scripts/pick-accent.py
"""
from collections import Counter
import colorsys
from PIL import Image

SRC = 'src/content/galleries/78990595/01.png'
BG = (13, 13, 13)


def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def lum(rgb):
    r, g, b = (lin(v) for v in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


img = Image.open(SRC).convert('RGB')
img = img.resize((img.width // 6, img.height // 6), Image.LANCZOS)

# 只收「明確是紅色」的像素：色相在紅區、彩度夠高、不要太暗的陰影
reds = []
for r, g, b in img.getdata():
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    deg = h * 360
    if (deg < 18 or deg > 342) and s > 0.55 and v > 0.28:
        reds.append((r, g, b))

print(f'紅色像素 {len(reds)} / {img.width*img.height} = {len(reds)/(img.width*img.height):.1%}')

# 量化取眾數（把相近的紅併在一起）
q = Counter(((r // 12) * 12, (g // 12) * 12, (b // 12) * 12) for r, g, b in reds)
print('\n畫面上最主要的紅（取樣自禮服／玫瑰／紅簾）：')
for rgb, n in q.most_common(6):
    h, s, v = colorsys.rgb_to_hsv(*[x / 255 for x in rgb])
    print(f'  #{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}  {n:6d}px  '
          f'H{h*360:5.1f} S{s:.2f} V{v:.2f}  對比 {contrast(rgb, BG):.2f}:1')

# 平均紅（面積加權）
n = len(reds)
avg = tuple(sum(c[i] for c in reds) // n for i in range(3))
print(f'\n面積加權平均紅：#{avg[0]:02x}{avg[1]:02x}{avg[2]:02x}  對比 {contrast(avg, BG):.2f}:1')

print(f'\n現行 --accent #ed2553（nhentai 粉紅）對比 {contrast((237,37,83), BG):.2f}:1')

# 若取樣色對比不足，沿著明度往上找到剛好過 4.5:1 的版本（保留色相與彩度）
def bump(rgb, target=4.5):
    h, s, v = colorsys.rgb_to_hsv(*[c / 255 for c in rgb])
    for i in range(int(v * 100), 101):
        cand = tuple(round(c * 255) for c in colorsys.hsv_to_rgb(h, s, i / 100))
        if contrast(cand, BG) >= target:
            return cand, contrast(cand, BG)
    return None, None

print('\n把主色提亮到剛好通過 WCAG AA 4.5:1（保留色相/彩度）：')
for rgb, _ in q.most_common(3):
    fixed, c = bump(rgb)
    if fixed:
        h, s, v = colorsys.rgb_to_hsv(*[x / 255 for x in fixed])
        print(f'  #{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x} → #{fixed[0]:02x}{fixed[1]:02x}{fixed[2]:02x}'
              f'  對比 {c:.2f}:1   H{h*360:5.1f} S{s:.2f} V{v:.2f}')
