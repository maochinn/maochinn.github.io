/**
 * Facebook 備份 → 站上動態（build 時執行，與 import-baha.mjs 同模式）
 *  ../archive/facebook/<日期>-<pageid>_<postid>/ → src/content/fb/<postid>.md + public/fb/<postid>/
 * 輸出是生成物（gitignore），重跑會覆蓋；individual 修正請用 src/data/fb-overrides.ts。
 */
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { yStr } from './sync-lib.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const ARCHIVE = path.resolve(ROOT, '..', 'archive', 'facebook');
const OUT_MD = path.join(ROOT, 'src', 'content', 'fb');
const OUT_IMG = path.join(ROOT, 'public', 'fb');

if (!existsSync(ARCHIVE)) {
  console.log(`skip fb import (no ${ARCHIVE})`);
  process.exit(0);
}

rmSync(OUT_MD, { recursive: true, force: true });
mkdirSync(OUT_MD, { recursive: true });
mkdirSync(OUT_IMG, { recursive: true });

/** 貼文沒有標題：拿內文第一行（去掉圖片語法）截短當卡片標題 */
function deriveTitle(body, extra, atts) {
  const line = body
    .split('\n')
    .map((l) => l.replace(/!\[[^\]]*\]\([^)]*\)/g, '').trim())
    .find((l) => l.length > 0);
  if (!line) {
    if (extra.link_title) return `分享：${extra.link_title}`;
    if (extra.youtube || extra.fb_video || extra.video_file) return '（影片貼文）';
    // native_templates = 分享 FB 站內貼文，API 讀不到目標，只能標記類型
    if (atts.some((a) => ['share', 'native_templates', 'multi_share'].includes(a.type))) return '（分享貼文）';
    return '（相片貼文）';
  }
  return line.length > 40 ? `${line.slice(0, 40)}…` : line;
}

/**
 * 附件 → frontmatter 額外欄位（backfill-fb-attachments.mjs 補的 meta.attachments）
 *  - YouTube 分享：media_source 是穩定的 embed URL → 取出 id 直接內嵌
 *  - FB 原生影片（video_inline/animated_image_video）：url 是 fb 影片頁 → plugin 內嵌
 *  - 其他分享：連結卡（標題+描述+目標網址）
 */
function attachmentFields(atts = []) {
  const out = {};
  const video = atts.find((a) => a.media_type === 'video');
  if (video) {
    const yt =
      video.media_source?.match(/youtube\.com\/embed\/([\w-]{11})/) ??
      video.url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
    if (yt) out.youtube = yt[1];
    else if (video.url?.includes('facebook.com')) out.fb_video = video.url;
  }
  const share = atts.find(
    (a) => ['share', 'multi_share', 'goodwill_shared_card'].includes(a.type) && a.url
  );
  if (share && !out.youtube) {
    out.link = share.url;
    if (share.title) out.link_title = share.title;
    if (share.description) out.link_desc = share.description;
  }
  return out;
}

let n = 0;
for (const dir of readdirSync(ARCHIVE)) {
  const src = path.join(ARCHIVE, dir);
  const meta = JSON.parse(readFileSync(path.join(src, 'meta.json'), 'utf8'));
  const slug = meta.id.split('_')[1] ?? meta.id; // 路由用 post 流水號就唯一了
  let body = readFileSync(path.join(src, 'content.md'), 'utf8').replace(/\r\n/g, '\n');

  // 去掉備份檔自帶的來源行（站上由 frontmatter/版型呈現）
  body = body.replace(/^> .*\n+/, '');
  body = body.replaceAll('](images/', `](/fb/${slug}/`);

  if (existsSync(path.join(src, 'images')) && readdirSync(path.join(src, 'images')).length) {
    cpSync(path.join(src, 'images'), path.join(OUT_IMG, slug), { recursive: true });
  }

  const extra = attachmentFields(meta.attachments);
  // 原生影片有備份本體 → 自家 <video> 播放，不依賴 FB plugin
  if (existsSync(path.join(src, 'video.mp4'))) {
    mkdirSync(path.join(OUT_IMG, slug), { recursive: true });
    cpSync(path.join(src, 'video.mp4'), path.join(OUT_IMG, slug, 'video.mp4'));
    extra.video_file = `/fb/${slug}/video.mp4`;
    delete extra.fb_video;
  }
  const fm = [
    '---',
    `title: ${yStr(deriveTitle(body, extra, meta.attachments ?? []))}`,
    `date: ${meta.created_time}`,
    `source: ${yStr(meta.permalink_url)}`,
    ...Object.entries(extra).map(([k, v]) => `${k}: ${yStr(v)}`),
    '---',
    '',
  ].join('\n');
  writeFileSync(path.join(OUT_MD, `${slug}.md`), fm + body, 'utf8');
  n++;
}
console.log(`fb import: ${n} posts`);
