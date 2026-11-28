(() => {
  const academic = globalThis.IE104AdminAcademic;
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.ui ||= {};
  function option(round) {
    const item = new Option(`${round.name} (${round.id})`, round.id);
    item.translate = false;
    return item;
  }
  const syncPickers = () => app.ui.proposalPickers?.syncSelects();

  function bind(form, { lecturer = false, previous = "", legacy = false, onChange = () => {} } = {}) {
    const select = form.querySelector("[data-round-choice]");
    const year = form.querySelector("#academic-year");
    const semester = form.querySelector("#semester");
    const type = form.querySelector("#topic-type");
    const deadline = form.querySelector("[data-round-deadline]");
    const note = form.querySelector("[data-round-note]");
    select.value = previous;
    let chosen = previous;
    select.required = !legacy;
    if (legacy) form.querySelector("[data-round-required]").hidden = true;

    function paint() {
      const data = academic.snapshot();
      const existingYears = new Set([...year.options].map(({ value }) => value));
      for (const value of academic.academicYears()) {
        if (!existingYears.has(value)) year.add(new Option(value.replace("-", " – "), value));
      }
      const details = { academicYear: year.value, semester: semester.value, type: type.value };
      const matching = data.unavailable ? [] : data.rounds.filter((round) => academic.matches(round, details));
      const available = matching.filter((round) => round.status === "open" || (lecturer && round.status === "upcoming"));
      const selected = matching.find((round) => round.id === chosen) ||
        (!legacy && (available.length === 1 ? available[0] : matching.length === 1 ? matching[0] : undefined));
      const placeholder = new Option(legacy ? "Chưa gắn đợt đăng ký" : "Chọn đợt đăng ký", "");
      placeholder.disabled = !legacy;
      const currentOptions = [...select.options].map(({ value, text }) => [value, text]);
      const nextOptions = [placeholder, ...matching.map(option)];
      if (JSON.stringify(currentOptions) !== JSON.stringify(nextOptions.map(({ value, text }) => [value, text]))) {
        select.replaceChildren(...nextOptions);
      }
      select.value = chosen = selected?.id || "";
      deadline.textContent = selected ? academic.displayTime(selected.end, Boolean(selected.source)) : "—";
      deadline.dateTime = selected ? (selected.source ? selected.end.slice(0, 10) : selected.end + "+07:00") : "";
      note.textContent = data.unavailable ? "Không đọc được lịch đợt đăng ký. Hãy thử lại." :
        selected && selected.status !== "open" ? academic.statusLabels[selected.status] :
        !available.length && year.value && semester.value && type.value ? "Chưa có đợt đăng ký phù hợp." : "";
      note.hidden = !note.textContent;
      syncPickers();
      onChange(selected);
    }

    select.addEventListener("change", () => { chosen = select.value; paint(); });
    for (const control of [year, semester, type]) control.addEventListener("change", paint);
    form.addEventListener("reset", () => requestAnimationFrame(() => { chosen = previous; paint(); }));
    window.addEventListener(academic.updateEvent, paint);
    academic.watch();
    paint();
  }

  const summary = document.querySelector("[data-round-summary]");
  if (summary) {
    const select = summary.querySelector("select");
    const picker = app.ui.proposalPickers?.enhanceSelect(select);
    const term = summary.querySelector("[data-round-term]");
    const status = summary.querySelector("[data-round-status]");
    const start = summary.querySelector("[data-round-start]");
    const end = summary.querySelector("[data-round-end]");
    function paint() {
      const { rounds, unavailable } = academic.snapshot();
      summary.hidden = unavailable || !rounds.length;
      if (summary.hidden) {
        picker?.close();
        return;
      }
      const latest = [...rounds].sort((a, b) => b.term.localeCompare(a.term) || b.start.localeCompare(a.start));
      const active = latest.find((round) => round.status === "open");
      const current = latest.find((round) => round.id === select.value) || active || latest[0];
      const ids = JSON.stringify(latest.map(({ id, name }) => [id, name]));
      if (select.dataset.rounds !== ids) {
        picker?.close();
        select.replaceChildren(...latest.map(option));
        select.dataset.rounds = ids;
      }
      select.value = current.id;
      picker?.sync();
      const control = picker?.trigger || select;
      control.title = select.selectedOptions[0].text;
      term.textContent = academic.termLabel(current.term);
      status.dataset.state = current.status;
      status.textContent = academic.statusLabels[current.status];
      for (const [time, value] of [[start, current.start], [end, current.end]]) {
        time.dateTime = current.source ? value.slice(0, 10) : value + "+07:00";
        time.textContent = academic.displayTime(value, Boolean(current.source));
      }
    }
    select.addEventListener("change", paint);
    window.addEventListener(academic.updateEvent, paint);
    academic.watch();
    paint();
  }

  app.ui.registrationRound = { bind };
})();
