(() => {
  'use strict';

  // Dữ liệu demo dùng chung giữa hai vai trò, không thay thế kiểm tra phía máy chủ.
  const prefix = 'ie104.proposal-decision.v1.';
  const courseProject = { topicType: 'do-an-mon-hoc', topicTypeLabel: 'Đồ án môn học' };
  const primary = { supervisionRole: 'huong-dan-chinh', supervisionRoleLabel: 'Hướng dẫn chính' };
  const legacySeeds = [
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
      ...courseProject, ...primary, id: 'DX-GV002', topicId: 'DT-GV002',
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
      ...courseProject, ...primary, id: 'DX-GV005', topicId: 'DT-GV005',
      title: 'Hệ thống hỗ trợ đăng ký học phần', studentName: 'Hoàng Văn E', studentId: '22520005',
      course: 'co-so-du-lieu', courseLabel: 'Cơ sở dữ liệu',
    },
    {
      ...courseProject, ...primary, id: 'DX001', topicId: 'DT-DX001',
      title: 'Cổng thông tin nghiên cứu sinh viên', studentName: 'Nguyễn Minh Anh', studentId: '24520001',
      course: 'internet-va-cong-nghe-web', courseLabel: 'IE104 - Internet và Công nghệ Web',
      semester: '6', academicYear: '2026–2027', submittedAt: '2026-10-11T16:00:00+07:00',
      supervisor: 'Nguyễn Văn A',
      description: 'Xây dựng cổng thông tin giúp sinh viên tra cứu công trình nghiên cứu, tìm đề tài quan tâm và tìm nhóm cùng thực hiện nghiên cứu.',
      objectives: 'Tập trung thông tin công trình nghiên cứu và hỗ trợ sinh viên tìm nhóm theo lĩnh vực quan tâm.',
      outcomes: 'Cổng thông tin có chức năng tra cứu nghiên cứu, tìm nhóm theo lĩnh vực, kèm mã nguồn, dữ liệu mẫu và báo cáo.',
      scope: 'Trình bày danh sách công trình, tìm kiếm theo tên hoặc lĩnh vực, xem chi tiết công trình và thông tin nhóm nghiên cứu.',
      attachment: 'de-cuong-de-tai-mau.txt',
    },
  ].map((record) => ({ submittedAt: '', semester: '', academicYear: '', ...record }));
  const uitSeeds = window.UITLecturerCatalog?.pending;
  const rejectedSeeds = window.UITLecturerCatalog?.rejected || [];
  const realSeeds = window.IE104?.data?.lecturerRealProposalSeeds;
  const activeSeedIds = uitSeeds ? new Set(uitSeeds.map(record => record.id)) : null;
  const seeds = uitSeeds ? [...uitSeeds, ...rejectedSeeds, ...(window.UITLecturerCatalog.archivedPending || []), ...legacySeeds] : realSeeds || legacySeeds;
  const canViewSeed = () => !window.IE104?.data?.currentLecturer || window.IE104.data.currentLecturer.id === 'GV001';
  const listeners = new Set();
  const submissionDateFormat = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
  let readError = '';

  function readDecision(id) {
    const raw = window.localStorage.getItem(prefix + id) ??
      window.localStorage.getItem('ie104.restored-uit.proposal-decision.v1.' + id);
    if (raw === null) {
      const sample = rejectedSeeds.find(record => record.id === id);
      return sample ? { ...sample.decision } : null;
    }
    const decision = JSON.parse(raw);
    if (!decision || !['approved', 'rejected'].includes(decision.status) ||
        typeof decision.reason !== 'string' || !Number.isFinite(Date.parse(decision.decidedAt)) ||
        (decision.status === 'rejected' && decision.reason.trim().length < 10)) {
      throw new Error('Dữ liệu quyết định đã lưu không hợp lệ.');
    }
    return { status: decision.status, reason: decision.reason, decidedAt: decision.decidedAt };
  }

  function seedRecord(seed) {
    let decision;
    try { decision = readDecision(seed.id); }
    catch { readError = 'Không đọc được dữ liệu đã lưu. Kiểm tra quyền lưu trữ của trình duyệt trước khi xử lý đề xuất.'; }
    const { decision: initialDecision, ...fields } = seed;
    const record = { ...fields, status: 'pending', reason: '', decidedAt: '', ...(decision || initialDecision) };
    record.topicStatus = record.status === 'approved' ? 'in-progress' : record.status;
    return record;
  }

  function getApprovedSeed(topicId) {
    if (!canViewSeed()) return null;
    const seed = seeds.find((record) => record.topicId === topicId) ||
      legacySeeds.find((record) => record.topicId === topicId);
    const record = seed && seedRecord(seed);
    return record?.status === 'approved' ? record : null;
  }

  function getAll() {
    readError = '';
    const initial = canViewSeed() ? seeds.map(seedRecord)
      .filter(record => !activeSeedIds || activeSeedIds.has(record.id) || record.status !== 'pending') : [];
    // Giữ các quyết định đã duyệt từ bộ dữ liệu cũ khi dùng danh mục UIT.
    if (realSeeds && !uitSeeds && canViewSeed()) {
      initial.push(...legacySeeds.map(seedRecord).filter((record) => record.status === 'approved'));
    }
    let saved = [];
    try { saved = window.IE104?.services?.proposals?.listForLecturer() || []; }
    catch (error) { readError = error.message; }
    let registrations = [];
    try { registrations = window.IE104?.services?.registrations?.listForLecturer() || []; }
    catch (error) { readError = error.message; }
    return [...initial, ...saved, ...registrations];
  }

  function filterPending(records) {
    const catalog = window.UITLecturerCatalog;
    return records.filter(record => record.status === 'pending' &&
      record.topicTypeLabel !== 'Luận văn thạc sĩ' && (catalog?.isAvailableTopic(record) ?? true));
  }

  function compareSubmissionDates(a, b, order) {
    const first = Date.parse(a.submittedAt);
    const second = Date.parse(b.submittedAt);
    if (Number.isNaN(first) || Number.isNaN(second)) return Number.isNaN(first) - Number.isNaN(second);
    return order === 'oldest' ? first - second : second - first;
  }

  function formatSubmissionDate(value) {
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) return '';
    const { day, month, year, hour, minute } = Object.fromEntries(
      submissionDateFormat.formatToParts(timestamp).map(({ type, value }) => [type, value]),
    );
    return `${day}/${month}/${year} · ${hour}:${minute}`;
  }

  function get(id) {
    const record = getAll().find(item => item.id === id);
    if (!record || record.source || !legacySeeds.some(seed => seed.id === id)) return record;
    // Hồ sơ mẫu cũ có thể đã được sinh viên cập nhật tệp từ biểu mẫu đề xuất.
    try {
      const saved = window.IE104?.storage?.readRequests?.().find(item => item.id === id && item.kind === 'de-xuat');
      if (saved) return {
        ...record,
        attachment: saved.attachment?.name || saved.attachmentName || '',
        attachmentSize: saved.attachment?.size,
        attachmentFileKey: saved.attachment?.fileKey,
        coverImage: saved.coverImage,
      };
    } catch { /* Giữ thông tin tệp của hồ sơ mẫu khi không đọc được dữ liệu cũ. */ }
    return record;
  }

  function notify() {
    for (const listener of listeners) listener();
  }

  async function decide(id, status, reason = '', revision) {
    if (!seeds.some(record => record.id === id)) {
      const service = window.IE104?.services?.registrations?.listForLecturer().some(record => record.id === id) ? window.IE104.services.registrations : window.IE104?.services?.proposals;
      if (!service) throw new Error('Không tìm thấy đề xuất.');
      return service.decide(id, status, reason, revision);
    }
    const save = () => {
      if (window.IE104?.data?.currentLecturer && window.IE104.data.currentLecturer.id !== 'GV001') throw new Error('Giảng viên hiện tại không được xử lý đề xuất này.');
      const seed = seeds.find(record => record.id === id);
      if (!seed) throw new Error('Không tìm thấy đề xuất.');
      if (!['approved', 'rejected'].includes(status)) throw new Error('Quyết định không hợp lệ.');
      const trimmedReason = reason.trim();
      if (status === 'rejected' && trimmedReason.length < 10) {
        throw new Error('Vui lòng nhập lý do từ chối từ 10 ký tự, không tính khoảng trắng ở hai đầu.');
      }
      if (seed.decision || readDecision(id)) throw new Error('Đề xuất này đã được xử lý. Vui lòng xem kết quả mới nhất.');
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
    if (event.key === null || event.key.startsWith(prefix) || event.key === window.IE104?.storage?.proposalKey || event.key === window.IE104?.storage?.registrationKey || event.key === window.IE104?.storage?.requestKey) notify();
  });
  window.addEventListener('pageshow', notify);
  window.addEventListener('ie104:proposals-updated', notify);
  window.addEventListener('ie104:registrations-updated', notify);
  window.IE104Proposals = Object.freeze({
    getAll,
    filterPending,
    compareSubmissionDates,
    formatSubmissionDate,
    get,
    getSeed: (id) => {
      const seed = seeds.find(record => record.id === id) || legacySeeds.find(record => record.id === id);
      return canViewSeed() && seed ? seedRecord(seed) : null;
    },
    getSeedDecision: readDecision,
    getApprovedSeed,
    getError: () => readError,
    decide,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
  });
})();
