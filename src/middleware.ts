// HAnDA: できあがったページを最後に書き換える場所。
//   - Gyazo の写真を軽くしてサイトから配る（theme/lib/images.ts）
//   - 写真に説明（alt）を付ける（theme/lib/alt.ts）
//   - $$ で挟んだ文字を赤くする（theme/lib/redText.ts）
import { defineMiddleware } from "astro:middleware";
import { applyRedText, stripRedText } from "../theme/lib/redText";
import { optimizeImages } from "../theme/lib/images";
import { addAltText } from "../theme/lib/alt";

export const onRequest = defineMiddleware(async (context, next) => {
  const res = await next();
  const type = res.headers.get("content-type") ?? "";
  const path = context.url.pathname;
  const isHtml = type.includes("text/html");
  const isText = /json|xml|rss/.test(type) || /\.(json|xml)$/.test(path);
  if (!isHtml && !isText) return res;
  const body = await res.text();
  const out = isHtml ? applyRedText(await optimizeImages(addAltText(body))) : stripRedText(body);
  return new Response(out, { status: res.status, statusText: res.statusText, headers: res.headers });
});
