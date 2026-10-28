// HAnDA: メンバー（Cosense の #member/年度 付きページ）を集める。
// メンバーページ（templates/members.astro）とトップの MEMBERS 欄で使う。
// 書き方・並び順のルールは templates/members.astro の先頭を参照。
import { getCollection } from "astro:content";
import { MEMBER_TAG } from "./sections";
import { handaConfig } from "./config";

// ---- 表示する名前 ------------------------------------------------------------
// 同姓同名の人がいるときは、Cosense のページ名を「半田太郎（建築学科）」のように
// 区別して付ける。サイトでは名前の後ろの（ ）の部分を表示しない
export const displayName = (title: string) => title.replace(/\s*[（(][^（）()]*[）)]\s*$/, "").trim() || title;

/** 名前の後ろに（ ）が付いているメンバーページの { ページ名 → 表示する名前 }（本文中のリンクの文字を直すため） */
export async function memberDisplayNames(): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const e of await getCollection("pages")) {
    if (!e.data.tags.some((t) => MEMBER_TAG.test(t))) continue;
    const name = displayName(e.data.title);
    if (name !== e.data.title) out.set(e.data.title, name);
  }
  return out;
}

// ---- 並び順の材料 ------------------------------------------------------------
export const memberCfg = handaConfig.members ?? {};
export const DEPT_ORDER = memberCfg.departments ?? [];
const ROLE_ORDER = memberCfg.roles ?? ["代表", "副代表"];
export const OTHER_DEPT = "その他";

const tagValue = (tags: string[], ...prefixes: string[]) => {
  for (const prefix of prefixes) {
    const t = tags.find((t) => t.toLowerCase().startsWith(`${prefix.toLowerCase()}/`));
    if (t) return t.slice(prefix.length + 1).trim() || undefined;
  }
  return undefined;
};

// 学年を数値に（大きいほど上の学年）。D1〜 > M1〜 > 4年〜1年 > 不明
function gradeRank(raw?: string): number {
  if (!raw) return 0;
  const t = raw.normalize("NFKC").trim();
  let m = t.match(/^(?:D|博士)\s*(\d)/i);
  if (m) return 300 + Number(m[1]);
  m = t.match(/^(?:M|修士)\s*(\d)/i);
  if (m) return 200 + Number(m[1]);
  m = t.match(/^B?\s*(\d)\s*(?:年)?$/i);
  if (m) return 100 + Number(m[1]);
  return 0;
}

// 本文 1 行目（例：「情報科学科 ３年」「大学院経情科 １年」）から学科と学年を読み取る（タグが無いとき用）
function fromSummary(summary?: string): { dept?: string; grade: number } {
  const t = (summary ?? "").normalize("NFKC").trim();
  const m = t.match(/^(.*?)\s*(M|D|修士|博士)?\s*(\d)\s*年/i);
  if (!m) return { grade: 0 };
  const dept = m[1].replace(/[\/／|｜・,、]\s*$/, "").trim() || undefined;
  const n = Number(m[3]);
  const kind = (m[2] ?? "").toUpperCase();
  const grad = kind === "D" || kind === "博士" ? 300 : kind === "M" || kind === "修士" || /大学院|研究科/.test(dept ?? "") ? 200 : 100;
  return { dept, grade: grad + n };
}


// 1 人 1 件。その人の在籍年度・学科・学年・読み方・役職を持たせる
export async function loadMembers() {
  const pages = await getCollection("pages");
  return pages
  .map((entry) => {
    const tags = entry.data.tags;
    const years = [
      ...new Set(tags.map((t) => t.match(MEMBER_TAG)?.[1]).filter((y): y is string => Boolean(y))),
    ].sort();
    const legacyLeader = tags.some((t) => ["member/leader", "role/leader"].includes(t.toLowerCase()));
    const role = tagValue(tags, "role", "役職") ?? (legacyLeader ? "LEADER" : undefined);
    const roleIdx = role ? ROLE_ORDER.indexOf(role) : -1;
    const guess = fromSummary(entry.data.summary);
    return {
      entry,
      years,
      dept: tagValue(tags, "dept", "学科") ?? guess.dept ?? OTHER_DEPT,
      grade: gradeRank(tagValue(tags, "grade", "学年")) || guess.grade,
      yomi: (tagValue(tags, "yomi", "よみ") ?? entry.data.title).normalize("NFKC"),
      role,
      roleRank: role ? (roleIdx >= 0 ? ROLE_ORDER.length - roleIdx : 1) : 0,
    };
  })
  .filter((m) => m.years.length > 0)
  .sort(
    (a, b) =>
      b.roleRank - a.roleRank ||
      b.grade - a.grade ||
      a.yomi.localeCompare(b.yomi, "ja") ||
      a.entry.data.title.localeCompare(b.entry.data.title, "ja"),
  );
}

// 学科の並び順（handa.config.ts の departments、無い学科は後ろに）
export const deptRank = (d: string) => {
  if (d === OTHER_DEPT) return 10_000;
  const i = DEPT_ORDER.indexOf(d);
  return i >= 0 ? i : 1_000;
};
