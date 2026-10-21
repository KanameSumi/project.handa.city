// HAnDA: できあがったページを最後に書き換える場所。
// いまは「《 》で囲んだ文字を赤くする」（theme/lib/redText.ts）だけを行っている。
import { defineMiddleware } from "astro:middleware";
import { applyRedText, stripRedText } from "../theme/lib/redText";

export const onRequest = defineMiddleware(async (context, next) => {
  const res = await next();
  const type = res.headers.get("content-type") ?? "";
  const path = context.url.pathname;
  const isHtml = type.includes("text/html");
  const isText = /json|xml|rss/.test(type) || /\.(json|xml)$/.test(path);
  if (!isHtml && !isText) return res;
  const body = await res.text();
  const out = isHtml ? applyRedText(body) : stripRedText(body);
  return new Response(out, { status: res.status, statusText: res.statusText, headers: res.headers });
});
