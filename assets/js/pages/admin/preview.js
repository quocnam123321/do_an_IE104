(() => {
  const { accounts, notices, requests, topics } = globalThis.IE104AdminSampleData;
  const academic = globalThis.IE104AdminAcademic;

  const labels = {
    active: "Đang thực hiện", completed: "Hoàn thành", approved: "Đã duyệt",
    pending: "Chờ duyệt", open: "Đang mở đăng ký", upcoming: "Sắp mở",
    closed: "Đã đóng đăng ký", enabled: "Đang hoạt động", locked: "Đã khóa",
    draft: "Bản nháp", published: "Đã đăng",
    student: "Sinh viên", lecturer: "Giảng viên", course: "Đồ án môn học",
    thesis: "Khóa luận tốt nghiệp", registration: "Đăng ký", proposal: "Đề xuất",
    plan: "Kế hoạch học vụ", submissions: "Báo cáo và nộp bài", defense: "Lịch bảo vệ",
  };

  const roundLabels = { open: "Đang mở", upcoming: "Sắp mở", closed: "Đã đóng" };
  const statusColors = {
    active: "info", completed: "success", approved: "success", open: "info",
    pending: "warning", upcoming: "warning", enabled: "success", published: "success",
  };

  const names = {
    overview: "Tổng quan",
    accounts: "Tài khoản",
    rounds: "Học kỳ và đợt đăng ký",
    projects: "Đề tài và hồ sơ",
    notices: "Thông báo",
  };

  const definitions = {
    "tai-khoan": {
      name: names.accounts, description: "Tra cứu tài khoản sinh viên và giảng viên.",
      items: accounts, typeLabel: "Vai trò", nameLabel: "Họ và tên",
      extra: [["email", "Email"]], search: "Tìm theo tên, mã hoặc email",
    },
    "dot-dang-ky": {
      name: names.rounds, hasRoundActions: true, nameLabel: "Đợt đăng ký", extra: [["start", "Ngày mở"], ["end", "Ngày đóng"]],
      statusLabels: roundLabels, search: "Tìm theo tên hoặc mã đợt",
    },
    "de-tai": {
      name: names.projects, description: "Tra cứu đề tài, hồ sơ đăng ký và đề xuất của sinh viên.",
      items: topics, nameLabel: "Tên đề tài", extra: [["lecturer", "Giảng viên hướng dẫn"]],
      search: "Tìm theo tên, mã đề tài hoặc giảng viên",
    },
    "ho-so": {
      name: names.projects, description: "Tra cứu đề tài, hồ sơ đăng ký và đề xuất của sinh viên.",
      items: requests, nameLabel: "Tên đề tài", extra: [["sender", "Người gửi"], ["lecturer", "Giảng viên tiếp nhận"], ["date", "Ngày gửi"]],
      search: "Tìm theo tên, mã hồ sơ hoặc người gửi",
    },
    "thong-bao": {
      name: names.notices, description: "Xem danh sách thông báo học vụ và trạng thái công bố.",
      items: notices, typeLabel: "Chuyên mục", nameLabel: "Tiêu đề", extra: [["date", "Ngày cập nhật"]],
      search: "Tìm theo tiêu đề hoặc mã thông báo",
    },
  };

  const overview = {
    name: names.overview,
  };

  const view = document.querySelector("#admin-view");
  const term = document.querySelector("#admin-term");
  const title = document.querySelector("#admin-title");
  const description = document.querySelector("#admin-description");
  const locationLabel = document.querySelector("#admin-location");
  const termControl = document.querySelector("#admin-term-control");
  const navigation = document.querySelector(".admin-navigation");
  const compactMenu = matchMedia("(width < 75rem)");
  const welcome = document.querySelector("#admin-welcome");
  const demo = document.querySelector("#admin-demo");
  const accountMenu = document.querySelector(".account-menu__disclosure");
  let refreshTerm = null;
  const detail = document.querySelector(".admin-dialog");
  const heading = document.querySelector(".admin-heading");
  const academicActions = document.querySelector("#admin-academic-actions");
  const roundStatus = document.querySelector("#admin-round-status");
  const academicMessage = document.querySelector("#admin-academic-message");
  const academicDialog = document.querySelector("#admin-academic-dialog");
  const academicForm = academicDialog.querySelector("form");
  const academicFields = document.querySelector("#admin-academic-fields");
  const academicError = document.querySelector("#admin-academic-error");
  const academicSubmit = academicForm.querySelector('[type="submit"]');
  let currentRound;
  let formAction;
  let data = academic.snapshot();

  function syncMenu(event) {
    navigation.open = !event.matches;
  }
  syncMenu(compactMenu);
  compactMenu.addEventListener("change", syncMenu);

  function forTerm(items) {
    return items.filter((item) => !item.term || item.term === term.value);
  }

  function displayDate(value) {
    return value.split("T")[0].split("-").reverse().join("/");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[character]);
  }

  function populateTerms(select, selected) {
    select.replaceChildren(...data.terms.map((id) => new Option(academic.termLabel(id), id, false, id === selected)));
  }

  function statusLabel(definition, status) {
    return definition.statusLabels?.[status] ?? labels[status];
  }

  function badge(label, status) {
    return `<span class="admin-status admin-status--${statusColors[status] ?? "neutral"}">${label}</span>`;
  }

  const arrow = `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 12h15m-6-6 6 6-6 6"/>
  </svg>`;

  const searchIcon = `<svg class="admin-action-icon" aria-hidden="true" viewBox="0 0 24 24">
    <circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>
  </svg>`;

  const calendar = `<svg class="admin-action-icon" aria-hidden="true" viewBox="0 0 24 24">
    <path d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
  </svg>`;

  function listTabs(current) {
    return `<nav class="admin-tabs" aria-label="Danh mục đề tài và hồ sơ">
      <a href="#de-tai" ${current === "de-tai" ? 'aria-current="page"' : ""}>Đề tài</a>
      <a href="#ho-so" ${current === "ho-so" ? 'aria-current="page"' : ""}>Hồ sơ đăng ký và đề xuất</a>
    </nav>`;
  }

  function dataTable(definition, items, caption) {
    const groupLabel = definition.typeLabel ?? "Phân loại";
    const headers = [definition.nameLabel, ...(definition.hideType ? [] : [groupLabel]), ...definition.extra.map(([, label]) => label), "Trạng thái"];
    if (definition.hasRoundActions) headers.push("Thao tác");
    return `
      <div class="admin-table-scroll" tabindex="0" role="region" aria-label="${caption}">
        <table class="admin-table${definition.hasRoundActions ? " admin-round-table" : ""}">
          <caption class="visually-hidden">${caption}</caption>
          <thead><tr>${headers.map((label) => `<th scope="col">${label}</th>`).join("")}</tr></thead>
          <tbody>
            ${items.map((item) => `<tr>
              <th scope="row">
                ${recordControl(definition, item)}
              </th>
              ${definition.hideType ? "" : `<td>${labels[item.type]}</td>`}
              ${definition.extra.map(([key]) => `<td translate="no">${cellValue(item, key)}</td>`).join("")}
              <td>${badge(statusLabel(definition, item.status), item.status)}</td>
              ${definition.hasRoundActions ? `<td>
                <a class="admin-button" href="${roundUrl(item)}"><span>Xem chi tiết</span>${arrow}<span class="visually-hidden" translate="no"> ${escapeHtml(item.name)}</span></a>
              </td>` : ""}
            </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  }

  function cellValue(item, key) {
    return ["start", "end", "date"].includes(key) ? displayDate(item[key]) : item[key];
  }

  function roundUrl(item) {
    return `#dot-dang-ky/chi-tiet/${item.id}`;
  }

  function recordControl(definition, item) {
    const label = `<span translate="no">${escapeHtml(item.name)}</span><span class="admin-code" translate="no">${item.id}</span>`;
    if (definition.hasRoundActions) {
      return `<a class="admin-record" href="${roundUrl(item)}">${label}</a>`;
    }
    return `<button class="admin-record" type="button" data-record="${item.id}">${label}</button>`;
  }

  function metric(label, count, href) {
    return `<article class="summary-card admin-metric">
      <h2><a href="${href}">${label}</a></h2>
      <p class="summary-card__value"><strong>${count}</strong></p>
    </article>`;
  }

  function topicChart(items) {
    const center = { x: 130, y: 108 };
    const radius = 78;
    let offset = 0;
    const slices = ["active", "open", "completed"].map((status) => {
      const count = items.filter((topic) => topic.status === status).length;
      const share = items.length ? count / items.length : 0;
      const angle = (offset + share / 2) * 2 * Math.PI;
      const slice = {
        status, count, share, offset,
        x: center.x + Math.sin(angle) * radius,
        y: center.y - Math.cos(angle) * radius,
      };
      offset += share;
      return slice;
    });

    return `<section class="topic-status" aria-labelledby="topics-heading">
      <h2 id="topics-heading">Trạng thái đề tài</h2>
      <div class="topic-status__content">
        <svg class="topic-status__chart admin-donut" viewBox="0 0 260 216" width="260" height="216" aria-hidden="true" focusable="false">
          ${slices.map((slice) => `<circle cx="${center.x}" cy="${center.y}" r="${radius}" fill="none"
            stroke-width="48" pathLength="100" stroke-dasharray="${100 * slice.share} 100"
            stroke-dashoffset="${-100 * slice.offset}" transform="rotate(-90 ${center.x} ${center.y})"/>`).join("")}
          <g text-anchor="middle">
            <text x="130" y="102" font-size="14">Tổng đề tài</text>
            <text x="130" y="134" font-size="28">${items.length}</text>
          </g>
          <g text-anchor="middle" dominant-baseline="central">
            ${slices.filter((slice) => slice.share >= 0.08).map((slice) => `<text class="topic-status__percent"
              x="${slice.x.toFixed(1)}" y="${slice.y.toFixed(1)}">${Math.round(slice.share * 100)}%</text>`).join("")}
          </g>
        </svg>
        <dl class="topic-status__legend">
          ${slices.map(({ status, count }) => `<div><dt>${labels[status]}</dt><dd>${count}</dd></div>`).join("")}
        </dl>
      </div>
    </section>`;
  }

  function renderOverview() {
    const termRounds = forTerm(data.rounds).filter((item) => item.status === "open").sort((a, b) => a.end.localeCompare(b.end));
    const termTopics = forTerm(topics);
    const termRequests = forTerm(requests);
    const recent = termRequests[0];

    view.innerHTML = `
      <section class="dashboard-summary" aria-label="Số liệu theo học kỳ">
        <div class="dashboard-summary__list">
          ${metric("Đợt đang mở", termRounds.length, "#dot-dang-ky/open")}
          ${metric("Hồ sơ chờ duyệt", termRequests.filter((item) => item.status === "pending").length, "#ho-so/pending")}
          ${metric("Đề tài đang thực hiện", termTopics.filter((item) => item.status === "active").length, "#de-tai/active")}
          ${metric("Đề tài hoàn thành", termTopics.filter((item) => item.status === "completed").length, "#de-tai/completed")}
        </div>
      </section>
      ${topicChart(termTopics)}
      <section class="pending-requests" aria-labelledby="rounds-heading">
        <header class="section-header">
          <h2 id="rounds-heading">Đợt đăng ký đang mở</h2>
          <a href="#dot-dang-ky/open"><span>Xem tất cả</span>${arrow}<span class="visually-hidden">đợt đăng ký đang mở</span></a>
        </header>
        ${termRounds.length ? `<ul class="admin-overview-list">
          ${termRounds.map((item) => `<li class="admin-overview-row">
            <h3 id="title-${item.id}" translate="no">${escapeHtml(item.name)}</h3>
            <time class="admin-row-date" datetime="${item.end}+07:00"><span class="visually-hidden">Ngày đóng</span> ${displayDate(item.end)}</time>
            <a class="admin-button admin-row-action" href="#dot-dang-ky/chi-tiet/${item.id}" aria-labelledby="action-${item.id} title-${item.id}">
              <span id="action-${item.id}">Xem chi tiết</span>${arrow}
            </a>
          </li>`).join("")}
        </ul>` : '<p class="admin-empty">Học kỳ này không có đợt đang mở.</p>'}
      </section>
      <section class="pending-requests" aria-labelledby="recent-heading">
        <header class="section-header">
          <h2 id="recent-heading">Hồ sơ gần đây</h2>
          <a href="#ho-so"><span>Xem tất cả</span>${arrow}<span class="visually-hidden">hồ sơ</span></a>
        </header>
        ${recent ? `<ul class="admin-overview-list">
          <li class="admin-overview-row admin-overview-row--request">
            <h3 id="recent-title" translate="no">${recent.name}</h3>
            <p class="admin-row-date" translate="no">${recent.lecturer} · <time datetime="${recent.date}">${displayDate(recent.date)}</time></p>
            ${badge(labels[recent.status], recent.status)}
            <button type="button" class="admin-button admin-row-action" data-record="${recent.id}" aria-labelledby="recent-action recent-title">
              <span id="recent-action">Xem hồ sơ</span>${arrow}
            </button>
          </li>
        </ul>` : '<p class="admin-empty">Học kỳ này chưa có hồ sơ.</p>'}
      </section>`;
  }

  function selectFilter(id, label, values, glossary, selected, allLabel) {
    return `<div class="admin-field">
      <label for="${id}" ${allLabel ? 'class="visually-hidden"' : ""}>${label}</label>
      <select id="${id}">
        <option value="">${allLabel ?? "Tất cả"}</option>
        ${values.map((value) => `<option value="${value}" ${value === selected ? "selected" : ""}>${glossary[value]}</option>`).join("")}
      </select>
    </div>`;
  }

  function normalizeSearch(value) {
    return value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replaceAll("đ", "d").trim();
  }

  function renderList(route, definition, initialStatus) {
    const values = (key) => [...new Set(definition.items.map((item) => item[key]))];
    const caption = route === "ho-so" ? "Hồ sơ đăng ký và đề xuất" : route === "de-tai" ? "Danh sách đề tài" : definition.name;
    view.innerHTML = `
      ${["de-tai", "ho-so"].includes(route) ? listTabs(route) : ""}
      <form class="admin-filters admin-panel" aria-label="Bộ lọc">
        ${selectFilter("admin-filter-type", definition.typeLabel ?? "Phân loại", values("type"), labels)}
        ${selectFilter("admin-filter-status", "Trạng thái", values("status"), definition.statusLabels ?? labels, initialStatus)}
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

  function renderRounds(initialStatus) {
    const definition = definitions["dot-dang-ky"];
    const caption = "Danh sách đợt đăng ký";
    view.innerHTML = `
      <div class="admin-round-toolbar">
        <div class="admin-round-search">
          <label class="visually-hidden" for="admin-search">Tìm kiếm</label>
          ${searchIcon}
          <input id="admin-search" type="search" placeholder="${definition.search}">
        </div>
        <div class="admin-round-filters" role="group" aria-label="Bộ lọc">
          <div id="admin-round-term-slot"></div>
          ${selectFilter("admin-filter-type", "Loại đề tài", academic.roundTypes, labels, "", "Tất cả loại đề tài")}
          ${selectFilter("admin-filter-status", "Trạng thái", Object.keys(roundLabels), roundLabels, initialStatus, "Tất cả trạng thái")}
        </div>
      </div>
      <section class="admin-round-list" aria-labelledby="admin-round-list-title">
        <div class="admin-round-list__heading">
          <h2 id="admin-round-list-title">${caption}</h2>
          <p id="admin-result-count" role="status"><span></span> <span>đợt đăng ký</span></p>
        </div>
        <div class="admin-panel" id="admin-results"></div>
      </section>`;
    view.querySelector("#admin-round-term-slot").replaceWith(termControl);

    const search = view.querySelector("#admin-search");
    const type = view.querySelector("#admin-filter-type");
    const status = view.querySelector("#admin-filter-status");
    const count = view.querySelector("#admin-result-count span");
    const results = view.querySelector("#admin-results");

    function filter() {
      const query = normalizeSearch(search.value);
      const matches = forTerm(data.rounds).filter((round) =>
        (!type.value || type.value === round.type) &&
        (!status.value || status.value === round.status) &&
        [round.id, round.name].some((value) => normalizeSearch(value).includes(query))
      );
      count.textContent = matches.length;
      const empty = query || type.value || status.value ?
        "Không có kết quả phù hợp. Hãy đổi từ khóa hoặc bộ lọc." : "Học kỳ này chưa có đợt đăng ký.";
      results.innerHTML = matches.length ? dataTable(definition, matches, caption) : `<p class="admin-empty">${empty}</p>`;
    }

    [search, type, status].forEach((input) => input.addEventListener("input", filter));
    filter();
    return filter;
  }

  function getRoute() {
    const [section, filter, record] = location.hash.slice(1).split("/");
    const route = Object.hasOwn(definitions, section) ? section : "tong-quan";
    const detailId = route === "dot-dang-ky" && filter === "chi-tiet" ? record : undefined;
    return { route, filter, detailId };
  }

  function renderRoundDetail(item) {
    const back = '<a class="admin-back" href="#dot-dang-ky">← Danh sách các đợt</a>';
    if (!item) {
      view.innerHTML = `${back}<p class="admin-panel admin-empty">Không tìm thấy đợt đăng ký này.</p>`;
      return;
    }

    const roundTopics = topics.filter((topic) => topic.roundId === item.id);
    const topicColumns = { ...definitions["de-tai"], hideType: true };
    const datetime = (value) =>
      `<time class="admin-round-datetime" datetime="${value}+07:00">${calendar}${displayDate(value)} · ${value.split("T")[1]}</time>`;
    const field = (label, value) => `<div><dt>${label}</dt><dd>${value}</dd></div>`;
    view.innerHTML = `
      <section class="pending-requests" aria-labelledby="round-detail-heading">
        <header class="section-header"><h2 id="round-detail-heading">Thông tin đợt đăng ký</h2></header>
        <dl class="admin-detail-fields admin-round-detail-fields">
          ${field("Mã đợt", item.id)}
          ${field("Học kỳ", academic.termLabel(item.term))}
          ${field("Loại đề tài", labels[item.type])}
          ${field("Mở đăng ký", datetime(item.start))}
          ${field("Đóng đăng ký", datetime(item.end))}
        </dl>
      </section>
      <section class="pending-requests" aria-labelledby="round-topics-heading">
        <header class="section-header"><h2 id="round-topics-heading">Đề tài thuộc đợt</h2></header>
        ${roundTopics.length ? dataTable(topicColumns, roundTopics, "Đề tài thuộc đợt") :
          '<p class="admin-empty">Đợt này chưa có đề tài.</p>'}
      </section>
      ${back}`;
  }

  function renderPage() {
    const { route, filter, detailId } = getRoute();
    const definition = definitions[route] ?? overview;
    const isOverview = route === "tong-quan";
    const isAcademic = route === "dot-dang-ky";
    data = academic.snapshot();
    const round = detailId && data.rounds.find((item) => item.id === detailId);
    currentRound = round;
    if (termControl.parentElement !== heading) heading.append(termControl);
    populateTerms(term, round?.term ?? term.value);
    title.textContent = round?.name ?? (detailId ? "Chi tiết đợt đăng ký" : definition.name);
    title.translate = !round;
    locationLabel.textContent = detailId ? "Chi tiết đợt đăng ký" : definition.name;
    description.textContent = detailId ? "" : definition.description ?? "";
    description.hidden = !description.textContent;
    termControl.hidden = route === "tai-khoan" || Boolean(detailId);
    termControl.querySelector("label").classList.toggle("visually-hidden", isAcademic);
    welcome.hidden = !isOverview;
    demo.hidden = isOverview;
    demo.querySelector("svg").toggleAttribute("hidden", !isAcademic);
    academicMessage.hidden = !isAcademic || !data.unavailable;
    academicMessage.textContent = data.unavailable ? "Không thể đọc thay đổi đã lưu. Đang hiển thị dữ liệu mẫu." : "";
    academicActions.hidden = !isAcademic;
    academicActions.querySelectorAll("button").forEach((button) => {
      button.hidden = detailId ? button.dataset.academicAction !== "edit" || !round : button.dataset.academicAction === "edit";
    });
    roundStatus.hidden = !round;
    roundStatus.innerHTML = round ? badge(roundLabels[round.status], round.status) : "";
    view.closest("main").classList.toggle("admin-academic-page", isAcademic);

    const menuRoute = route === "ho-so" ? "de-tai" : route;
    navigation.querySelectorAll("[data-admin-nav]").forEach((link) => {
      if (link.dataset.adminNav === menuRoute) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    if (detailId) {
      renderRoundDetail(round);
      refreshTerm = null;
    } else if (isOverview) {
      renderOverview();
      refreshTerm = renderOverview;
    } else if (isAcademic) {
      refreshTerm = renderRounds(filter);
    } else {
      refreshTerm = renderList(route, definition, filter);
    }
  }

  const formCopy = {
    term: ["Thêm học kỳ", "Thêm học kỳ"],
    round: ["Tạo đợt đăng ký", "Tạo đợt"],
    edit: ["Chỉnh sửa đợt", "Lưu thay đổi"],
  };

  function showFormError(message) {
    academicError.textContent = message;
    academicError.hidden = !message;
  }

  academicActions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-academic-action]");
    if (!button) return;
    formAction = button.dataset.academicAction;
    const isTerm = formAction === "term";
    const template = document.querySelector(isTerm ? "#admin-term-form-fields" : "#admin-round-form-fields");
    academicFields.replaceChildren(template.content.cloneNode(true));
    const [dialogTitle, submitLabel] = formCopy[formAction];
    document.querySelector("#admin-academic-title").textContent = dialogTitle;
    academicSubmit.textContent = submitLabel;
    showFormError("");

    const controls = academicForm.elements;
    if (isTerm) {
      controls.year.value = term.value.split("-")[0];
    } else {
      const record = formAction === "edit" ? currentRound : null;
      populateTerms(controls.term, record?.term ?? term.value);
      if (record) {
        for (const key of ["name", "type", "start", "end"]) controls[key].value = record[key];
        const hasTopics = topics.some((topic) => topic.roundId === record.id);
        controls.term.disabled = hasTopics;
        controls.type.disabled = hasTopics;
      }
    }
    academicDialog.showModal();
  });

  academicDialog.querySelectorAll("[data-academic-close]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!academicSubmit.disabled) academicDialog.close();
    });
  });
  academicDialog.addEventListener("cancel", (event) => {
    if (academicSubmit.disabled) event.preventDefault();
  });
  academicForm.addEventListener("input", () => {
    showFormError("");
    academicForm.elements.end?.removeAttribute("aria-invalid");
  });
  academicForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (academicSubmit.disabled) return;
    const controls = academicForm.elements;
    const isTerm = formAction === "term";
    const original = formAction === "edit" ? currentRound : null;
    let values;
    if (!isTerm) {
      values = Object.fromEntries(["name", "term", "type", "start", "end"].map((key) => [key, controls[key].value.trim()]));
      if (!values.name) {
        showFormError("Hãy nhập tên đợt đăng ký.");
        controls.name.focus();
        return;
      }
      if (values.end <= values.start) {
        showFormError("Thời điểm đóng phải sau thời điểm mở đăng ký.");
        controls.end.setAttribute("aria-invalid", "true");
        controls.end.focus();
        return;
      }
    }

    academicSubmit.disabled = true;
    const result = isTerm ? await academic.addTerm(controls.year.value, controls.number.value) : await academic.saveRound(values, original);
    academicSubmit.disabled = false;
    if (!academicDialog.open) return;
    if (result.error) {
      showFormError(result.error);
      return;
    }

    academicDialog.close();
    const selected = isTerm ? result.id : values.term;
    if (getRoute().detailId === undefined && location.hash !== "#dot-dang-ky") {
      history.replaceState(null, "", "#dot-dang-ky");
    }
    data = academic.snapshot();
    populateTerms(term, selected);
    renderPage();
    academicMessage.hidden = false;
    academicMessage.textContent = "Đã lưu dữ liệu mẫu trong trình duyệt.";
    title.focus({ preventScroll: true });
  });

  view.addEventListener("click", (event) => {
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

  navigation.addEventListener("click", (event) => {
    if (compactMenu.matches && event.target.closest("[data-admin-nav]")?.hash === location.hash) {
      navigation.open = false;
      navigation.querySelector("summary").focus();
    }
  });
  window.addEventListener("hashchange", () => {
    if (detail.open) detail.close();
    if (academicDialog.open) academicDialog.close();
    if (compactMenu.matches) navigation.open = false;
    accountMenu.open = false;
    renderPage();
    title.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  });

  document.querySelectorAll('.skip-link, .project-footer__top').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = document.querySelector(link.hash);
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "start" });
    });
  });

  term.addEventListener("change", () => refreshTerm?.());
  renderPage();
})();
