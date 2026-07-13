# 站外內容同步（YouTube / Pixiv / 巴哈）

每月 15 號 `content-sync.yml` 自動跑（也可在 Actions 手動 dispatch），
比照 ZMediumToMarkdown 模式：sync → commit main → workflow_run 接力觸發 pages-deploy。
全部匿名抓取、只收「本來就公開、正常向」的內容；三支腳本都是**增量**（已存在就跳過），
sync 失敗會紅燈但不影響既有資料。

| 腳本 | 來源 | 去向 | 上站？ |
|---|---|---|---|
| `scripts/sync-youtube.mjs` | 頻道 RSS（僅最新 15 部） | `src/data/videos.json` | ✅ 影片卡混入封面牆 + `/v/<id>/` 內嵌播放頁 |
| `scripts/sync-pixiv.mjs` | 公開 AJAX API（user 6856401） | `src/content/galleries/<pixiv-id>/` | ✅ 一般圖集機制 |
| `scripts/sync-baha.mjs` | 小屋 creation list API + 文章頁 | repo 根目錄 `archive/baha/<sn>-<slug>/` | ✅ build 時 `import-baha.mjs` 轉成 `/baha/<sn>/` 文章 |
| `scripts/backfill-youtube.mjs` | uploads 播放清單 + watch 頁 | 同 videos.json | 一次性：頻道有「比 json 早的漏網影片」才需要 |

## 端點備忘（全部非官方，改版時來這裡修）

- YouTube RSS：`https://www.youtube.com/feeds/videos.xml?channel_id=UCww--WSRxvzaY41oa0kz8Mw`（上限 15 筆）
- Pixiv：`/ajax/user/6856401/profile/all`、`/ajax/illust/{id}`、`/ajax/illust/{id}/pages`；
  下載 `i.pximg.net` 原圖必須帶 `Referer: https://www.pixiv.net/`
- 巴哈 list：`https://api.gamer.com.tw/home/v2/creation_list.php?owner=maochinn&page=N&row=50`
  （`total`/`totalPage`/`flagicon` 齊全）；內文抓 `https://home.gamer.com.tw/artwork.php?sn=`
  （需瀏覽器 UA；`creationDetail.php` 會 302 過去）。內文容器 = `<div id="article_content">`

## 各平台規則

### YouTube
- 影片本體不備份（存 YouTube），站上用 youtube-nocookie 內嵌；縮圖熱鏈 `i.ytimg.com/vi/<id>/hqdefault.jpg`
  （maxresdefault 舊影片會 404）
- 已存在的 id 不覆寫 → `videos.json` 的標題/描述可手動修
- 卡片分類：標題含 作業/練習/Krenz/test/demo → 練習，其餘 創作；個別修正用 `src/data/video-overrides.ts`

### Pixiv
- **create-once**：圖集資料夾已存在就不碰 → 匯入後手動補 parody/characters、改 rating 都不會被沖掉
- 下架/跳過：把 id 加進 `src/data/pixiv-ignore.json` 並刪掉圖集資料夾（與舊策展圖集重複時同理）
- 匿名抓不到 R-18，腳本另有 `xRestrict > 0` 過濾當第二道保險；gallery id = pixiv 作品 id（8 位數）

### 巴哈
- 備份每篇：`meta.json` + `content.html`（原始內文，圖連結已改本地）+ `content.md` + `images/`
- `ref.gamer.com.tw` 轉址連結已還原成原始網址；內文圖（含熱鏈的 miro.medium）全下載
- 「兒少保護」標記的跳過（要手機認證帳號才看得到）——見下方延後項
- `archive/` 已加進 `_config.astro.yml` 的 exclude（不然 Jekyll 會把它複製進 /medium/ 產物）
- **上站**：pages-deploy build 時 `import-baha.mjs` 把備份轉成 `src/content/baha/<sn>.md` +
  `public/baha/<sn>/`（皆 gitignore 生成物），路由 `/baha/<sn>/`、社團標 巴哈姆特；
  分類規則：插畫類（kind≠1）→ 創作/塗鴉，文章類走 Medium 同款 POST_CATEGORY_RULES；
  標題的【x】[x] 前綴當原始 tag 過 taxonomy 分流
- **與 Medium 重複的整合**：不少巴哈文是 Medium 好讀版，目前兩邊都在牆上；
  要下架單篇巴哈版 → `src/data/baha-overrides.ts` 設 `hidden: true`（備份不受影響）

### Facebook（粉專 maochinnn）
- `scripts/sync-facebook.mjs`：Graph API `/{page-id}/published_posts` → `archive/facebook/<日期>-<postid>/`
  （meta.json + content.md + images/；FB CDN 圖片連結會過期所以必須落地）
- **附件詳情**（meta.json 的 `attachments`，2026-07-13 由 backfill-fb-attachments.mjs 補齊全量）：
  分享目標存 `unshimmed_url`（乾淨連結，不存 l.facebook.com 轉址殼）+ title/description；
  **原生影片**（video_inline/animated_image_video）本體下載成 `video.mp4`（media_source 直鏈會過期）。
  注意：`native_templates` 型（分享 FB 站內貼文，1634 篇最大宗）**API 讀不到目標貼文**
  （target/story/oEmbed 全試過，一律回「目前無法查看此內容」）
- **站內分享的補救**（`fb-embed.mjs` + `backfill-fb-shared.mjs`）：公開 embed 頁
  `plugins/post.php` 的 server-side HTML 裡有分享目標的永久連結與預覽圖 → 抓進 meta.json 的
  `shared: { link, images }`，圖存 `images/shared-NN.*`。
  **必須用 curl 抓**：Node fetch 只講 HTTP/1.1，FB 會擋「自稱 Chrome 卻不走 HTTP/2」的請求（400）。
  拿不到的：原作者名與貼文文字（JS 渲染）、原尺寸圖（CDN 簽名綁縮圖參數，改了 403）。
  站上 = 連結卡（連原貼文）+ 預覽圖進內文 + post plugin 點擊載入看完整內容；
  **預覽圖不上牆**（是別人的內容，牆只放自己貼的圖）
- 需要 GitHub Secret **`FB_PAGE_TOKEN`**（長效粉專 token）；沒設的話這步自動跳過不會紅燈
- **Token 取得（一次性）**：
  1. [developers.facebook.com](https://developers.facebook.com/) 建一個 app（類型選「商業」即可，不用送審——讀自己管理的粉專在開發模式就能用）
  2. 開 [Graph API 測試工具](https://developers.facebook.com/tools/explorer/)：選這個 app，
     權限勾 `pages_show_list`、`pages_read_engagement`、`pages_read_user_content`，
     產生「使用者存取權杖」（會跳授權視窗，記得勾 maochinnn 粉專）
  3. `node scripts/fb-token.mjs <app-id> <app-secret> <剛拿到的token>` → 印出長效粉專 token
     （實務上不過期，除非改密碼或安全事件）
  4. `gh secret set FB_PAGE_TOKEN`（互動貼上，不留 shell 紀錄）
- Token 失效時 Actions 會紅燈 → 重跑上面 2-4
- **上站**：build 時 `import-fb.mjs` 轉成 `/fb/<postid>/`（社團標 Facebook、分類 動態、
  標題=內文第一行截斷）；**牆上只放有圖的**（純文字動態量太大，仍可搜／/group/Facebook/ 全列）；
  下架單篇 → `src/data/fb-overrides.ts` 設 `hidden: true`
- **分享與影片的呈現**：YouTube 分享 → 頁上直接內嵌播放器；原生影片 → 自家 `<video>` 播備份的
  video.mp4（不依賴 FB plugin）；外部連結分享 → 連結卡（標題+描述+網址）；
  牆卡有影片的標 ▶ VIDEO

## 延後項（敏感內容，之後另想辦法：NAS 私有備份等）

- 巴哈 8 篇「兒少保護」文章（需登入 cookie 才抓得到）
- Facebook **個人檔案**（粉專以外的個人貼文）：無 API；正規做法 = 官方「下載你的資訊」（JSON）手動匯出
- Pixiv / 其他平台的 R18 作品（本 repo 公開，R18 一律不進 git）
