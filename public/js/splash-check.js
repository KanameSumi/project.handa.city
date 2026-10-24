// HAnDA: ロード画面を出すかどうかの判定（components/Splash.astro から読み込む）。
// インラインだとプレビュー環境の CSP で止められるため別ファイルにしている。
// 表示前に判定して、不要ならスプラッシュを最初から出さない（ちらつき防止）
// 「もう見た」の記録は sessionStorage に残すが、プレビュー環境などでは
// sessionStorage が使えない・消えることがあるので、次の 2 つでも判定する
// - 同じサイト内のリンクから来た（メニューで移動した）とき
// - window.name の印（同じタブなら、ページを移動しても残る）
(function () {
  var skip = false;
  try {
    skip = sessionStorage.getItem("handa-splash") === "1";
  } catch (e) {}
  try {
    if (document.referrer && new URL(document.referrer).origin === location.origin) skip = true;
  } catch (e) {}
  if (/(^|\s)handa-splash(\s|$)/.test(window.name || "")) skip = true;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) skip = true;
  if (skip) document.documentElement.classList.add("no-splash");
})();
