const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const scripts = path.join(__dirname, "../web/assets/js/pages/admin");
const source = ["sample-data.js", "account-store.js"]
  .map((file) => fs.readFileSync(path.join(scripts, file), "utf8"))
  .join("\n");

function loadAccounts() {
  const storage = new Map();
  const context = {
    navigator: {},
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  };
  vm.runInNewContext(source, context);
  return { store: context.IE104AdminAccounts, storage };
}

const fields = { fullName: "Nguyễn An", code: "SV-100", role: "student", username: "nguyen.an", email: "" };

test("adds a password profile with optional email and never persists credentials", async () => {
  const { store, storage } = loadAccounts();
  const created = await store.saveAccount({ ...fields, password: "test-password" });
  const account = store.snapshot().accounts.find(({ id }) => id === created.id);
  assert.equal(account.username, fields.username);
  assert.equal(account.email, "");
  assert.equal(account.provider, "password");
  assert(!storage.get(store.storageKey).includes("test-password"));
  assert.equal((await store.saveAccount({ ...fields, username: "another.user" })).field, "code");
  assert.equal((await store.saveAccount({ ...fields, code: "SV-101", username: "MINH.ANH" })).field, "username");
});

test("locks and unlocks without a reason, rejects locked edits, and restores editing after unlock", async () => {
  const { store } = loadAccounts();
  const account = store.snapshot().accounts.find(({ id }) => id === "SV-041");
  assert.equal((await store.toggleStatus(account)).id, account.id);
  const locked = store.snapshot().accounts.find(({ id }) => id === account.id);
  assert.equal(locked.status, "locked");
  assert.equal(locked.statusReason, undefined);
  assert.equal(locked.code, account.code);
  assert((await store.saveAccount(fields, account)).error);
  assert((await store.saveAccount(fields, locked)).error);
  assert((await store.toggleStatus(account)).error);
  assert.equal((await store.toggleStatus(locked)).id, account.id);
  const unlocked = store.snapshot().accounts.find(({ id }) => id === account.id);
  assert.equal(unlocked.status, "enabled");
  assert.equal((await store.saveAccount(fields, unlocked)).id, account.id);
});

test("keeps the original Google sign-in email when editing profile information", async () => {
  const { store } = loadAccounts();
  const original = store.snapshot().accounts.find(({ id }) => id === "GV-021");
  const updated = await store.saveAccount({ ...fields, email: "different@example.com" }, original);
  const account = store.snapshot().accounts.find(({ id }) => id === updated.id);
  assert.equal(account.name, fields.fullName);
  assert.equal(account.email, original.email);
  assert.equal(account.username, "");
  assert.equal(account.provider, "google");
});

test("adds every new sample to an existing directory while preserving saved changes", async () => {
  const { store, storage } = loadAccounts();
  const originalIds = new Set(["SV-041", "SV-042", "SV-043", "SV-044", "SV-045", "GV-021", "GV-022", "GV-023"]);
  const saved = store.snapshot().accounts.filter(({ id }) => originalIds.has(id));
  saved[0] = { ...saved[0], name: "Lê Minh Anh đã sửa", status: "locked", revision: 2 };
  saved.push({ ...saved[0], id: "account-9", code: "SV-100", username: "custom.student", name: "Nguyễn An" });
  const savedData = JSON.stringify(saved);
  storage.set(store.storageKey, savedData);

  const { accounts, unavailable } = store.snapshot();
  const added = accounts.filter(({ id }) => !saved.some((account) => account.id === id));
  assert.equal(unavailable, undefined);
  assert.equal(added.length, 7);
  assert.equal(added.filter(({ provider }) => provider === "password").length, 2);
  assert.equal(added.filter(({ provider, email }) => provider === "google" && email.endsWith("@gmail.com")).length, 2);
  const uitAccounts = added.filter(({ provider, email }) => provider === "google" && email.endsWith("@gm.uit.edu.vn"));
  assert.deepEqual(Array.from(uitAccounts, ({ code }) => code.slice(0, 4)), ["2352", "2452", "2552"]);
  for (const { code, email } of uitAccounts) {
    assert.match(code, /^\d{8}$/);
    assert.equal(email, `${code}@gm.uit.edu.vn`);
  }
  for (const { username, email } of accounts) {
    assert.doesNotMatch(username + email, /demo|example/i);
  }
  assert.equal(JSON.stringify(accounts.slice(0, saved.length)), savedData);

  await store.toggleStatus(added[0]);
  const reloaded = store.snapshot().accounts;
  assert.equal(reloaded.length, accounts.length);
  assert.equal(reloaded.find(({ id }) => id === added[0].id).status, "locked");
});

test("preserves a saved account that already uses a new sample's code", () => {
  const { store, storage } = loadAccounts();
  const sample = store.snapshot().accounts.find(({ id }) => id === "SV-046");
  const saved = { ...sample, id: "account-9", username: "custom.student" };
  storage.set(store.storageKey, JSON.stringify([saved]));

  const { accounts } = store.snapshot();
  assert.equal(accounts.filter(({ code }) => code === sample.code).length, 1);
  assert.equal(accounts.find(({ code }) => code === sample.code).id, saved.id);
});

test("updates old sample sign-in details without overwriting edited profile fields", () => {
  const { store, storage } = loadAccounts();
  const { accounts } = store.snapshot();
  const uit = accounts.find(({ id }) => id === "SV-048");
  const lecturer = accounts.find(({ id }) => id === "GV-024");
  const customEmail = "hang.le.2026@gmail.com";
  storage.set(store.storageKey, JSON.stringify([
    { ...uit, code: "SV-048", email: "ie104-demo-sv048@gm.uit.edu.vn", status: "locked", revision: 2 },
    { ...lecturer, username: "ie104.demo.gv024", email: customEmail, revision: 3 },
  ]));

  const saved = store.snapshot().accounts;
  const updatedUit = saved.find(({ id }) => id === uit.id);
  assert.equal(updatedUit.code, uit.code);
  assert.equal(updatedUit.email, uit.email);
  assert.equal(updatedUit.status, "locked");
  assert.equal(updatedUit.revision, 2);
  const updatedLecturer = saved.find(({ id }) => id === lecturer.id);
  assert.equal(updatedLecturer.username, lecturer.username);
  assert.equal(updatedLecturer.email, customEmail);
});
