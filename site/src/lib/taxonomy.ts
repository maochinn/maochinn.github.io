import {
  TAXONOMY,
  POST_CATEGORY_RULES,
  POST_DEFAULT_CATEGORY,
  type Namespace,
} from '../data/taxonomy';

/** 任一原始詞（正名或別名）→ 所屬 namespace 與正名 */
const LOOKUP = new Map<string, { ns: Namespace; name: string }>();
for (const [ns, entries] of Object.entries(TAXONOMY) as [Namespace, Record<string, string[]>][]) {
  for (const [name, aliases] of Object.entries(entries)) {
    for (const raw of [name, ...aliases]) {
      const key = raw.normalize().toLowerCase();
      const prev = LOOKUP.get(key);
      if (prev && (prev.ns !== ns || prev.name !== name)) {
        throw new Error(
          `taxonomy alias collision: "${raw}" -> ${prev.ns}:${prev.name} vs ${ns}:${name}`
        );
      }
      LOOKUP.set(key, { ns, name });
    }
  }
}

/** 解析一個原始詞；不在表裡 → tag namespace、原樣 passthrough */
export function resolve(raw: string): { ns: Namespace; name: string } {
  return LOOKUP.get(raw.normalize().toLowerCase()) ?? { ns: 'tag', name: raw.normalize() };
}

/** 已知正名 → 正名（僅做同 namespace 的別名合併，用於圖集自帶欄位） */
export function canonical(raw: string, expectNs: Namespace): string {
  const hit = LOOKUP.get(raw.normalize().toLowerCase());
  return hit && hit.ns === expectNs ? hit.name : raw.normalize();
}

/** 一組原始詞 → 各 namespace 的正名 buckets */
export function classify(rawTags: string[]): Partial<Record<Namespace, string[]>> {
  const buckets: Partial<Record<Namespace, string[]>> = {};
  for (const raw of rawTags) {
    const { ns, name } = resolve(raw);
    (buckets[ns] ??= []).push(name);
  }
  for (const ns of Object.keys(buckets) as Namespace[]) {
    buckets[ns] = [...new Set(buckets[ns])];
  }
  return buckets;
}

/** 文章分類規則：看正規化後的 tags + groups */
export function classifyPostCategory(canonicalTags: string[], groups: string[]): string {
  const pool = new Set([...canonicalTags, ...groups]);
  for (const rule of POST_CATEGORY_RULES) {
    if (rule.anyOf.some((t) => pool.has(t))) return rule.category;
  }
  return POST_DEFAULT_CATEGORY;
}

/** 全部（正名與別名，皆小寫 key）→ [ns, 正名]，給搜尋索引用 */
export function lookupEntries(): [string, [Namespace, string]][] {
  return [...LOOKUP.entries()].map(([k, v]) => [k, [v.ns, v.name]]);
}

/** markdown 內文 → 閱讀分鐘數（中文約 500 字/分，粗略去掉語法與連結） */
export function readingMinutes(body: string): number {
  const cleaned = body
    .replace(/```[\s\S]*?```/g, ' ') // code block 快速掃過
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~\-|]/g, '')
    .replace(/\s+/g, '');
  return Math.min(99, Math.max(1, Math.round(cleaned.length / 500)));
}
