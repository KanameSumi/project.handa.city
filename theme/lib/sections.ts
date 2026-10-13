// HAnDA: サイトの「セクション」（About / Blog / Works / Members / Contact …）を
// Cosense の .site の nav から組み立てるヘルパー。
//
// - ラベルは「英語|日本語」で書く（例: "Members|メンバー"）。英語は小さな見出し、
//   日本語は大きなタイトルとして各ページの先頭に出る。
// - 種類（kind）は nav のリンク先から自動で決まる:
//     href "/posts"   → blog     （.site posts.tag のタグが付いた記事）
//     href "/works"   → works    （#works タグが付いたページ）
//     href "/members" → members  （#member/2026 などのタグが付いたページ）
//     page で、そのページが #template/contact → contact
//     page で、.site home.page と同じページ → about（トップに全文表示）
//     それ以外の page → page（トップに概要表示）
// - 各一覧ページの説明文は .site の intros で書ける（任意）:
//     intros:
//       blog: "活動の様子をお届けします"
import { type CollectionEntry, getCollection } from "astro:content";
import { hasTag, loadStructure, loadTitleToSlug, navHref } from "@cosense-site-kit/theme-utils";
import { isContactPage } from "./contact";

export type SectionKind = "about" | "blog" | "works" | "members" | "contact" | "page" | "link";

export interface Section {
  kind: SectionKind;
  en: string;
  ja: string;
  href: string;
  entry?: CollectionEntry<"pages">;
}

export const MEMBER_TAG = /^member\/(\d{4})$/i;

export function splitLabel(label: string): { en: string; ja: string } {
  const i = label.search(/[|｜]/);
  if (i === -1) return { en: label, ja: label };
  return { en: label.slice(0, i).trim(), ja: label.slice(i + 1).trim() };
}

const DEFAULTS: Record<"blog" | "works" | "members", { en: string; ja: string; path: string }> = {
  blog: { en: "Blog", ja: "ブログ", path: "/posts" },
  works: { en: "Works", ja: "活動・成果", path: "/works" },
  members: { en: "Members", ja: "メンバー", path: "/members" },
};

const base = () => import.meta.env.BASE_URL.replace(/\/$/, "");

export async function loadSections(): Promise<Section[]> {
  const structure = await loadStructure();
  const titleToSlug = await loadTitleToSlug();
  const pages = await getCollection("pages");
  const byTitle = new Map(pages.map((p) => [p.data.title, p]));
  const homeTitle = structure.home?.page;

  return structure.nav.map((item) => {
    const { en, ja } = splitLabel(item.label);
    const href = navHref(item, titleToSlug);
    if ("href" in item && item.href) {
      const h = item.href.replace(/\/$/, "");
      const kind: SectionKind =
        h === "/posts" ? "blog" : h === "/works" ? "works" : h === "/members" ? "members" : "link";
      return { kind, en, ja, href };
    }
    const entry = "page" in item ? byTitle.get(item.page) : undefined;
    const kind: SectionKind =
      entry && isContactPage(entry)
        ? "contact"
        : entry && entry.data.title === homeTitle
          ? "about"
          : "page";
    return { kind, en, ja, href, entry };
  });
}

/** 一覧ページ（blog / works / members）の見出し用ラベル。nav に無ければ既定値。 */
export async function sectionInfo(kind: "blog" | "works" | "members") {
  const sections = await loadSections();
  const found = sections.find((s) => s.kind === kind);
  const d = DEFAULTS[kind];
  const structure = (await loadStructure()) as { intros?: Record<string, unknown> };
  const intro = typeof structure.intros?.[kind] === "string" ? (structure.intros[kind] as string) : undefined;
  return {
    en: found?.en ?? d.en,
    ja: found?.ja ?? d.ja,
    href: found?.href ?? `${base()}${d.path}`,
    intro,
  };
}

export async function worksTag(): Promise<string> {
  const structure = (await loadStructure()) as { works?: { tag?: unknown } };
  return typeof structure.works?.tag === "string" ? structure.works.tag : "works";
}

export async function postsTag(): Promise<string | undefined> {
  return (await loadStructure()).posts?.tag;
}

export const byNewest = (a: CollectionEntry<"pages">, b: CollectionEntry<"pages">) =>
  (b.data.publishedAt ?? "").localeCompare(a.data.publishedAt ?? "");

/** 詳細ページの左上に出す「一覧へ戻る」リンク。該当しなければ undefined。 */
export async function backLinkFor(tags: string[]) {
  if (tags.some((t) => MEMBER_TAG.test(t))) {
    const s = await sectionInfo("members");
    return { href: s.href, label: `${s.ja}一覧`, en: s.en };
  }
  const pTag = await postsTag();
  if (pTag && hasTag(tags, pTag)) {
    const s = await sectionInfo("blog");
    return { href: s.href, label: `${s.ja}一覧`, en: s.en };
  }
  if (hasTag(tags, await worksTag())) {
    const s = await sectionInfo("works");
    return { href: s.href, label: `${s.ja}一覧`, en: s.en };
  }
  return undefined;
}

/** そのページが活動・成果（#works）のページか */
export async function isWorksPage(entry: CollectionEntry<"pages">): Promise<boolean> {
  return hasTag(entry.data.tags, await worksTag());
}

/**
 * メンバーが関わった活動・成果のページ一覧。
 * 活動ページ側でメンバー名をリンク（[山田太郎]）しているか、
 * メンバーページ側で活動名をリンク（[マイクラで再現した赤レンガ建物]）していれば関わったとみなす。
 */
export async function worksForMember(member: CollectionEntry<"pages">): Promise<CollectionEntry<"pages">[]> {
  const tag = await worksTag();
  const key = (t: string) => t.trim().toLowerCase();
  const back = new Set(member.data.backlinks.map(key));
  const out = new Set(member.data.links.map(key));
  return (await getCollection("pages"))
    .filter((e) => hasTag(e.data.tags, tag) && (back.has(key(e.data.title)) || out.has(key(e.data.title))))
    .sort(byNewest);
}
