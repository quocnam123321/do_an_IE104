(() => {
  const { notices } = globalThis.IE104AdminSampleData;
  const accounts = globalThis.IE104AdminAccounts;
  const { openDatabase, storeName, vietnamDateTime, notifyPublicationChange } = globalThis.IE104AcademicNotices;
  const categories = ["plan", "submissions", "defense"];
  const audiences = ["student", "lecturer", "both"];
  const fileLimit = 10 * 1024 * 1024;
  const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];
  const connected = Boolean(document.querySelector('meta[name="ie104-website-db"]'));
  const remote = async (path = "", options) => (await import("../../services/website-data-api.js")).websiteData("notices/manage" + path, options);
  let recipientsFromServer;
  const failure = "Không thể lưu thông báo trên trình duyệt. Hãy thử lại.";
  const seeds = [
    ...notices.map((notice) => ({ ...notice, kind: "academic", revision: 0 })),
    { id: "HT-104", kind: "system", name: "Có hồ sơ đăng ký mới", type: "registration", audience: "lecturer", date: "2026-11-28T08:45", recipients: [{ name: "Trần Thảo Nguyên", type: "lecturer" }] },
    { id: "HT-103", kind: "system", name: "Hồ sơ đề xuất đã được duyệt", type: "decision", audience: "student", date: "2026-11-27T14:30", recipients: [{ name: "Lê Minh Anh", type: "student" }] },
    { id: "HT-102", kind: "system", name: "Sắp đến hạn nộp báo cáo", type: "reminder", audience: "student", date: "2026-11-27T08:00", recipients: [{ name: "Trần Nhật Minh", type: "student" }] },
    { id: "HT-101", kind: "system", name: "Sinh viên đã nộp báo cáo tiến độ", type: "submission", audience: "lecturer", date: "2026-11-26T16:20", recipients: [{ name: "Nguyễn Minh Khang", type: "lecturer" }] },
  ];

  // Đọc và cập nhật cùng giao dịch để hai cửa sổ không ghi đè bản mới.
  async function transaction(mode, update) {
    const database = await openDatabase();
    try {
      const result = await new Promise((resolve, reject) => {
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
            result = [...entries.values()].filter((notice) => !notice.deleted);
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
      if (result.record?.kind === "academic" && result.record.status !== "draft") notifyPublicationChange();
      if (result.record?.kind === "system") globalThis.IE104SystemNotices.notifyChange();
      return result;
    } finally {
      database.close();
    }
  }

  function currentDateTime(now = Date.now()) {
    const { date, time } = vietnamDateTime(now);
    return `${date}T${time}`;
  }

  function nextId(entries, prefix) {
    const numbers = [...entries.keys()].filter((id) => id.startsWith(prefix)).map((id) => Number(id.slice(prefix.length)));
    return prefix + String(Math.max(0, ...numbers) + 1).padStart(3, "0");
  }

  function eligibleRecipients(audience) {
    if (connected) return { unavailable: !recipientsFromServer, recipients: (recipientsFromServer || [])
      .filter(({ type }) => audience === "both" || type === audience) };
    const snapshot = accounts.snapshot();
    return {
      unavailable: snapshot.unavailable,
      recipients: snapshot.accounts.filter(({ type, status }) => status === "enabled" && (audience === "both" || type === audience)),
    };
  }

  function validateText(name, body, hasImage = false) {
    if (!name || name.length > 120) return { error: "Nhập tiêu đề từ 1 đến 120 ký tự.", field: "title" };
    if ((!body && !hasImage) || body.length > 5000) return { error: "Nhập nội dung từ 1 đến 5000 ký tự.", field: "body" };
    return null;
  }

  function validateImage(file) {
    if (!imageTypes.includes(file.type)) return "Chọn ảnh JPG, PNG, GIF, WebP hoặc AVIF.";
    if (!file.size || file.size > fileLimit) return "Chọn ảnh có dung lượng từ 1 byte đến 10 MB.";
    return "";
  }

  function validateAcademic(fields) {
    const invalid = validateText(fields.title.trim(), fields.body.trim(), Boolean(fields.images.length));
    if (invalid) return invalid;
    if (!categories.includes(fields.category)) return { error: "Hãy chọn chuyên mục.", field: "category" };
    if (fields.attachment && (!fields.attachment.size || fields.attachment.size > fileLimit)) {
      return { error: "Chọn tệp đính kèm có dung lượng từ 1 byte đến 10 MB.", field: "attachment" };
    }
    for (const { file } of fields.images) {
      const error = validateImage(file);
      if (error) return { error, field: "body" };
    }
    return null;
  }

  function publishAcademic(fields, original) {
    const invalid = validateAcademic(fields);
    if (invalid) return invalid;
    if (connected) return saveRemoteAcademic(fields, original, "published");

    return transaction("readwrite", (entries) => {
      const current = original && entries.get(original.id);
      if (original && (current?.kind !== "academic" || current.status !== "draft" || current.revision !== original.revision)) {
        return { error: "Thông báo đã thay đổi. Hãy mở lại và thử lại." };
      }
      const now = new Date();
      return { record: {
        id: current?.id ?? nextId(entries, "TB-"),
        kind: "academic", name: fields.title.trim(), body: fields.body.trim(), type: fields.category, status: "published",
        html: fields.html, images: fields.images,
        attachment: fields.attachment, date: currentDateTime(now), revision: (current?.revision ?? 0) + 1,
        publishedAt: now.toISOString(),
      } };
    });
  }

  async function writeRemote(path, method, body) {
    try {
      const result = await remote(path, { method, body });
      if (result.record.id.startsWith("HT-")) globalThis.IE104SystemNotices.notifyChange();
      if (result.record.status === "published" || result.record.status === "withdrawn") notifyPublicationChange();
      return result;
    } catch (failure) {
      return { error: failure.message, field: failure.field };
    }
  }

  function saveRemoteAcademic(fields, original, status) {
    const invalid = validateAcademic(fields);
    if (invalid) return invalid;
    const form = new FormData();
    form.append("payload", JSON.stringify({ title: fields.title, body: fields.body, html: fields.html, category: fields.category,
      images: fields.images.map(image => image.id), attachment: Boolean(fields.attachment), status, revision: original?.revision }));
    for (const { id, file } of fields.images) if (file instanceof Blob) form.append(id, file, file.name);
    if (fields.attachment instanceof Blob) form.append("attachment", fields.attachment, fields.attachment.name);
    return writeRemote("/academic" + (original ? "/" + encodeURIComponent(original.id) : ""), original ? "PATCH" : "POST", form);
  }

  function deleteDraft(original) {
    if (connected) return writeRemote("/academic/" + encodeURIComponent(original.id), "DELETE", { revision: original.revision });
    return transaction("readwrite", (entries) => {
      const current = entries.get(original.id);
      if (current?.kind !== "academic" || current.status !== "draft" || current.revision !== original.revision) {
        return { error: "Thông báo đã thay đổi. Hãy mở lại và thử lại." };
      }
      // Reserve the ID and prevent a removed sample draft from reappearing.
      return { record: { id: current.id, deleted: true } };
    });
  }

  function withdrawAcademic(original) {
    if (connected) return writeRemote("/academic/" + encodeURIComponent(original.id) + "/withdraw", "PATCH", { revision: original.revision });
    return transaction("readwrite", (entries) => {
      const current = entries.get(original.id);
      if (current?.kind !== "academic" || current.status !== "published" || current.revision !== original.revision) {
        return { error: "Thông báo đã thay đổi. Hãy mở lại và thử lại." };
      }
      return { record: {
        ...current, status: "withdrawn", date: currentDateTime(), revision: current.revision + 1,
      } };
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
    if (connected) return writeRemote("/system", "POST", fields);

    return transaction("readwrite", (entries) => {
      const { recipients, unavailable } = eligibleRecipients(fields.audience);
      if (unavailable) return { error: "Không thể đọc danh sách tài khoản. Hãy thử lại." };
      const ids = new Set(fields.ids);
      const selected = fields.scope === "all" ? recipients : recipients.filter(({ id }) => ids.has(id));
      if (fields.scope === "specific" && selected.length !== ids.size) {
        return { error: "Người nhận đã thay đổi. Hãy chọn lại người nhận.", field: "recipientSearch" };
      }
      if (!selected.length) return { error: "Hãy chọn ít nhất một người nhận hợp lệ.", field: "recipientSearch" };
      const now = new Date();
      return { record: {
        id: nextId(entries, "HT-"), kind: "system", name, body, type: "manual",
        audience: fields.audience, scope: fields.scope, date: currentDateTime(now), sentAt: now.toISOString(),
        recipients: selected.map(({ id, name, code, type }) => ({ id, name, code, type })),
      } };
    });
  }

  async function snapshot() {
    try {
      if (connected) {
        const data = await remote();
        recipientsFromServer = data.recipients;
        return { records: data.records };
      }
      return { records: await transaction("readonly") };
    } catch {
      if (connected) {
        recipientsFromServer = undefined;
        return { records: [], unavailable: true };
      }
      return { records: seeds, unavailable: true };
    }
  }

  globalThis.IE104AdminNotices = {
    categories, audiences, eligibleRecipients, snapshot, publishAcademic, deleteDraft, validateAcademic, validateImage, connected,
    saveDraft: (fields, original) => saveRemoteAcademic(fields, original, "draft"),
    withdrawAcademic, createSystem,
  };
})();
