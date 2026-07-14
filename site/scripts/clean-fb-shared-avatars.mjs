/**
 * 一次性清理：把 backfill 早期存進來的「被分享粉專大頭貼」從 shared 預覽圖裡剔除。
 * （抓取端已改成過濾 sNNxNN 頭像 URL，這支只是修既有備份）
 * 判定：長寬都 <= 100px 的方形小圖 = 頭像，刪檔並從 meta.json 的 shared.images 移除。
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ARCHIVE = path.resolve(import.meta.dirname, '..', '..', 'archive', 'facebook');

let removed = 0;
let touched = 0;
for (const dir of readdirSync(ARCHIVE)) {
  const metaPath = path.join(ARCHIVE, dir, 'meta.json');
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  if (!meta.shared?.images?.length) continue;

  const keep = [];
  for (const name of meta.shared.images) {
    const file = path.join(ARCHIVE, dir, 'images', name);
    if (!existsSync(file)) continue;
    try {
      const { width = 0, height = 0 } = await sharp(file).metadata();
      if (width <= 100 && height <= 100) {
        rmSync(file);
        removed++;
        continue;
      }
    } catch {
      /* 讀不出尺寸的當內容圖保留 */
    }
    keep.push(name);
  }
  if (keep.length !== meta.shared.images.length) {
    meta.shared.images = keep;
    writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');
    touched++;
  }
}
console.log(`清掉頭像 ${removed} 張（影響 ${touched} 篇）`);
