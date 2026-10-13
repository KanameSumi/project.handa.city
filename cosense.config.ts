import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defineCosenseSite } from "@cosense-site-kit/core";
import { parse as parseYaml } from "yaml";

// サイト名・説明文も Cosense の `.site` ページから読む（コード編集不要にするため）。
//   code:site.yaml
//    site:
//      title: "HAnDA Project"
//      description: "..."
// `npm run fetch` で取得済みのキャッシュから読み、無ければ下のフォールバックを使う。
function readSiteMeta(): { title?: string; description?: string } {
  try {
    const root = ".cosense-cache/pages";
    for (const dir of readdirSync(root)) {
      for (const file of readdirSync(join(root, dir))) {
        const page = JSON.parse(readFileSync(join(root, dir, file), "utf8"));
        if (page.title !== ".site") continue;
        const lines: string[] = page.text.split("\n");
        const start = lines.findIndex((l) => /^code:site\.ya?ml$/.test(l.trim()));
        if (start === -1) return {};
        const body: string[] = [];
        for (const l of lines.slice(start + 1)) {
          if (!/^[ \t]/.test(l)) break;
          body.push(l.slice(1));
        }
        const site = parseYaml(body.join("\n"))?.site ?? {};
        return {
          title: typeof site.title === "string" ? site.title : undefined,
          description: typeof site.description === "string" ? site.description : undefined,
        };
      }
    }
  } catch {
    // キャッシュ未取得など。フォールバックを使う。
  }
  return {};
}
const meta = readSiteMeta();

// Per-site values are NOT hard-coded here, so a copy of this template needs
// no code edits to be pointed at your own site:
//
//   * source.project — your PUBLIC Cosense project name. Set it as a GitHub
//     repository *variable* named COSENSE_PROJECT
//     (Settings → Secrets and variables → Actions → Variables). Locally, run
//     e.g. `COSENSE_PROJECT=my-notes npm run dev`. Left unset, the build stops
//     with a message instead of silently building someone else's site.
//   * site.baseUrl / site.base — injected by the deploy workflow
//     (PAGES_ORIGIN / PAGES_BASE_PATH, from actions/configure-pages), which
//     handles both user/org pages (served at "/") and project pages (served
//     at "/REPO"). The literals below are only fallbacks for local builds.
//   * site.title — defaults to the repository name; edit it to taste.
//
// The upstream demo (https://shinyaoguri.github.io/cosense-theme-default/)
// builds from the public Cosense project https://scrapbox.io/cosense-theme-default/
// by setting COSENSE_PROJECT=cosense-theme-default as its repository variable.
const project = process.env.COSENSE_PROJECT;
if (!project) {
  throw new Error(
    "COSENSE_PROJECT is not set. Set your public Cosense project name as the " +
      "COSENSE_PROJECT repository variable (Settings → Secrets and variables → " +
      "Actions → Variables), or run locally with COSENSE_PROJECT=<name>.",
  );
}

export default defineCosenseSite({
  site: {
    title: meta.title ?? "HAnDA Project",
    description: meta.description ?? "A site published from Cosense",
    baseUrl: process.env.PAGES_ORIGIN || "http://localhost:4321",
    base: process.env.PAGES_BASE_PATH || "/",
    lang: "ja",
  },

  source: {
    type: "cosense",
    project,
  },

  publish: {
    default: "none",
    includeTags: ["publish"],
    excludeTags: ["draft", "private", "internal"],
  },

  routing: {
    slug: "metadata-or-encoded-title",
  },

  deploy: {
    target: "github-pages",
    schedule: "17 1,13 * * *",
  },
});
