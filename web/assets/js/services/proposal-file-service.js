(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services ||= {};
  const storeName = 'files';

  function transaction(mode, operation) {
    if (location.protocol === 'file:') return Promise.reject(new Error('Mở website qua localhost để lưu và tải tệp đề xuất.'));
    return new Promise((resolve, reject) => {
      let database;
      let result;
      let failed = false;
      const fail = () => {
        failed = true;
        database?.close();
        reject(new Error('Không truy cập được kho tệp đề xuất. Hãy kiểm tra quyền lưu trữ của trình duyệt rồi thử lại.'));
      };
      let opening;
      try { opening = indexedDB.open('ie104.demo.proposal-files', 1); }
      catch { fail(); return; }
      opening.onupgradeneeded = () => opening.result.createObjectStore(storeName, { keyPath: 'fileKey' });
      opening.onerror = fail;
      opening.onblocked = fail;
      opening.onsuccess = () => {
        database = opening.result;
        if (failed) { database.close(); return; }
        database.onversionchange = () => database.close();
        try {
          const tx = database.transaction(storeName, mode);
          const request = operation(tx.objectStore(storeName));
          request.onsuccess = () => { result = request.result; };
          tx.oncomplete = () => { database.close(); resolve(result); };
          tx.onerror = fail;
          tx.onabort = fail;
        } catch { fail(); }
      };
    });
  }

  async function stage(file) {
    if (!(file instanceof Blob) || !file.size || !file.name) throw new Error('Tệp đính kèm bị rỗng hoặc không hợp lệ. Hãy chọn tệp khác.');
    const fileKey = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ref = { fileKey, name: file.name, size: file.size, type: file.type };
    await transaction('readwrite', store => store.add({ ...ref, blob: file }));
    return ref;
  }

  async function read(ref) {
    if (ref.proposalId || ref.projectId) {
      const blob = ref.proposalId ? await app.proposalDatabase.readProposalFile(ref.proposalId, ref.fileKey)
        : await app.proposalDatabase.readProjectCover(ref.projectId, ref.fileKey);
      return { blob, fileName: ref.name };
    }
    const record = await transaction('readonly', store => store.get(ref.fileKey));
    if (!record || !(record.blob instanceof Blob) || !record.blob.size ||
      record.name !== ref.name || record.blob.size !== ref.size) {
      throw new Error('Không tìm thấy nội dung tệp khớp với đề xuất này.');
    }
    return { blob: record.blob, fileName: record.name };
  }

  function validateImage(file) {
    if (!['image/jpeg', 'image/png'].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) {
      throw new Error('Chọn ảnh PNG hoặc JPG có dung lượng tối đa 5 MB.');
    }
  }

  async function validateImageContent(file) {
    validateImage(file);
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
    } catch {
      throw new Error('Không đọc được ảnh đại diện. Hãy chọn lại ảnh PNG hoặc JPG.');
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function stageImage(file) {
    await validateImageContent(file);
    return stage(file);
  }

  const discard = fileKey => transaction('readwrite', store => store.delete(fileKey));
  app.services.proposalFiles = { stage, stageImage, validateImage, validateImageContent, read, discard };
})();
