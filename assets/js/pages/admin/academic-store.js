(() => {
  const seedRounds = globalThis.IE104AdminSampleData.rounds;
  const storageKey = "ie104.admin.academic-demo.v1";
  const initialTerms = ["2026-1", "2025-2"];
  const roundTypes = ["course", "thesis"];
  const vietnamOffsetMs = 7 * 60 * 60 * 1000;
  const minuteMs = 60 * 1000;

  // Học kỳ 4 vẫn đọc được từ dữ liệu của các phiên bản trước.
  const storedTermPattern = /^20\d{2}-[1-4]$/;
  const datetimePattern = /^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}$/;

  function currentYear() {
    return new Date(Date.now() + vietnamOffsetMs).getUTCFullYear();
  }

  function availableStartYears() {
    return Array.from({ length: 2100 - currentYear() }, (_, index) => String(2099 - index));
  }

  function minimumDateTime() {
    const minute = Math.ceil((Date.now() + vietnamOffsetMs) / minuteMs) * minuteMs;
    return new Date(minute).toISOString().slice(0, 16);
  }

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
      data.terms.every((id) => typeof id === "string" && storedTermPattern.test(id)) &&
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
      if (!/^20\d{2}$/.test(year)) return { error: "Hãy nhập năm bắt đầu từ 2000 đến 2099." };
      if (Number(year) < currentYear()) return { error: "Năm bắt đầu phải từ năm hiện tại trở đi." };
      if (!/^[1-3]$/.test(number)) return { error: "Hãy chọn học kỳ 1, 2 hoặc 3." };
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
      const minimum = minimumDateTime();
      const field = ["start", "end"].find((key) => values[key] !== existing?.[key] && values[key] < minimum);
      if (field) return { error: "Mốc mới phải từ thời điểm hiện tại trở đi.", field };
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

  globalThis.IE104AdminAcademic = { roundTypes, availableStartYears, minimumDateTime, snapshot, termLabel, addTerm, saveRound };
})();
