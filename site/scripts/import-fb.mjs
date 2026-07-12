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
function deriveTitle(body) {
  const line = body
    .split('\n')
    .map((l) => l.replace(/!\[[^\]]*\]\([^)]*\)/g, '').trim())
    .find((l) => l.length > 0);
  if (!line) return '（相片貼文）';
  return line.length > 40 ? `${line.slice(0, 40)}…` : line;
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

  const fm = [
    '---',
    `title: ${yStr(deriveTitle(body))}`,
    `date: ${meta.created_time}`,
    `source: ${yStr(meta.permalink_url)}`,
    '---',
    '',
  ].join('\n');
  writeFileSync(path.join(OUT_MD, `${slug}.md`), fm + body, 'utf8');
  n++;
}
console.log(`fb import: ${n} posts`);
