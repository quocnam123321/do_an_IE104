(() => {
  const { accounts, notices, requests, rounds, topics } = globalThis.IE104AdminSampleData;

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
      name: names.rounds, description: "Theo dõi thời gian mở và đóng đăng ký theo học kỳ.",
      items: rounds, nameLabel: "Đợt đăng ký", extra: [["start", "Ngày mở"], ["end", "Ngày đóng"]],
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

  function syncMenu(event) {
    navigation.open = !event.matches;
  }
  syncMenu(compactMenu);
  compactMenu.addEventListener("change", syncMenu);

  function forTerm(items) {
    return items.filter((item) => !item.term || item.term === term.value);
  }

  function displayDate(value) {
    return value.split("-").reverse().join("/");
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

  function listTabs(current) {
    return `<nav class="admin-tabs" aria-label="Danh mục đề tài và hồ sơ">
      <a href="#de-tai" ${current === "de-tai" ? 'aria-current="page"' : ""}>Đề tài</a>
      <a href="#ho-so" ${current === "ho-so" ? 'aria-current="page"' : ""}>Hồ sơ đăng ký và đề xuất</a>
    </nav>`;
  }

  function dataTable(definition, items, caption) {
    const groupLabel = definition.typeLabel ?? "Phân loại";
    const headers = [definition.nameLabel, groupLabel, ...definition.extra.map(([, label]) => label), "Trạng thái"];
    return `
      <div class="admin-table-scroll" tabindex="0" role="region" aria-label="${caption}">
        <table class="admin-table">
          <caption class="visually-hidden">${caption}</caption>
          <thead><tr>${headers.map((label) => `<th scope="col">${label}</th>`).join("")}</tr></thead>
          <tbody>
            ${items.map((item) => `<tr>
              <th scope="row">
                ${recordControl(definition, item)}
              </th>
              <td>${labels[item.type]}</td>
              ${definition.extra.map(([key]) => `<td translate="no">${cellValue(item, key)}</td>`).join("")}
              <td>${badge(statusLabel(definition, item.status), item.status)}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  }

  function cellValue(item, key) {
    return ["start", "end", "date"].includes(key) ? displayDate(item[key]) : item[key];
  }

  function recordControl(definition, item) {
    const label = `<span translate="no">${item.name}</span><span class="admin-code" translate="no">${item.id}</span>`;
    if (definition === definitions["dot-dang-ky"]) {
      return `<a class="admin-record" href="#dot-dang-ky/chi-tiet/${item.id}">${label}</a>`;
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
    const termRounds = forTerm(rounds).filter((item) => item.status === "open").sort((a, b) => a.end.localeCompare(b.end));
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
            <h3 id="title-${item.id}" translate="no">${item.name}</h3>
            <time class="admin-row-date" datetime="${item.end}"><span class="visually-hidden">Ngày đóng</span> ${displayDate(item.end)}</time>
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

  function selectFilter(id, label, values, glossary, selected) {
    return `<div class="admin-field">
      <label for="${id}">${label}</label>
      <select id="${id}">
        <option value="">Tất cả</option>
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
    const selectedTerm = [...term.options].find((option) => option.value === item.term);
    const field = (label, value) => `<div><dt>${label}</dt><dd>${value}</dd></div>`;
    view.innerHTML = `
      ${back}
      <section class="pending-requests" aria-labelledby="round-detail-heading">
        <header class="section-header"><h2 id="round-detail-heading">Thông tin đợt đăng ký</h2></header>
        <dl class="admin-detail-fields">
          ${field("Mã", item.id)}
          ${field("Học kỳ", globalThis.IE104Language.optionLabel(selectedTerm))}
          ${field("Phân loại", labels[item.type])}
          ${field("Trạng thái", badge(roundLabels[item.status], item.status))}
          ${field("Ngày mở", `<time datetime="${item.start}">${displayDate(item.start)}</time>`)}
          ${field("Ngày đóng", `<time datetime="${item.end}">${displayDate(item.end)}</time>`)}
        </dl>
      </section>
      <section class="pending-requests" aria-labelledby="round-topics-heading">
        <header class="section-header"><h2 id="round-topics-heading">Đề tài thuộc đợt</h2></header>
        ${roundTopics.length ? dataTable(definitions["de-tai"], roundTopics, "Đề tài thuộc đợt") :
          '<p class="admin-empty">Đợt này chưa có đề tài.</p>'}
      </section>`;
  }

  function renderPage() {
    const { route, filter, detailId } = getRoute();
    const definition = definitions[route] ?? overview;
    const isOverview = route === "tong-quan";
    const round = detailId && rounds.find((item) => item.id === detailId);
    title.textContent = round?.name ?? (detailId ? "Chi tiết đợt đăng ký" : definition.name);
    title.translate = !round;
    locationLabel.textContent = detailId ? "Chi tiết đợt đăng ký" : definition.name;
    description.textContent = detailId ? "" : definition.description ?? "";
    description.hidden = !description.textContent;
    termControl.hidden = route === "tai-khoan" || Boolean(detailId);
    welcome.hidden = !isOverview;
    demo.hidden = isOverview;

    const menuRoute = route === "ho-so" ? "de-tai" : route;
    navigation.querySelectorAll("[data-admin-nav]").forEach((link) => {
      if (link.dataset.adminNav === menuRoute) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    if (detailId) {
      if (round) term.value = round.term;
      renderRoundDetail(round);
      refreshTerm = null;
    } else if (isOverview) {
      renderOverview();
      refreshTerm = renderOverview;
    } else {
      refreshTerm = renderList(route, definition, filter);
    }
  }

  view.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-record]");
    if (!trigger) return;
    const recordId = trigger.dataset.record;
    const definition = Object.values(definitions).find(({ items }) => items.some(({ id }) => id === recordId));
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
