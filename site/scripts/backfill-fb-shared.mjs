/**
 * 一次性 backfill：站內分享貼文（native_templates）的分享目標連結＋預覽圖
 *  - embed plugin 抓法見 fb-embed.mjs；成果寫進 meta.json 的 shared 欄位：
 *    { link: 目標永久連結|null, images: [下載落地的檔名] }
 *  - 圖存 images/shared-NN.<ext>（與原有貼文圖檔名區隔）
 *  - 可重跑：已有 shared 欄位的跳過；被擋（Error 頁）不寫欄位，重跑會再試
 *  - LIMIT=n 環境變數：只處理前 n 篇（試跑用）
 */
import { writeFileSync, readFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fetchBuffer, sleep, extFromUrl } from './sync-lib.mjs';
import { scrapeSharedPost } from './fb-embed.mjs';

const ARCHIVE = path.resolve(import.meta.dirname, '..', '..', 'archive', 'facebook');
const LIMIT = Number(process.env.LIMIT ?? Infinity);

let done = 0;
let withLink = 0;
let withImg = 0;
let blocked = 0;
for (const dir of readdirSync(ARCHIVE)) {
  if (done >= LIMIT) break;
  const metaPath = path.join(ARCHIVE, dir, 'meta.json');
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  if (meta.shared) continue; // 已處理
  if (!(meta.attachments ?? []).some((a) => a.type === 'native_templates')) continue;

  try {
    const { link, images } = await scrapeSharedPost(meta.permalink_url);
    const saved = [];
    for (const [i, src] of images.entries()) {
      const name = `shared-${String(i + 1).padStart(2, '0')}${extFromUrl(src)}`;
      try {
        mkdirSync(path.join(ARCHIVE, dir, 'images'), { recursive: true });
        writeFileSync(path.join(ARCHIVE, dir, 'images', name), await fetchBuffer(src));
        saved.push(name);
      } catch (e) {
        console.warn(`   圖片抓不到: ${e.message}`);
      }
      await sleep(200);
    }
    meta.shared = { link, images: saved };
    writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');
    done++;
    if (link) withLink++;
    if (saved.length) withImg++;
    if (done % 100 === 0) console.log(`...${done}（連結 ${withLink}／有圖 ${withImg}）`);
  } catch (e) {
    blocked++;
    console.warn(`${dir}: ${e.message}`);
    if (blocked >= 10 && blocked > done) {
      console.error('連續被擋，先停——晚點重跑（已處理的不會重抓）');
      process.exit(1);
    }
    await sleep(5000); // 被擋就多歇一下
  }
  await sleep(1200);
}
console.log(`shared backfill: ${done} 篇完成（目標連結 ${withLink}、預覽圖 ${withImg}、被擋 ${blocked}）`);
