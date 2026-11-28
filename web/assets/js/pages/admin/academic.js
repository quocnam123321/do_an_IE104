(() => {
  const { topics } = globalThis.IE104AdminSampleData;
  const {
    academic, badge, dataTable, definitions, displayDate, displayDateTime, escapeHtml, forTerm, initializeTerm, labels,
    normalizeSearch, pageUrl, params, populateTerms, rememberTerm, roundLabels, term, view,
  } = globalThis.IE104Admin;
  const title = document.querySelector("#admin-title");
  const academicActions = document.querySelector("#admin-academic-actions");
  const roundStatus = document.querySelector("#admin-round-status");
  const academicMessage = document.querySelector("#admin-academic-message");
  const saveSuccess = document.querySelector("#admin-academic-success");
  const saveSuccessTitle = document.querySelector("#admin-academic-success-title");
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
    const empty = query || type.value || status.value ?
      "Không có kết quả phù hợp. Hãy đổi từ khóa hoặc bộ lọc." : "Học kỳ này chưa có đợt đăng ký.";
    results.innerHTML = matches.length ? dataTable(definition, matches, caption) : `<p class="admin-empty">${empty}</p>`;
  }

  function topicsInRound(round) {
    const samples = topics.filter((topic) => topic.roundId === round.id);
    try {
      const created = globalThis.IE104.services.lecturerTopicRepository.read()
        .filter((topic) => topic.registration?.roundId === round.id)
        .map((topic) => ({
          id: topic.id, name: topic.title, lecturer: topic.supervisor?.name || "",
          status: topic.status === "closed" ? "closed" : round.status,
        }));
      return [...samples, ...created];
    } catch {
      return samples;
    }
  }

  function renderRoundDetail(item) {
    if (!item) {
      view.innerHTML = '<p class="admin-panel admin-empty">Không tìm thấy đợt đăng ký này.</p>';
      return;
    }

    const roundTopics = topicsInRound(item);
    const topicColumns = { ...definitions["de-tai"], hideType: true, recordClass: "admin-round-record" };
    const datetime = (value) => {
      const date = item.source ? value.slice(0, 10) : `${value}+07:00`;
      const label = item.source ? displayDate(value) : displayDateTime(value);
      return `<time class="admin-round-datetime" datetime="${date}">${calendar}${label}</time>`;
    };
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
          ${item.source ? field("Nguồn lịch", `<a href="${escapeHtml(item.source)}">Xem thông báo của Khoa</a>`) : ""}
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
    title.translate = !currentRound || Boolean(currentRound.source);
    document.querySelector("#admin-demo").hidden = !currentRound?.sample;
    roundStatus.hidden = !currentRound;
    roundStatus.innerHTML = currentRound ? badge(roundLabels[currentRound.status], currentRound.status) : "";
    academicActions.hidden = !currentRound;
    renderRoundDetail(currentRound);
  }

  const formCopy = {
    term: { title: "Thêm học kỳ", submit: "Thêm học kỳ", success: "Đã thêm học kỳ" },
    round: { title: "Tạo đợt đăng ký", submit: "Tạo đợt", success: "Đã tạo đợt đăng ký" },
    edit: { title: "Chỉnh sửa đợt", submit: "Lưu thay đổi", success: "Đã lưu thay đổi" },
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
    const { title: dialogTitle, submit: submitLabel, success } = formCopy[formAction];
    document.querySelector("#admin-academic-title").textContent = dialogTitle;
    academicSubmit.textContent = submitLabel;
    saveSuccessTitle.textContent = success;
    showFormError("");

    const controls = academicForm.elements;
    if (isTerm) {
      const years = academic.availableStartYears();
      const filterYear = (term.value || data.terms[0]).split("-")[0];
      const selectedYear = years.includes(filterYear) ? filterYear : years.at(-1);
      controls.year.replaceChildren(...years.map((year) => new Option(year, year, false, year === selectedYear)));
    } else {
      const record = formAction === "edit" ? currentRound : null;
      populateTerms(controls.term, record?.term ?? term?.value);
      controls.name.value = record?.name ?? "";
      controls.type.value = record?.type ?? "course";
      const hasTopics = Boolean(record && topicsInRound(record).length);
      controls.term.disabled = hasTopics;
      controls.type.disabled = hasTopics;
      const dates = [[controls.start, record?.start, "Giờ mở đăng ký"], [controls.end, record?.end, "Giờ đóng đăng ký"]];
      const minimum = academic.minimumDateTime();
      // Biểu mẫu vẫn kiểm tra bằng JavaScript khi ngày cũ nằm ngoài giới hạn của lịch gốc.
      academicForm.noValidate = !datePicker && dates.some(([, value]) => value && value < minimum);
      for (const [input, value, timeLabel] of dates) {
        input.removeAttribute("aria-invalid");
        if (datePicker) {
          datePicker.enhanceDate(input, { timeZone, timeLabel, minimumDateTime: academic.minimumDateTime });
          datePicker.fill(input, value ?? "");
        } else {
          input.min = minimum;
          input.value = value ?? "";
        }
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
      if (result.field) {
        const input = controls[result.field];
        input.setAttribute("aria-invalid", "true");
        input.focus();
      }
      return;
    }

    academicDialog.close();
    data = academic.snapshot();
    if (isDetail) {
      refreshDetail();
    } else {
      populateTerms(term, isTerm ? result.id : values.term, true);
      rememberTerm();
      search.value = "";
      type.value = "";
      status.value = "";
      updateListUrl();
      renderRounds();
    }
    academicMessage.hidden = true;
    saveSuccess.showModal();
  });

  saveSuccess.querySelector("button").addEventListener("click", () => saveSuccess.close());

  if (data.unavailable) {
    academicMessage.hidden = false;
    academicMessage.textContent = "Không thể đọc thay đổi đã lưu. Đang hiển thị dữ liệu có sẵn.";
  }

  if (isDetail) {
    document.querySelector("#admin-round-back").href = pageUrl("hoc-ky-va-dot-dang-ky.html", { term: params.get("term") });
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

  window.addEventListener("storage", (event) => {
    if (isDetail && event.key === globalThis.IE104.services.lecturerTopicRepository.key) refreshDetail();
  });
  academic.watch();
  window.addEventListener(academic.updateEvent, () => {
    data = academic.snapshot();
    if (isDetail) {
      refreshDetail();
    } else {
      populateTerms(term, term.value, true);
      renderRounds();
    }
  });
})();
