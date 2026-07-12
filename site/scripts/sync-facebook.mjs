/**
 * Facebook 粉專備份：Graph API → ../archive/facebook/<日期>-<postid>/
 *  - 需要環境變數 FB_PAGE_TOKEN（長效粉專 token，用 fb-token.mjs 換）；沒設就整段跳過（exit 0）
 *  - 每篇：meta.json + content.md + images/（附件圖片下載——FB CDN 連結會過期，必須落地）
 *  - 增量：資料夾已存在的貼文跳過；影片不下載本體（存 permalink）
 */
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fetchBuffer, sleep, extFromUrl } from './sync-lib.mjs';

const TOKEN = process.env.FB_PAGE_TOKEN;
if (!TOKEN) {
  console.log('skip facebook (FB_PAGE_TOKEN not set)');
  process.exit(0);
}

const V = 'v21.0';
const ARCHIVE = path.resolve(import.meta.dirname, '..', '..', 'archive', 'facebook');

const api = async (pathOrUrl) => {
  const url = pathOrUrl.startsWith('https://')
    ? pathOrUrl
    : `https://graph.facebook.com/${V}${pathOrUrl}${pathOrUrl.includes('?') ? '&' : '?'}access_token=${TOKEN}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) throw new Error(`${json.error.type}: ${json.error.message}`);
  return json;
};

const page = await api('/me?fields=id,name');
console.log(`facebook: ${page.name} (id ${page.id})`);

/** 附件樹 → 圖片 URL 清單（相簿型貼文的 subattachments 攤平） */
function collectImages(att) {
  const out = [];
  for (const a of att?.data ?? []) {
    if (a.media?.image?.src) out.push(a.media.image.src);
    out.push(...collectImages(a.subattachments));
  }
  return out;
}

const FIELDS =
  'id,message,created_time,permalink_url,attachments{media_type,media,url,subattachments}';
let url = `https://graph.facebook.com/${V}/${page.id}/published_posts?fields=${FIELDS}&limit=100&access_token=${TOKEN}`;
let added = 0;
let total = 0;
while (url) {
  const batch = await api(url);
  for (const post of batch.data ?? []) {
    total++;
    const day = post.created_time.slice(0, 10);
    const dir = path.join(ARCHIVE, `${day}-${post.id.replace(/[^0-9_]/g, '')}`);
    if (existsSync(dir)) continue;

    mkdirSync(path.join(dir, 'images'), { recursive: true });
    try {
      const imgs = [...new Set(collectImages(post.attachments))];
      const saved = [];
      for (const [i, src] of imgs.entries()) {
        const name = `${String(i + 1).padStart(2, '0')}${extFromUrl(src)}`;
        try {
          writeFileSync(path.join(dir, 'images', name), await fetchBuffer(src));
          saved.push(name);
        } catch (e) {
          console.warn(`   圖片抓不到: ${e.message}`);
        }
        await sleep(200);
      }
      const md =
        `> ${post.created_time} · 來源 ${post.permalink_url}\n\n` +
        (post.message ?? '') +
        (saved.length ? '\n\n' + saved.map((n) => `![](images/${n})`).join('\n') : '') +
        '\n';
      writeFileSync(path.join(dir, 'content.md'), md, 'utf8');
      writeFileSync(
        path.join(dir, 'meta.json'),
        JSON.stringify(
          {
            id: post.id,
            created_time: post.created_time,
            permalink_url: post.permalink_url,
            media_type: post.attachments?.data?.[0]?.media_type ?? null,
            images: saved.length,
          },
          null,
          2
        ) + '\n',
        'utf8'
      );
      console.log(`fb ${day} ${post.id}（圖 ${saved.length} 張）`);
      added++;
    } catch (e) {
      rmSync(dir, { recursive: true, force: true }); // 半成品不留，下次重抓
      throw e;
    }
    await sleep(500);
  }
  url = batch.paging?.next ?? null;
}
console.log(`facebook: +${added} new / ${total} posts`);
