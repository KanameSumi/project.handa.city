// HAnDA: 年度（4月〜翌3月）の計算。ブログ・活動の一覧を年度ごとに区切るのに使う。
// 年度の決め方（上から順に使う）:
//   1. #年度/2026 のタグ（活動ページは日付まで要らないので、これだけ付ければよい）
//   2. 公開日（#published/2026-08-01 のタグ、無ければ Cosense でページを作った日）

/** 日付（ISO 形式）から年度を求める。2026-03-31 → 2025年度、2026-04-01 → 2026年度。日本時間で数える */
export function fiscalYear(iso?: string): number | undefined {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return undefined;
  const jst = new Date(t + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  return jst.getUTCMonth() >= 3 ? y : y - 1; // getUTCMonth は 0 始まり（3 = 4月）
}

const YEAR_TAG = /^(?:年度|fy)\/(\d{4})$/i;

/** ページの年度。#年度/2026 のタグがあればそれ、無ければ公開日から */
export function entryFiscalYear(data: { tags: string[]; publishedAt?: string }): number | undefined {
  for (const t of data.tags) {
    const m = t.match(YEAR_TAG);
    if (m) return Number(m[1]);
  }
  return fiscalYear(data.publishedAt);
}

/** 「2026年度」 */
export const fiscalLabel = (year: number) => `${year}年度`;

/** 見出しのリンク先に使う id（#fy-2026） */
export const fiscalId = (year: number) => `fy-${year}`;

/** 年度の新しい順に並んだ一覧を、年度ごとのまとまりに分ける（日付が無いものは直前のまとまり、先頭なら今年度に入れる） */
export function groupByFiscalYear<T>(items: T[], yearOf: (item: T) => number | undefined): { year: number; items: T[] }[] {
  const groups: { year: number; items: T[] }[] = [];
  for (const item of items) {
    const year = yearOf(item) ?? groups.at(-1)?.year ?? fiscalYear(new Date().toISOString())!;
    const last = groups.at(-1);
    if (last && last.year === year) last.items.push(item);
    else groups.push({ year, items: [item] });
  }
  return groups;
}
