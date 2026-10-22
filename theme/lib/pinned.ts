// HAnDA: 本文の写真を「紙に貼ってある」ように見せる。
// 本文（components/Content.astro）の HTML の中から、1行に1枚で置かれた写真を探して
// <span class="pinned …"> で包む。留め方（テープ・画鋲）と傾きは写真ごとに変える。
//   - 同じ写真なら、いつビルドしても同じ留め方・傾きになる（写真の URL から決めている）
//   - 文中の小さな画像（.inline-image）やアイコン（.icon）は対象外
//   - 見た目は theme/styles/handa.css の「貼ってある写真」

// 留め方：pin = 画鋲（いまは画鋲だけ）
//   テープも混ぜたいときは "tape2"（左上と右上にテープ）・"tape1"（上の真ん中にテープ）を足す
const KINDS = ["pin"];
// マスキングテープの色（生成り・ロゴの青・ロゴの赤を薄くしたもの）
const TAPES = [
  "rgb(232 216 172 / 0.85)",
  "rgb(22 88 160 / 0.32)",
  "rgb(214 21 46 / 0.28)",
];
// 傾き（度）
const TILTS = [1.6, 1.2, 0.8, 1.7, 1.0, 0.7];

const hash = (s: string) => {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

// class の付いていない <img>（＝1行に1枚の写真）。リンク付きならリンクごと
const PHOTO = /(<a\b[^>]*>\s*)?(<img\b(?![^>]*\sclass=)[^>]*>)(\s*<\/a>)?/g;

export function pinPhotos(html: string): string {
  let n = 0;
  return html.replace(PHOTO, (m, open, img, close) => {
    // リンクの片側だけが引っかかったときは触らない
    if (!!open !== !!close) return m;
    const src = img.match(/\ssrc="([^"]*)"/)?.[1] ?? "";
    const h = hash(`${src}#${n}`);
    const kind = KINDS[h % KINDS.length];
    const tape = TAPES[Math.floor(h / 7) % TAPES.length];
    // となりの写真とは逆向きに傾ける
    const tilt = Math.abs(TILTS[Math.floor(h / 13) % TILTS.length]) * (n % 2 ? 1 : -1);
    n++;
    // 写真が届くまでの「読み込み中」表示（写真が届くと、その上に写真が重なって隠れる）
    const loading = `<span class="pinned-loading" aria-hidden="true"><span class="pinned-spinner"></span>読み込み中</span>`;
    return `<span class="pinned pinned--${kind}" style="--tilt:${tilt}deg;--tape:${tape}">${loading}${m}</span>`;
  });
}
