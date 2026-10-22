// HAnDA: ページごとの OGP 画像（/og/〇〇.png）。中身は theme/lib/og.ts
import type { APIRoute, GetStaticPaths } from "astro";
import { ogEntries, renderOg, type OgEntry } from "../../../theme/lib/og";

export const getStaticPaths: GetStaticPaths = async () =>
  (await ogEntries()).map((e) => ({ params: { path: e.key }, props: { entry: e } }));

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg((props as { entry: OgEntry }).entry);
  return new Response(png, { headers: { "Content-Type": "image/png" } });
};
