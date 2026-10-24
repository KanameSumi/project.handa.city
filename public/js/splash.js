// HAnDA: ロード画面の表示と片付け（components/Splash.astro から読み込む）。
// ロード画面の要素より後で読み込むこと。
(function () {
  var el = document.getElementById("handa-splash");
  if (!el || document.documentElement.classList.contains("no-splash")) {
    if (el) el.remove();
    return;
  }
  try {
    sessionStorage.setItem("handa-splash", "1");
  } catch (e) {}
  try {
    if (!/(^|\s)handa-splash(\s|$)/.test(window.name || "")) {
      window.name = ((window.name || "") + " handa-splash").trim();
    }
  } catch (e) {}
  var start = Date.now();
  var MIN = 1700; // アニメーションを見せる最短時間（ミリ秒）
  function hide() {
    var wait = Math.max(0, MIN - (Date.now() - start));
    setTimeout(function () {
      el.classList.add("is-done");
      setTimeout(function () { el.remove(); }, 700);
    }, wait);
  }
  if (document.readyState === "complete") hide();
  else window.addEventListener("load", hide, { once: true });
})();
