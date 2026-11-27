(() => {
  const { notices } = globalThis.IE104AdminSampleData;
  const accounts = globalThis.IE104AdminAccounts;
  const databaseName = "ie104.admin.notifications-demo";
  const storeName = "notifications";
  const categories = ["plan", "submissions", "defense"];
  const audiences = ["student", "lecturer", "both"];
  const fileLimit = 10 * 1024 * 1024;
  const failure = "Không thể lưu thông báo trên trình duyệt. Hãy thử lại.";
  const seeds = [
    ...notices.map((notice) => ({ ...notice, kind: "academic", revision: 0 })),
    { id: "HT-104", kind: "system", name: "Có hồ sơ đăng ký mới", type: "registration", audience: "lecturer", date: "2026-11-28T08:45", recipients: [{ name: "Trần Thảo Nguyên", type: "lecturer" }] },
    { id: "HT-103", kind: "system", name: "Hồ sơ đề xuất đã được duyệt", type: "decision", audience: "student", date: "2026-11-27T14:30", recipients: [{ name: "Lê Minh Anh", type: "student" }] },
    { id: "HT-102", kind: "system", name: "Sắp đến hạn nộp báo cáo", type: "reminder", audience: "student", date: "2026-11-27T08:00", recipients: [{ name: "Trần Nhật Minh", type: "student" }] },
    { id: "HT-101", kind: "system", name: "Sinh viên đã nộp báo cáo tiến độ", type: "submission", audience: "lecturer", date: "2026-11-26T16:20", recipients: [{ name: "Nguyễn Minh Khang", type: "lecturer" }] },
  ];

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: "id" });
      request.onerror = () => reject(new Error(failure));
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => database.close();
        resolve(database);
      };
    });
  }

  // Đọc và cập nhật cùng giao dịch để hai cửa sổ không ghi đè bản mới.
  async function transaction(mode, update) {
    const database = await openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const tx = database.transaction(storeName, mode);
        const records = tx.objectStore(storeName);
        const request = records.getAll();
        let result;
        tx.oncomplete = () => resolve(result);
        tx.onabort = () => reject(new Error(failure));
        request.onsuccess = () => {
          const entries = new Map(seeds.map((notice) => [notice.id, notice]));
          request.result.forEach((notice) => entries.set(notice.id, notice));
          if (!update) {
            result = [...entries.values()];
            return;
          }
          try {
            result = update(entries);
            if (!result.error) records.put(result.record);
          } catch {
            tx.abort();
          }
        };
      });
    } finally {
      database.close();
    }
  }

  function currentDateTime() {
    const utcPlusSeven = 7 * 60 * 60 * 1000;
    return new Date(Date.now() + utcPlusSeven).toISOString().slice(0, 16);
  }

  function nextId(entries, prefix) {
    const numbers = [...entries.keys()].filter((id) => id.startsWith(prefix)).map((id) => Number(id.slice(prefix.length)));
    return prefix + String(Math.max(0, ...numbers) + 1).padStart(3, "0");
  }

  function eligibleRecipients(audience) {
    const snapshot = accounts.snapshot();
    return {
      unavailable: snapshot.unavailable,
      recipients: snapshot.accounts.filter(({ type, status }) => status === "enabled" && (audience === "both" || type === audience)),
    };
  }

  function validateText(name, body) {
    if (!name || name.length > 120) return { error: "Nhập tiêu đề từ 1 đến 120 ký tự.", field: "title" };
    if (!body || body.length > 5000) return { error: "Nhập nội dung từ 1 đến 5000 ký tự.", field: "body" };
    return null;
  }

  function saveDraft(fields, original) {
    const name = fields.title.trim();
    const body = fields.body.trim();
    const invalid = validateText(name, body);
    if (invalid) return invalid;
    if (!categories.includes(fields.category)) return { error: "Hãy chọn chuyên mục.", field: "category" };
    if (fields.attachment && (!fields.attachment.size || fields.attachment.size > fileLimit)) {
      return { error: "Chọn tệp đính kèm có dung lượng từ 1 byte đến 10 MB.", field: "attachment" };
    }

    return transaction("readwrite", (entries) => {
      const current = original && entries.get(original.id);
      if (original && (!current || current.status !== "draft" || current.revision !== original.revision)) {
        return { error: "Thông báo đã thay đổi. Hãy mở lại và thử lại." };
      }
      return { record: {
        id: current?.id ?? nextId(entries, "TB-"),
        kind: "academic", name, body, type: fields.category, status: "draft",
        attachment: fields.attachment, date: currentDateTime(), revision: (current?.revision ?? 0) + 1,
      } };
    });
  }

  function changeStatus(original, next) {
    const expected = next === "published" ? "draft" : "published";
    return transaction("readwrite", (entries) => {
      const current = entries.get(original.id);
      if (current?.kind !== "academic" || current.status !== expected || current.revision !== original.revision) {
        return { error: "Thông báo đã thay đổi. Hãy mở lại và thử lại." };
      }
      return { record: { ...current, status: next, date: currentDateTime(), revision: current.revision + 1 } };
    });
  }

  function createSystem(fields) {
    const name = fields.title.trim();
    const body = fields.body.trim();
    const invalid = validateText(name, body);
    if (invalid) return invalid;
    if (!audiences.includes(fields.audience) || !["all", "specific"].includes(fields.scope)) {
      return { error: "Hãy chọn đối tượng và phạm vi gửi." };
    }

    return transaction("readwrite", (entries) => {
      const { recipients, unavailable } = eligibleRecipients(fields.audience);
      if (unavailable) return { error: "Không thể đọc danh sách tài khoản. Hãy thử lại." };
      const ids = new Set(fields.ids);
      const selected = fields.scope === "all" ? recipients : recipients.filter(({ id }) => ids.has(id));
      if (fields.scope === "specific" && selected.length !== ids.size) {
        return { error: "Người nhận đã thay đổi. Hãy chọn lại người nhận.", field: "recipientSearch" };
      }
      if (!selected.length) return { error: "Hãy chọn ít nhất một người nhận hợp lệ.", field: "recipientSearch" };
      return { record: {
        id: nextId(entries, "HT-"), kind: "system", name, body, type: "manual",
        audience: fields.audience, scope: fields.scope, date: currentDateTime(),
        recipients: selected.map(({ id, name, code, type }) => ({ id, name, code, type })),
      } };
    });
  }

  async function snapshot() {
    try {
      return { records: await transaction("readonly") };
    } catch {
      return { records: seeds, unavailable: true };
    }
  }

  globalThis.IE104AdminNotices = { categories, audiences, eligibleRecipients, snapshot, saveDraft, changeStatus, createSystem };
})();
