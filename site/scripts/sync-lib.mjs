/** 三支站外同步腳本（youtube/pixiv/baha）共用的小工具 */

export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(url, headers = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, ...headers }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res;
}

export const fetchText = async (url, headers) => (await request(url, headers)).text();
export const fetchJSON = async (url, headers) => (await request(url, headers)).json();
export const fetchBuffer = async (url, headers) =>
  Buffer.from(await (await request(url, headers)).arrayBuffer());

/** 檔名消毒：Windows 不允許字元 + 結尾點/空白 */
export const sanitizeName = (name) =>
  name.replace(/[<>:"/\\|?*]/g, '_').replace(/[. ]+$/, '');

/** 標題 → 資料夾 slug（保留 CJK，空白轉 -，截短） */
export const slugify = (title, max = 40) =>
  sanitizeName(title).replace(/\s+/g, '-').slice(0, max).replace(/[-_.]+$/, '');

/** meta.yaml 用的最小 YAML 序列化（與 import-content.mjs 同款） */
export const yStr = (s) => `'${String(s).replace(/'/g, "''")}'`;
export const yList = (arr) => (arr.length ? `[${arr.map(yStr).join(', ')}]` : '[]');

/** URL → 副檔名（帶 query 也行；認不得就給 fallback） */
export function extFromUrl(url, fallback = '.jpg') {
  const m = /\.(png|jpe?g|gif|webp|avif)(?:[?#]|$)/i.exec(url);
  return m ? `.${m[1].toLowerCase().replace('jpeg', 'jpg')}` : fallback;
}
