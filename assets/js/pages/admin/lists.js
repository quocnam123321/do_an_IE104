(() => {
  const { dataTable, definitions, forTerm, initializeTerm, labels, normalizeSearch, params, term, view } =
    globalThis.IE104Admin;

  function listTabs(current) {
    return `<nav class="admin-tabs" aria-label="Danh mục đề tài và hồ sơ">
      <a href="de-tai-va-ho-so.html" ${current === "de-tai" ? 'aria-current="page"' : ""}>Đề tài</a>
      <a href="ho-so-dang-ky-va-de-xuat.html" ${current === "ho-so" ? 'aria-current="page"' : ""}>Hồ sơ đăng ký và đề xuất</a>
    </nav>`;
  }

  function selectFilter(id, label, values, selected) {
    return `<div class="admin-field">
      <label for="${id}">${label}</label>
      <select id="${id}">
        <option value="">Tất cả</option>
        ${values.map((value) => `<option value="${value}" ${value === selected ? "selected" : ""}>${labels[value]}</option>`).join("")}
      </select>
    </div>`;
  }

  function renderList(route, definition, initialStatus) {
    const values = (key) => [...new Set(definition.items.map((item) => item[key]))];
    const caption = route === "ho-so" ? "Hồ sơ đăng ký và đề xuất" : route === "de-tai" ? "Danh sách đề tài" : definition.name;
    view.innerHTML = `
      ${["de-tai", "ho-so"].includes(route) ? listTabs(route) : ""}
      <form class="admin-filters admin-panel" aria-label="Bộ lọc">
        ${selectFilter("admin-filter-type", definition.typeLabel ?? "Phân loại", values("type"))}
        ${selectFilter("admin-filter-status", "Trạng thái", values("status"), initialStatus)}
        <button class="admin-button" type="reset">Xóa bộ lọc</button>
      </form>
      <div class="admin-list-tools">
        <div class="admin-field">
          <label for="admin-search">Tìm kiếm</label>
          <input id="admin-search" type="search" placeholder="${definition.search}">
        </div>
        <p role="status" id="admin-result-count"><strong></strong> <span>kết quả</span></p>
      </div>
      <section class="admin-panel admin-list" id="admin-results" aria-label="${caption}"></section>`;

    const type = view.querySelector("#admin-filter-type");
    const status = view.querySelector("#admin-filter-status");
    const search = view.querySelector("#admin-search");
    const filters = view.querySelector("form");
    const results = view.querySelector("#admin-results");
    const count = view.querySelector("#admin-result-count strong");

    function filterItems() {
      const query = normalizeSearch(search.value);
      const matches = forTerm(definition.items).filter((item) => (
        (!type.value || item.type === type.value) &&
        (!status.value || item.status === status.value) &&
        [item.id, item.name, item.lecturer, item.sender, item.email].some((value) => value && normalizeSearch(value).includes(query))
      ));
      count.textContent = matches.length;
      results.innerHTML = matches.length ? dataTable(definition, matches, caption) :
        '<p class="admin-empty">Không có kết quả phù hợp. Hãy đổi từ khóa hoặc bộ lọc.</p>';
    }

    [type, status, search].forEach((control) => control.addEventListener("input", filterItems));
    filters.addEventListener("reset", (event) => {
      event.preventDefault();
      type.value = "";
      status.value = "";
      search.value = "";
      filterItems();
    });
    filterItems();
    return filterItems;
  }

  initializeTerm();
  const route = document.body.dataset.adminPage;
  const refresh = renderList(route, definitions[route], params.get("status"));
  term?.addEventListener("change", refresh);
})();
