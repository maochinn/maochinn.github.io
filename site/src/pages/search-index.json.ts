import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { getAllMetas, galleryMeta, postMeta, fmtDate } from '../lib/site';
import { lookupEntries } from '../lib/taxonomy';

export const GET: APIRoute = async () => {
  const { galleries, posts } = await getAllMetas();

  const galleryEntries = await Promise.all(
    galleries.map(async (g) => {
      const m = galleryMeta(g);
      const cover = await getImage({ src: g.data.cover, width: 480 });
      return {
        ...m,
        date: fmtDate(m.date),
        alt: g.data.alt,
        rating: g.data.rating,
        cover: cover.src,
      };
    })
  );

  const postEntries = posts.map((p) => {
    const m = postMeta(p);
    const { images, ...rest } = m; // 圖片清單不進索引，只留封面
    return {
      ...rest,
      date: fmtDate(m.date),
      description: p.data.description ?? '',
      cover: images?.[0]?.src ?? null,
    };
  });

  // aliases: 任一寫法（小寫）→ [namespace, 正名]，搜尋時把使用者輸入正規化
  const payload = {
    aliases: Object.fromEntries(lookupEntries()),
    entries: [...galleryEntries, ...postEntries],
  };

  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
