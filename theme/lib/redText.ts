// HAnDA: Cosense で $$ と $$ で挟んだ文字を、サイト上で赤文字にする。
//   例）Cosense に「入場は$$無料$$です」と書く → サイトでは「無料」だけが赤くなり、$$ は消える
// 記号は handa.config.ts の redText で変えられる。
// できあがった HTML を書き換える方式なので、本文・カードの説明文など、どこに書いても効く。
//   - 見出しや説明文の <title>・<meta> などでは、記号だけを取り除く
//   - コード（`…` やコードブロック）の中はそのまま残す
//   - 同じ段落の中で閉じていない記号は、ただの文字として残す
import config from "../../handa.config";

const OPEN = config.redText?.open ?? "$$";
const CLOSE = config.redText?.close ?? "$$";
const SPAN_OPEN = '<span class="red-text">';

const strip = (s: string) => s.split(OPEN).join("").split(CLOSE).join("");

// 段落などの区切り。ここをまたいで赤くはしない
const BLOCK_END = /<\/(p|li|h[1-6]|div|td|th|dd|dt|figcaption|blockquote|section|article|a)>|<br\b/i;
// 中身を書き換えない要素
const RAW = /^<(code|pre|script|style|textarea|title)\b/i;

/** 本文（<body> の中身）の記号で挟んだ部分を赤い span に置き換える */
function colorize(html: string): string {
  const parts = html.split(/(<[^>]*>)/);
  let out = "";
  let raw: string | null = null; // いま中にいる「書き換えない要素」
  let red = false;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i % 2 === 1) {
      // タグ
      if (raw) {
        if (new RegExp(`^</${raw}\\b`, "i").test(part)) raw = null;
        out += part;
        continue;
      }
      const m = part.match(RAW);
      if (m && !part.endsWith("/>")) raw = m[1].toLowerCase();
      // 属性（alt・title など）に入った記号は取り除く
      const tag = strip(part);
      // 赤の途中でタグをまたぐときは、いったん閉じて開き直す（入れ子を壊さないため）
      out += red ? `</span>${tag}${SPAN_OPEN}` : tag;
      continue;
    }
    if (raw) {
      // script・style の中の記号は取り除き、code・pre の中はそのまま
      out += raw === "code" || raw === "pre" || raw === "textarea" ? part : strip(part);
      continue;
    }
    let j = 0;
    while (j < part.length) {
      if (red && part.startsWith(CLOSE, j)) {
        out += "</span>";
        red = false;
        j += CLOSE.length;
        continue;
      }
      if (!red && part.startsWith(OPEN, j)) {
        // 同じ段落の中に閉じ記号があるときだけ赤にする
        const rest = part.slice(j + OPEN.length) + parts.slice(i + 1).join("");
        const c = rest.indexOf(CLOSE);
        const b = rest.search(BLOCK_END);
        if (c !== -1 && (b === -1 || c < b)) {
          out += SPAN_OPEN;
          red = true;
          j += OPEN.length;
          continue;
        }
      }
      out += part[j];
      j++;
    }
  }
  return out.split(`${SPAN_OPEN}</span>`).join("");
}

/** ページ全体の HTML を書き換える（<head> は記号を取るだけ、<body> は赤くする） */
export function applyRedText(html: string): string {
  if (!html.includes(OPEN) && !html.includes(CLOSE)) return html;
  const i = html.search(/<body\b/i);
  if (i === -1) return colorize(html);
  return strip(html.slice(0, i)) + colorize(html.slice(i));
}

/** JSON・RSS など HTML 以外は、記号を取り除くだけ */
export const stripRedText = strip;
