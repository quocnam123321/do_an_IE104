(() => {
  const { topics } = globalThis.IE104AdminSampleData;
  const {
    academic, badge, dataTable, definitions, displayDate, forTerm, initializeTerm, labels,
    normalizeSearch, pageUrl, params, populateTerms, rememberTerm, roundLabels, term, view,
  } = globalThis.IE104Admin;
  const title = document.querySelector("#admin-title");
  const academicActions = document.querySelector("#admin-academic-actions");
  const roundStatus = document.querySelector("#admin-round-status");
  const academicMessage = document.querySelector("#admin-academic-message");
  const saveSuccess = document.querySelector("#admin-round-save-success");
  const isDetail = document.body.dataset.adminPage === "chi-tiet-dot";
  const academicDialog = document.querySelector("#admin-academic-dialog");
  const academicForm = academicDialog.querySelector("form");
  const academicFields = document.querySelector("#admin-academic-fields");
  const academicError = document.querySelector("#admin-academic-error");
  const academicSubmit = academicForm.querySelector('[type="submit"]');
  const roundFields = [...document.querySelector("#admin-round-form-fields").content.cloneNode(true).children];
  const datePicker = globalThis.IE104?.ui?.proposalDatePicker;
  const timeZone = "Asia/Ho_Chi_Minh";
  let currentRound;
  let formAction;
  let data = academic.snapshot();

  const calendar = `<svg class="admin-action-icon" aria-hidden="true" viewBox="0 0 24 24">
    <path d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
  </svg>`;

  const search = view.querySelector("#admin-search");
  const type = view.querySelector("#admin-filter-type");
  const status = view.querySelector("#admin-filter-status");
  const count = view.querySelector("#admin-result-count span");
  const results = view.querySelector("#admin-results");

  function updateListUrl() {
    if (location.protocol === "file:") return;
    const url = new URL(location.href);
    url.searchParams.set("term", term.value);
    if (status.value) url.searchParams.set("status", status.value);
    else url.searchParams.delete("status");
    history.replaceState(history.state, "", url);
  }

  function renderRounds() {
    const definition = definitions["dot-dang-ky"];
    const caption = "Danh sách đợt đăng ký";
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

  function renderRoundDetail(item) {
    if (!item) {
      view.innerHTML = '<p class="admin-panel admin-empty">Không tìm thấy đợt đăng ký này.</p>';
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
      <section class="pending-requests admin-round-topics" aria-labelledby="round-topics-heading">
        <header class="section-header"><h2 id="round-topics-heading">Đề tài thuộc đợt</h2></header>
        ${roundTopics.length ? dataTable(topicColumns, roundTopics, "Đề tài thuộc đợt") :
          '<p class="admin-empty">Đợt này chưa có đề tài.</p>'}
      </section>`;
  }

  function refreshDetail() {
    currentRound = data.rounds.find((round) => round.id === params.get("id"));
    title.textContent = currentRound?.name ?? "Chi tiết đợt đăng ký";
    title.translate = !currentRound;
    roundStatus.hidden = !currentRound;
    roundStatus.innerHTML = currentRound ? badge(roundLabels[currentRound.status], currentRound.status) : "";
    academicActions.hidden = !currentRound;
    renderRoundDetail(currentRound);
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
    if (isTerm) {
      const template = document.querySelector("#admin-term-form-fields");
      academicFields.replaceChildren(template.content.cloneNode(true));
    } else {
      academicFields.replaceChildren(...roundFields);
    }
    const [dialogTitle, submitLabel] = formCopy[formAction];
    document.querySelector("#admin-academic-title").textContent = dialogTitle;
    academicSubmit.textContent = submitLabel;
    showFormError("");

    const controls = academicForm.elements;
    if (isTerm) {
      const selectedYear = (term.value || data.terms[0]).split("-")[0];
      controls.year.replaceChildren(...academic.startYears.map((year) => new Option(year, year, false, year === selectedYear)));
    } else {
      const record = formAction === "edit" ? currentRound : null;
      populateTerms(controls.term, record?.term ?? term?.value);
      controls.name.value = record?.name ?? "";
      controls.type.value = record?.type ?? "course";
      const hasTopics = Boolean(record && topics.some((topic) => topic.roundId === record.id));
      controls.term.disabled = hasTopics;
      controls.type.disabled = hasTopics;
      const dates = [[controls.start, record?.start, "Giờ mở đăng ký"], [controls.end, record?.end, "Giờ đóng đăng ký"]];
      for (const [input, value, timeLabel] of dates) {
        input.removeAttribute("aria-invalid");
        datePicker?.enhanceDate(input, { timeZone, timeLabel });
        if (datePicker) datePicker.fill(input, value ?? "");
        else input.value = value ?? "";
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
    academicForm.elements.start?.removeAttribute("aria-invalid");
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
      values = {
        name: controls.name.value.trim(),
        term: controls.term.value,
        type: controls.type.value,
        start: datePicker?.read(controls.start) ?? controls.start.value,
        end: datePicker?.read(controls.end) ?? controls.end.value,
      };
      if (!values.name) {
        showFormError("Hãy nhập tên đợt đăng ký.");
        controls.name.focus();
        return;
      }
      if (!values.start || !values.end) {
        const input = values.start ? controls.end : controls.start;
        showFormError("Hãy nhập ngày và giờ đăng ký hợp lệ.");
        input.setAttribute("aria-invalid", "true");
        input.focus();
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
    data = academic.snapshot();
    if (isDetail) {
      refreshDetail();
      academicMessage.hidden = true;
      saveSuccess.showModal();
      return;
    }
    populateTerms(term, isTerm ? result.id : values.term, true);
    rememberTerm();
    search.value = "";
    type.value = "";
    status.value = "";
    updateListUrl();
    renderRounds();
    academicMessage.hidden = false;
    academicMessage.textContent = "Đã lưu dữ liệu mẫu trong trình duyệt.";
    title.focus({ preventScroll: true });
  });

  if (data.unavailable) {
    academicMessage.hidden = false;
    academicMessage.textContent = "Không thể đọc thay đổi đã lưu. Đang hiển thị dữ liệu mẫu.";
  }

  if (isDetail) {
    document.querySelector("#admin-round-back").href = pageUrl("hoc-ky-va-dot-dang-ky.html", { term: params.get("term") });
    saveSuccess.querySelector("button").addEventListener("click", () => saveSuccess.close());
    refreshDetail();
  } else {
    initializeTerm(true);
    if (Object.hasOwn(roundLabels, params.get("status"))) status.value = params.get("status");
    [search, type, status].forEach((control) => control.addEventListener("input", renderRounds));
    status.addEventListener("change", updateListUrl);
    term.addEventListener("change", () => {
      updateListUrl();
      renderRounds();
    });
    renderRounds();
  }

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    data = academic.snapshot();
    if (isDetail) {
      refreshDetail();
    } else {
      populateTerms(term, term.value, true);
      renderRounds();
    }
  });
})();
