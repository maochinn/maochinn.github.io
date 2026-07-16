# STUDIO MAOCHINN — 個人網站

booru / 同人誌檔案庫式的個人作品集 + 部落格。tag 篩選、封面牆、多頁圖集閱讀器，
視覺沿用 nhentai 式深灰版面，強調色＝**狂三紅 `#e33939`**（H0°，取樣自〈狂三 禮服〉`#78990595` 的禮服主色 `#601818` 提亮至 WCAG AA；原本是 nhentai 的品牌粉紅 `#ed2553`，與角色無關，2026-07-17 換掉）。圖集與 Medium 同步文章共用同一套 tag。

本目錄是 maochinn.github.io repo 的 `site/`（上層是 Chirpy + ZMediumToMarkdown，
**上游檔案一字不動**；部署細節見 docs/MIGRATION.md）：

- 部落格來源：上層 repo 的 `_posts/`（import 腳本預設 `JEKYLL_DIR=..`）
- 舊作品集來源：WebTest 專案（repo 外；重策展圖集時用 `WEBTEST_DIR` 指到它的 img/，
  找不到就跳過圖集匯入——圖集已隨 repo，日常不需要）
- 站外同步：YouTube 影片卡 + Pixiv 圖集 + 巴哈 + FB 粉專，四個 sync-*.yml 各自排在
  每月不同天自動抓（詳見 docs/SYNC.md）；巴哈/FB 備份在上層 repo 的 `archive/`，build 時由
  import-baha.mjs / import-fb.mjs 轉成 `/baha/<sn>/`、`/fb/<postid>/`
  （比照 blog 的生成模式，覆寫用 baha-overrides.ts / fb-overrides.ts；
  FB 純文字動態不上牆只可搜）
- `Workspace\website\maochinn-site\` 是收編前的舊工作區，已降級為備份

## 環境

系統無全域 Node，用 fnm。Bash 中先執行：

```bash
eval "$(fnm env --shell bash)" && fnm use lts-latest
```

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

其他指令：`npm run build`（靜態輸出到 dist/）、`npm run preview`。

## 結構

- `src/content/galleries/<slug>/` — 一本圖集 = 一個資料夾：`meta.yaml` + 圖片（`01.png`…）
- `src/content/blog/` — Medium 文章（清洗過的 markdown，重跑匯入會覆蓋）
- `public/assets/<postid>/` — 文章圖片（檔名已消毒：`*` 等 Windows 不允許字元 → `_`）
- `public/siggraph2026.html` — **手動產生的離線單檔**（SIGGRAPH 2026 行事曆，未掛導覽/sitemap）。
  **別直接改這顆 1.3MB 檔**；改內容要回 `Workspace\website\siggraph2026-src\` 跑 `python gen7.py`
  再覆蓋回來 push（該資料夾有 README）
- `src/data/taxonomy.ts` — **全站 tag 分類法**：7 個 namespace（parody/character/tag/
  artist/group/language/category）的正名與別名；文章的自動分類規則也在這
- `src/data/post-overrides.ts` — 個別文章 metadata 覆寫（自動歸類不準時用）
- `src/lib/taxonomy.ts` — 別名解析（build 時檢查別名衝突）、文章歸類、閱讀分鐘
- `src/lib/site.ts` — `UnifiedMeta`：圖集與文章統一成同一張檔案卡
  （parodies/characters/tags/artists/groups/languages/categories/pages/date）
- `src/pages/` — index（圖集+文章混排封面牆）、`g/[id]`（詳情+閱讀器）、
  `[ns]/[name]`（7 種 namespace 頁 + 舊 `/tag/<詞>/` 與別名的轉向頁）、`tags/`（分組總覽）、
  `blog/`（文章也是「本子」：首圖=封面、文中圖=頁面、縮圖牆+閱讀器、全文在下方；
  無圖文章用生成的純文字本封面）、`search/`、`search-index.json.ts`（索引含 aliases 表）
- `src/components/Reader.astro` — 圖集與文章共用的全螢幕閱讀器
  （`window.openReader(i)` 開啟；文章版有 caption 與「↧ 文中位置」跳轉）
- `src/pages/v/[id].astro` + `src/components/VideoCard.astro` — YouTube 影片
  （來源 `src/data/videos.json`，sync 腳本維護；覆寫用 `src/data/video-overrides.ts`）
- `scripts/import-content.mjs` — 從兩個舊專案匯入內容（詳見 docs/CONTENT.md）
- `scripts/sync-*.mjs` — 站外平台每月同步（YouTube/Pixiv/巴哈，詳見 docs/SYNC.md）
- 視覺 tokens 都在 `src/styles/global.css` 的 `:root`；刻意單主題深色。
  `--stripe`（紅 8 : 黑 6，45°）＝狂三的「紅為主、黑為條狀裝飾」語言，用於 hero 收邊／`.who-card` 頂邊／`h2.sec` 標記／footer。
  **別用 `--accent` 鋪大面積再放白字**（4.28:1 < AA 4.5:1）；要鋪紅底用 `--accent-deep`（12.80:1）。
  取樣／驗算工具：`scripts/pick-accent.py`、`scripts/accent-compare.py`、`scripts/banner-preview.py`
  原始設計 mockup 存檔於 `docs/design-mock.html`（可直接用瀏覽器開）

## Taxonomy 慣例

- 來源 tag（Medium 英文、圖集中文）不改動；一切合併與歸類都疊在 taxonomy 層
- 正名會成為網址段（`/parody/NVIDIA Omniverse/`），**不可含 `/` 或 `:`**，原始寫法放 aliases
- 搜尋語法：`parody:"x"`、`character:"x"`、`tag:"x"`、`-category:"x"`、自由文字；
  別名輸入會自動轉正名，打錯 namespace 也會依 taxonomy 矯正
- 文章 category 自動判斷（開箱文/遊記/職涯/技術文章），規則在 taxonomy.ts 的
  `POST_CATEGORY_RULES`；單篇不準用 post-overrides.ts

## 資料模型摘要

`meta.yaml`（schema 在 `src/content.config.ts`）：
`title / alt / id(六位數,唯一) / date / category(創作|練習|塗鴉|合作) / parody /
characters[] / tags[] / rating(all|r15|r18) / fav / featured / cover / pages[]`

- `rating` 非 all → 封面與縮圖前端遮罩，點擊確認顯示（sessionStorage 記住）
- 圖集路由用六位數 `id`（`/g/177013/`），不是資料夾名
- 文章 frontmatter 沿用 ZMediumToMarkdown 輸出，schema 會過濾空 tags/categories

## 注意事項

- 上層 repo 的 `assets/` 在 Windows working tree 不完整（Medium 圖檔名含 `*`
  無法 checkout；本地 clone 用 sparse-checkout 排除 assets），匯入腳本是直接從
  git HEAD tree 抽 blob，不要依賴 working tree
- 內容編輯後 dev server 會熱更新；`meta.yaml` 改動偶爾需要重啟
- 部署 GitHub Pages 前注意：站內含 R18 內容，GitHub Pages 使用條款對成人內容有限制
