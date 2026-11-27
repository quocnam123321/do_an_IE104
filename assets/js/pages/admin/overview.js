(() => {
  const { requests, topics } = globalThis.IE104AdminSampleData;
  const {
    academic, arrow, badge, displayDate, escapeHtml, forTerm, initializeTerm, labels,
    pageUrl, populateTerms, roundUrl, term, view,
  } = globalThis.IE104Admin;

  const roundsUrl = () => pageUrl("hoc-ky-va-dot-dang-ky.html", { status: "open", term: term.value });
  const requestsUrl = (status) => pageUrl("ho-so-dang-ky-va-de-xuat.html", { status, term: term.value });
  const topicsUrl = (status) => pageUrl("de-tai-va-ho-so.html", { status, term: term.value });

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
    const termRounds = forTerm(academic.snapshot().rounds).filter((item) => item.status === "open").sort((a, b) => a.end.localeCompare(b.end));
    const termTopics = forTerm(topics);
    const termRequests = forTerm(requests);
    const recent = termRequests[0];

    view.innerHTML = `
      <section class="dashboard-summary" aria-label="Số liệu theo học kỳ">
        <div class="dashboard-summary__list">
          ${metric("Đợt đang mở", termRounds.length, roundsUrl())}
          ${metric("Hồ sơ chờ duyệt", termRequests.filter((item) => item.status === "pending").length, requestsUrl("pending"))}
          ${metric("Đề tài đang thực hiện", termTopics.filter((item) => item.status === "active").length, topicsUrl("active"))}
          ${metric("Đề tài hoàn thành", termTopics.filter((item) => item.status === "completed").length, topicsUrl("completed"))}
        </div>
      </section>
      ${topicChart(termTopics)}
      <section class="pending-requests" aria-labelledby="rounds-heading">
        <header class="section-header">
          <h2 id="rounds-heading">Đợt đăng ký đang mở</h2>
          <a href="${roundsUrl()}"><span>Xem tất cả</span>${arrow}<span class="visually-hidden">đợt đăng ký đang mở</span></a>
        </header>
        ${termRounds.length ? `<ul class="admin-overview-list">
          ${termRounds.map((item) => `<li class="admin-overview-row">
            <h3 id="title-${item.id}" translate="no">${escapeHtml(item.name)}</h3>
            <time class="admin-row-date" datetime="${item.end}+07:00"><span class="visually-hidden">Ngày đóng</span> ${displayDate(item.end)}</time>
            <a class="admin-button admin-row-action" href="${roundUrl(item)}" aria-labelledby="action-${item.id} title-${item.id}">
              <span id="action-${item.id}">Xem chi tiết</span>${arrow}
            </a>
          </li>`).join("")}
        </ul>` : '<p class="admin-empty">Học kỳ này không có đợt đang mở.</p>'}
      </section>
      <section class="pending-requests" aria-labelledby="recent-heading">
        <header class="section-header">
          <h2 id="recent-heading">Hồ sơ gần đây</h2>
          <a href="${requestsUrl()}"><span>Xem tất cả</span>${arrow}<span class="visually-hidden">hồ sơ</span></a>
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

  initializeTerm();
  term.addEventListener("change", renderOverview);
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    populateTerms(term, term.value);
    renderOverview();
  });
  renderOverview();
})();
