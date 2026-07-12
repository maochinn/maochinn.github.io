/**
 * 巴哈姆特小屋創作備份：list API + 文章頁 → ../archive/baha/<sn>-<slug>/
 *  - 每篇：meta.json + content.html（原始內文）+ content.md + images/（內文圖下載）
 *  - 增量：資料夾已存在的 sn 跳過
 *  - 「兒少保護」標記（flagicon）的跳過——需要登入才看得到，之後另想辦法（見 docs/SYNC.md）
 *  - 對站方禮貌：每篇之間 sleep 1.5s
 */
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import TurndownService from 'turndown';
import { fetchJSON, fetchText, fetchBuffer, sleep, slugify, extFromUrl } from './sync-lib.mjs';

const OWNER = 'maochinn';
const ARCHIVE = path.resolve(import.meta.dirname, '..', '..', 'archive', 'baha');

/* ---------- list：翻頁抓全部創作 ---------- */
const listPage = (p) =>
  fetchJSON(`https://api.gamer.com.tw/home/v2/creation_list.php?owner=${OWNER}&page=${p}&row=50`, {
    Referer: 'https://home.gamer.com.tw/',
  });

const first = await listPage(1);
const totalPage = Number(first.data.totalPage);
const items = [...first.data.list];
for (let p = 2; p <= totalPage; p++) items.push(...(await listPage(p)).data.list);
console.log(`baha: ${items.length} creations listed (${totalPage} pages)`);

/* ---------- 內文擷取：<div id="article_content"> 到對應的 </div>（數 div 深度） ---------- */
function extractArticle(html) {
  const start = html.search(/<div[^>]*id="article_content"[^>]*>/);
  if (start < 0) return null;
  const re = /<div\b[^>]*>|<\/div>/g;
  re.lastIndex = start;
  let depth = 0;
  for (let m; (m = re.exec(html)); ) {
    depth += m[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return html.slice(start, m.index + m[0].length);
  }
  return null;
}

/* ---------- 連結還原：ref.gamer.com.tw 轉址 → 原始網址 ---------- */
const unwrapRedir = (html) =>
  html.replace(
    /https?:\/\/ref\.gamer\.com\.tw\/redir\.php\?url=([^"'\s<>]+)/g,
    (_, enc) => decodeURIComponent(enc)
  );

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

let added = 0;
let skippedFlag = 0;
for (const it of items) {
  const sn = Number(it.csn);
  if ((it.flagicon ?? []).length) {
    skippedFlag++;
    continue;
  }
  const dir = path.join(ARCHIVE, `${sn}-${slugify(it.title)}`);
  if (existsSync(dir)) continue;

  const page = await fetchText(`https://home.gamer.com.tw/artwork.php?sn=${sn}`, {
    Referer: 'https://home.gamer.com.tw/',
  });
  let article = extractArticle(page);
  if (!article) {
    console.warn(`!! ${sn} 抓不到內文容器，跳過（${it.title}）`);
    continue;
  }
  article = unwrapRedir(article);

  mkdirSync(path.join(dir, 'images'), { recursive: true });
  try {
    /* 內文圖片下載 + 連結改指本地檔（lazysizes 的 data-src 優先於 src） */
    const imgUrls = [
      ...new Set(
        [...article.matchAll(/<img[^>]*?(?:data-src|src)="(https?:\/\/[^"]+)"/g)].map((m) => m[1])
      ),
    ];
    let n = 0;
    for (const url of imgUrls) {
      const name = `${String(++n).padStart(2, '0')}${extFromUrl(url)}`;
      try {
        writeFileSync(path.join(dir, 'images', name), await fetchBuffer(url));
        article = article.replaceAll(url, `images/${name}`);
      } catch (e) {
        console.warn(`   圖片抓不到（保留原網址）: ${url} — ${e.message}`);
        n--;
      }
      await sleep(200);
    }

    const header = `# ${it.title}\n\n> ${it.ctime} · ${it.categoryName} · GP ${it.gp} · ` +
      `來源 https://home.gamer.com.tw/artwork.php?sn=${sn}\n\n`;
    writeFileSync(path.join(dir, 'content.html'), article, 'utf8');
    writeFileSync(path.join(dir, 'content.md'), header + turndown.turndown(article) + '\n', 'utf8');
    writeFileSync(
      path.join(dir, 'meta.json'),
      JSON.stringify(
        {
          sn,
          title: it.title,
          ctime: it.ctime,
          category: it.categoryName,
          kind1: Number(it.kind1),
          gp: it.gp,
          visit: it.visit,
          url: `https://home.gamer.com.tw/artwork.php?sn=${sn}`,
        },
        null,
        2
      ) + '\n',
      'utf8'
    );
    console.log(`baha ${sn}: ${it.title}（圖 ${n} 張）`);
    added++;
  } catch (e) {
    rmSync(dir, { recursive: true, force: true }); // 半成品不留，下次重抓
    throw e;
  }
  await sleep(1500);
}
console.log(`baha: +${added} new, ${skippedFlag} flagged skipped`);
