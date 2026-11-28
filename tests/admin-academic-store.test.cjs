const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const adminScripts = path.join(__dirname, "../web/assets/js/pages/admin");
const source = ["sample-data.js", "academic-store.js"]
  .map((file) => fs.readFileSync(path.join(adminScripts, file), "utf8"))
  .join("\n");

function loadAcademicStore(now, saved) {
  const entries = new Map();
  if (saved) entries.set("ie104.admin.academic-demo.v1", JSON.stringify(saved));
  const context = {
    Date: class extends Date {
      static now() { return Date.parse(now); }
    },
    navigator: {},
    localStorage: {
      getItem: (key) => entries.get(key) ?? null,
      setItem: (key, value) => entries.set(key, value),
    },
  };
  vm.runInNewContext(source, context);
  return context.IE104AdminAcademic;
}

test("validates new registration times to the minute in Vietnam time", async () => {
  const store = loadAcademicStore("2026-11-28T03:27:36Z");
  assert.equal(store.minimumDateTime(), "2026-11-28T10:28");
  const originalCount = store.snapshot().rounds.length;
  const values = {
    name: "Đợt mới", term: "2026-1", type: "course",
    start: "2026-11-28T10:27", end: "2026-11-28T11:00",
  };
  const past = await store.saveRound(values);
  assert.equal(past.field, "start");
  assert.equal(store.snapshot().rounds.length, originalCount);
  const saved = await store.saveRound({ ...values, start: "2026-11-28T10:28" });
  assert.equal(saved.id, "DOT-06");
});

test("preserves saved past times but rejects changes to earlier times", async () => {
  const store = loadAcademicStore("2026-11-28T03:27:36Z");
  const original = store.snapshot().rounds.find(({ id }) => id === "DOT-04");
  const renamed = await store.saveRound({ ...original, name: "Đợt đã đóng" }, original);
  assert.equal(renamed.id, original.id);
  const updated = store.snapshot().rounds.find(({ id }) => id === original.id);
  assert.equal(updated.start, original.start);
  assert.equal(updated.end, original.end);
  const invalid = await store.saveRound({ ...updated, end: "2026-11-27T23:00" }, updated);
  assert.equal(invalid.field, "end");
  const extended = await store.saveRound({ ...updated, end: "2026-11-28T12:00" }, updated);
  assert.equal(extended.id, original.id);
});

test("limits new academic years while preserving earlier terms", async () => {
  const store = loadAcademicStore("2026-12-31T17:00:00Z");
  assert.equal(store.availableStartYears().at(-1), "2027");
  assert((await store.addTerm("2026", "2")).error);
  assert.equal((await store.addTerm("2027", "2")).id, "2027-2");
  assert(store.snapshot().terms.includes("2025-2"));
});

test("imports sourced rounds and keeps every previous semester closed", () => {
  const store = loadAcademicStore("2026-11-28T03:27:36Z", {
    terms: ["2025-1"],
    rounds: [{ id: "DOT-06", term: "2025-1", type: "course", name: "Đợt đã lưu",
      start: "2026-11-27T08:00", end: "2026-12-01T17:00", revision: 1 }],
  });
  const data = store.snapshot();
  assert.equal(store.currentTerm, "2026-1");
  assert.equal(data.unavailable, undefined);
  assert.deepEqual(Array.from(data.terms), ["2026-1", "2025-2", "2025-1", "2024-2", "2024-1"]);
  assert.equal(data.rounds.filter(({ source }) => source).length, 8);
  assert(data.rounds.filter(({ term }) => term === store.currentTerm).length > 10);
  assert(data.rounds.filter(({ term }) => term < store.currentTerm).every(({ status }) => status === "closed"));
  assert.equal(data.rounds.find(({ id }) => id === "DOT-06").name, "Đợt đã lưu");
  assert.equal(data.rounds.find(({ id }) => id === "DOT-01").status, "open");
  assert.equal(data.rounds.find(({ id }) => id === "DOT-03").status, "upcoming");
});

test("uses the full last day for date-only source records and preserves the source after a rename", async () => {
  const store = loadAcademicStore("2026-11-28T03:27:36Z");
  const id = "UIT-2026-1-KL";
  const at = (timestamp) => store.snapshot(Date.parse(timestamp)).rounds.find((round) => round.id === id);
  assert.equal(at("2026-09-06T16:59:59Z").status, "open");
  assert.equal(at("2026-09-06T17:00:00Z").status, "closed");

  const original = at("2026-11-28T03:27:36Z");
  assert.equal((await store.saveRound({ ...original, name: "Nộp đề cương KLTN" }, original)).id, id);
  assert.equal(at("2026-11-28T03:27:36Z").source, original.source);
});
