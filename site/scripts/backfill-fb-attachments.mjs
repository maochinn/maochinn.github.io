/**
 * 一次性 backfill：把附件詳情（分享連結/影片）補進既有 archive/facebook/<dir>/meta.json
 *  - 首次備份只存了圖片與第一個附件的 media_type；分享目標連結（unshimmed_url）、
 *    連結標題/描述、影片 embed 來源都沒落地——這支補齊，之後由 sync-facebook.mjs 維持
 *  - 只改 meta.json（加 attachments 欄位），content.md 與 images/ 一律不動
 *  - 可重跑：已有 attachments 欄位的也會覆寫成最新 API 結果（冪等）
 */
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const TOKEN = process.env.FB_PAGE_TOKEN;
if (!TOKEN) {
  console.error('need FB_PAGE_TOKEN');
  process.exit(1);
}

const V = 'v21.0';
const ARCHIVE = path.resolve(import.meta.dirname, '..', '..', 'archive', 'facebook');

const api = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) throw new Error(`${json.error.type}: ${json.error.message}`);
  return json;
};

// dir 名是 <日期>-<pageid>_<postid>，先建 postid → dir 對照
const dirByPost = new Map();
for (const dir of readdirSync(ARCHIVE)) {
  const m = dir.match(/^\d{4}-\d{2}-\d{2}-(\d+_\d+)$/);
  if (m) dirByPost.set(m[1], dir);
}
console.log(`archive: ${dirByPost.size} dirs`);

/** API 附件 → 精簡備份格式（l.facebook.com 轉址殼不存，只存 unshimmed 乾淨連結） */
function slimAttachments(att) {
  return (att?.data ?? []).map((a) => {
    const o = { media_type: a.media_type ?? null, type: a.type ?? null };
    if (a.unshimmed_url) o.url = a.unshimmed_url;
    if (a.title) o.title = a.title;
    if (a.description) o.description = a.description;
    if (a.media?.source) o.media_source = a.media.source; // YouTube 分享=穩定 embed；FB 原生=過期 CDN，僅備考
    return o;
  });
}

const FIELDS =
  'id,attachments{media_type,type,unshimmed_url,title,description,media,target}';
// limit 別調高：帶巢狀 attachments 展開時，太大會吃到 "reduce the amount of data" 錯誤
const page = await api(`https://graph.facebook.com/${V}/me?fields=id&access_token=${TOKEN}`);
let url = `https://graph.facebook.com/${V}/${page.id}/published_posts?fields=${FIELDS}&limit=25&access_token=${TOKEN}`;
let updated = 0;
let seen = 0;
const stats = new Map();
while (url) {
  const batch = await api(url);
  for (const post of batch.data ?? []) {
    seen++;
    const dir = dirByPost.get(post.id.replace(/[^0-9_]/g, ''));
    if (!dir) continue; // 備份沒有的貼文交給 sync-facebook.mjs
    const metaPath = path.join(ARCHIVE, dir, 'meta.json');
    if (!existsSync(metaPath)) continue;
    const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
    meta.attachments = slimAttachments(post.attachments);
    writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');
    for (const a of meta.attachments) {
      const k = `${a.media_type}/${a.type}`;
      stats.set(k, (stats.get(k) ?? 0) + 1);
    }
    updated++;
    if (updated % 200 === 0) console.log(`...${updated}/${seen}`);
  }
  url = batch.paging?.next ?? null;
}
console.log(`backfill: ${updated} metas updated / ${seen} posts seen`);
console.log([...stats.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `  ${k}: ${n}`).join('\n'));
