// HAnDA: Cosense の本文中の「区切り線」の行（ーーーーー、-----、＝＝＝ など 3 文字以上）。
//   - トップの概要：線より上だけを表示し、「詳しく見る」で概要ページへ
//   - 線そのものはサイト上には表示しない
type Inline = { type: string; value?: string; children?: Inline[] };
type Block = { type: string; children?: Inline[] };

const SEPARATOR = /^[ー\-－―—─━=＝_＿〜~]{3,}$/;
const textOf = (nodes?: Inline[]): string =>
  (nodes ?? []).map((n) => (n.type === "text" ? n.value ?? "" : textOf(n.children))).join("");

export function isSeparator(block: unknown): boolean {
  const b = block as Block;
  return b?.type === "paragraph" && SEPARATOR.test(textOf(b.children).trim());
}

/** 最初の区切り線で前後に分ける（線は含めない）。線が無ければ after は null */
export function splitAtSeparator<T>(blocks: T[]): { before: T[]; after: T[] | null } {
  const i = blocks.findIndex(isSeparator);
  if (i < 0) return { before: blocks, after: null };
  return { before: blocks.slice(0, i), after: blocks.slice(i + 1).filter((b) => !isSeparator(b)) };
}
