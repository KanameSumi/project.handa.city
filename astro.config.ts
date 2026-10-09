import { defineConfig } from "astro/config";
import cosense from "@cosense-site-kit/astro";
import themeDefault from "@cosense-site-kit/theme-default";

// GitHub Actions が渡すリポジトリ所有者。ローカルビルドでは未設定（undefined）。
const owner = process.env.GITHUB_REPOSITORY_OWNER;

// Astro 本体の設定。ここでは2つのインテグレーションを使います。
//   1. cosense()      … Cosense からページを取り込む（設定の本体は cosense.config.ts）
//   2. themeDefault() … 見た目（デフォルトテーマ）。オプションはすべて任意で、
//                       未指定なら賢いデフォルトが効きます。下の値はデモ兼サンプルなので、
//                       自分のサイトに合わせて書き換えてください。
export default defineConfig({
  integrations: [
    cosense({ configFile: "./cosense.config.ts" }),

    themeDefault({
      // フッターの著作者表示（"© <年>" の後ろ）。未指定なら cosense.config.ts の site.title。
      // GitHub Actions 上ではリポジトリの所有者（ユーザー名 / Organization 名）が自動で入るので、
      // 編集は不要です。本名や会社名にしたいときは文字列で上書きしてください（例: "Taro Yamada"）。
      copyright: owner,
      // 著作者名をリンクにするときの URL（未指定ならただのテキスト表示）。
      copyrightUrl: owner && `https://github.com/${owner}`,

      // 全文検索（ヘッダーの🔍）。既定 true。小さなサイトで不要なら false に。
      // ※ 検索インデックスはビルド時に生成されるため、npm run dev では出ません
      //   （npm run build → npm run preview で確認できます）。
      search: true,

      // ── ここから下はよく使うオプションの例。必要に応じてコメントを外してください ──

      // ヘッダーに出すサイト名。未指定なら cosense.config.ts の site.title を使います。
      // siteTitle: "My Notes",

      // ヘッダーのナビ。
      // ※ Cosense の .site ページで nav: を宣言しているとそちらが優先され、これは
      //   「.site に nav が無いとき」のフォールバックです（このデモは .site で宣言済み）。
      //     { label, page } … page は Cosense ページタイトルへの内部リンク
      //     { label, href } … href は任意の URL（外部リンク）
      // nav: [
      //   { label: "Home",   page: "Home" },
      //   { label: "GitHub", href: "https://github.com/shinyaoguri/cosense-theme-default" },
      // ],

      // ホームに本文として表示する Cosense ページのタイトル。
      // 未指定なら「最近のページ一覧」を自動表示します（.site の home.page が優先）。
      // homePage: "Home",

      // 配色スキン（カラーテーマ）。組み込みは2つ:
      //   - "light" … 既定（明るい配色・トークン上書きなし）
      //   - "dark"  … presetDark（Notion 風の暖色を保ったダーク）。このデモでは下で有効化中。
      // 切り替えは2通り（.site が最優先）:
      //   (a) Cosense の .site で theme: { skin: "dark" } … ブラウザだけ・再ビルド不要・おすすめ
      //   (b) ここで preset を渡す（ビルド時の既定）。下の presetDark がその例。
      // 独自配色にしたいときは CSS 変数を上書き（light をベースに上書きされる）:
      //   preset: { tokens: { "--color-bg": "#191919" }, colorScheme: "dark" }
      // preset: presetDark,
    }),
  ],
});
