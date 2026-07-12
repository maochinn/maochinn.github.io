# 站外內容同步（YouTube / Pixiv / 巴哈）

每月 15 號 `content-sync.yml` 自動跑（也可在 Actions 手動 dispatch），
比照 ZMediumToMarkdown 模式：sync → commit main → workflow_run 接力觸發 pages-deploy。
全部匿名抓取、只收「本來就公開、正常向」的內容；三支腳本都是**增量**（已存在就跳過），
sync 失敗會紅燈但不影響既有資料。

| 腳本 | 來源 | 去向 | 上站？ |
|---|---|---|---|
| `scripts/sync-youtube.mjs` | 頻道 RSS（僅最新 15 部） | `src/data/videos.json` | ✅ 影片卡混入封面牆 + `/v/<id>/` 內嵌播放頁 |
| `scripts/sync-pixiv.mjs` | 公開 AJAX API（user 6856401） | `src/content/galleries/<pixiv-id>/` | ✅ 一般圖集機制 |
| `scripts/sync-baha.mjs` | 小屋 creation list API + 文章頁 | repo 根目錄 `archive/baha/<sn>-<slug>/` | ❌ 純備份 |
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
- 每篇：`meta.json` + `content.html`（原始內文，圖連結已改本地）+ `content.md` + `images/`
- `ref.gamer.com.tw` 轉址連結已還原成原始網址；內文圖（含熱鏈的 miro.medium）全下載
- 「兒少保護」標記的跳過（要手機認證帳號才看得到）——見下方延後項
- `archive/` 已加進 `_config.astro.yml` 的 exclude（不然 Jekyll 會把它複製進 /medium/ 產物）

## 延後項（敏感內容，之後另想辦法：NAS 私有備份等）

- 巴哈 8 篇「兒少保護」文章（需登入 cookie 才抓得到）
- Facebook 全部：個人檔案無 API、爬蟲違反 ToS；正規做法 = 官方「下載你的資訊」（JSON）手動匯出
- Pixiv / 其他平台的 R18 作品（本 repo 公開，R18 一律不進 git）
