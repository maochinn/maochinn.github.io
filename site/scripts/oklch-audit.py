"""用 OKLCH（感知均勻色彩空間，Material 3 / Radix Colors / shadcn 這代設計系統
產生色階的標準做法）重新檢視現有紅色 token，取代原本純 HSL 的驗算。

目的：
1. 看現有 8 個紅色 token 在感知空間裡是不是真的「等距階梯」，還是 HSL 看起來
   均勻、人眼其實不均勻（HSL 在低明度／高彩度區間會失真，這是它被現代系統
   淘汰的原因）。
2. 以品牌錨點 --bg #601818 為準，生成一條數學上乾淨的 OKLCH ramp 供比較。

用法：python scripts/oklch-audit.py
"""
import math

TOKENS = {
    'accent-hi': '#2a0505',
    'mut-card':  '#400a0a',
    'bg':        '#601818',
    'panel':     '#6d1c1c',
    'chip':      '#7a2020',
    'chip-hi':   '#8a2828',
    'mut':       '#c09a9a',
    'card':      '#ea9999',
    'gold':      '#d4af37',
    'accent':    '#000000',
    'ink':       '#ffffff',
}


def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) / 255 for i in (0, 2, 4))


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def linear_to_srgb(c):
    c = max(0.0, min(1.0, c))
    return c * 12.92 if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def rgb_to_oklab(rgb):
    r, g, b = (srgb_to_linear(c) for c in rgb)
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l_, m_, s_ = l ** (1/3), m ** (1/3), s ** (1/3)
    L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    return L, a, b2


def oklab_to_rgb(L, a, b2):
    l_ = L + 0.3963377774 * a + 0.2158037573 * b2
    m_ = L - 0.1055613458 * a - 0.0638541728 * b2
    s_ = L - 0.0894841775 * a - 1.2914855480 * b2
    l, m, s = l_**3, m_**3, s_**3
    r =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    b =  -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    return tuple(linear_to_srgb(c) for c in (r, g, b))


def oklab_to_lch(L, a, b):
    C = math.hypot(a, b)
    H = math.degrees(math.atan2(b, a)) % 360
    return L, C, H


def lch_to_hex(L, C, H):
    a = C * math.cos(math.radians(H))
    b = C * math.sin(math.radians(H))
    r, g, bl = oklab_to_rgb(L, a, b)
    return '#%02x%02x%02x' % tuple(round(max(0, min(1, c)) * 255) for c in (r, g, bl))


print('=== 現有 token 的 OKLCH（L 0-1, C, H°）===')
rows = []
for name, hexv in TOKENS.items():
    L, a, b = rgb_to_oklab(hex_to_rgb(hexv))
    L2, C, H = oklab_to_lch(L, a, b)
    rows.append((name, hexv, L2, C, H))
    print(f'{name:10s} {hexv}  L{L2:.3f}  C{C:.3f}  H{H:6.1f}°')

print('\n=== 按 L 排序（紅色家族，排除 gold/黑/白）===')
reds = [r for r in rows if r[0] not in ('gold', 'accent', 'ink')]
for name, hexv, L, C, H in sorted(reds, key=lambda r: r[2]):
    print(f'  L{L:.3f}  C{C:.3f}  H{H:6.1f}°  {name:10s} {hexv}')

# 品牌錨點 = --bg，取它的 hue/chroma 當「哥德紅」的定義色相
anchor_L, anchor_a, anchor_b = rgb_to_oklab(hex_to_rgb(TOKENS['bg']))
_, anchor_C, anchor_H = oklab_to_lch(anchor_L, anchor_a, anchor_b)
print(f'\n錨點 --bg 的 OKLCH：L{anchor_L:.3f} C{anchor_C:.3f} H{anchor_H:.1f}°')

print('\n=== 用錨點的 H 固定、C 微調，生成等距 L 的乾淨 ramp（僅供比較，非定案）===')
Ls = [0.12, 0.18, 0.28, 0.335, 0.375, 0.42, 0.52, 0.62, 0.80]
for L in Ls:
    # chroma 在極暗/極亮處自動收一點，避免出界（跟 Radix/Material 3 的做法一樣）
    c_scale = 1.0
    if L < 0.2:
        c_scale = L / 0.2
    if L > 0.75:
        c_scale = (1 - L) / 0.25
    C = anchor_C * min(1.0, max(0.35, c_scale))
    hexv = lch_to_hex(L, C, anchor_H)
    print(f'  L{L:.3f}  C{C:.3f}  →  {hexv}')
