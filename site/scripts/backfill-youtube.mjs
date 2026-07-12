/**
 * YouTube 一次性 backfill：RSS 只回最新 15 部，舊影片用這支補進 videos.json。
 *  1. uploads 播放清單頁（UU + channel id 去掉 UC）一次列出全部影片 id
 *  2. 缺的影片逐部抓 watch 頁的 microformat（精確 publishDate + 標題 + 描述）
 * 之後的例行更新交給 sync-youtube.mjs，這支只在頻道有「比 json 早的漏網影片」時才需要。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fetchText, sleep } from './sync-lib.mjs';

const CHANNEL_ID = 'UCww--WSRxvzaY41oa0kz8Mw';
const UPLOADS = 'UU' + CHANNEL_ID.slice(2);
const OUT = path.resolve(import.meta.dirname, '..', 'src', 'data', 'videos.json');

/** 從 HTML 中取出 marker 後面那個平衡的 JSON 物件（考慮字串與跳脫） */
function extractJSON(html, marker) {
  const at = html.indexOf(marker);
  if (at < 0) return null;
  const start = html.indexOf('{', at);
  let depth = 0;
  let inStr = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (c === '\\') i++;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(html.slice(start, i + 1));
  }
  return null;
}

const listHtml = await fetchText(`https://www.youtube.com/playlist?list=${UPLOADS}`, {
  'Accept-Language': 'zh-TW',
});
const ids = [...new Set([...listHtml.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)].map((m) => m[1]))];
console.log(`playlist: ${ids.length} videos`);

const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : [];
const known = new Set(existing.map((v) => v.id));

let added = 0;
for (const id of ids) {
  if (known.has(id)) continue;
  const html = await fetchText(`https://www.youtube.com/watch?v=${id}`, {
    'Accept-Language': 'zh-TW',
  });
  const mf = extractJSON(html, '"playerMicroformatRenderer":');
  if (!mf) {
    console.warn(`!! ${id} 抓不到 microformat，跳過`);
    continue;
  }
  existing.push({
    id,
    title: mf.title?.simpleText ?? '',
    published: (mf.publishDate ?? '').slice(0, 10),
    description: mf.description?.simpleText ?? '',
  });
  console.log(`+ ${id} ${mf.publishDate?.slice(0, 10)} ${mf.title?.simpleText}`);
  added++;
  await sleep(1000);
}

existing.sort((a, b) => b.published.localeCompare(a.published));
writeFileSync(OUT, JSON.stringify(existing, null, 2) + '\n', 'utf8');
console.log(`youtube backfill: +${added}, total ${existing.length}`);
