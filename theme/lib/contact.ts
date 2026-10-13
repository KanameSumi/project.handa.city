// HAnDA: お問い合わせページ（code:contact.yaml があるページ）の YAML を読む。
//
//   code:contact.yaml
//    accounts:                        # メイン：各 SNS アカウントのホームへのボタン
//      - { service: "X", handle: "handa_project" }
//      - { service: "Instagram", handle: "xxxx" }
//      - { service: "TikTok", handle: "xxxx" }
//      # handle（@ の後ろ）だけ書けば URL は自動。url: を書けばそちらが優先
//    sns:                             # 任意：おすすめ投稿へのリンク（小さく表示）
//      - { service: "X", label: "写真投稿", url: "https://x.com/..." }
//    mail:                            # 任意：メールで問い合わせるボタン
//      address: ""                    #   空のあいだは「準備中」表示
//      subject: "【HAnDA Project】お問い合わせ"   # 件名（自動で入る）
//      body: "お名前：\n所属：\nお問い合わせ内容：\n"   # 本文のひな形（自動で入る）
//    lab:                             # 任意：関わりのある研究室（ページ下に小さく表示）
//      name: "小栗研究室"
//      org: "愛知工業大学 情報科学部"
//      description: "HAnDA Project は小栗研究室を拠点に活動しています。"
//      url: "https://ogurilab.org"
//    email: "xxxx@aitech.ac.jp"      # 任意
//    sns:
//      - { service: "X", label: "写真投稿", url: "https://x.com/..." }
import type { CollectionEntry } from "astro:content";
import { parse } from "yaml";

export interface Account {
  service: string;
  handle?: string;
  /** 未設定（handle が空や「〇〇」）のときは undefined → 「準備中」表示 */
  url?: string;
}

export interface Mail {
  address?: string;
  /** address があるとき、件名と本文のひな形入りの mailto: リンク */
  href?: string;
}

export interface ContactData {
  accounts: Account[];
  mail?: Mail;
  lab?: { name: string; org?: string; description?: string; url?: string };
  email?: string;
  sns: { service: string; label?: string; url: string }[];
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const safeUrl = (v: unknown) => {
  const s = str(v);
  return s && /^(https?:|mailto:)/i.test(s) ? s : undefined;
};

/** お問い合わせページかどうか（#template/contact が付いている、または code:contact.yaml がある） */
// handle からアカウントのホーム URL を作る
const PROFILE_URL: Record<string, (h: string) => string> = {
  x: (h) => `https://x.com/${h}`,
  twitter: (h) => `https://x.com/${h}`,
  instagram: (h) => `https://www.instagram.com/${h}/`,
  tiktok: (h) => `https://www.tiktok.com/@${h}`,
  youtube: (h) => `https://www.youtube.com/@${h}`,
  facebook: (h) => `https://www.facebook.com/${h}`,
};

function toAccount(x: Record<string, unknown>): Account | null {
  const service = str(x.service);
  if (!service) return null;
  const rawHandle = str(x.handle)?.replace(/^@/, "");
  const handle = rawHandle && /^[A-Za-z0-9._-]+$/.test(rawHandle) ? rawHandle : undefined;
  const make = PROFILE_URL[service.toLowerCase()];
  const url = safeUrl(x.url) ?? (handle && make ? make(handle) : undefined);
  return { service, handle, url };
}

export function isContactPage(entry: CollectionEntry<"pages">): boolean {
  return (
    entry.data.template === "contact" ||
    entry.data.blocks.some((b) => b.type === "code" && /^contact\.ya?ml$/i.test(b.filename ?? ""))
  );
}

export function contactBlockIndex(entry: CollectionEntry<"pages">): number {
  return entry.data.blocks.findIndex((b) => b.type === "code" && /\.ya?ml$/i.test(b.filename ?? ""));
}

export function parseContact(entry: CollectionEntry<"pages">): ContactData | null {
  const i = contactBlockIndex(entry);
  const block = entry.data.blocks[i];
  if (!block || block.type !== "code") return null;
  let raw: unknown;
  try {
    raw = parse(block.value);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const labRaw = (o.lab ?? {}) as Record<string, unknown>;
  const lab = str(labRaw.name)
    ? {
        name: str(labRaw.name)!,
        org: str(labRaw.org),
        description: str(labRaw.description),
        url: safeUrl(labRaw.url),
      }
    : undefined;
  const sns = Array.isArray(o.sns)
    ? o.sns
        .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
        .map((x) => ({ service: str(x.service) ?? "", label: str(x.label), url: safeUrl(x.url) ?? "" }))
        .filter((x) => x.service && x.url)
    : [];
  const accounts = Array.isArray(o.accounts)
    ? o.accounts
        .map((x) => (x && typeof x === "object" ? toAccount(x as Record<string, unknown>) : null))
        .filter((x): x is Account => x !== null)
    : [];
  // mail（または旧形式の email: "..."）
  const mailRaw = (o.mail && typeof o.mail === "object" ? o.mail : {}) as Record<string, unknown>;
  const hasMail = "mail" in o || "email" in o;
  const rawAddress = str(mailRaw.address) ?? str(o.email);
  const address = rawAddress && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(rawAddress) ? rawAddress : undefined;
  const subject = str(mailRaw.subject) ?? "【HAnDA Project】お問い合わせ";
  const body = str(mailRaw.body) ?? "お名前：\nご所属：\nお問い合わせ内容：\n";
  const mail: Mail | undefined = hasMail
    ? {
        address,
        href: address
          ? `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
          : undefined,
      }
    : undefined;
  return { accounts, mail, lab, email: address, sns };
}
