/**
 * 個別巴哈創作的 metadata 覆寫，key = 創作編號（sn）。
 * 與 post-overrides.ts 同邏輯：tags/parodies/characters 是「追加」，categories 是「取代」；
 * hidden: true 可把單篇下架（例如與 Medium 版重複、之後整合時用）。
 */
export interface BahaOverride {
  parodies?: string[];
  characters?: string[];
  tags?: string[];
  categories?: string[];
  hidden?: boolean;
}

export const BAHA_OVERRIDES: Record<string, BahaOverride> = {};
