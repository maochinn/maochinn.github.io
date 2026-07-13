/**
 * Facebook 粉專備份：Graph API → ../archive/facebook/<日期>-<postid>/
 *  - 需要環境變數 FB_PAGE_TOKEN（長效粉專 token，用 fb-token.mjs 換）；沒設就整段跳過（exit 0）
 *  - 每篇：meta.json + content.md + images/（附件圖片下載——FB CDN 連結會過期，必須落地）
 *  - 增量：資料夾已存在的貼文跳過；影片不下載本體（存 permalink）
 */
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fetchBuffer, sleep, extFromUrl } from './sync-lib.mjs';
import { scrapeSharedPost } from './fb-embed.mjs';

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
  'id,message,created_time,permalink_url,attachments{media_type,type,media,url,unshimmed_url,title,description,subattachments}';
// limit 別調高：帶巢狀 attachments 展開時，太大會吃到 "reduce the amount of data" 錯誤
let url = `https://graph.facebook.com/${V}/${page.id}/published_posts?fields=${FIELDS}&limit=25&access_token=${TOKEN}`;
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
      // 原生影片（video_inline / animated_image_video）：media_source 直鏈會過期，本體落地備份
      const atts = slimAttachments(post.attachments);
      // 站內分享（native_templates）：API 讀不到目標，補抓 embed 頁的連結與預覽圖
      // （best-effort：CI 機房 IP 可能被 FB 擋，失敗就略過，本地重跑可補）
      let shared;
      if (atts.some((a) => a.type === 'native_templates')) {
        try {
          const { link, images } = await scrapeSharedPost(post.permalink_url);
          const savedShared = [];
          for (const [i, src] of images.entries()) {
            const name = `shared-${String(i + 1).padStart(2, '0')}${extFromUrl(src)}`;
            try {
              writeFileSync(path.join(dir, 'images', name), await fetchBuffer(src));
              savedShared.push(name);
            } catch (e) {
              console.warn(`   分享圖抓不到: ${e.message}`);
            }
            await sleep(200);
          }
          shared = { link, images: savedShared };
        } catch (e) {
          console.warn(`   分享內容抓不到: ${e.message}`);
        }
      }
      const vatt = atts.find(
        (a) => a.media_type === 'video' && a.url?.includes('facebook.com') && a.media_source
      );
      if (vatt) {
        try {
          writeFileSync(path.join(dir, 'video.mp4'), await fetchBuffer(vatt.media_source));
        } catch (e) {
          console.warn(`   影片抓不到: ${e.message}`);
        }
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
            attachments: atts,
            ...(shared ? { shared } : {}),
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
