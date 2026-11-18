(() => {
  'use strict';

  // Dữ liệu demo dùng chung giữa hai vai trò, không thay thế kiểm tra phía máy chủ.
  const prefix = 'ie104.proposal-decision.v1.';
  const courseProject = { topicType: 'do-an-mon-hoc', topicTypeLabel: 'Đồ án môn học' };
  const primary = { supervisionRole: 'huong-dan-chinh', supervisionRoleLabel: 'Hướng dẫn chính' };
  const secondary = { supervisionRole: 'dong-huong-dan', supervisionRoleLabel: 'Đồng hướng dẫn' };
  const seeds = [
    {
      ...courseProject, ...primary, id: 'DX-GV001', topicId: 'DT-GV001',
      title: 'Website quản lý thư viện', studentName: 'Nguyễn Văn A', studentId: '22520001',
      course: 'internet-va-cong-nghe-web', courseLabel: 'Internet và công nghệ Web',
      semester: '1', academicYear: '2026–2027', submittedAt: '2026-10-26T09:00:00+07:00',
      description: 'Xây dựng website hỗ trợ quản lý sách, độc giả và hoạt động mượn trả tại thư viện. Hệ thống giúp tra cứu tài liệu và theo dõi tình trạng sách.',
      objectives: 'Quản lý danh mục sách, hỗ trợ tra cứu tài liệu và theo dõi việc mượn trả sách.',
      outcomes: 'Website có chức năng quản lý sách, quản lý độc giả, mượn trả và thống kê cơ bản.',
      attachment: 'De_cuong_de_tai.pdf',
    },
    {
      ...courseProject, ...secondary, id: 'DX-GV002', topicId: 'DT-GV002',
      title: 'Ứng dụng quản lý chi tiêu', studentName: 'Trần Thị B', studentId: '22520002',
      course: 'co-so-du-lieu', courseLabel: 'Cơ sở dữ liệu',
    },
    {
      ...primary, id: 'DX-GV003', topicId: 'DT-GV003', topicType: 'khoa-luan', topicTypeLabel: 'Khóa luận',
      title: 'Hệ thống gợi ý phim', studentName: 'Lê Văn C', studentId: '22520003',
      course: 'cong-nghe-phan-mem', courseLabel: 'Công nghệ phần mềm',
    },
    {
      ...courseProject, ...primary, id: 'DX-GV004', topicId: 'DT-GV004',
      title: 'Website quản lý câu lạc bộ', studentName: 'Phạm Thị D', studentId: '22520004',
      course: 'internet-va-cong-nghe-web', courseLabel: 'Internet và công nghệ Web',
    },
    {
      ...courseProject, ...secondary, id: 'DX-GV005', topicId: 'DT-GV005',
      title: 'Hệ thống hỗ trợ đăng ký học phần', studentName: 'Hoàng Văn E', studentId: '22520005',
      course: 'co-so-du-lieu', courseLabel: 'Cơ sở dữ liệu',
    },
    {
      ...courseProject, ...primary, id: 'DX001', topicId: 'DT-DX001',
      title: 'Cổng thông tin nghiên cứu sinh viên', studentName: 'Nguyễn Minh Anh', studentId: '24520001',
      course: 'internet-va-cong-nghe-web', courseLabel: 'Internet và công nghệ Web',
      semester: '6', academicYear: '2026–2027', submittedAt: '2026-10-11T16:00:00+07:00',
      supervisor: 'Nguyễn Văn A',
      description: 'Xây dựng cổng thông tin giúp sinh viên tra cứu công trình nghiên cứu, tìm đề tài quan tâm và tìm nhóm cùng thực hiện nghiên cứu.',
      objectives: 'Tập trung thông tin công trình nghiên cứu và hỗ trợ sinh viên tìm nhóm theo lĩnh vực quan tâm.',
      outcomes: 'Cổng thông tin có chức năng tra cứu nghiên cứu, tìm nhóm theo lĩnh vực, kèm mã nguồn, dữ liệu mẫu và báo cáo.',
      attachment: 'De_cuong_de_tai.pdf',
    },
  ].map((record) => ({ submittedAt: '', semester: '', academicYear: '', ...record }));
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
    const initial = seeds.filter(() => !window.IE104?.data?.currentLecturer || window.IE104.data.currentLecturer.id === 'GV001').map((seed) => {
      let decision;
      try { decision = readDecision(seed.id); }
      catch { readError = 'Không đọc được dữ liệu đã lưu. Kiểm tra quyền lưu trữ của trình duyệt trước khi xử lý đề xuất.'; }
      const record = { ...seed, status: 'pending', reason: '', decidedAt: '', ...decision };
      record.topicStatus = record.status === 'approved' ? 'in-progress' : record.status;
      return record;
    });
    let saved = [];
    try { saved = window.IE104?.services?.proposals?.listForLecturer() || []; }
    catch (error) { readError = error.message; }
    return [...initial, ...saved];
  }

  function notify() {
    for (const listener of listeners) listener();
  }

  async function decide(id, status, reason = '', revision) {
    if (!seeds.some(record => record.id === id)) {
      const service = window.IE104?.services?.proposals;
      if (!service) throw new Error('Không tìm thấy đề xuất.');
      return service.decide(id, status, reason, revision);
    }
    const save = () => {
      if (window.IE104?.data?.currentLecturer && window.IE104.data.currentLecturer.id !== 'GV001') throw new Error('Giảng viên hiện tại không được xử lý đề xuất này.');
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
    if (event.key === null || event.key.startsWith(prefix) || event.key === window.IE104?.storage?.proposalKey) notify();
  });
  window.addEventListener('pageshow', notify);
  window.addEventListener('ie104:proposals-updated', notify);
  window.IE104Proposals = Object.freeze({
    getAll,
    get: (id) => getAll().find((record) => record.id === id),
    getError: () => readError,
    decide,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
  });
})();
