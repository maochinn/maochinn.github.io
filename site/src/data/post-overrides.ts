/**
 * 個別文章的 metadata 覆寫（自動歸類不夠準時用）
 * key = 文章 id（檔名去掉 .md），值會「附加」到自動歸類的結果上；
 * categories 則是「取代」自動判斷。
 */
export interface PostOverride {
  parodies?: string[];
  characters?: string[];
  tags?: string[];
  groups?: string[];
  categories?: string[];
}

export const POST_OVERRIDES: Record<string, PostOverride> = {
  // 狂三繪圖文：tag 有 tokisaki-kurumi，補上系列
  '2020-03-22-4c977f187851': { parodies: ['Date A Live'] },
};
