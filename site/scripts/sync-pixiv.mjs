/**
 * Pixiv 作品同步：公開 AJAX API → src/content/galleries/<pixiv-id>/（meta.yaml + 原圖）
 *  - 匿名抓取（本來就看不到 R-18），xRestrict > 0 仍一律跳過當第二道保險
 *  - create-once：圖集資料夾已存在就不碰 → 匯入後手動修飾 meta.yaml 不會被沖掉
 *  - src/data/pixiv-ignore.json 列的 id 跳過（與舊策展圖集重複者）
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fetchJSON, fetchBuffer, sleep, extFromUrl, yStr, yList } from './sync-lib.mjs';

const USER_ID = 6856401;
const ROOT = path.resolve(import.meta.dirname, '..');
const GALLERIES = path.join(ROOT, 'src', 'content', 'galleries');
const IGNORE = new Set(
  JSON.parse(readFileSync(path.join(ROOT, 'src', 'data', 'pixiv-ignore.json'), 'utf8')).ignore
);

const HEADERS = { Referer: 'https://www.pixiv.net/' };
const api = (p) => fetchJSON(`https://www.pixiv.net/ajax${p}`, HEADERS);

const profile = await api(`/user/${USER_ID}/profile/all?lang=zh_tw`);
if (profile.error) throw new Error(`profile/all: ${profile.message}`);
const ids = [...Object.keys(profile.body.illusts ?? {}), ...Object.keys(profile.body.manga ?? {})]
  .map(Number)
  .sort((a, b) => a - b);

let added = 0;
for (const id of ids) {
  const dir = path.join(GALLERIES, String(id));
  if (IGNORE.has(id) || existsSync(dir)) continue;

  const meta = (await api(`/illust/${id}?lang=zh_tw`)).body;
  if (meta.xRestrict > 0) {
    console.log(`skip ${id} (xRestrict=${meta.xRestrict})`);
    continue;
  }
  const pageUrls =
    meta.pageCount > 1
      ? (await api(`/illust/${id}/pages?lang=zh_tw`)).body.map((p) => p.urls.original)
      : [meta.urls.original];

  mkdirSync(dir, { recursive: true });
  try {
    const pageFiles = [];
    for (const [i, url] of pageUrls.entries()) {
      const name = `${String(i + 1).padStart(2, '0')}${extFromUrl(url, '.png')}`;
      writeFileSync(path.join(dir, name), await fetchBuffer(url, HEADERS));
      pageFiles.push(name);
      await sleep(300);
    }
    const yaml = [
      `title: ${yStr(meta.title)}`,
      `alt: ${yStr(meta.alt ?? '')}`,
      `id: ${id}`, // = pixiv 作品 id（https://www.pixiv.net/artworks/<id>）
      `date: ${meta.createDate.slice(0, 10)}`,
      `category: 創作`,
      `parody: '原創'`, // 自動匯入判不了系列/角色，之後手動補（create-once 不會被沖掉）
      `characters: []`,
      `tags: ${yList((meta.tags?.tags ?? []).map((t) => t.tag))}`,
      `rating: all`,
      `fav: ${meta.bookmarkCount ?? 0}`,
      `featured: false`,
      `cover: ${pageFiles[0]}`,
      `pages:`,
      ...pageFiles.map((f) => `  - ${f}`),
      '',
    ].join('\n');
    writeFileSync(path.join(dir, 'meta.yaml'), yaml, 'utf8');
    console.log(`pixiv ${id}: ${meta.title} (${pageFiles.length}P)`);
    added++;
  } catch (e) {
    rmSync(dir, { recursive: true, force: true }); // 半成品不留，下次重抓
    throw e;
  }
  await sleep(1000);
}
console.log(`pixiv: +${added} new (${ids.length} works on pixiv, ignore ${IGNORE.size})`);
