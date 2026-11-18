(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services ||= {};
  const key = 'ie104.demo.lecturer-topics.v1';
  const hasText = value => typeof value === 'string' && value.trim();
  const asset = value => value === undefined || value === null || (hasText(value.key) && hasText(value.name) && hasText(value.type) && Number.isInteger(value.size) && value.size > 0);
  function valid(record) {
    return record && record.kind === 'created' && ['id', 'ownerId', 'title', 'topicType', 'typeLabel', 'course', 'courseLabel', 'academicYear', 'createdAt', 'description'].every(field => typeof record[field] === 'string') && /^[A-Z0-9][A-Z0-9_-]{0,29}$/.test(record.id) && hasText(record.ownerId) && hasText(record.title) && ['open', 'closed'].includes(record.status) && Number.isInteger(record.revision) && record.revision > 0 && ['objectives', 'outcomes', 'requirements'].every(field => Array.isArray(record[field]) && record[field].every(item => typeof item === 'string')) && record.registration && Number.isInteger(record.registration.minMembers) && Number.isInteger(record.registration.maxMembers) && record.registration.minMembers > 0 && record.registration.maxMembers >= record.registration.minMembers && Number.isFinite(Date.parse(record.registration.deadline)) && Number.isFinite(Date.parse(record.updatedAt)) && asset(record.imageRef) && asset(record.attachmentRef);
  }
  function read() {
    if (globalThis.location?.protocol === 'file:') throw new Error('Mở website qua localhost để lưu và xem đề tài GV giữa các trang.');
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return [];
      const value = JSON.parse(raw);
      if (value.version !== 1 || !Array.isArray(value.records) || !value.records.every(valid) || new Set(value.records.map(record => record.id)).size !== value.records.length) throw new Error();
      return value.records;
    } catch { throw new Error('Không đọc được đề tài GV đã lưu. Dữ liệu cũ chưa bị thay thế.'); }
  }
  function write(records) {
    if (!Array.isArray(records) || !records.every(valid)) throw new Error('Thông tin đề tài chưa hợp lệ nên chưa được lưu.');
    try { localStorage.setItem(key, JSON.stringify({ version: 1, records })); }
    catch { throw new Error('Chưa lưu được đề tài. Trình duyệt có thể đang chặn lưu trữ hoặc đã hết dung lượng.'); }
    globalThis.dispatchEvent?.(new Event('ie104:lecturer-topics-updated'));
  }
  app.services.lecturerTopicRepository = { key, read, write };
})();
