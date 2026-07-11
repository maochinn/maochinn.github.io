import { getCollection, type CollectionEntry } from 'astro:content';
import { NS_PATH, type Namespace } from '../data/taxonomy';
import { POST_OVERRIDES } from '../data/post-overrides';
import { canonical, classify, classifyPostCategory, readingMinutes } from './taxonomy';

export type Gallery = CollectionEntry<'galleries'>;
export type Post = CollectionEntry<'blog'>;

/** 全站統一的同人誌式檔案卡欄位（圖集與文章共用） */
export interface UnifiedMeta {
  type: 'gallery' | 'post';
  title: string;
  url: string;
  date: Date;
  parodies: string[];
  characters: string[];
  tags: string[];
  artists: string[];
  groups: string[];
  languages: string[];
  categories: string[];
  /** 圖集 = 頁數；文章 = 文中圖片數（0 = 純文字本） */
  pages: number;
  /** 文章限定：閱讀分鐘 */
  minutes?: number;
  /** 文章限定：文中圖片（依出現順序，= 本子的頁面） */
  images?: { src: string; alt: string }[];
}

/** 文章 markdown → 文中圖片清單（只取本站 /assets 的圖，順序即頁序） */
export function extractImages(body: string): { src: string; alt: string }[] {
  const out: { src: string; alt: string }[] = [];
  const re = /!\[([^\]]*)\]\((\/assets\/[^)\s]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) out.push({ src: m[2], alt: m[1] });
  return out;
}

export async function getGalleries(): Promise<Gallery[]> {
  let list = await getCollection('galleries');
  // 公開部署的第二道保險：整本 r18 不進站（第一道是 gitignore 不進 repo）
  if (process.env.EXCLUDE_R18) list = list.filter((g) => g.data.rating !== 'r18');
  return list.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getPosts(): Promise<Post[]> {
  const list = await getCollection('blog');
  return list.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function galleryMeta(g: Gallery): UnifiedMeta {
  const d = g.data;
  const parody = canonical(d.parody, 'parody');
  const category = canonical(d.category, 'category');
  const tags = d.tags
    .map((t) => canonical(t, 'tag'))
    // meta.yaml 裡與系列/分類重複的詞不再算 tag（如 tags 裡的 練習、原創）
    .filter((t) => t !== parody && t !== category);
  return {
    type: 'gallery',
    title: d.title,
    url: `/g/${d.id}/`,
    date: d.date,
    parodies: [parody],
    characters: d.characters.map((c) => canonical(c, 'character')),
    tags: [...new Set(tags)],
    artists: ['maochinn'],
    groups: [canonical(d.group, 'group')],
    languages: [canonical(d.language, 'language')],
    categories: [category],
    pages: d.pages.length,
  };
}

export function postMeta(p: Post): UnifiedMeta {
  // Medium 的原始 tags（含 categories 欄位）過 taxonomy 自動分流
  const buckets = classify([...p.data.tags, ...p.data.categories]);
  const ov = POST_OVERRIDES[p.id] ?? {};
  const merge = (a?: string[], b?: string[]) => [...new Set([...(a ?? []), ...(b ?? [])])];
  const tags = merge(buckets.tag, ov.tags);
  const groups = merge(buckets.group, ov.groups);
  const images = extractImages(p.body ?? '');
  return {
    type: 'post',
    title: p.data.title,
    url: `/blog/${p.id}/`,
    date: p.data.date,
    parodies: merge(buckets.parody, ov.parodies),
    characters: merge(buckets.character, ov.characters),
    tags,
    artists: ['maochinn'],
    groups: merge(groups, ['Medium']),
    languages: buckets.language?.length ? buckets.language : ['中文'],
    categories: ov.categories ?? [classifyPostCategory(tags, groups)],
    pages: images.length,
    minutes: readingMinutes(p.body ?? ''),
    images,
  };
}

/** namespace → UnifiedMeta 的欄位名 */
export const NS_FIELD: Record<Namespace, keyof Pick<
  UnifiedMeta,
  'parodies' | 'characters' | 'tags' | 'artists' | 'groups' | 'languages' | 'categories'
>> = {
  parody: 'parodies',
  character: 'characters',
  tag: 'tags',
  artist: 'artists',
  group: 'groups',
  language: 'languages',
  category: 'categories',
};

export const nsUrl = (ns: Namespace, name: string) =>
  `/${NS_PATH[ns]}/${encodeURIComponent(name)}/`;

export interface TagCount {
  galleries: number;
  posts: number;
}

/** 每個 namespace 的 名稱 → 出現次數 */
export function buildCounts(metas: UnifiedMeta[]): Map<Namespace, Map<string, TagCount>> {
  const all = new Map<Namespace, Map<string, TagCount>>();
  for (const ns of Object.keys(NS_FIELD) as Namespace[]) all.set(ns, new Map());
  for (const m of metas) {
    const kind: keyof TagCount = m.type === 'gallery' ? 'galleries' : 'posts';
    for (const ns of Object.keys(NS_FIELD) as Namespace[]) {
      const map = all.get(ns)!;
      for (const name of m[NS_FIELD[ns]]) {
        const cur = map.get(name) ?? { galleries: 0, posts: 0 };
        cur[kind]++;
        map.set(name, cur);
      }
    }
  }
  return all;
}

export async function getAllMetas(): Promise<{
  galleries: Gallery[];
  posts: Post[];
  metas: UnifiedMeta[];
}> {
  const galleries = await getGalleries();
  const posts = await getPosts();
  return {
    galleries,
    posts,
    metas: [...galleries.map(galleryMeta), ...posts.map(postMeta)],
  };
}

export const fmt = (n: number) => n.toLocaleString('en-US');

export const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
