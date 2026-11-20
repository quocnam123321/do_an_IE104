(() => {
  'use strict';

  // Dữ liệu demo dùng chung giữa hai vai trò, không thay thế kiểm tra phía máy chủ.
  const prefix = 'ie104.restored-uit.proposal-decision.v1.';
  const courseProject = { topicType: 'do-an-mon-hoc', topicTypeLabel: 'Đồ án môn học' };
  const primary = { supervisionRole: 'huong-dan-chinh', supervisionRoleLabel: 'Hướng dẫn chính' };
  const secondary = { supervisionRole: 'dong-huong-dan', supervisionRoleLabel: 'Đồng hướng dẫn' };
  const seeds = window.UITLecturerCatalog.pending;
  const listeners = new Set();
  let readError = '';

  function readDecision(id) {
    const raw = window.localStorage.getItem(prefix + id);
    if (raw === null) return null;
    const decision = JSON.parse(raw);
    if (!decision || !['approved', 'rejected'].includes(decision.status) ||
        typeof decision.reason !== 'string' || !Number.isFinite(Date.parse(decision.decidedAt)) ||
        (decision.status === 'rejected' && decision.reason.trim().length < 10)) {
      throw new Error('Dữ liệu quyết định đã lưu không hợp lệ.');
    }
    return { status: decision.status, reason: decision.reason, decidedAt: decision.decidedAt };
  }

  function getAll() {
    readError = '';
    return seeds.map((seed) => {
      let decision;
      try { decision = readDecision(seed.id); }
      catch { readError = 'Không đọc được dữ liệu đã lưu. Kiểm tra quyền lưu trữ của trình duyệt trước khi xử lý đề xuất.'; }
      const record = { ...seed, status: 'pending', reason: '', decidedAt: '', ...decision };
      record.topicStatus = record.status === 'approved' ? 'in-progress' : record.status;
      return record;
    });
  }

  function notify() {
    for (const listener of listeners) listener();
  }

  async function decide(id, status, reason = '') {
    const save = () => {
      if (!seeds.some((record) => record.id === id)) throw new Error('Không tìm thấy đề xuất.');
      if (!['approved', 'rejected'].includes(status)) throw new Error('Quyết định không hợp lệ.');
      const trimmedReason = reason.trim();
      if (status === 'rejected' && trimmedReason.length < 10) {
        throw new Error('Vui lòng nhập lý do từ chối từ 10 ký tự, không tính khoảng trắng ở hai đầu.');
      }
      if (readDecision(id)) throw new Error('Đề xuất này đã được xử lý. Vui lòng xem kết quả mới nhất.');
      const decision = { status, reason: status === 'rejected' ? trimmedReason : '', decidedAt: new Date().toISOString() };
      window.localStorage.setItem(prefix + id, JSON.stringify(decision));
      notify();
      return getAll().find((record) => record.id === id);
    };
    // Khóa theo hồ sơ khi trình duyệt hỗ trợ, tránh hai tab xác nhận cùng lúc.
    if (navigator.locks?.request) return navigator.locks.request(prefix + id, save);
    return save();
  }

  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key.startsWith(prefix)) notify();
  });
  window.addEventListener('pageshow', notify);
  window.IE104Proposals = Object.freeze({
    getAll,
    get: (id) => getAll().find((record) => record.id === id),
    getError: () => readError,
    decide,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
  });
})();
