(() => {
  const seedRounds = globalThis.IE104AdminSampleData.rounds;
  const storageKey = "ie104.admin.academic-demo.v1";
  const initialTerms = ["2026-1", "2025-2"];
  const roundTypes = ["course", "graduation", "thesis"];
  const updateEvent = "ie104:registration-rounds-updated";
  const changedEvent = "ie104:registration-rounds-changed";
  const topicTypes = {
    "do-an-mon-hoc": "course", "do-an-tot-nghiep": "graduation", "khoa-luan": "thesis",
  };
  const statusLabels = { upcoming: "Sắp mở", open: "Đang mở", closed: "Đã đóng" };
  const instant = (value) => Date.parse(value + "+07:00");
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
      instant(start) < instant(end);
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

  function statusOf({ start, end }, now = Date.now()) {
    if (now < instant(start)) return "upcoming";
    return now >= instant(end) ? "closed" : "open";
  }

  function records(data, now = Date.now()) {
    const result = new Map([...seedRounds, ...data.rounds].map((round) => [round.id, round]));
    return [...result.values()].map((round) => ({ ...round, status: statusOf(round, now) }));
  }

  function snapshot(now = Date.now()) {
    try {
      const state = read();
      return {
        terms: [...initialTerms, ...state.terms].sort((a, b) => b.localeCompare(a)),
        rounds: records(state, now),
      };
    } catch {
      return { terms: initialTerms, rounds: records({ rounds: [] }, now), unavailable: true };
    }
  }

  function academicYears() {
    return [...new Set(snapshot().terms.map((id) => {
      const year = Number(id.split("-")[0]);
      return `${year}-${year + 1}`;
    }))];
  }

  function matches(round, { academicYear, semester, topicType, type }) {
    const year = String(academicYear ?? "").match(/^20\d{2}(?=\s*[-–])/);
    const termNumber = ["he", "summer"].includes(semester) ? "3" : String(semester);
    return year && round.term === `${year[0]}-${termNumber}` &&
      round.type === (topicType || topicTypes[type] || type);
  }

  function selection(id, attrs, { now = Date.now(), allowUpcoming = false, keep = false } = {}) {
    const data = snapshot(now);
    if (data.unavailable) return { error: "Không đọc được lịch đợt đăng ký. Hãy thử lại." };
    const round = data.rounds.find((item) => item.id === id);
    if (!round || !matches(round, attrs)) return { error: "Chọn đợt đăng ký phù hợp với học kỳ và loại đề tài." };
    if (!keep && round.status === "closed") return { round, error: "Đợt đăng ký đã đóng." };
    if (!keep && !allowUpcoming && round.status === "upcoming") return { round, error: "Đợt đăng ký chưa mở." };
    return { round };
  }

  function forTopic(topic, now) {
    const id = topic.registration?.roundId;
    return id ? selection(id, topic, { now, keep: true }).round : undefined;
  }

  function withRegistration(topic, now) {
    const round = forTopic(topic, now);
    if (!round) return topic;
    return { ...topic, registration: {
      ...topic.registration,
      opensAt: new Date(instant(round.start)).toISOString(),
      deadline: new Date(instant(round.end)).toISOString(),
    } };
  }

  function displayTime(value) {
    const [day, time] = value.split("T");
    return `${time} · ${day.split("-").reverse().join("/")}`;
  }

  let watching = false;
  function watch() {
    if (watching) return;
    watching = true;
    let timer;
    function schedule(notify = true) {
      clearTimeout(timer);
      const now = Date.now();
      const next = Math.min(...snapshot(now).rounds.flatMap(({ start, end }) => [instant(start), instant(end)])
        .filter((timestamp) => timestamp > now));
      if (Number.isFinite(next)) timer = setTimeout(schedule, Math.min(2147483647, next - now));
      if (notify) {
        window.dispatchEvent(new Event(updateEvent));
        window.dispatchEvent(new Event("ie104:published-topics-updated"));
      }
    }
    window.addEventListener("storage", (event) => {
      if (event.key === storageKey || event.key === null) schedule();
    });
    window.addEventListener("pageshow", () => schedule());
    window.addEventListener(changedEvent, () => schedule());
    document.addEventListener("visibilitychange", () => { if (!document.hidden) schedule(); });
    schedule(false);
  }

  async function save(update) {
    function write() {
      const data = read();
      const result = update(data);
      if (!result.error) {
        localStorage.setItem(storageKey, JSON.stringify(data));
        globalThis.dispatchEvent?.(new Event(changedEvent));
      }
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

  globalThis.IE104AdminAcademic = { roundTypes, availableStartYears, minimumDateTime, snapshot, termLabel, addTerm, saveRound,
    academicYears, matches, selection, forTopic, withRegistration, displayTime, watch, updateEvent, statusLabels };
})();
