(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};
  const catalog = {
    types: {
      'do-an-mon-hoc': { label: 'Đồ án môn học', courses: { IE104: 'IE104 - Internet và Công nghệ Web' } },
      'do-an-tot-nghiep': { label: 'Đồ án tốt nghiệp', courses: { IE501: 'IE501 - Đồ án tốt nghiệp' } },
      'khoa-luan': { label: 'Khóa luận tốt nghiệp', courses: { IE505: 'IE505 - Khóa luận tốt nghiệp' } },
    },
    semesters: ['1', '2', 'he'],
    academicYears: ['2026-2027'],
    supervisors: {
      'placeholder-1': 'Nguyễn Văn An',
      'placeholder-2': 'Trần Thị Bình',
      'placeholder-3': 'Lê Văn Cường',
      'placeholder-4': 'Phạm Minh Anh',
      'placeholder-5': 'Nguyễn Minh Khang',
    },
  };
  const labels = { 'cho-duyet': 'Chờ duyệt', 'da-rut': 'Đã rút', 'da-duyet': 'Đã duyệt', 'tu-choi': 'Từ chối' };
  const clone = value => JSON.parse(JSON.stringify(value));
  const defaultStudent = () => app.data.currentStudent;
  const assignedLecturer = record => app.data.proposalLecturers.find(person => person.choiceId === record.supervisorId)?.id;
  const studentOwns = record => (record.student || app.data.legacyProposalStudent)?.code === defaultStudent()?.code;

  function notify() {
    globalThis.dispatchEvent?.(new Event('ie104:proposals-updated'));
  }

  function save(records) {
    app.storage.writeProposals(records);
    notify();
  }

  function validate(input) {
    return app.validation.validateProposal(input, catalog);
  }

  function create(input) {
    const checked = validate(input);
    if (checked.errors.length) throw new Error(checked.errors[0].message);
    const value = checked.value;
    if (!defaultStudent()?.code || !assignedLecturer(value)) throw new Error('Chưa có thông tin sinh viên hoặc giảng viên nhận đề xuất.');
    const records = app.storage.readProposals();
    rejectDuplicate(records, value);
    const record = {
      ...value,
      id: `DX-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
      typeLabel: catalog.types[value.type].label,
      courseLabel: catalog.types[value.type].courses[value.courseId],
      supervisorName: catalog.supervisors[value.supervisorId],
      lecturerId: assignedLecturer(value),
      student: clone(defaultStudent()),
      status: 'cho-duyet',
      revision: 0,
      createdAt: new Date().toISOString(),
    };
    save([...records, record]);
    return record;
  }

  function findById(id) {
    return app.storage.readProposals().find(record => record.id === id && studentOwns(record)) || null;
  }

  function rejectDuplicate(records, value, excludedId) {
    const normalize = text => text.normalize('NFC').toLocaleLowerCase('vi').replace(/\s+/g, ' ').trim();
    if (records.some(record => record.id !== excludedId && record.status === 'cho-duyet' && normalize(record.title) === normalize(value.title) && ['type', 'courseId', 'semester', 'academicYear', 'supervisorId'].every(key => record[key] === value[key]))) throw new Error('Đề xuất này đã được lưu. Bạn có thể xem lại trong Đề tài của tôi.');
  }

  function getEditable(records, id, revision) {
    const record = records.find(item => item.id === id);
    if (!record) throw new Error('Không tìm thấy đề xuất đã lưu trên trình duyệt này.');
    if (!studentOwns(record)) throw new Error('Sinh viên hiện tại không được chỉnh sửa đề xuất này.');
    if (record.status !== 'cho-duyet') throw new Error(record.status === 'da-rut' ? 'Đề xuất đã rút nên không thể chỉnh sửa hoặc rút lần nữa.' : 'Đề xuất đã được xử lý nên không thể chỉnh sửa hoặc rút.');
    if (!Number.isInteger(revision) || revision !== (record.revision || 0)) throw new Error('Đề xuất đã thay đổi ở tab khác. Hãy tải lại trang để xem bản mới trước khi thao tác tiếp.');
    return record;
  }

  function update(id, input, revision) {
    const records = app.storage.readProposals();
    const previous = getEditable(records, id, revision);
    const checked = validate(input);
    if (checked.errors.length) throw new Error(checked.errors[0].message);
    const value = checked.value;
    rejectDuplicate(records, value, id);
    const record = { ...previous, ...value, student: previous.student || clone(defaultStudent()), lecturerId: assignedLecturer(value), typeLabel: catalog.types[value.type].label, courseLabel: catalog.types[value.type].courses[value.courseId], supervisorName: catalog.supervisors[value.supervisorId], revision: (previous.revision || 0) + 1, updatedAt: new Date().toISOString() };
    save(records.map(item => item.id === id ? record : item));
    return record;
  }

  function withdraw(id, revision) {
    const records = app.storage.readProposals();
    const previous = getEditable(records, id, revision);
    const record = { ...previous, status: 'da-rut', revision: (previous.revision || 0) + 1, withdrawnAt: new Date().toISOString() };
    save(records.map(item => item.id === id ? record : item));
    return record;
  }

  function listMyTopics() {
    return app.storage.readProposals().filter(studentOwns).map(record => ({
      id: record.id, requestId: record.id, title: record.title,
      type: record.type === 'khoa-luan' ? 'khoa-luan' : 'do-an', typeLabel: record.typeLabel,
      courseId: record.courseId, semester: record.semester,
      academicYear: record.academicYear, lecturer: record.supervisorName,
      lecturerLabel: 'Giảng viên nhận đề xuất', groupName: 'Chưa xác nhận',
      status: record.status === 'da-duyet' ? 'dang-thuc-hien' : record.status, statusLabel: record.status === 'da-duyet' ? 'Đang thực hiện' : labels[record.status], requestStatusLabel: labels[record.status], feedback: record.decision?.reason || '', createdAt: record.createdAt,
      detailUrl: `chi-tiet-de-xuat-da-luu.html?proposal=${encodeURIComponent(record.id)}`,
    }));
  }

  function listForLecturer() {
    const actor = app.data.currentLecturer?.id;
    return app.storage.readProposals().filter(record => (record.lecturerId || assignedLecturer(record)) === actor).map(record => {
      const student = record.student || app.data.legacyProposalStudent;
      return {
        id: record.id, topicId: `DT-${record.id}`, title: record.title, source: 'student', revision: record.revision || 0,
        status: ({ 'cho-duyet': 'pending', 'da-duyet': 'approved', 'tu-choi': 'rejected', 'da-rut': 'withdrawn' })[record.status],
        topicStatus: record.status === 'da-duyet' ? 'in-progress' : record.status,
        topicType: record.type, topicTypeLabel: record.typeLabel, courseId: record.courseId,
        course: ({ IE104: 'internet-va-cong-nghe-web', IE501: 'do-an-tot-nghiep', IE505: 'khoa-luan' })[record.courseId] || record.courseId,
        courseLabel: record.courseLabel, semester: record.semester, academicYear: record.academicYear,
        supervisionRole: 'huong-dan-chinh', supervisionRoleLabel: 'Hướng dẫn chính',
        studentName: student.name, studentId: student.code, submittedAt: record.createdAt,
        description: record.description, objectives: record.objectives, outcomes: record.outcomes,
        attachment: record.attachment?.name || '', lecturerId: record.lecturerId || assignedLecturer(record),
        reason: record.decision?.reason || '', decidedAt: record.decision?.decidedAt || '',
      };
    });
  }

  async function decide(id, status, reason, revision) {
    const apply = () => {
      const records = app.storage.readProposals();
      const previous = records.find(record => record.id === id);
      if (!previous) throw new Error('Không tìm thấy đề xuất.');
      const lecturerId = app.data.currentLecturer?.id;
      if ((previous.lecturerId || assignedLecturer(previous)) !== lecturerId) throw new Error('Giảng viên hiện tại không được xử lý đề xuất này.');
      if (previous.status !== 'cho-duyet') throw new Error('Đề xuất đã rút hoặc đã được xử lý. Hãy tải lại kết quả mới nhất.');
      if (!Number.isInteger(revision) || revision !== (previous.revision || 0)) throw new Error('Sinh viên đã sửa đề xuất. Hãy tải lại để đọc nội dung mới trước khi xét duyệt.');
      if (!['approved', 'rejected'].includes(status)) throw new Error('Quyết định không hợp lệ.');
      const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
      if (status === 'rejected' && trimmedReason.length < 10) throw new Error('Vui lòng nhập lý do từ chối từ 10 ký tự.');
      const record = { ...previous, student: previous.student || clone(app.data.legacyProposalStudent), lecturerId, status: status === 'approved' ? 'da-duyet' : 'tu-choi', revision: revision + 1, decision: { lecturerId, reason: status === 'rejected' ? trimmedReason : '', decidedAt: new Date().toISOString(), proposalRevision: revision } };
      save(records.map(item => item.id === id ? record : item));
      return listForLecturer().find(item => item.id === id);
    };
    return globalThis.navigator?.locks?.request ? navigator.locks.request(app.storage.proposalKey, apply) : apply();
  }

  app.services.proposals = { catalog, labels, validate, create, findById, update, withdraw, listMyTopics, listForLecturer, decide };
})();
