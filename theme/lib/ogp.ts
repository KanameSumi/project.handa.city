// HAnDA: 外部ページの OGP（タイトル・説明・画像）をビルド時に読みに行く。
// Cosense で URL だけの行を書いたときに、リンクカードとして見せるために使う（components/LinkCard.astro）。
//
//   - 読みに行けなかった・時間切れのときは null（カードはドメイン名などで代わりに表示する）
//   - 同じ URL は 1 回のビルドで 1 回だけ読む。読んだ結果は .cosense-cache/ogp.json にも残し、
//     次のビルドや npm run dev で使い回す（7 日たったら読み直す）
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export interface Ogp {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  icon?: string;
}

const CACHE_FILE = join(process.cwd(), ".cosense-cache", "ogp.json");
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const TIMEOUT = 6000;

const VERSION = 2; // キャッシュの形を変えたら上げる
type Cached = { v?: number; at: number; ogp: Ogp | null };
let disk: Record<string, Cached> | null = null;
const inflight = new Map<string, Promise<Ogp | null>>();

function loadDisk(): Record<string, Cached> {
  if (disk) return disk;
  try {
    disk = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, "utf8")) : {};
  } catch {
    disk = {};
  }
  return disk!;
}
function saveDisk() {
  try {
    mkdirSync(dirname(CACHE_FILE), { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(disk ?? {}, null, 1));
  } catch {
    /* キャッシュが書けなくても表示には影響しない */
  }
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}
const clean = (s?: string) => {
  const t = s ? decodeEntities(s).replace(/\s+/g, " ").trim() : "";
  return t || undefined;
};

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[2] ?? m[3] ?? m[4]) : undefined;
}

function parse(html: string, base: string): Ogp {
  const head = html.slice(0, 300_000);
  const meta: Record<string, string> = {};
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (attr(tag, "property") ?? attr(tag, "name"))?.toLowerCase();
    const content = attr(tag, "content");
    if (key && content && !(key in meta)) meta[key] = content;
  }
  let icon: string | undefined;
  for (const tag of head.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = attr(tag, "rel")?.toLowerCase() ?? "";
    if (/\bicon\b/.test(rel) && !rel.includes("mask")) {
      icon = attr(tag, "href");
      if (rel.includes("apple-touch-icon")) continue; // 普通の icon があればそちらを優先
      break;
    }
  }
  const abs = (u?: string) => {
    if (!u) return undefined;
    try {
      const r = new URL(decodeEntities(u), base);
      return r.protocol === "https:" || r.protocol === "http:" ? r.href : undefined;
    } catch {
      return undefined;
    }
  };
  const titleTag = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return {
    title: clean(meta["og:title"] ?? meta["twitter:title"] ?? titleTag),
    description: clean(meta["og:description"] ?? meta["twitter:description"] ?? meta["description"]),
    image: abs(meta["og:image"] ?? meta["og:image:url"] ?? meta["twitter:image"]),
    siteName: clean(meta["og:site_name"]),
    icon: abs(icon) ?? abs("/favicon.ico"),
  };
}

async function fetchOgp(url: string): Promise<Ogp | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT),
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; HAnDA-Project-site/1.0; link preview)",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "ja,en;q=0.8",
      },
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return null;
    const buf = await res.arrayBuffer();
    // 文字コード（Shift_JIS などのページもある）
    const ctype = res.headers.get("content-type") ?? "";
    let charset = ctype.match(/charset=([\w-]+)/i)?.[1];
    if (!charset) {
      const sniff = new TextDecoder("latin1").decode(buf.slice(0, 4096));
      charset = sniff.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1];
    }
    let html: string;
    try {
      html = new TextDecoder(charset || "utf-8").decode(buf);
    } catch {
      html = new TextDecoder("utf-8").decode(buf);
    }
    const page = res.url || url;
    const ogp = parse(html, page);
    if (!(ogp.title || ogp.description || ogp.image)) return null;
    return ogp;
  } catch {
    return null;
  }
}

export async function getOgp(url: string): Promise<Ogp | null> {
  const cache = loadDisk();
  const hit = cache[url];
  if (hit && hit.v === VERSION && Date.now() - hit.at < MAX_AGE) return hit.ogp;
  let p = inflight.get(url);
  if (!p) {
    p = fetchOgp(url).then((ogp) => {
      // 読めなかったものも 1 日は覚えておく（毎回待たされないように）
      cache[url] = { v: VERSION, at: ogp ? Date.now() : Date.now() - MAX_AGE + 24 * 60 * 60 * 1000, ogp };
      saveDisk();
      return ogp;
    });
    inflight.set(url, p);
  }
  return p;
}

