(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services ||= {};
  const databaseName = 'ie104.demo.submission-files';
  const storeName = 'files';
  const missingMessage = 'Chưa có nội dung tệp của lần nộp này. Tên tệp chưa đủ để tải xuống.';

  function readRecord(projectId, submissionId) {
    if (location.protocol === 'file:') return Promise.reject(new Error('Mở website qua localhost để đọc tệp bài nộp.'));
    return new Promise((resolve, reject) => {
      let database;
      let failed = false;
      let result = null;
      const fail = () => {
        failed = true;
        database?.close();
        reject(new Error('Không đọc được tệp bài nộp đã lưu. Hãy kiểm tra quyền lưu trữ của trình duyệt rồi thử lại.'));
      };
      try {
        const opening = indexedDB.open(databaseName, 1);
        opening.onupgradeneeded = () => opening.result.createObjectStore(storeName, { keyPath: ['projectId', 'submissionId'] });
        opening.onerror = fail;
        opening.onblocked = fail;
        opening.onsuccess = () => {
          database = opening.result;
          if (failed) { database.close(); return; }
          database.onversionchange = () => database.close();
          try {
            const transaction = database.transaction(storeName, 'readonly');
            const request = transaction.objectStore(storeName).get([projectId, submissionId]);
            request.onsuccess = () => { result = request.result || null; };
            transaction.oncomplete = () => { database.close(); resolve(result); };
            transaction.onerror = fail;
            transaction.onabort = fail;
          } catch { fail(); }
        };
      } catch { fail(); }
    });
  }

  async function lookup(projectId, submissionId) {
    const initial = app.services.teaching.getSubmission(projectId, submissionId);
    const record = await readRecord(projectId, submissionId);
    const current = app.services.teaching.getSubmission(projectId, submissionId);
    if (current.fileName !== initial.fileName || current.submittedAt !== initial.submittedAt) throw new Error('Bài nộp đã thay đổi. Hãy tải lại danh sách trước khi tải tệp.');
    if (!record) return null;
    if (record.projectId !== projectId || record.submissionId !== submissionId || record.fileName !== current.fileName || record.submittedAt !== current.submittedAt) throw new Error('Tệp đã lưu không khớp với lần nộp hiện tại. Không thể tải nhầm phiên bản.');
    if (!(record.blob instanceof Blob) || record.blob.size === 0) throw new Error('Nội dung tệp đã lưu không hợp lệ hoặc đang rỗng.');
    return { blob: record.blob, fileName: current.fileName.replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g, '_').trim() || 'bai-nop', size: record.blob.size };
  }

  async function availability(projectId, submissionId) {
    const result = await lookup(projectId, submissionId);
    return { available: Boolean(result), reason: result ? '' : missingMessage };
  }

  async function read(projectId, submissionId) {
    const result = await lookup(projectId, submissionId);
    if (!result) throw new Error(missingMessage);
    return result;
  }

  app.services.submissionFiles = { availability, read, databaseName, storeName };
})();
