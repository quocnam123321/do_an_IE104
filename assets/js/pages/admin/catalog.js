(() => {
  const { accounts, sampleMembers, requests, topics } = globalThis.IE104AdminSampleData;
  const {
    academic, arrow, badge, dataTable, displayDate, displayDateTime, escapeHtml,
    forTerm, initializeTerm, labels, normalizeSearch, pageUrl, params, term, view,
  } = globalThis.IE104Admin;

  const catalogFile = "de-tai-va-ho-so.html";
  const topicStatuses = ["active", "completed"];
  const requestStatuses = ["pending", "approved", "rejected", "withdrawn"];
  const topicTypes = ["course", "graduation", "thesis"];
  const requestTypes = { registration: "Đăng ký đề tài", proposal: "Đề xuất đề tài" };
  const catalogTopics = topics.filter(({ status }) => topicStatuses.includes(status));
  const students = new Map([...accounts, ...sampleMembers].map((member) => [member.id, member]));
  const isRequest = params.get("tab") === "ho-so";
  const title = isRequest ? "Danh sách hồ sơ" : "Danh sách đề tài";
  const detailTitle = isRequest ? "Chi tiết hồ sơ" : "Chi tiết đề tài";
  const backLabel = isRequest ? "Quay lại danh sách hồ sơ" : "Quay lại danh sách đề tài";
  const topicStatus = topicStatuses.includes(params.get("status")) ? params.get("status") : null;

  const calendar = `<svg class="admin-action-icon" aria-hidden="true" viewBox="0 0 24 24">
    <path d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
  </svg>`;

  function catalogUrl(values = {}) {
    return pageUrl(catalogFile, { tab: isRequest ? "ho-so" : null, ...values });
  }

  function membersOf(topic) {
    return (topic.members ?? []).map((id) => students.get(id)).filter(Boolean);
  }

  function performerCell(topic) {
    if (topic.group) return `<span translate="no">${escapeHtml(topic.group)}</span>`;
    const [member] = membersOf(topic);
    if (!member) return '<span class="admin-code">Chưa ghi nhận</span>';
    return `<span class="admin-catalog-person" translate="no">${escapeHtml(member.name)}
      <span class="admin-code">${escapeHtml(member.code ?? member.id)}</span></span>`;
  }

  function senderCell(item) {
    const representative = students.get(item.representativeId);
    if (!representative) return identity(item.sender);
    return `<span class="admin-catalog-person" translate="no">
      <strong>${escapeHtml(item.sender)}</strong>
      <span class="admin-code">${identity(representative.name, representative.code ?? representative.id)}</span>
    </span>`;
  }

  function dateMarkup(value) {
    if (!value) return "Chưa ghi nhận";
    const hasTime = value.includes("T");
    const text = hasTime ? displayDateTime(value) : displayDate(value);
    return `<time datetime="${escapeHtml(value)}">${escapeHtml(text)}</time>`;
  }

  function showList() {
    const search = document.querySelector("#admin-search");
    const type = document.querySelector("#admin-filter-type");
    const extra = document.querySelector("#admin-catalog-filter");
    const results = document.querySelector("#admin-results");
    const count = document.querySelector("#admin-catalog-count");
    const topicTab = document.querySelector("#admin-catalog-topic-tab");
    const requestTab = document.querySelector("#admin-catalog-request-tab");
    const statusFilter = document.querySelector("#admin-catalog-status-filter");

    document.querySelector("#admin-catalog-list-title").textContent = title;
    document.querySelector("#admin-catalog-count-label").textContent = isRequest ? "hồ sơ" : "đề tài";
    document.querySelector("#admin-catalog-type-label").textContent = isRequest ? "Loại hồ sơ" : "Loại đề tài";
    document.querySelector("#admin-catalog-filter-label").textContent = isRequest ? "Trạng thái" : "Giảng viên phụ trách";
    search.placeholder = isRequest ? "Tìm theo tên hồ sơ, người gửi hoặc mã" : "Tìm theo tên hoặc mã đề tài";
    search.value = params.get("q") ?? "";
    (isRequest ? requestTab : topicTab).setAttribute("aria-current", "page");

    const typeOptions = isRequest ? Object.entries(requestTypes) : topicTypes.map((value) => [value, labels[value]]);
    type.append(new Option(isRequest ? "Tất cả loại hồ sơ" : "Tất cả loại đề tài", ""),
      ...typeOptions.map(([value, label]) => new Option(label, value)));
    type.value = typeOptions.some(([value]) => value === params.get("type")) ? params.get("type") : "";

    const lecturers = [...new Set(catalogTopics.map(({ lecturer }) => lecturer))].sort((a, b) => a.localeCompare(b, "vi"));
    extra.append(new Option(isRequest ? "Tất cả trạng thái" : "Tất cả giảng viên", ""),
      ...(isRequest ? requestStatuses.map((value) => new Option(labels[value], value)) :
        lecturers.map((name) => {
          const option = new Option(name, name);
          option.translate = false;
          return option;
        })));
    const initialExtra = params.get(isRequest ? "status" : "lecturer");
    extra.value = (isRequest ? requestStatuses : lecturers).includes(initialExtra) ? initialExtra : "";

    const items = isRequest ? [...requests].sort((a, b) => b.date.localeCompare(a.date)) : catalogTopics;
    const definition = isRequest ? {
      nameLabel: "Hồ sơ", typeLabel: "Loại hồ sơ", typeLabels: requestTypes,
      tableClass: "admin-catalog-table admin-catalog-table--requests", detailInRecord: true,
      extra: [["sender", "Người gửi", senderCell], ["lecturer", "Giảng viên tiếp nhận"], ["date", "Ngày gửi", (item) => dateMarkup(item.date)]],
    } : {
      nameLabel: "Đề tài", tableClass: "admin-catalog-table",
      extra: [["lecturer", "Giảng viên phụ trách"], ["performer", "Người thực hiện", performerCell]],
    };

    function render() {
      const query = normalizeSearch(search.value);
      const filters = {
        term: term.value, type: type.value || null, q: search.value.trim() || null,
        lecturer: isRequest ? null : extra.value || null,
        status: isRequest ? extra.value || null : topicStatus,
      };
      const matches = forTerm(items).filter((item) => {
        const searchable = [item.id, item.name];
        if (isRequest) {
          const representative = students.get(item.representativeId);
          searchable.push(item.sender, item.senderCode ?? "", representative?.name ?? "", representative?.code ?? representative?.id ?? "");
        }
        return (!type.value || item.type === type.value) &&
          (!extra.value || (isRequest ? item.status : item.lecturer) === extra.value) &&
          (isRequest || !topicStatus || item.status === topicStatus) &&
          searchable.some((value) => normalizeSearch(value).includes(query));
      });
      count.textContent = matches.length;
      definition.detailUrl = (item) => catalogUrl({ ...filters, id: item.id });
      results.innerHTML = matches.length ? dataTable(definition, matches, title) :
        '<p class="admin-empty">Không có kết quả phù hợp. Hãy đổi từ khóa hoặc bộ lọc.</p>';
      topicTab.href = catalogUrl({ tab: null, term: term.value });
      requestTab.href = catalogUrl({ tab: "ho-so", term: term.value });

      if (!isRequest && topicStatus) {
        statusFilter.innerHTML = `${badge(labels[topicStatus], topicStatus)}
          <a href="${escapeHtml(catalogUrl({ ...filters, status: null }))}">Xóa lọc trạng thái</a>`;
        statusFilter.hidden = false;
      }

      const current = catalogUrl(filters);
      if (location.protocol !== "file:" && current !== location.pathname.split("/").pop() + location.search) {
        history.replaceState(history.state, "", current + location.hash);
      }
    }

    initializeTerm(true);
    [term, type, extra].forEach((control) => control.addEventListener("change", render));
    search.addEventListener("input", render);
    render();
  }

  function field(label, value) {
    return `<div><dt>${label}</dt><dd>${value}</dd></div>`;
  }

  function identity(name, code) {
    const value = code ? `${name} · ${code}` : name;
    return `<span translate="no">${escapeHtml(value)}</span>`;
  }

  function panel(id, heading, content) {
    return `<section class="admin-panel admin-catalog-detail-panel" aria-labelledby="${id}">
      <h2 id="${id}">${heading}</h2>
      ${content}
    </section>`;
  }

  function person(name, information, role, code) {
    const initials = name.split(/\s+/u).slice(-2).map((part) => part[0]).join("").toUpperCase();
    return `<li class="admin-catalog-detail-person">
      <span class="admin-catalog-avatar" aria-hidden="true">${escapeHtml(initials)}</span>
      <div><strong translate="no">${escapeHtml(name)}</strong>${code ? ` <span class="admin-code" translate="no">· ${escapeHtml(code)}</span>` : ""}
        ${information ? `<p>${information}</p>` : ""}
      </div>
      ${role}
    </li>`;
  }

  function topCard(item, fields) {
    return `<section class="admin-panel admin-catalog-detail-top${isRequest ? " admin-catalog-detail-top--request" : ""}">
      <h1 translate="no">${escapeHtml(item.name)}</h1>
      ${badge(labels[item.status], item.status)}
      <dl class="admin-catalog-detail-fields">${fields}</dl>
    </section>`;
  }

  function showTopic(item) {
    const members = membersOf(item);
    const groupName = [item.group, item.groupName].filter(Boolean).join(" – ");
    const participants = panel("admin-catalog-performers", item.group ? "Nhóm thực hiện" : "Người thực hiện",
      `${groupName ? `<p class="admin-catalog-group-name" translate="no">${escapeHtml(groupName)}</p>` : ""}
      ${members.length ? `<ul>${members.map((member, index) => person(member.name,
        item.group ? (index === 0 ? "Nhóm trưởng" : "Thành viên") : "Sinh viên thực hiện", "", member.code ?? member.id)).join("")}</ul>` :
        "<p>Chưa ghi nhận</p>"}`);
    const supervisor = panel("admin-catalog-supervisor", "Giảng viên hướng dẫn",
      `<ul>${person(item.lecturer, "Khoa Khoa học và Kỹ thuật Thông tin",
        '<span class="admin-status admin-status--info">Hướng dẫn chính</span>')}</ul>`);
    const timeline = ["Ngày bắt đầu", "Hạn nộp báo cáo tiến độ", "Hạn nộp báo cáo cuối cùng"];
    const milestones = panel("admin-catalog-dates", "Mốc thời gian chính", `<dl class="admin-catalog-milestones">
      ${timeline.map((label, index) => `<div>${calendar}<div><dt>${label}</dt><dd>${dateMarkup(item.dates?.[index])}</dd></div></div>`).join("")}
    </dl>`);
    const completion = item.status === "completed" ? panel("admin-catalog-completed", "Thông tin hoàn thành", `<dl class="admin-catalog-completion">
      ${field("Ngày hoàn thành", dateMarkup(item.completedOn))}
      ${field("Kết quả đánh giá", item.publishedOn ? "Đã công bố" : "Chưa công bố")}
    </dl>`) : "";

    return topCard(item,
      field("Mã đề tài", identity(item.id)) +
      field("Loại đề tài", labels[item.type]) +
      (item.course ? field("Môn học", identity(item.course)) : "") +
      field("Học kỳ", academic.termLabel(item.term))
    ) + `<div class="admin-catalog-detail-grid">
      <div>${participants}${supervisor}</div>
      <div>${milestones}${completion}</div>
    </div>`;
  }

  function showRequest(item) {
    const registration = item.type === "registration";
    const topic = topics.find(({ id }) => id === item.topicId);
    const representative = students.get(item.representativeId);
    const rejection = item.status === "rejected" ?
      panel("admin-catalog-rejection", "Lý do từ chối", `<p>${item.reason ? identity(item.reason) : "Chưa ghi nhận"}</p>`) : "";
    const content = `<dl class="admin-catalog-completion">
      ${topic ? field("Đề tài đăng ký", identity(topic.name, topic.id)) : ""}
      ${field(registration ? "Lời nhắn của người gửi" : "Nội dung đề xuất", identity(item.message))}
    </dl>`;
    const attachment = item.hasSampleOutline ? `<div class="admin-catalog-attachment">
      <span>Đề cương đề xuất mẫu (PDF)</span>
      <a class="admin-button" href="../../assets/documents/de-cuong-de-xuat-mau.pdf" download>Tải xuống</a>
    </div>` : "<p>Chưa có tệp đính kèm.</p>";

    return topCard(item,
      field("Mã hồ sơ", identity(item.id)) +
      field("Loại hồ sơ", requestTypes[item.type]) +
      field("Học kỳ", academic.termLabel(item.term)) +
      field("Người gửi", identity(item.sender, item.senderCode)) +
      (representative ? field("Đại diện nhóm", identity(representative.name, representative.code ?? representative.id)) : "") +
      field("Giảng viên tiếp nhận", identity(item.lecturer)) +
      field("Ngày gửi", `<span class="admin-round-datetime">${calendar}${dateMarkup(item.date)}</span>`)
    ) + rejection + panel("admin-catalog-content", registration ? "Nội dung đăng ký" : "Nội dung đề xuất", content) +
      panel("admin-catalog-attachments", "Tệp đính kèm", attachment);
  }

  function showDetail(id) {
    const item = (isRequest ? requests : catalogTopics).find((record) => record.id === id);
    const backUrl = escapeHtml(catalogUrl({
      term: params.get("term"), type: params.get("type"), status: params.get("status"),
      lecturer: params.get("lecturer"), q: params.get("q"),
    }));
    const breadcrumb = document.querySelector("#admin-catalog-breadcrumb");
    breadcrumb.innerHTML = `<a href="${backUrl}">Đề tài và hồ sơ</a>`;
    breadcrumb.insertAdjacentHTML("afterend", `<li class="breadcrumb__item"><span aria-current="page">${detailTitle}</span></li>`);
    document.title = detailTitle + " | Quản lý đồ án";
    document.querySelector("#admin-catalog-heading").hidden = true;
    view.classList.add("admin-catalog-detail");
    view.innerHTML = `<a href="${backUrl}" class="admin-button admin-catalog-back">${arrow}<span>${backLabel}</span></a>
      ${item ? (isRequest ? showRequest(item) : showTopic(item)) :
        `<h1>${detailTitle}</h1><p class="admin-panel admin-empty">Không tìm thấy dữ liệu này.</p>`}`;
    view.querySelector(".admin-catalog-detail-top > .admin-status")?.after(document.querySelector("#admin-demo"));
  }

  if (params.has("id")) showDetail(params.get("id"));
  else showList();
  view.hidden = false;
})();
