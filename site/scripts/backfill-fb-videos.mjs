/**
 * 一次性 backfill：FB 原生影片本體下載 → archive/facebook/<dir>/video.mp4
 *  meta.attachments 的 media_source（fbcdn mp4 直鏈）會過期，趁 backfill 剛抓完落地。
 *  之後的新原生影片由 sync-facebook.mjs 順手下載。
 */
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fetchBuffer, sleep } from './sync-lib.mjs';

const ARCHIVE = path.resolve(import.meta.dirname, '..', '..', 'archive', 'facebook');

let n = 0;
for (const dir of readdirSync(ARCHIVE)) {
  const metaPath = path.join(ARCHIVE, dir, 'meta.json');
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  const att = (meta.attachments ?? []).find(
    (a) => a.media_type === 'video' && a.url?.includes('facebook.com') && a.media_source
  );
  if (!att) continue;
  const out = path.join(ARCHIVE, dir, 'video.mp4');
  if (existsSync(out)) continue;
  try {
    const buf = await fetchBuffer(att.media_source);
    writeFileSync(out, buf);
    console.log(`${dir}  ${(buf.length / 1024 / 1024).toFixed(2)} MB`);
    n++;
  } catch (e) {
    console.warn(`${dir}  抓不到: ${e.message}`);
  }
  await sleep(500);
}
console.log(`videos: +${n}`);
