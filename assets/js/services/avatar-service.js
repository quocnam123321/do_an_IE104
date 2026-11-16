(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};
  const types = ['image/jpeg', 'image/png', 'image/webp'];
  const maxBytes = 2 * 1024 * 1024;

  function validate(file) {
    if (!(file instanceof Blob) || !types.includes(file.type) || !file.size || file.size > maxBytes) throw new Error('Chọn ảnh JPG, PNG hoặc WebP không quá 2 MB.');
  }

  function transact(mode, file) {
    if (location.protocol === 'file:') return Promise.reject(new Error('Mở website qua localhost để lưu ảnh thử.'));
    return new Promise((resolve, reject) => {
      let database;
      let value = null;
      let failed = false;
      const fail = () => { failed = true; database?.close(); reject(new Error(mode === 'readwrite' ? 'Chưa lưu được ảnh. Trình duyệt có thể đang chặn lưu trữ hoặc đã hết dung lượng.' : 'Không đọc được ảnh đã lưu trên trình duyệt.')); };
      let opening;
      try { opening = indexedDB.open('ie104.demo.student-media', 1); }
      catch { fail(); return; }
      opening.onupgradeneeded = () => { opening.result.createObjectStore('avatars'); };
      opening.onerror = fail;
      opening.onblocked = fail;
      opening.onsuccess = () => {
        database = opening.result;
        if (failed) { database.close(); return; }
        try {
          const transaction = database.transaction('avatars', mode);
          const store = transaction.objectStore('avatars');
          const request = mode === 'readwrite' ? store.put(file, app.data.studentProfile.code) : store.get(app.data.studentProfile.code);
          request.onsuccess = () => { value = request.result; };
          transaction.oncomplete = () => { database.close(); resolve(mode === 'readwrite' ? file : value || null); };
          transaction.onerror = fail;
          transaction.onabort = fail;
        } catch { fail(); }
      };
    });
  }

  async function read() {
    const file = await transact('readonly');
    if (file) validate(file);
    return file;
  }

  async function save(file) {
    validate(file);
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
    } catch { throw new Error('Không đọc được nội dung ảnh. Vui lòng chọn ảnh khác.'); }
    finally { URL.revokeObjectURL(url); }
    return transact('readwrite', file);
  }

  app.services.avatar = { read, save, validate, maxBytes };
})();
