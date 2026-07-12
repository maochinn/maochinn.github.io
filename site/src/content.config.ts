import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const galleries = defineCollection({
  loader: glob({ pattern: '*/meta.yaml', base: './src/content/galleries' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      alt: z.string().default(''),
      id: z.number().int(), // 全站唯一：策展圖集用六位數惡趣味編號，pixiv 匯入的直接用 8 位 pixiv id
      date: z.coerce.date(),
      category: z.enum(['創作', '練習', '塗鴉', '合作']),
      parody: z.string().default('原創'),
      characters: z.array(z.string()).default([]),
      tags: z.array(z.string()).default([]),
      rating: z.enum(['all', 'r15', 'r18']).default('all'),
      language: z.string().default('無文字'), // 插畫預設無文字（懂的人都懂）
      group: z.string().default('STUDIO MAOCHINN'),
      fav: z.number().int().default(0), // 收藏數（示意用惡趣味數字）
      featured: z.boolean().default(false), // 首頁「熱門作品」區
      cover: image(),
      pages: z.array(image()).min(1),
    }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    author: z.string().optional(),
    date: z.coerce.date(),
    last_modified_at: z.coerce.date().optional(),
    categories: z
      .array(z.string())
      .default([])
      .transform((cats) => cats.filter((c) => c && c.trim() !== '')),
    tags: z
      .array(z.string())
      .default([])
      .transform((tags) => tags.filter((t) => t && t.trim() !== '')),
    description: z.string().optional(),
  }),
});

// 巴哈小屋創作（import-baha.mjs 從 ../archive/baha 生成，樣式比照 blog）
const baha = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/baha' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    baha_category: z.string().default(''),
    kind: z.number().int(), // 巴哈 kind1：1=文章 3=插畫 6=Cosplay
    gp: z.number().int().default(0),
    visit: z.number().int().default(0),
    source: z.string(),
  }),
});

export const collections = { galleries, blog, baha };
