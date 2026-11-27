(() => {
  const seedRounds = globalThis.IE104AdminSampleData.rounds;
  const storageKey = "ie104.admin.academic-demo.v1";
  const initialTerms = ["2026-1", "2025-2"];
  const roundTypes = ["course", "thesis"];
  const startYears = Array.from({ length: 100 }, (_, index) => String(2099 - index));

  const termPattern = /^20\d{2}-[1-4]$/;
  const datetimePattern = /^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}$/;

  function validWindow(start, end) {
    return datetimePattern.test(start) && datetimePattern.test(end) &&
      Date.parse(start + "+07:00") < Date.parse(end + "+07:00");
  }

  function read() {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return { terms: [], rounds: [] };

    const data = JSON.parse(raw);
    if (!Array.isArray(data?.terms) || !Array.isArray(data.rounds)) throw new Error();
    const validTerms = new Set([...initialTerms, ...data.terms]);
    const valid = validTerms.size === initialTerms.length + data.terms.length &&
      data.terms.every((id) => typeof id === "string" && termPattern.test(id)) &&
      new Set(data.rounds.map((round) => round?.id)).size === data.rounds.length &&
      data.rounds.every((round) =>
        typeof round?.id === "string" && /^DOT-\d{2,}$/.test(round.id) &&
        typeof round.name === "string" && round.name.trim() && round.name.length <= 120 &&
        validTerms.has(round.term) && roundTypes.includes(round.type) &&
        Number.isSafeInteger(round.revision) && round.revision > 0 && validWindow(round.start, round.end)
      );
    if (!valid) throw new Error();
    return data;
  }

  function termLabel(id) {
    const [year, number] = id.split("-");
    return `HK ${number} · ${year}–${Number(year) + 1}`;
  }

  function statusOf({ start, end }) {
    const now = Date.now();
    if (now < Date.parse(start + "+07:00")) return "upcoming";
    return now >= Date.parse(end + "+07:00") ? "closed" : "open";
  }

  function records(data) {
    const result = new Map(seedRounds.map((round) => [round.id, round]));
    data.rounds.forEach((round) => result.set(round.id, { ...round, status: statusOf(round) }));
    return [...result.values()];
  }

  function snapshot() {
    try {
      const state = read();
      return {
        terms: [...initialTerms, ...state.terms].sort((a, b) => b.localeCompare(a)),
        rounds: records(state),
      };
    } catch {
      return { terms: initialTerms, rounds: seedRounds, unavailable: true };
    }
  }

  async function save(update) {
    function write() {
      const data = read();
      const result = update(data);
      if (!result.error) localStorage.setItem(storageKey, JSON.stringify(data));
      return result;
    }
    try {
      return navigator.locks ? await navigator.locks.request(storageKey, write) : write();
    } catch {
      return { error: "Không thể lưu dữ liệu mẫu trong trình duyệt." };
    }
  }

  function addTerm(year, number) {
    const id = `${year}-${number}`;
    return save((data) => {
      if (!termPattern.test(id)) return { error: "Hãy nhập năm bắt đầu từ 2000 đến 2099." };
      if ([...initialTerms, ...data.terms].includes(id)) {
        return { error: "Học kỳ này đã tồn tại." };
      }
      data.terms.push(id);
      return { id };
    });
  }

  function saveRound(values, original) {
    return save((data) => {
      if (!values.name.trim() || values.name.length > 120) {
        return { error: "Hãy nhập tên đợt đăng ký." };
      }
      if (!validWindow(values.start, values.end)) {
        return { error: "Thời điểm đóng phải sau thời điểm mở đăng ký." };
      }
      const all = records(data);
      const existing = original && all.find((item) => item.id === original.id);
      if (original && (!existing || original.revision !== existing.revision)) {
        return { error: "Đợt đã thay đổi. Hãy đóng biểu mẫu và mở lại." };
      }
      if (![...initialTerms, ...data.terms].includes(values.term) || !roundTypes.includes(values.type)) {
        return { error: "Hãy chọn học kỳ và loại đề tài hợp lệ." };
      }
      const nextNumber = Math.max(...all.map(({ id }) => Number(id.slice(4)))) + 1;
      const id = existing?.id ?? `DOT-${String(nextNumber).padStart(2, "0")}`;
      const entry = { ...values, id, revision: (existing?.revision ?? 0) + 1 };
      data.rounds = data.rounds.filter((item) => item.id !== id);
      data.rounds.push(entry);
      return { id };
    });
  }

  globalThis.IE104AdminAcademic = { roundTypes, startYears, snapshot, termLabel, addTerm, saveRound };
})();
