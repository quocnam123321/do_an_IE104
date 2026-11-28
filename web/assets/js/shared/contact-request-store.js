(() => {
  const databaseName = "ie104.contact-requests-demo";
  const storeName = "requests";
  const changeEvent = "ie104.contact-requests.changed";
  const statuses = ["new", "processing", "resolved"];
  const connected = Boolean(document.querySelector('meta[name="ie104-website-db"]'));
  const remote = async (path, options) => (await import("../services/website-data-api.js")).websiteData(path, options);
  const samples = [
    { subject: "Không đăng nhập được", name: "Nguyễn Minh Anh", role: "guest",
      email: "minh.anh@example.com", phone: "", sentAt: "2026-11-28T10:40:00+07:00", status: "new",
      message: "Em đã thử đặt lại mật khẩu nhưng vẫn chưa đăng nhập được. Nhờ quản trị viên hỗ trợ giúp em." },
    { subject: "Hỏi về hạn đăng ký đề tài", name: "Trần Nhật Minh", role: "student",
      email: "nhat.minh@example.com", phone: "", sentAt: "2026-11-28T09:15:00+07:00", status: "processing",
      message: "Em muốn hỏi đợt đăng ký đề tài học kỳ này sẽ đóng vào ngày nào ạ?" },
    { subject: "Góp ý về trang thông báo", name: "Lê Thanh Hà", role: "guest",
      email: "thanh.ha@example.com", phone: "", sentAt: "2026-11-27T16:20:00+07:00", status: "new",
      message: "Mình mong có thể tìm các thông báo theo tiêu đề dễ hơn trên điện thoại." },
    { subject: "Cập nhật thông tin môn học", name: "Phạm Ngọc Linh", role: "lecturer",
      email: "ngoc.linh@example.com", phone: "", sentAt: "2026-11-27T14:30:00+07:00", status: "resolved",
      message: "Nhờ cập nhật tên môn học trong đợt đăng ký sắp tới." },
  ];

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
        for (const sample of samples) store.add({ ...sample, revision: 0 });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => database.close();
        resolve(database);
      };
    });
  }

  async function transact(mode, run) {
    const database = await openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, mode);
        let result;
        transaction.oncomplete = () => resolve(result);
        transaction.onabort = () => reject(transaction.error);
        run(transaction.objectStore(storeName), (value) => { result = value; });
      });
    } finally {
      database.close();
    }
  }

  function list() {
    if (connected) return remote("auth/admin/contacts").then(result => result.requests);
    return transact("readonly", (store, result) => {
      const request = store.getAll();
      request.onsuccess = () => result(request.result);
    });
  }

  function notifyChange() {
    try {
      localStorage.setItem(changeEvent, `${Date.now()}-${Math.random()}`);
    } catch {
      // The database write has already completed.
    }
  }

  async function submit({ name, email, phone, subject, message, role }) {
    if (connected) {
      await remote("contact-requests", { method: "POST", body: { name, email, phone, subject, message } });
      notifyChange();
      return;
    }
    await transact("readwrite", (store) => {
      store.add({ name, email, phone, subject, message, role, sentAt: new Date().toISOString(),
        status: "new", revision: 0 });
    });
    notifyChange();
  }

  async function saveStatus(id, revision, status) {
    if (!statuses.includes(status)) return false;
    if (connected) {
      try {
        await remote("auth/admin/contacts/" + encodeURIComponent(id), { method: "PATCH", body: { revision, status } });
      } catch (failure) {
        if (failure.status === 409) return false;
        throw failure;
      }
      notifyChange();
      return true;
    }
    const saved = await transact("readwrite", (store, result) => {
      const request = store.get(id);
      request.onsuccess = () => {
        const entry = request.result;
        if (!entry || entry.revision !== revision) {
          result(false);
          return;
        }
        store.put({ ...entry, status, revision: revision + 1 });
        result(true);
      };
    });
    if (saved) notifyChange();
    return saved;
  }

  function onChange(refresh) {
    window.addEventListener("storage", (event) => {
      if (event.key === changeEvent) refresh();
    });
    if (connected) {
      document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
    }
  }

  globalThis.IE104ContactRequests = { list, submit, saveStatus, onChange, connected };
})();
