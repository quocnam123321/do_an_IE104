(() => {
  const { requests, topics } = globalThis.IE104AdminSampleData;
  const academic = globalThis.IE104AdminAcademic;

  const labels = {
    active: "Đang thực hiện", completed: "Hoàn thành", approved: "Đã duyệt",
    pending: "Chờ duyệt", rejected: "Từ chối", withdrawn: "Đã rút",
    open: "Đang mở đăng ký", upcoming: "Sắp mở",
    closed: "Đã đóng đăng ký", enabled: "Đang hoạt động", locked: "Đã khóa",
    draft: "Bản nháp", published: "Đã đăng",
    student: "Sinh viên", lecturer: "Giảng viên", course: "Đồ án môn học",
    graduation: "Đồ án tốt nghiệp", thesis: "Khóa luận tốt nghiệp",
    registration: "Đăng ký", proposal: "Đề xuất",
    plan: "Kế hoạch học vụ", submissions: "Báo cáo và nộp bài", defense: "Lịch bảo vệ",
  };

  const roundLabels = { open: "Đang mở", upcoming: "Sắp mở", closed: "Đã đóng" };
  const statusColors = {
    active: "info", completed: "success", approved: "success", open: "info",
    pending: "warning", rejected: "danger", upcoming: "warning", enabled: "success", published: "success",
  };

  const definitions = {
    "dot-dang-ky": {
      name: "Học kỳ và đợt đăng ký", hasRoundActions: true, nameLabel: "Đợt đăng ký",
      recordClass: "admin-round-record",
      extra: [["start", "Mở đăng ký"], ["end", "Đóng đăng ký"]],
      statusLabels: roundLabels,
    },
    "de-tai": {
      name: "Đề tài và hồ sơ",
      items: topics, nameLabel: "Tên đề tài", extra: [["lecturer", "Giảng viên hướng dẫn"]],
      search: "Tìm theo tên, mã đề tài hoặc giảng viên",
    },
    "ho-so": {
      name: "Đề tài và hồ sơ",
      items: requests, nameLabel: "Tên đề tài", extra: [["sender", "Người gửi"], ["lecturer", "Giảng viên tiếp nhận"], ["date", "Ngày gửi"]],
      search: "Tìm theo tên, mã hồ sơ hoặc người gửi",
    },
  };

  const view = document.querySelector("#admin-view");
  const term = document.querySelector("#admin-term");
  const detail = document.querySelector('dialog[aria-labelledby="admin-detail-title"]');
  const params = new URLSearchParams(location.search);
  const termKey = "ie104.admin.term";
  const roundListTermKey = "ie104.admin.round-list-term";
  const navigation = document.querySelector(".admin-navigation");
  const compactMenu = matchMedia("(width < 75rem)");

  function syncMenu(event) {
    navigation.open = !event.matches;
  }
  syncMenu(compactMenu);
  compactMenu.addEventListener("change", syncMenu);

  function forTerm(items) {
    return items.filter((item) => !term?.value || !item.term || item.term === term.value);
  }

  function displayDate(value) {
    return value.split("T")[0].split("-").reverse().join("/");
  }

  function displayDateTime(value) {
    return `${displayDate(value)} · ${value.split("T")[1]}`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[character]);
  }

  function populateTerms(select, selected, includeAll = false) {
    const terms = academic.snapshot().terms;
    const hasSelection = terms.includes(selected) || (includeAll && selected === "");
    const options = terms.map((id) => new Option(academic.termLabel(id), id));
    if (includeAll) options.unshift(new Option("Tất cả học kỳ", ""));
    select.replaceChildren(...options);
    select.value = hasSelection ? selected : terms[0];
  }

  function rememberTerm() {
    try {
      if (term.value) sessionStorage.setItem(termKey, term.value);
      if (document.body.dataset.adminPage === "dot-dang-ky") {
        sessionStorage.setItem(roundListTermKey, term.value);
      }
    } catch {
      // The current page can still filter by term if storage is unavailable.
    }
  }

  function initializeTerm(includeAll = false) {
    if (!term) return;
    let saved;
    try {
      if (includeAll && document.body.dataset.adminPage === "dot-dang-ky") {
        saved = sessionStorage.getItem(roundListTermKey);
      }
      saved ??= sessionStorage.getItem(termKey);
    } catch {
      // The current page uses the default term if storage is unavailable.
    }
    populateTerms(term, params.get("term") ?? saved, includeAll);
    rememberTerm();
    term.addEventListener("change", rememberTerm);
  }

  function pageUrl(file, values = {}) {
    const query = new URLSearchParams(Object.entries(values).filter(([, value]) => value != null));
    return query.size ? file + "?" + query.toString() : file;
  }

  function statusLabel(definition, status) {
    return definition.statusLabels?.[status] ?? labels[status];
  }

  function badge(label, status) {
    return `<span class="admin-status admin-status--${statusColors[status] ?? "neutral"}" data-status="${status}">${label}</span>`;
  }

  const arrow = `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 12h15m-6-6 6 6-6 6"/>
  </svg>`;

  function dataTable(definition, items, caption) {
    const groupLabel = definition.typeLabel ?? "Phân loại";
    const headers = [definition.nameLabel, ...(definition.hideType ? [] : [groupLabel]), ...definition.extra.map(([, label]) => label), "Trạng thái"];
    const detailUrl = definition.detailUrl ?? (definition.hasRoundActions ? roundUrl : null);
    if (detailUrl) headers.push("Thao tác");
    return `
      <div class="admin-table-scroll" tabindex="0" role="region" aria-label="${caption}">
        <table class="admin-table ${definition.tableClass ?? (definition.hasRoundActions ? "admin-round-table" : "")}">
          <caption class="visually-hidden">${caption}</caption>
          <thead><tr>${headers.map((label) => `<th scope="col">${label}</th>`).join("")}</tr></thead>
          <tbody>
            ${items.map((item) => `<tr>
              <th scope="row">
                ${recordCell(definition, item)}
              </th>
              ${definition.hideType ? "" : `<td>${definition.typeLabels?.[item.type] ?? labels[item.type]}</td>`}
              ${definition.extra.map(([key, , render]) => render ? `<td>${render(item)}</td>` : `<td translate="no">${escapeHtml(cellValue(item, key))}</td>`).join("")}
              <td>${badge(statusLabel(definition, item.status), item.status)}</td>
              ${detailUrl ? `<td>
                <a class="admin-button" href="${escapeHtml(detailUrl(item))}"><span>Xem chi tiết</span>${arrow}<span class="visually-hidden" translate="no"> ${escapeHtml(item.name)}</span></a>
              </td>` : ""}
            </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  }

  function cellValue(item, key) {
    if (key === "start" || key === "end") return displayDateTime(item[key]);
    return key === "date" ? displayDate(item[key]) : item[key];
  }

  function roundUrl(item) {
    return pageUrl("chi-tiet-dot-dang-ky.html", { id: item.id, term: term?.value });
  }

  function recordCell(definition, item) {
    const label = `<span translate="no">${escapeHtml(item.name)}</span><span class="admin-code" translate="no">${escapeHtml(item.id)}</span>`;
    return `<span class="${definition.recordClass ?? "admin-catalog-record"}">${label}</span>`;
  }

  function normalizeSearch(value) {
    return value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replaceAll("đ", "d").trim();
  }

  if (detail) view.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-record]");
    if (!trigger) return;
    const recordId = trigger.dataset.record;
    const definition = Object.values(definitions).find(({ items }) => items?.some(({ id }) => id === recordId));
    if (!definition) return;

    const item = definition.items.find(({ id }) => id === recordId);
    const fields = [
      ["Mã", item.id, false],
      [definition.typeLabel ?? "Phân loại", labels[item.type], true],
      ...definition.extra.map(([key, label]) => [label, cellValue(item, key), false]),
      ["Trạng thái", statusLabel(definition, item.status), true],
    ];
    const dialogTitle = detail.querySelector("h2");
    dialogTitle.translate = false;
    dialogTitle.textContent = item.name;
    detail.querySelector(".admin-detail-fields").innerHTML = fields.map(([label, value, translate]) =>
      `<div><dt>${label}</dt><dd ${translate ? "" : 'translate="no"'}>${value}</dd></div>`
    ).join("");
    detail.showModal();
  });

  document.querySelectorAll('.skip-link, .project-footer__top').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = document.querySelector(link.hash);
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "start" });
    });
  });

  globalThis.IE104Admin = {
    academic, arrow, badge, dataTable, definitions, displayDate, displayDateTime, escapeHtml, forTerm,
    initializeTerm, labels, normalizeSearch, pageUrl, params, populateTerms,
    rememberTerm, roundLabels, roundUrl, term, view,
  };
})();
