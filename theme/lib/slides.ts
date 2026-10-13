// HAnDA: トップページのスライド写真を Cosense の専用ページから読む。
//
// Cosense 側:
//   - タイトル「トップ写真」のページを作り、写真を上から順に貼る（1 行に 1 枚）
//   - #publish を付ける（このページ自体はサイトのページとしては公開されない）
//   - ページ名を変えたいときは .site に  slides: "ページ名"  と書く
import { type CollectionEntry, getCollection } from "astro:content";
import { loadStructure } from "@cosense-site-kit/theme-utils";

export const DEFAULT_SLIDES_PAGE = "トップ写真";

export async function slidesPageTitle(): Promise<string> {
  const s = (await loadStructure()) as { slides?: unknown };
  return typeof s.slides === "string" && s.slides.trim() ? s.slides.trim() : DEFAULT_SLIDES_PAGE;
}

/** そのページがスライド用ページか（通常のページとしては出さない） */
export async function isSlidesPage(entry: CollectionEntry<"pages">): Promise<boolean> {
  return entry.data.title === (await slidesPageTitle());
}

// Gyazo の画像は Cosense 上では縮小版（/thumb/1000）になっているので、大きい版に差し替える
function hiRes(url: string): string {
  const m = url.match(/^(https?:\/\/(?:[0-9a-z-]+\.)?gyazo\.com\/[0-9a-f]{32})(?:\/thumb\/\d+|\/raw)?$/);
  return m ? `${m[1]}/max_size/2400` : url;
}

type Node = { type?: string; src?: string; children?: Node[] };

export async function loadSlides(): Promise<string[]> {
  const title = await slidesPageTitle();
  const entry = (await getCollection("pages")).find((e) => e.data.title === title);
  if (!entry) return [];
  const urls: string[] = [];
  const walk = (nodes: Node[] | undefined) => {
    for (const n of nodes ?? []) {
      if (n.type === "image" && n.src) urls.push(n.src);
      if (n.children) walk(n.children);
    }
  };
  for (const b of entry.data.blocks as unknown as (Node & { url?: string })[]) {
    if (b.type === "image" && b.url) urls.push(b.url);
    else walk(b.children);
  }
  return [...new Set(urls.map(hiRes))];
}
