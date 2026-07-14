/**
 * FB 站內分享貼文（native_templates）的補救抓取：
 * Graph API 讀不到分享目標，但公開的 embed plugin 頁（plugins/post.php）
 * server-side HTML 裡有「分享目標的永久連結」與「分享內容的預覽圖」。
 * 需要完整瀏覽器 headers（缺 Sec-Fetch 等會被 400 擋）；
 * 原作者名與貼文文字是 JS 渲染，靜態 HTML 拿不到（要就得上 headless，刻意不做）。
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { UA } from './sync-lib.mjs';

const run = promisify(execFile);

// 注意：這頁得用 curl 抓——Node fetch 只會講 HTTP/1.1，FB 會擋
// 「自稱 Chrome 卻不走 HTTP/2」的請求（一律 400）；curl 走 h2 就過
const CURL_ARGS = [
  '-sf',
  '--compressed',
  '-H', `User-Agent: ${UA}`,
  '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  '-H', 'Accept-Language: zh-TW,zh;q=0.9,en;q=0.8',
  '-H', 'Sec-Fetch-Dest: iframe',
  '-H', 'Sec-Fetch-Mode: navigate',
  '-H', 'Sec-Fetch-Site: cross-site',
];

const decodeEntities = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));

/**
 * @param permalink 自家貼文的 permalink_url
 * @returns {Promise<{link: string|null, images: string[]}>}
 *   link=分享目標永久連結（原貼文已刪等情況會是 null）、images=預覽圖 CDN URL
 * @throws 被擋（HTTP 非 200 或 Error 頁）時丟錯，讓呼叫端決定重試——與「查無內容」區分
 */
export async function scrapeSharedPost(permalink) {
  const url = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(permalink)}&show_text=true&width=500`;
  const { stdout: html } = await run('curl', [...CURL_ARGS, url], { maxBuffer: 8 * 1024 * 1024 }).catch((e) => {
    throw new Error(`embed curl failed (${e.code ?? e.message})`);
  });
  if (/<title>Error<\/title>/.test(html)) throw new Error('embed blocked (Error page)');

  // 自家貼文編號：排除 embed 裡指回本篇的連結
  const ownId = permalink.match(/(\d+)\/?$/)?.[1];

  // 分享目標連結：photo.php / videos / 他人 posts / permalink.php
  const link = [...html.matchAll(/href="((?:https:\/\/www\.facebook\.com)?\/[^"]*(?:photo\.php|\/videos\/|\/posts\/|permalink\.php|\/watch\/)[^"]*)"/g)]
    .map((m) => decodeEntities(m[1]))
    .map((h) => (h.startsWith('/') ? `https://www.facebook.com${h}` : h))
    .map((h) => h.replace(/[?&]ref=embed_post/, ''))
    .find((h) => !(ownId && h.includes(ownId)) && !h.includes('sharer'));

  // 預覽圖：fbcdn 內容圖（排掉頭像——URL 帶兩位數方框尺寸如 s40x40、s50x50）
  const images = [
    ...new Set(
      [...html.matchAll(/src="(https:\/\/(?:scontent|external)[^"]*fbcdn\.net[^"]*)"/g)]
        .map((m) => decodeEntities(m[1]))
        .filter((u) => !/s\d{2}x\d{2}(?!\d)/.test(u))
    ),
  ];

  return { link: link ?? null, images };
}
