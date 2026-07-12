/**
 * YouTube 頻道同步：RSS → src/data/videos.json
 * RSS 只回最新 15 部；比 15 早的舊影片靠 json 既有內容保留（首次 backfill 手動補齊）。
 * 已存在的 id 不覆寫（標題等欄位手動修過不會被沖掉）。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fetchText } from './sync-lib.mjs';

const CHANNEL_ID = 'UCww--WSRxvzaY41oa0kz8Mw';
const OUT = path.resolve(import.meta.dirname, '..', 'src', 'data', 'videos.json');

const unescapeXml = (s) =>
  s
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');

const xml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`);

const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => {
  const pick = (tag) => unescapeXml(e.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1] ?? '');
  return {
    id: pick('yt:videoId'),
    title: pick('title'),
    published: pick('published').slice(0, 10),
    description: pick('media:description'),
  };
});
if (!entries.length) throw new Error('RSS 解析不到任何 entry（格式可能改版）');

const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : [];
const known = new Set(existing.map((v) => v.id));
const added = entries.filter((v) => !known.has(v.id));

const merged = [...existing, ...added].sort((a, b) => b.published.localeCompare(a.published));
if (added.length || !existsSync(OUT)) {
  writeFileSync(OUT, JSON.stringify(merged, null, 2) + '\n', 'utf8');
}
console.log(`youtube: +${added.length} new, total ${merged.length}`);
