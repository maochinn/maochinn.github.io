"""稽核 global.css 現有 token：算出每個紅色 token 的 HSL、跟其他 token 的 WCAG 對比，
驗證「所有紅其實是同一個色相 H0° 的單一 ramp」這個假設，供 brand guide 頁面引用。

用法：python scripts/brand-audit.py
"""
import colorsys

TOKENS = {
    '--bg':         '#601818',
    '--panel':      '#6d1c1c',
    '--card':       '#ea9999',
    '--accent':     '#000000',
    '--accent-hi':  '#2a0505',
    '--accent-deep':'#601818',
    '--gold':       '#d4af37',
    '--ink':        '#ffffff',
    '--mut':        '#c09a9a',
    '--mut-card':   '#400a0a',
    '--chip':       '#7a2020',
    '--chip-hi':    '#8a2828',
}


def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


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


print('=== HSL 一覽（驗證是否同色相）===')
rows = []
for name, hexv in TOKENS.items():
    rgb = hex_to_rgb(hexv)
    h, l, s = colorsys.rgb_to_hls(*(c / 255 for c in rgb))
    rows.append((name, hexv, h * 360, s * 100, l * 100))
    print(f'{name:14s} {hexv}  H{h*360:5.1f}  S{s*100:5.1f}%  L{l*100:5.1f}%')

print('\n=== 按 L（明度）排序，看是否構成一條平滑 ramp ===')
for name, hexv, h, s, l in sorted(rows, key=lambda r: r[4]):
    print(f'  L{l:5.1f}  {name:14s} {hexv}  H{h:5.1f} S{s:5.1f}')

print('\n=== 對比矩陣（只列出實際會疊字的關鍵配對）===')
pairs = [
    ('--bg', '--ink'), ('--bg', '--gold'), ('--bg', '--mut'), ('--bg', '--accent'),
    ('--panel', '--ink'), ('--panel', '--gold'),
    ('--chip', '--gold'), ('--chip', '--ink'),
    ('--card', '--accent'), ('--card', '--ink'), ('--card', '--gold'), ('--card', '--mut-card'), ('--card', '--accent-hi'),
    ('--bg', '--panel'),
]
for a, b in pairs:
    ra, rb = hex_to_rgb(TOKENS[a]), hex_to_rgb(TOKENS[b])
    c = contrast(ra, rb)
    tag = 'AA(4.5)' if c >= 4.5 else ('AA-large(3)' if c >= 3 else 'FAIL')
    print(f'  {a:12s} vs {b:12s}  {c:5.2f}:1   {tag}')
