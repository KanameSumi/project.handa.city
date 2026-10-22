// HAnDA: 写真に説明（alt）を付ける。
// Cosense に貼った写真には説明が無いので、画面の読み上げや検索のために自動で付ける。
//   - 本文の写真 …「（ページ名）の写真」。2枚目からは「（ページ名）の写真 2」のように番号付き
//   - トップのスライド …「HAnDA Project の活動の写真」
// 一覧のカードやメンバーの顔写真は、すぐ横にページ名や名前が書いてあるので、
// 読み上げが二重にならないよう空のまま（＝飾りの画像）にしておく。
// src/middleware.ts から、できあがった HTML に対して使う。

// すぐ外側のタグの class がこれなら、飾りの画像として扱う
const DECORATIVE = /card-thumb|\bthumb\b|member-card|about-card|about-photo|about-more-cover|mt-face/;
const EMPTY_ALT = /\salt(?:="")?(?=[\s>\/])/;

export function addAltText(html: string): string {
  const title = (html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "").split(" | ")[0].trim();
  let n = 0;
  return html.replace(/<img\b[^>]*>/g, (tag, offset: number) => {
    if (!EMPTY_ALT.test(tag)) return tag; // すでに説明がある
    if (/aria-hidden="true"/.test(tag)) return tag;
    if (/hero-slide/.test(tag)) return tag.replace(EMPTY_ALT, ' alt="HAnDA Project の活動の写真"');
    if (/\sclass="/.test(tag)) return tag; // アイコンや文中の小さな画像など
    const before = html.slice(Math.max(0, offset - 400), offset);
    const parentTag = [...before.matchAll(/<[a-z][^>]*>/gi)].at(-1)?.[0] ?? "";
    const parentClass = parentTag.match(/\sclass="([^"]*)"/)?.[1] ?? "";
    if (DECORATIVE.test(parentClass) || !title) return tag;
    n++;
    const alt = `${title}の写真${n > 1 ? ` ${n}` : ""}`.replace(/"/g, "&quot;");
    return tag.replace(EMPTY_ALT, ` alt="${alt}"`);
  });
}
