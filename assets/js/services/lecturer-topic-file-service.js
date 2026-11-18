(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services ||= {};
  function validate(file, purpose) {
    if (!(file instanceof Blob) || !file.size) throw new Error('Tệp rỗng hoặc không hợp lệ.');
    if (purpose === 'image') {
      if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Chọn ảnh PNG/JPG không quá 5 MB.');
    } else if (purpose !== 'attachment' || file.size > 10 * 1024 * 1024 || !/\.(pdf|docx?|txt)$/i.test(file.name || '')) throw new Error('Chọn tài liệu PDF, DOC, DOCX hoặc TXT không quá 10 MB.');
  }
  function transaction(mode, operation) {
    if (location.protocol === 'file:') return Promise.reject(new Error('Mở website qua localhost để lưu tệp đề tài.'));
    return new Promise((resolve, reject) => {
      let database; let result; let failed = false;
      const fail = () => { failed = true; database?.close(); reject(new Error('Không truy cập được kho tệp đề tài trên trình duyệt. Chưa thay đổi nội dung đã lưu.')); };
      let opening;
      try { opening = indexedDB.open('ie104.demo.lecturer-topic-files', 1); } catch { fail(); return; }
      opening.onupgradeneeded = () => opening.result.createObjectStore('files', { keyPath: 'key' });
      opening.onerror = fail; opening.onblocked = fail;
      opening.onsuccess = () => {
        database = opening.result; if (failed) { database.close(); return; }
        try {
          const tx = database.transaction('files', mode);
          const request = operation(tx.objectStore('files'));
          request.onsuccess = () => { result = request.result; };
          tx.oncomplete = () => { database.close(); resolve(result); };
          tx.onerror = fail; tx.onabort = fail;
        } catch { fail(); }
      };
    });
  }
  async function stage(topicId, purpose, file, ownerId) {
    validate(file, purpose);
    if (ownerId !== app.data.currentLecturer?.id) throw new Error('Giảng viên hiện tại đã thay đổi.');
    if (purpose === 'image') {
      const url = URL.createObjectURL(file);
      try { const image = new Image(); image.src = url; await image.decode(); }
      catch { throw new Error('Không đọc được nội dung ảnh. Chọn ảnh PNG/JPG khác.'); }
      finally { URL.revokeObjectURL(url); }
    }
    const ref = { key: crypto.randomUUID(), name: String(file.name || 'anh-de-tai').split(/[\\/]/).pop(), size: file.size, type: file.type || 'application/octet-stream', ownerId, topicId, purpose };
    if (ownerId !== app.data.currentLecturer?.id) throw new Error('Giảng viên hiện tại đã thay đổi.');
    await transaction('readwrite', store => store.add({ ...ref, file }));
    return ref;
  }
  async function readResolved(topicId,purpose,resolve) {
    const topic = resolve();
    const ref = topic[`${purpose}Ref`];
    if (!ref) return null;
    const record = await transaction('readonly',store => store.get(ref.key));
    const current = resolve();
    if (current.ownerId !== topic.ownerId || current[`${purpose}Ref`]?.key !== ref.key) throw new Error('Tệp đã thay đổi ở tab khác. Hãy tải lại trang.');
    if (!record || !(record.file instanceof Blob) || record.ownerId !== topic.ownerId || record.topicId !== topicId || record.purpose !== purpose || record.name !== ref.name || record.file.size !== ref.size || record.file.type !== (ref.type === 'application/octet-stream' ? '' : ref.type)) throw new Error('Chưa tìm thấy nội dung tệp thật khớp với đề tài.');
    validate(record.file,purpose);
    return { blob:record.file,fileName:ref.name };
  }
  const read = (topicId,purpose) => readResolved(topicId,purpose,() => app.services.lecturerTopics.get('created',topicId));
  function readPublished(id,purpose) {
    const resolve = () => { const topic = app.services.publishedTopics.get(id); if (!topic) throw new Error('Không tìm thấy đề tài có tài liệu công khai.'); return topic; };
    return readResolved(resolve().catalogId,purpose,resolve);
  }
  async function discard(refs) {
    for (const ref of refs.filter(Boolean)) {
      let used = true;
      try { const topic = app.services.lecturerTopics.get('created', ref.topicId); used = [topic.imageRef?.key, topic.attachmentRef?.key].includes(ref.key); }
      catch { used = app.services.lecturerTopics.list('created').some(topic => [topic.imageRef?.key, topic.attachmentRef?.key].includes(ref.key)); }
      if (!used && ref.ownerId === app.data.currentLecturer?.id) await transaction('readwrite', store => store.delete(ref.key));
    }
  }
  app.services.lecturerTopicFiles = { validate, stage, read, readPublished, discard };
})();
