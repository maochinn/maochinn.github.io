/**
 * 全站 tag 分類法：namespace + 正名（canonical）+ 別名（aliases）
 *
 * 任何來源 tag（Medium 英文 tag、圖集中文 tag）出現在此表的
 * 正名或別名中，就會被歸入該 namespace 並以正名顯示；
 * 沒列在表裡的詞自動落在 tags namespace、原樣顯示（passthrough）。
 *
 * 發現新的同義分裂就往這裡加一行。別名不可重複（lib 會在 build 時檢查）。
 */

export type Namespace =
  | 'parody'
  | 'character'
  | 'tag'
  | 'artist'
  | 'group'
  | 'language'
  | 'category';

export const TAXONOMY: Record<Namespace, Record<string, string[]>> = {
  // 系列 —— 對文章來說是「平台 / 生態系 / 品牌」，這是本站的世界觀
  parody: {
    // 注意：正名會變成網址段與輸出目錄名，不可含 / 或 :（用別名吸收原始寫法）
    'Date A Live': ['デート・ア・ライブ'],
    'Fate Grand Order': ['fgo', 'Fate/Grand Order'],
    'NieR Automata': ['nier', 'NieR:Automata'],
    'NVIDIA Omniverse': ['omniverse', 'kit', 'ovx', 'custom-application', 'extension'],
    NVIDIA: ['nvidia'],
    'NVIDIA Cosmos': ['cosmos'],
    'NVIDIA Isaac Sim': ['isaac-sim', 'issac'],
    Blender: ['blender'],
    OpenUSD: ['openusd'],
    OpenGL: ['opengl'],
    OpenCV: ['opencv'],
    Unity: ['unity'],
    FLTK: ['fltk'],
    PyTorch3D: ['pytorch3d'],
    SIGGRAPH: ['siggraph', 'siggraph-asia'],
    GTC: ['gtc-2025'],
    'Pokémon': ['pokemon', '寶可夢'],
    'LoveLive! 虹咲': ['love-live', '虹ヶ咲'],
    'Detroit: Become Human': ['detroit'],
    'ASUS ROG': ['asus-rog', 'rog', 'rog-zephyrus'],
  },

  // 角色
  character: {
    時崎狂三: ['tokisaki-kurumi', 'kurumi'],
  },

  // 一般標籤 —— 只列需要「合併同義詞」的，其餘 passthrough
  tag: {
    電腦圖學: ['computer-graphics', '計算機圖形學', 'cg'],
    電繪: ['digital-art', 'digital-painting'],
    Krenz課程: ['krenz'],
    自動化: ['automation'],
    出差: ['business-trip'],
    開箱: ['unboxing'],
    同人誌: ['doujinshi'],
    東京: ['tokyo'],
    香港: ['hong-kong'],
    中國: ['china'],
    深圳: ['shenzhen', 'shenzhen-city-lahore'],
    拉合爾: ['lahore'],
    台北101: ['101'],
    'differentiable-rendering': ['differentiable-renderer'],
  },

  // 作者
  artist: {
    maochinn: ['帽捲'],
  },

  // 社團 / 出處
  group: {
    'STUDIO MAOCHINN': ['studio-maochinn'],
    鴻海: ['foxconn'],
  },

  // 語言
  language: {
    中文: ['zh', 'chinese'],
    無文字: ['textless'],
  },

  // 分類（內容型態）
  category: {
    創作: [],
    練習: [],
    塗鴉: [],
    合作: [],
    技術文章: [],
    遊記: [],
    開箱文: [],
    職涯: [],
  },
};

/** 文章分類規則：命中越前面的越優先，都沒中 → 技術文章 */
export const POST_CATEGORY_RULES: { category: string; anyOf: string[] }[] = [
  { category: '開箱文', anyOf: ['開箱'] },
  {
    category: '遊記',
    anyOf: ['旅遊', '出差', '東京', '京都', '大阪', '秋葉原', '香港', '中國', '深圳', '拉合爾', '台北101'],
  },
  { category: '職涯', anyOf: ['面試', '轉職', '工作', '鴻海'] },
];
export const POST_DEFAULT_CATEGORY = '技術文章';

/** namespace → 路由段（nhentai 式單數） */
export const NS_PATH: Record<Namespace, string> = {
  parody: 'parody',
  character: 'character',
  tag: 'tag',
  artist: 'artist',
  group: 'group',
  language: 'language',
  category: 'category',
};

/** /tags/ 頁與檔案卡的顯示標題與順序 */
export const NS_LABEL: [Namespace, string, string][] = [
  ['parody', '系列', 'parodies'],
  ['character', '角色', 'characters'],
  ['tag', '標籤', 'tags'],
  ['artist', '作者', 'artists'],
  ['group', '社團', 'groups'],
  ['language', '語言', 'languages'],
  ['category', '分類', 'categories'],
];
