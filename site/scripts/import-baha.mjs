/**
 * 巴哈備份 → 站上文章（build 時執行，與 import-content.mjs 的 blog 同模式）
 *  ../archive/baha/<sn>-<slug>/ → src/content/baha/<sn>.md + public/baha/<sn>/（圖片）
 * 輸出是生成物（gitignore），重跑會覆蓋；individual 修正請用 src/data/baha-overrides.ts。
 */
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { yStr } from './sync-lib.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const ARCHIVE = path.resolve(ROOT, '..', 'archive', 'baha');
const OUT_MD = path.join(ROOT, 'src', 'content', 'baha');
const OUT_IMG = path.join(ROOT, 'public', 'baha');

if (!existsSync(ARCHIVE)) {
  console.log(`skip baha import (no ${ARCHIVE})`);
  process.exit(0);
}

rmSync(OUT_MD, { recursive: true, force: true });
mkdirSync(OUT_MD, { recursive: true });
mkdirSync(OUT_IMG, { recursive: true });

let n = 0;
for (const dir of readdirSync(ARCHIVE)) {
  const src = path.join(ARCHIVE, dir);
  const meta = JSON.parse(readFileSync(path.join(src, 'meta.json'), 'utf8'));
  let body = readFileSync(path.join(src, 'content.md'), 'utf8').replace(/\r\n/g, '\n');

  // 去掉備份檔自帶的標題與來源行（站上由 frontmatter/版型呈現）
  body = body.replace(/^# .*\n+/, '').replace(/^> .*\n+/, '');
  // 圖片連結改指 public 路徑
  body = body.replaceAll('](images/', `](/baha/${meta.sn}/`);

  if (existsSync(path.join(src, 'images'))) {
    cpSync(path.join(src, 'images'), path.join(OUT_IMG, String(meta.sn)), { recursive: true });
  }

  const fm = [
    '---',
    `title: ${yStr(meta.title)}`,
    `date: ${meta.ctime}`,
    `baha_category: ${yStr(meta.category)}`,
    `kind: ${meta.kind1}`, // 1=文章 3=插畫 6=Cosplay（巴哈的 kind1）
    `gp: ${meta.gp}`,
    `visit: ${meta.visit}`,
    `source: ${yStr(meta.url)}`,
    '---',
    '',
  ].join('\n');
  writeFileSync(path.join(OUT_MD, `${meta.sn}.md`), fm + body, 'utf8');
  n++;
}
console.log(`baha import: ${n} posts`);
