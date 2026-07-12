/**
 * 個別影片 metadata 覆寫（自動歸類不準時用），key = YouTube 影片 id。
 * 與 post-overrides.ts 同一套邏輯：tags/parodies/characters 是「追加」，categories 是「取代」。
 */
export interface VideoOverride {
  parodies?: string[];
  characters?: string[];
  tags?: string[];
  categories?: string[];
}

export const VIDEO_OVERRIDES: Record<string, VideoOverride> = {};
