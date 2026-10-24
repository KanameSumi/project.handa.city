// HAnDA: 概要ページ（handa.config.ts の home.about）の下に続けて載せるページ
// （半田市とは・赤レンガ建物とは など）を集める。概要ページの目次・トップの ABOUT 欄・共有用画像で使う。
//
// 載せ方は2通り（両方使える）:
//   1. Cosense のページに  #about/5  のようなタグを付ける（数字が並び順。目次の番号になる）
//      → handa.config.ts を書き換えずに、Cosense だけで増やせる
//      ※ / の入ったタグはサイト上には表示されない
//   2. handa.config.ts の home.aboutMore にタイトルを書く（書いた順に 02, 03, … の扱い）
// 並び順は「タグの数字」と「aboutMore での位置（2番目から）」を同じものさしで比べて決める。
// 同じページが両方にあるときはタグの数字が優先。数字の同じものはタイトル順。
import { getCollection, type CollectionEntry } from "astro:content";
import { handaConfig } from "./config";

type Entry = CollectionEntry<"pages">;
const ABOUT_TAG = /^(?:about|概要)\/(\d+)$/i;

export async function loadAboutMore(): Promise<Entry[]> {
  const pages = await getCollection("pages");
  const mainTitle = handaConfig.home.about;
  const items = new Map<string, { entry: Entry; order: number }>();

  // handa.config.ts の aboutMore（1つ目が 02）
  (handaConfig.home.aboutMore ?? []).forEach((title, i) => {
    const entry = pages.find((e) => e.data.title === title);
    if (entry) items.set(title, { entry, order: i + 2 });
  });

  // Cosense の #about/番号 タグ
  for (const entry of pages) {
    if (entry.data.title === mainTitle) continue;
    for (const tag of entry.data.tags) {
      const m = tag.match(ABOUT_TAG);
      if (m) {
        items.set(entry.data.title, { entry, order: Number(m[1]) });
        break;
      }
    }
  }

  return [...items.values()]
    .sort((a, b) => a.order - b.order || a.entry.data.title.localeCompare(b.entry.data.title, "ja"))
    .map((x) => x.entry);
}
