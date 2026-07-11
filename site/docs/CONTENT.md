# 內容維護手冊

## 新增一本圖集

1. 在 `src/content/galleries/` 開一個資料夾，名稱用英文 slug（例：`kurumi-2026`）
2. 把圖片丟進去，檔名用兩位數序號（`01.png`、`02.jpg`…），順序即閱讀順序
3. 寫 `meta.yaml`：

```yaml
title: '[STUDIO MAOCHINN (帽捲)] 標題 (系列名) [標記]'   # scanlation 格式隨意發揮
alt: 'English / 日本語 subtitle'
id: 123456          # 六位數，全站不可重複（挑個喜歡的數字）
date: 2026-07-10
category: 創作       # 創作 | 練習 | 塗鴉 | 合作
parody: Date A Live  # 系列名，原創就寫 原創
characters: [時崎狂三]
tags: [插畫, 電繪]
rating: all          # all | r15 | r18（非 all 會有點擊確認遮罩）
fav: 1000            # 收藏數（純惡趣味，隨便填）
featured: false      # true 會出現在首頁「熱門作品」區
cover: 01.png
pages:
  - 01.png
  - 02.png
```

4. dev server 會自動熱更新（沒反應就重啟）

tag 命名建議：角色用全名（如 `時崎狂三`），已存在的 tag 先去 `/tags/` 頁看一眼，
避免同義不同字（例：`插畫` vs `插图`）造成 tag 分裂。

## Tag 分類法（taxonomy）維護

全站 tag 分 7 個 namespace：系列(parody)/角色(character)/標籤(tag)/作者(artist)/
社團(group)/語言(language)/分類(category)，圖集與文章共用。對照表在
`src/data/taxonomy.ts`：

- **發現同義分裂**（如 Medium 新文章用了 `three-js` 而站上已有 `threejs`）：
  在對應 namespace 的正名底下把新寫法加進 aliases，全站自動合併 + 舊網址自動轉向
- **新平台/系列**：加到 `parody` 區（正名不可含 `/` 或 `:`，原始寫法放 aliases）
- **文章分類不準**：優先調 `POST_CATEGORY_RULES` 規則；單篇例外寫進
  `src/data/post-overrides.ts`（key 是文章檔名去掉 .md）
- 別名重複會在 build 時直接報錯，不用擔心手滑
- 沒列在表裡的詞會原樣落在「標籤」namespace，這是正常的（passthrough）

## Medium 出新文章後同步

1. GitHub 上的 `maochinn.github.io` repo 有 ZMediumToMarkdown Action 會自動抓新文章，
   先在本地 `../maochinn.github.io` 做 `git fetch origin && git reset --hard origin/main`
   （working tree 會因 `*` 檔名報錯，可忽略——匯入不依賴 working tree）
2. 在本專案跑：

```bash
eval "$(fnm env --shell bash)" && fnm use lts-latest
node scripts/import-content.mjs
```

腳本會做三件事：
- 圖集：依腳本內 `CURATION` 清單從 `../WebTest/img` 複製分本（**會覆蓋 meta.yaml**，
  如果你手動改過 meta，請把改動同步回腳本的 CURATION，或匯入後 skip 該資料夾）
- 文章：複製 + 清洗（去 kramdown `{:...}` 語法、消毒圖片連結檔名）
- 文章圖片：從 git HEAD tree 抽 blob 到 `public/assets/`（檔名 `*` → `_`）

## 部署前注意（下一階段）

- 站內有 `rating: r18` 的內容。GitHub Pages 使用條款不允許成人內容，
  部署前請把該類圖集移除、換站台（Cloudflare Pages / 自架），或只部署過濾後的版本
- WebGL 虛擬藝廊（舊站 `WebTest` 的 Virtual Gallery）尚未移植，屬下一階段
- 部署 GitHub Pages 時 `astro.config.mjs` 要設 `site: 'https://maochinn.github.io'`
