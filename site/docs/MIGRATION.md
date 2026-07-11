# 收編 maochinn.github.io 遷移計畫

（狀態：**已完成並上線**，2026-07-11 cutover。本文件保留作歷史紀錄與 rollback 指南。）

執行時與計畫的出入：
- Pages 當時其實是 **legacy（gh-pages branch）模式**，非計畫假設的 Actions 模式；
  cutover 前已用 API 切成 workflow 模式。**rollback 除了 revert merge commit，
  還要把 Pages build_type 切回 legacy**（gh-pages branch 仍留著）
- 根目錄 Chirpy 的 `.gitignore` 全域忽略 `package-lock.json`，
  `site/package-lock.json` 是 `git add -f` 硬加進去的（CI 的 npm ci 需要）
- cutover 前 code review 追加保命包：舊 `/posts/<id>/`、`/archives/`、`/categories/`
  轉向頁 + 404 頁 + root feed/sitemap/robots 由 CI 從 /medium/ 複製回 root +
  `sw.min.js` stub 解除舊 Chirpy PWA service worker + checkout 改淺 clone
- 已知未處理：Pages artifact 2.09GB（Medium 圖在 root 與 /medium/ 各一份，
  低於 10GB 硬限制、超過 1GB 軟限制），去重待日後改連結設計再處理

## 目標架構

單一 repo `maochinn/maochinn.github.io` 收編一切，網域保留：

```
maochinn.github.io/（repo）
├─ .github/workflows/
│  ├─ ZMediumToMarkdown.yml   ← 絕對不動（活的上游：每月15號抓 Medium 文章）
│  └─ pages-deploy.yml        ← 換成新版（Astro + Jekyll 雙 build，唯一被替換的檔案）
├─ _config.astro.yml          ← 新增（Jekyll overlay：baseurl /medium + exclude site/）
├─ _posts/ assets/ _config.yml Gemfile …  ← Chirpy 全部原樣不動
└─ site/                      ← Astro 新站（從 ../maochinn-site 搬入）
```

發佈結果：
- `https://maochinn.github.io/` = 新站（統一邏輯）
- `https://maochinn.github.io/medium/` = Chirpy 鏡像原樣續命（同步文章的檢視介面）
- `https://maochinn.github.io/WebTest/` = 舊站不動
- 文章路由**維持 `/blog/`**（先前討論的 /p/ 改名不需要了——鏡像定在 /medium/，/blog/ 沒被佔用）

## 原則

1. `ZMediumToMarkdown.yml` 與所有 Chirpy 檔案一字不動；只允許「替換 pages-deploy.yml」和「新增檔案」
2. Chirpy 的 /medium/ 化用 CLI overlay（`--config _config.yml,_config.astro.yml`），不改原 config
   - 注意：overlay 的 `exclude:` 會整個蓋掉原版陣列，寫 overlay 前先抄下 `_config.yml` 原有的 exclude 項目再追加 `site`
3. R18 內容不進 git（gitignore），公開站再用 EXCLUDE_R18=1 當第二道保險

## 本地環境（已完成的前置）

- `Workspace\website\maochinn.github.io` 已重 clone（SSH remote，push 免密碼）
- 已修復 Windows 無法 checkout `*` 檔名的問題：
  `git sparse-checkout init --no-cone && git sparse-checkout set '/*' '!assets'` +
  `git config core.protectNTFS false`（repo 內限定）→ index 完整（2124 個 asset 在 index、
  不在磁碟），**commit 是安全的**。新機器 clone 時照這組指令重做
- Node 用 fnm：`eval "$(fnm env --shell bash)" && fnm use lts-latest`

## Branch 策略

- `main` = production：cutover 前不碰，Chirpy 照常服務
- 開發全部在 **`feat/astro-site`** branch
- 新 workflow 設計成「build 永遠跑、deploy 只在 main」→ branch 上可手動 dispatch 驗 build 而不上線
- **cutover = merge 進 main**（觸發新 workflow 上線）；**rollback = revert 那個 merge commit**（Jekyll 版自動回來）

## 執行步驟

1. `maochinn.github.io` 開 branch `feat/astro-site`
2. R18 重整（在 ../maochinn-site 做完再搬）：
   - CURATION：kurumi-collection 移除 `kurumi_R18.png` 頁、rating→`r15`；
     graffiti-vol1 移除 `zero_two_R18.png`、rating→`all`；
     新增 `r18-extras`（id 114514、rating r18、收那兩張）
   - 重跑 `node scripts/import-content.mjs`
3. maochinn-site 整包複製到 `site/`（排除 node_modules/dist/.astro），加 `site/.gitignore`：
   `node_modules/ dist/ .astro/ src/content/blog/ public/assets/ src/content/galleries/r18-extras/`
4. import 腳本改兩處：`JEKYLL` 路徑 = `process.env.JEKYLL_DIR ?? '..'`（文章就在同 repo）；
   `OLD_SITE`（../../WebTest）不存在時跳過圖集匯入（CI 用，圖集已隨 repo）
5. `src/lib/site.ts` `getGalleries()` 加 `process.env.EXCLUDE_R18` 過濾整本 r18
6. `astro.config.mjs` 加 `site: 'https://maochinn.github.io'`
7. 新 `pages-deploy.yml`：
   - on: `push`(main)、`workflow_run`(ZMediumToMarkdown completed)、`workflow_dispatch`
   - build job：checkout → setup-node 22（cache npm, dependency-path site/package-lock.json）→
     `cd site && npm ci` → `JEKYLL_DIR=.. node scripts/import-content.mjs` →
     `EXCLUDE_R18=1 npm run build` → ruby/setup-ruby（bundler-cache）→
     `bundle exec jekyll b -d site/dist/medium --config _config.yml,_config.astro.yml` →
     upload-pages-artifact（path: site/dist）
   - deploy job：`needs: build`、`if: github.ref == 'refs/heads/main'`、actions/deploy-pages
   - permissions: pages/id-token；concurrency group "pages"
8. 新增 `_config.astro.yml`（url: https://maochinn.github.io、baseurl: /medium、exclude 原清單+site）
9. Branch 驗證：本地 `EXCLUDE_R18=1 npm run build`（無 114514、/blog/ 正常）+ 正常 build；
   push branch → Actions 手動 dispatch（選 feat/astro-site）→ 確認 build 綠、deploy 被跳過
10. Cutover：merge → main → Actions 跑完 → 線上驗證四個網址（root 新站、/medium/ 鏡像
    CSS 正常、/WebTest/、任一文章圖片載入）
11. 事後：更新 memory 與本文件狀態；../maochinn-site 資料夾降級為備份（新工作區 = repo 的 site/）；
    （選配）WebTest 網頁上 Archive

## 使用者手動步驟

幾乎為零：Pages 已是 GitHub Actions 模式、push 用 SSH。唯一選配：WebTest 封存（Settings → Archive）。

## 開發用到的 skills / 工具

- 內建 skill：`/verify`（改動後端到端驗證）、`/run`（起 dev server）、`/code-review`（cutover merge 前跑一次）
- 不需要任何外部 plugin / MCP server
- 選配：`winget install GitHub.cli`（gh）——看 Actions 跑況（`gh run watch`）和開 PR 方便，非必需

## 未來擴充備忘

- 自訂網域：repo 加 CNAME 檔（純新增）
- booru 化：works 集合 + medium discriminator（video/webgl/shader）設計已談定，靜態架構
  撐得住單人 booru；多人互動（留言/收藏）用 Cloudflare Workers + D1 hybrid，之後再說
