/**
 * 一次性工具：把 Graph API 測試工具拿到的「短效使用者 token」換成「長效粉專 token」。
 * 長效粉專 token 實務上不會過期（除非改密碼/安全事件），拿到後存 GitHub Secret：
 *   gh secret set FB_PAGE_TOKEN
 *
 * 用法：
 *   node scripts/fb-token.mjs <app-id> <app-secret> <短效使用者token>
 */
const [appId, appSecret, shortToken] = process.argv.slice(2);
if (!shortToken) {
  console.error('用法: node scripts/fb-token.mjs <app-id> <app-secret> <短效使用者token>');
  process.exit(1);
}

const V = 'v21.0';
const get = async (path) => {
  const res = await fetch(`https://graph.facebook.com/${V}${path}`);
  const json = await res.json();
  if (json.error) throw new Error(`${json.error.type}: ${json.error.message}`);
  return json;
};

// 1. 短效使用者 token → 長效使用者 token
const long = await get(
  `/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}` +
    `&client_secret=${appSecret}&fb_exchange_token=${shortToken}`
);

// 2. 長效使用者 token → 各粉專的長效 Page token
const pages = await get(`/me/accounts?access_token=${long.access_token}`);
if (!pages.data?.length) throw new Error('這個帳號名下沒有粉專（權限要勾 pages_show_list）');
for (const p of pages.data) {
  const info = await get(`/debug_token?input_token=${p.access_token}&access_token=${long.access_token}`);
  const expires = info.data?.expires_at ? new Date(info.data.expires_at * 1000).toISOString() : '永不過期';
  console.log(`\n粉專: ${p.name} (id ${p.id})`);
  console.log(`到期: ${expires}`);
  console.log(`FB_PAGE_TOKEN:\n${p.access_token}`);
}
