"""把 global.css 切換成「深紅牆 + 亮紅黑字區塊」／或切回現況，用於 dev 預覽。

切回：python scripts/try-invert.py --revert
（更保險：git checkout src/styles/global.css src/layouts/Layout.astro）

配色（使用者 2026-07-17 定案）：整站以紅為主，分兩層紅：

  牆／header／footer  深紅 #601818 + **白字**（12.80:1）+ 金點綴（6.08:1）
  所有卡片            亮紅 #e33939 + **黑字**（4.91:1）
  線段                純黑實線（不是條紋）
  金 #d4af37          只給重點：logo 的 n、搜尋按鈕的底

為什麼要分兩層 —— 這不是風格選擇，是對比度算出來的：
  · 黑字要過 AA 4.5:1，紅底至少要 #e33939（深紅上的黑字只有 1.64:1）
  · 但白字在 #e33939 上只有 4.28:1 不合格 ⇒ 亮紅區塊只能放黑字
  · 金在 #e33939 上只有 2.03:1 會消失 ⇒ header 必須留在深紅，金才活得下來
  · 亮紅上做不出次要色層次（比黑淺一階就掉到 3.27:1）⇒ 卡片內靠字級/字重分層
"""
import io
import pathlib
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

CSS = pathlib.Path('src/styles/global.css')

TOKENS = [
    ('--bg: #0d0d0d;', '--bg: #601818;'),          # 深紅牆
    ('--panel: #1f1f1f;', '--panel: #6d1c1c;'),    # header/footer：略亮的深紅，金仍 5.45:1
    ('--card: #262626;', '--card: #e33939;'),      # 亮紅卡片 ＝ 黑字區塊
    ('--line: #333;', '--line: #000000;'),         # 純黑線段
    ('--accent: #e33939;', '--accent: #000000;'),  # 強調＝純黑（線、邊、標記）
    ('--accent-hi: #ff4d4d;', '--accent-hi: #2a0505;'),
    ('--mut: #8f8f8f;', '--mut: #c09a9a;'),        # 深紅牆上的次要色 5.08:1
    ('--chip: #3c3c3c;', '--chip: #7a2020;'),
    ('--chip-hi: #555;', '--chip-hi: #8a2828;'),
    ('''--stripe: repeating-linear-gradient(45deg,
             var(--accent) 0 8px, #0d0d0d 8px 14px);''',
     '--stripe: #000000;'),                        # 線段＝一條純黑，不要條紋
]

HARDCODED = [
    # ── header ＝ 黑字區塊 ⇒ 用 --card（亮紅）而不是 --panel。
    #    --panel 還被閱讀器/分頁/引言用著，改它會波及那些地方。
    #    header 一定要亮紅：logo 全黑在深紅上只有 1.83:1 會看不見。
    ('header.site {\n  background: var(--panel);',
     'header.site {\n  background: var(--card);\n  color: #000;'),
    ('nav.site a {\n  padding: 6px 12px; color: #ccc;',
     'nav.site a {\n  padding: 6px 12px; color: #000;'),
    ('.logo small {\n  display: block; font-size: 9px; font-weight: 400;\n  color: var(--mut);',
     '.logo small {\n  display: block; font-size: 9px; font-weight: 400;\n  color: #000;'),
    # 搜尋框：亮紅 header 上的輸入框 ⇒ 黑字
    ('  color: var(--ink); padding: 8px 12px; font-size: 14px;',
     '  color: #000; padding: 8px 12px; font-size: 14px;'),
    # 搜尋按鈕＝金底黑字 + 純黑外框。金在亮紅上色差僅 2.03:1，
    # 邊界得靠黑框（4.91:1）界定，否則按鈕會糊在 header 裡。
    ('.search button {\n  background: var(--accent); border: 0; color: #fff;',
     '.search button {\n  background: var(--gold); border: 1px solid #000; color: #000;'),
    ('.search button:hover { background: var(--accent-hi); }',
     '.search button:hover { background: #f0c850; }'),
    ('.search input::placeholder { color: #666; }',
     '.search input::placeholder { color: #7a1414; }'),

    # ── --accent 現在是純黑 ⇒ 凡是「拿 accent 當文字色、且底是深紅」的都會變 1.6–1.8:1
    #    看不見。這幾處改用白字（金要留給搜尋按鈕，不能到處撒）。
    ('h2.sec .clear { margin-left: auto; font-size: 12px; color: var(--accent);',
     'h2.sec .clear { margin-left: auto; font-size: 12px; color: #fff;'),
    ('.r-top .back { cursor: pointer; color: var(--accent);',
     '.r-top .back { cursor: pointer; color: #fff;'),
    ('.empty b { color: var(--accent); }', '.empty b { color: #fff; }'),
    # hero 的大標題壓在插畫＋深紅漸層上 ⇒ 全白（黑字在那上面讀不到）
    ('.hero-name b { color: var(--accent); font-weight: 900; }',
     '.hero-name b { color: #fff; font-weight: 900; }'),
    ('.hero-tag .sep { color: var(--accent); font-weight: 400; }',
     '.hero-tag .sep { color: var(--mut); font-weight: 400; }'),

    ('rgba(13,13,13,', 'rgba(96,24,24,'),          # hero 漸層 → 深紅
    ('rgba(13, 13, 13,', 'rgba(96, 24, 24,'),      # R18 遮罩
    ('background: #171717;', 'background: #601818;'),          # .cover 圖片襯底＝深紅
    ('linear-gradient(160deg, #232323, #141414 70%)',
     'linear-gradient(160deg, #ef5555, #d63030 70%)'),         # .text-cover＝亮紅系
    ('background: #111;', 'background: #f05555;'),             # .search input（亮紅+黑字）
    ('background: #161616;', 'background: #4a1010;'),          # .prose pre / .who-note
    ('background: #2a2a2a;', 'background: #7a2020;'),          # .prose code
    ('color: #ffb3b3;', 'color: #ffd0d0;'),                    # .prose code 字（深紅底上）

    # 卡片＝亮紅 ⇒ 卡片內一律黑字（原本這些都站在暗底上、是白/灰字）
    ('  line-height: 1.35; color: #fff;',
     '  line-height: 1.35; color: #000;'),                     # .cap
    ('  font-weight: 900; font-size: 16px; line-height: 1.5; color: #eee;',
     '  font-weight: 900; font-size: 16px; line-height: 1.5; color: #000;'),  # .text-cover 標題
    ('.p-meta { color: #777;', '.p-meta { color: #000;'),      # 亮紅上做不出次要色 ⇒ 用黑，靠字級分層
    ('.btn.grey { background: var(--chip); color: #eee; }',
     '.btn.grey { background: var(--chip); color: #fff; }'),   # .chip 底是深紅 ⇒ 白字
    # ⚠️ .pager 與 .chip 的底是 --panel / --chip ＝ **深紅**，不是亮紅 ⇒ 字維持淺色，
    #    先前一度改成黑字是錯的（深紅上只有 1.8–2.0:1）。這裡刻意不動它們。

    # 「關於」三張卡也是內容區塊 ⇒ 跟其他卡片一致用亮紅 + 黑字
    ('.who-card {\n  position: relative; overflow: hidden;\n  background: var(--panel);',
     '.who-card {\n  position: relative; overflow: hidden;\n  color: #000;\n  background: var(--card);'),
    ('.who-card p { margin: 0 0 10px; font-size: 13px; line-height: 1.8; color: #c4c4c4; }',
     '.who-card p { margin: 0 0 10px; font-size: 13px; line-height: 1.8; color: #000; }'),
    ('.who-card h3 span {\n  font-size: 10px; font-weight: 400; color: var(--mut);',
     '.who-card h3 span {\n  font-size: 10px; font-weight: 400; color: #5a0e0e;'),
    ('.who-note em { display: block; margin-top: 3px; font-style: normal; color: #6f6f6f; }',
     '.who-note em { display: block; margin-top: 3px; font-style: normal; color: #c09a9a; }'),
    ('.who-links a i {\n  font-style: normal; font-weight: 400; color: var(--mut);',
     '.who-links a i {\n  font-style: normal; font-weight: 400; color: #e0bcbc;'),
]


def apply(revert=False):
    s = CSS.read_text(encoding='utf-8')
    n, miss = 0, []
    for a, b in TOKENS + HARDCODED:
        src, dst = (b, a) if revert else (a, b)
        if src == dst:
            continue
        if src in s:
            s = s.replace(src, dst)
            n += 1
        else:
            miss.append(src.split('\n')[0][:44])
    CSS.write_text(s, encoding='utf-8')
    return n, miss


if __name__ == '__main__':
    rev = '--revert' in sys.argv
    n, miss = apply(rev)
    print(('切回現況（黑底 + 狂三紅）' if rev
           else '套用「深紅牆 + 亮紅黑字卡片」') + f' —— 置換 {n} 處')
    if miss:
        print(f'  ⚠ 找不到 {len(miss)} 處：{miss}')
    m = re.search(r':root \{(.*?)\n\}', CSS.read_text(encoding='utf-8'), re.S)
    for line in m.group(1).strip().split('\n'):
        t = line.strip()
        if t.startswith('--') and not t.startswith(('--sans', '--mono')):
            print('   ' + t.split('/*')[0].strip())
