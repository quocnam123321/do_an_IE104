(() => {
  const routes = {
    "tong-quan": "tong-quan-quan-tri.html",
    "tai-khoan": "tai-khoan.html",
    "dot-dang-ky": "hoc-ky-va-dot-dang-ky.html",
    "de-tai": "de-tai-va-ho-so.html",
    "ho-so": "de-tai-va-ho-so.html",
    "thong-bao": "thong-bao.html",
  };

  if (document.body.dataset.adminPage === "ho-so") {
    const url = new URL(routes["ho-so"], location.href);
    url.search = location.search;
    url.searchParams.set("tab", "ho-so");
    url.hash = location.hash;
    location.replace(url);
    return;
  }

  const [section, filter, record] = location.hash.slice(1).split("/");
  const isRound = section === "dot-dang-ky" && filter === "chi-tiet" && record;
  const file = isRound ? "chi-tiet-dot-dang-ky.html" :
    Object.hasOwn(routes, section) ? routes[section] : routes["tong-quan"];
  const url = new URL(file, location.href);
  if (section === "ho-so") url.searchParams.set("tab", "ho-so");

  if (isRound) {
    url.searchParams.set("id", record);
  } else if (filter) {
    url.searchParams.set("status", filter);
  } else if (section === "main-content" || section === "page-top") {
    url.hash = section;
  }

  location.replace(url);
})();
