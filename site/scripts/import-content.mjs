/**
 * 一次性內容匯入腳本
 *  1. WebTest/img 的散圖 → 依策展清單分本，複製成 src/content/galleries/<slug>/NN.ext + meta.yaml
 *  2. maochinn.github.io 的 Medium 文章 → 清洗後複製到 src/content/blog/
 *  3. 文章圖片 assets/<postid>/ → public/assets/
 * 重跑會覆蓋既有輸出（meta.yaml 手動改過的話請注意）。
 */
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OLD_SITE = path.resolve(ROOT, '..', 'WebTest', 'img');
// 收編後文章就在同一個 repo（site/ 的上一層）；本地備份工作區用 JEKYLL_DIR 指回舊 clone
const JEKYLL = path.resolve(ROOT, process.env.JEKYLL_DIR ?? '..');
const GALLERIES = path.join(ROOT, 'src', 'content', 'galleries');
const BLOG = path.join(ROOT, 'src', 'content', 'blog');
const PUB_ASSETS = path.join(ROOT, 'public', 'assets');

/* ============ 1. 圖集策展清單 ============ */
// pages: [來源資料夾, 檔名]，順序即閱讀順序
const CURATION = [
  {
    slug: 'krenz-practice',
    id: 391825,
    title: '[STUDIO MAOCHINN (帽捲)] Krenz 課程練習 W1–W8 [習作]',
    alt: 'Krenz course practice collection',
    date: '2019-03-01',
    category: '練習',
    parody: '原創',
    characters: [],
    tags: ['練習', 'Krenz課程', '電繪'],
    rating: 'all',
    fav: 610,
    featured: false,
    pages: [
      ['practice', 'Krenz_W1.png'],
      ['practice', 'Krenz_W2.png'],
      ['practice', 'Krenz_W3.png'],
      ['practice', 'Krenz_W4.png'],
      ['practice', 'Krenz_W4_DLC.png'],
      ['practice', 'Krenz_W5.png'],
      ['practice', 'Krenz_W6.png'],
      ['practice', 'Krenz_W7.png'],
      ['practice', 'Krenz_W7_DLC.png'],
      ['practice', 'Krenz_W8.png'],
    ],
  },
  {
    slug: 'figure-study',
    id: 228922,
    title: '[STUDIO MAOCHINN (帽捲)] 人體與素描研究 [習作]',
    alt: 'Figure & grayscale study',
    date: '2018-11-01',
    category: '練習',
    parody: '原創',
    characters: [],
    tags: ['練習', '人體', '素描'],
    rating: 'all',
    fav: 404,
    featured: false,
    pages: [
      ['practice', 'body_study1.png'],
      ['practice', 'body_study2.png'],
      ['practice', 'gray_scale.png'],
      ['practice', 'myself_study_1.png'],
      ['practice', 'myself_study_2.png'],
    ],
  },
  {
    slug: 'kurumi-collection',
    id: 177013, // 就決定是這個編號了
    title: '[STUDIO MAOCHINN (帽捲)] 狂三合輯 (デート・ア・ライブ) [R15注意] [DL版]',
    alt: 'Kurumi Tokisaki collection',
    date: '2019-06-01',
    category: '創作',
    parody: 'Date A Live',
    characters: ['時崎狂三'],
    tags: ['插畫', '電繪', '本命'],
    rating: 'r15',
    fav: 8181,
    featured: true,
    pages: [
      ['creation', '狂三.png'],
      ['creation', '狂三-聖誕.png'],
      ['creation', '2019_狂三_靈裝.png'],
      ['creation', '狂三_二三靈裝_眼鏡.png'],
      ['creation', '2017萬聖節-狂三.png'],
      ['graffiti', 'kurumi.png'],
      ['creation', '狂三毛衣(R15).png'],
    ],
  },
  {
    slug: 'festival-arts',
    id: 201710,
    title: '(例大祭) [STUDIO MAOCHINN (帽捲)] 節慶賀圖輯 [全彩]',
    alt: 'Festival greeting illustrations',
    date: '2017-10-31',
    category: '創作',
    parody: '綜合',
    characters: ['初音未來'],
    tags: ['賀圖', '節慶', '插畫'],
    rating: 'all',
    fav: 1717,
    featured: false,
    pages: [
      ['creation', '2016萬聖節.png'],
      ['creation', '2017丁酉.png'],
      ['graffiti', '情人節快樂.png'],
      ['graffiti', '薛南賀圖.jpg'],
      ['creation', 'miku-10th.png'],
    ],
  },
  {
    slug: 'fanart-collection',
    id: 265918,
    title: '[STUDIO MAOCHINN (帽捲)] 遊戲動畫二創輯 [フルカラー]',
    alt: 'Game & anime fanart collection',
    date: '2019-01-01',
    category: '創作',
    parody: '綜合',
    characters: ['2B', '黑貞德', '酒吞童子'],
    tags: ['二創', '插畫', '電繪'],
    rating: 'all',
    fav: 2789,
    featured: true,
    pages: [
      ['creation', '2B.png'],
      ['creation', '黑貞德.png'],
      ['creation', '酒吞童子.png'],
      ['creation', '奧茲魔女.png'],
      ['creation', 'Ruby.png'],
      ['creation', 'isabelle.png'],
      ['creation', '乘龍.png'],
      ['creation', '美心.png'],
    ],
  },
  {
    slug: 'graffiti-vol1',
    id: 308524,
    title: '[STUDIO MAOCHINN (帽捲)] 塗鴉本 vol.1',
    alt: 'Graffiti sketchbook vol.1',
    date: '2019-08-01',
    category: '塗鴉',
    parody: '綜合',
    characters: ['02', '寶多六花'],
    tags: ['塗鴉', '二創'],
    rating: 'all',
    fav: 1204,
    featured: true,
    pages: [
      ['graffiti', "KDA_Kai'sa.png"],
      ['graffiti', 'Raven_Branwen.png'],
      ['graffiti', 'Sorceress.png'],
      ['graffiti', 'chiya.png'],
      ['graffiti', 'kawaii_student.png'],
      ['graffiti', 'kawaii_student_2.png'],
      ['graffiti', 'kawaii_student_3.png'],
      ['graffiti', 'lin.png'],
      ['graffiti', '寶多六花.png'],
      ['graffiti', 'MAO.jpg'],
      ['graffiti', 'zero_two.png'],
    ],
  },
  {
    slug: 'r18-extras',
    id: 114514, // 這個編號也是惡意
    title: '[STUDIO MAOCHINN (帽捲)] 收錄外番外 R18 增補包 [R18注意] [DL版]',
    alt: 'R18 extras',
    date: '2019-08-01',
    category: '塗鴉',
    parody: '綜合',
    characters: ['時崎狂三', '02'],
    tags: ['塗鴉', '二創', 'R18'],
    rating: 'r18',
    fav: 1919,
    featured: false,
    pages: [
      ['graffiti', 'kurumi_R18.png'],
      ['graffiti', 'zero_two_R18.png'],
    ],
  },
  {
    slug: 'character-sheets',
    id: 246810,
    title: '[合作] 費莉斯・楊舒瑩 設定資料集 [設定資料]',
    alt: 'Felice & Yang Shu-ying character sheets',
    date: '2018-06-01',
    category: '合作',
    parody: '原創',
    characters: ['費莉斯', '楊舒瑩'],
    tags: ['設定稿', '原創', '合作'],
    rating: 'all',
    fav: 842,
    featured: false,
    pages: [
      ['cooperation', '費莉斯設定稿.png'],
      ['cooperation', '楊舒瑩設定稿.png'],
      ['cooperation', 'ch1.png'],
      ['cooperation', 'ch2.png'],
    ],
  },
  {
    slug: 'local-warfare',
    id: 100039,
    title: '[合作] 世大運 Local Warfare 美術設定 (臺北世大運)',
    alt: 'Universiade Local Warfare design works',
    date: '2017-08-19',
    category: '合作',
    parody: '臺北世大運',
    characters: [],
    tags: ['合作', '美術設定', '原創'],
    rating: 'all',
    fav: 523,
    featured: false,
    pages: [
      ['cooperation', '世大運-230.png'],
      ['cooperation', 'local_warfare_design.png'],
    ],
  },
];

const yStr = (s) => `'${String(s).replaceAll("'", "''")}'`;
const yList = (arr) => (arr.length ? `[${arr.map(yStr).join(', ')}]` : '[]');

function importGalleries() {
  let nPages = 0;
  for (const g of CURATION) {
    const dir = path.join(GALLERIES, g.slug);
    mkdirSync(dir, { recursive: true });
    const pageFiles = g.pages.map(([folder, file], i) => {
      const ext = path.extname(file).toLowerCase();
      const name = `${String(i + 1).padStart(2, '0')}${ext}`;
      const src = path.join(OLD_SITE, folder, file);
      if (!existsSync(src)) throw new Error(`missing source image: ${src}`);
      cpSync(src, path.join(dir, name));
      nPages++;
      return name;
    });
    const meta = [
      `title: ${yStr(g.title)}`,
      `alt: ${yStr(g.alt)}`,
      `id: ${g.id}`,
      `date: ${g.date}`,
      `category: ${g.category}`,
      `parody: ${yStr(g.parody)}`,
      `characters: ${yList(g.characters)}`,
      `tags: ${yList(g.tags)}`,
      `rating: ${g.rating}`,
      `fav: ${g.fav}`,
      `featured: ${g.featured}`,
      `cover: ${pageFiles[0]}`,
      `pages:`,
      ...pageFiles.map((f) => `  - ${f}`),
      '',
    ].join('\n');
    writeFileSync(path.join(dir, 'meta.yaml'), meta, 'utf8');
    console.log(`gallery ${g.slug}: ${pageFiles.length}P`);
  }
  console.log(`=> ${CURATION.length} galleries, ${nPages} pages`);
}

/* ============ 2. Medium 文章清洗匯入 ============ */
// Medium 圖檔名帶有 Windows 不允許的字元（如 1*Abc.jpeg 的 *），
// 檔案落地與 md 內連結都做同一套消毒
const sanitizeName = (name) => name.replaceAll(/[<>:"\\|?*]/g, '_');

function importBlog() {
  const srcDir = path.join(JEKYLL, '_posts', 'zmediumtomarkdown');
  mkdirSync(BLOG, { recursive: true });
  const files = readdirSync(srcDir).filter((f) => f.endsWith('.md'));
  for (const f of files) {
    let text = readFileSync(path.join(srcDir, f), 'utf8');
    // kramdown 專屬的 inline attribute list，標準 markdown 會變成字面文字
    text = text.replaceAll(/\{:.+?\}/g, '');
    // Jekyll 專用 frontmatter 欄位
    text = text.replace(/^render_with_liquid:.*\n/m, '');
    // 圖片連結的檔名消毒，與 importAssets 落地的檔名一致
    text = text.replaceAll(
      /(\/assets\/[0-9a-f]{9,14}\/)([^)\s]+)/g,
      (_, prefix, file) => prefix + sanitizeName(file)
    );
    writeFileSync(path.join(BLOG, f), text, 'utf8');
  }
  console.log(`=> ${files.length} blog posts`);
}

/* ============ 3. 文章圖片 ============ */
// 本地 working tree 因 * 檔名在 Windows checkout 失敗而不完整，
// 改從 git 物件庫（HEAD tree）直接抽 blob，落地時消毒檔名
function importAssets() {
  const git = (args, opts = {}) =>
    execFileSync('git', args, { cwd: JEKYLL, maxBuffer: 64 * 1024 * 1024, ...opts });

  const listing = git(['ls-tree', '-r', 'HEAD', '--format=%(objectname) %(path)', '--', 'assets'], {
    encoding: 'utf8',
  });
  const entries = listing
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const sp = line.indexOf(' ');
      return { sha: line.slice(0, sp), file: line.slice(sp + 1) };
    })
    // 只要文章圖片資料夾（Medium post id 形式的 hex 名稱），跳過 Chirpy 主題的 img/lib
    .filter((e) => /^assets\/[0-9a-f]{9,14}\//.test(e.file));

  const dirs = new Set();
  for (const e of entries) {
    const rel = e.file.slice('assets/'.length);
    const dir = path.join(PUB_ASSETS, path.dirname(rel));
    if (!dirs.has(dir)) {
      mkdirSync(dir, { recursive: true });
      dirs.add(dir);
    }
    const out = path.join(dir, sanitizeName(path.basename(rel)));
    writeFileSync(out, git(['cat-file', 'blob', e.sha]));
  }
  console.log(`=> ${entries.length} asset files in ${dirs.size} folders (from git blobs)`);
}

// CI 上沒有 WebTest（圖集已隨 repo 走），只有本地重策展時才重建圖集
if (existsSync(OLD_SITE)) importGalleries();
else console.log(`skip galleries (no ${OLD_SITE})`);
importBlog();
importAssets();
console.log('done.');
