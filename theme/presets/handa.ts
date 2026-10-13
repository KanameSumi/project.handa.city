// HAnDA スキン（ロゴの赤・青・白に合わせた配色）。
//
// README で想定されている「preset」方式：テーマ本体には手を入れず、
// CSS 変数（デザイントークン）を上書きするだけ。テーマの自動更新はそのまま受け取れる。
// 色を変えたいときはここの値を書き換える。
//
// ※ Cosense の .site に `theme: { skin: dark }` などを書くとそちらが優先される。
import type { ThemeDefaultPreset } from "../index";

// ロゴの色
const RED = "#d6152e"; // 白背景でコントラスト 5.2:1（AA）
const BLUE = "#1658a0"; // 白背景でコントラスト 7.0:1（AA）

export const presetHanda: ThemeDefaultPreset = {
  name: "handa",
  colorScheme: "light",
  // フォント（すべて Google Fonts）
  //   見出し・メニュー英字: Oswald（ロゴ下の英文に近い縦長の書体）
  //   本文・日本語の見出し: BIZ UDPゴシック（読みやすさ重視の UD フォント）
  //   （メニュー英字の指定は theme/styles/handa.css）
  fontHref:
    "https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=BIZ+UDPGothic:wght@400;700&family=M+PLUS+1+Code:wght@400;500&display=swap",
  tokens: {
    "--color-bg": "#ffffff",
    "--color-bg-soft": "#f7f6f6",
    "--color-bg-hover": "#fdeef0",
    "--color-text": "#1d1d22",
    "--color-text-soft": "#4a4a53",
    "--color-text-muted": "#62626c",
    "--color-text-faint": "#d0d0d6", // 装飾専用（文字には使わない）
    "--color-border": "#e8e8ec",
    "--color-border-soft": "#f1f1f4",
    "--color-divider": "rgb(29 29 34 / 0.09)",
    // アクセント：ロゴの赤
    "--color-accent": RED,
    "--color-accent-hover": "#b0101f",
    "--color-accent-soft": "#fdecee",
    "--color-code-bg": "rgb(214 21 46 / 0.07)",
    "--color-code-text": "#b0101f",
    // 囲み・タグ：ロゴの青
    "--color-callout-bg": "#f4f7fc",
    "--color-callout-border": "#d6e1f0",
    "--color-tag-bg": "rgb(22 88 160 / 0.09)",
    "--color-tag-text": BLUE,
    "--color-header-bg": "rgb(255 255 255 / 0.92)",
    "--font-sans":
      '"BIZ UDPGothic", -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic UI", sans-serif',
    "--font-display": '"Oswald", "BIZ UDPGothic", "Hiragino Sans", sans-serif',
  },
};
