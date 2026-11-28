(() => {
  const storageKey = "ie104.admin.accounts-demo.v1";
  const { accounts: sampleAccounts } = globalThis.IE104AdminSampleData;
  const initialAccounts = sampleAccounts.map((account) => ({ code: account.id, ...account, revision: 0 }));
  const previousSampleIdentity = {
    "SV-042": { email: "nhat.minh@example.com" },
    "SV-043": { email: "ngoc.linh@example.com" },
    "SV-044": { email: "gia.han@example.com" },
    "SV-045": { email: "hoai.nam@example.com" },
    "GV-021": { email: "minh.khang@example.com" },
    "GV-022": { email: "thao.nguyen@example.com" },
    "GV-023": { email: "hoang.nam@example.com" },
    "SV-046": { username: "ie104.demo.sv046" },
    "GV-024": { username: "ie104.demo.gv024", email: "ie104.demo.gv024@example.com" },
    "SV-047": { email: "ie104.demo.sv047@gmail.com" },
    "GV-025": { email: "ie104.demo.gv025@gmail.com" },
    "SV-048": { code: "SV-048", email: "ie104-demo-sv048@gm.uit.edu.vn" },
    "SV-049": { code: "SV-049", email: "ie104-demo-sv049@gm.uit.edu.vn" },
  };
  const usernamePattern = /^[a-z0-9._-]{3,32}$/i;
  const emailPattern = /^[^\s@]+@[^\s@]+$/;
  const uniqueFields = [
    ["code", "Mã này đã được sử dụng."],
    ["username", "Tên đăng nhập này đã được sử dụng."],
    ["email", "Email này đã được sử dụng."],
  ];

  function fieldInUse(accounts, account, field) {
    const value = account[field].toLowerCase();
    return Boolean(value) && accounts.some((other) => other.id !== account.id && other[field].toLowerCase() === value);
  }

  function validateProfile(account) {
    if (!account.name.trim() || account.name.length > 120) {
      return { error: "Hãy nhập họ và tên.", field: "fullName" };
    }
    if (!account.code.trim() || account.code.length > 32) {
      return { error: "Hãy nhập mã sinh viên hoặc mã giảng viên.", field: "code" };
    }
    if (!["student", "lecturer"].includes(account.type)) {
      return { error: "Hãy chọn vai trò hợp lệ.", field: "role" };
    }
    if (account.provider === "password" && !usernamePattern.test(account.username)) {
      return { error: "Tên đăng nhập phải có 3–32 ký tự, gồm chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.", field: "username" };
    }
    if ((account.email || account.provider === "google") && !emailPattern.test(account.email)) {
      return { error: "Hãy nhập địa chỉ email hợp lệ.", field: "email" };
    }
    return null;
  }

  function read() {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return initialAccounts;
    const accounts = JSON.parse(raw);
    const valid = Array.isArray(accounts) &&
      accounts.every((account) =>
        account && ["id", "name", "code", "username", "email"].every((key) => typeof account[key] === "string") &&
        account.id && Number.isSafeInteger(account.revision) && account.revision >= 0 &&
        ["enabled", "locked"].includes(account.status) && ["password", "google"].includes(account.provider) &&
        (account.statusReason === undefined || typeof account.statusReason === "string") &&
        !validateProfile(account)
      ) &&
      new Set(accounts.map(({ id }) => id)).size === accounts.length;
    if (!valid) throw new Error("Invalid account data");

    for (const sample of initialAccounts) {
      const saved = accounts.find(({ id }) => id === sample.id);
      if (!saved) {
        if (!uniqueFields.some(([field]) => fieldInUse(accounts, sample, field))) accounts.push(sample);
        continue;
      }
      for (const [field, oldValue] of Object.entries(previousSampleIdentity[sample.id] ?? {})) {
        if (saved[field] === oldValue && !fieldInUse(accounts, sample, field)) saved[field] = sample[field];
      }
    }
    return accounts;
  }

  function snapshot() {
    try {
      return { accounts: read() };
    } catch {
      return { accounts: initialAccounts, unavailable: true };
    }
  }

  async function write(update) {
    function commit() {
      const accounts = [...read()];
      const result = update(accounts);
      if (!result.error) localStorage.setItem(storageKey, JSON.stringify(accounts));
      return result;
    }
    try {
      return navigator.locks ? await navigator.locks.request(storageKey, commit) : commit();
    } catch {
      return { error: "Không thể lưu tài khoản mẫu trên trình duyệt." };
    }
  }

  function saveAccount(fields, original) {
    return write((accounts) => {
      const index = original ? accounts.findIndex(({ id }) => id === original.id) : -1;
      const existing = accounts[index];
      if (original && (!existing || existing.revision !== original.revision || existing.status !== "enabled")) {
        return { error: "Tài khoản đã thay đổi. Hãy đóng hộp thoại và thử lại." };
      }
      const google = existing?.provider === "google";
      const account = {
        id: existing?.id ?? `account-${accounts.length + 1}`,
        name: fields.fullName.trim(),
        code: fields.code.trim(),
        type: fields.role,
        username: google ? "" : fields.username.trim().toLowerCase(),
        email: google ? existing.email : fields.email.trim(),
        provider: existing?.provider ?? "password",
        status: existing?.status ?? "enabled",
        ...(existing?.statusReason && { statusReason: existing.statusReason }),
        revision: (existing?.revision ?? 0) + 1,
      };
      const invalid = validateProfile(account);
      if (invalid) return invalid;

      for (const [field, error] of uniqueFields) {
        if (fieldInUse(accounts, account, field)) return { error, field };
      }

      if (existing) accounts[index] = account;
      else accounts.push(account);
      return { id: account.id };
    });
  }

  function toggleStatus(original) {
    return write((accounts) => {
      const index = accounts.findIndex(({ id }) => id === original.id);
      const account = accounts[index];
      if (!account || account.revision !== original.revision) {
        return { error: "Tài khoản đã thay đổi. Hãy đóng hộp thoại và thử lại." };
      }
      const status = account.status === "enabled" ? "locked" : "enabled";
      accounts[index] = { ...account, status, revision: account.revision + 1 };
      return { id: account.id };
    });
  }

  globalThis.IE104AdminAccounts = { storageKey, snapshot, saveAccount, toggleStatus };
})();
