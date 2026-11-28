const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const adminScripts = path.join(__dirname, "../web/assets/js/pages/admin");
const source = ["sample-data.js", "academic-store.js"]
  .map((file) => fs.readFileSync(path.join(adminScripts, file), "utf8"))
  .join("\n");

function loadAcademicStore(now) {
  const entries = new Map();
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
  const values = {
    name: "Đợt mới", term: "2026-1", type: "course",
    start: "2026-11-28T10:27", end: "2026-11-28T11:00",
  };
  const past = await store.saveRound(values);
  assert.equal(past.field, "start");
  assert.equal(store.snapshot().rounds.length, 5);
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
