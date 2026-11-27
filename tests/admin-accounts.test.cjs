const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const scripts = path.join(__dirname, "../assets/js/pages/admin");
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

test("requires a reason for status changes, rejects locked edits, and restores editing after unlock", async () => {
  const { store } = loadAccounts();
  const account = store.snapshot().accounts.find(({ id }) => id === "SV-041");
  assert.equal((await store.toggleStatus(account, "  ")).field, "reason");
  assert.equal((await store.toggleStatus(account, "a".repeat(2001))).field, "reason");
  assert.equal((await store.toggleStatus(account, "  Cần xác minh tài khoản  ")).id, account.id);
  const locked = store.snapshot().accounts.find(({ id }) => id === account.id);
  assert.equal(locked.status, "locked");
  assert.equal(locked.statusReason, "Cần xác minh tài khoản");
  assert.equal(locked.code, account.code);
  assert((await store.saveAccount(fields, account)).error);
  assert((await store.saveAccount(fields, locked)).error);
  assert((await store.toggleStatus(account, "Yêu cầu đã cũ")).error);
  assert.equal((await store.toggleStatus(locked, "Đã xác minh tài khoản")).id, account.id);
  const unlocked = store.snapshot().accounts.find(({ id }) => id === account.id);
  assert.equal(unlocked.status, "enabled");
  assert.equal((await store.saveAccount(fields, unlocked)).id, account.id);
  assert.equal(store.snapshot().accounts.find(({ id }) => id === account.id).statusReason, "Đã xác minh tài khoản");
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
