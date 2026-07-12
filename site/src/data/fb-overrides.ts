/**
 * 個別 FB 貼文的 metadata 覆寫，key = 貼文流水號（permalink 的 posts/ 後面那段）。
 * tags/parodies/characters 是「追加」，categories 是「取代」（預設全是 動態）；
 * hidden: true 可把單篇下架（與其他平台重複、之後整合時用）。
 */
export interface FbOverride {
  parodies?: string[];
  characters?: string[];
  tags?: string[];
  categories?: string[];
  hidden?: boolean;
}

export const FB_OVERRIDES: Record<string, FbOverride> = {};
