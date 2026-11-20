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

  function validate(input) {
    return app.validation.validateProposal(input, catalog);
  }

  function create(input) {
    const checked = validate(input);
    if (checked.errors.length) throw new Error(checked.errors[0].message);
    const value = checked.value;
    const records = app.storage.readProposals();
    rejectDuplicate(records, value);
    const record = {
      ...value,
      id: `DX-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
      typeLabel: catalog.types[value.type].label,
      courseLabel: catalog.types[value.type].courses[value.courseId],
      supervisorName: catalog.supervisors[value.supervisorId],
      status: 'cho-duyet',
      revision: 0,
      createdAt: new Date().toISOString(),
    };
    app.storage.writeProposals([...records, record]);
    return record;
  }

  function findById(id) {
    return app.storage.readProposals().find(record => record.id === id) || null;
  }

  function rejectDuplicate(records, value, excludedId) {
    const normalize = text => text.normalize('NFC').toLocaleLowerCase('vi').replace(/\s+/g, ' ').trim();
    if (records.some(record => record.id !== excludedId && record.status === 'cho-duyet' && normalize(record.title) === normalize(value.title) && ['type', 'courseId', 'semester', 'academicYear', 'supervisorId'].every(key => record[key] === value[key]))) throw new Error('Đề xuất này đã được lưu. Bạn có thể xem lại trong Đề tài của tôi.');
  }

  function getEditable(records, id, revision) {
    const record = records.find(item => item.id === id);
    if (!record) throw new Error('Không tìm thấy đề xuất đã lưu trên trình duyệt này.');
    if (record.status !== 'cho-duyet') throw new Error('Đề xuất đã rút nên không thể chỉnh sửa hoặc rút lần nữa.');
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
    const record = { ...previous, ...value, typeLabel: catalog.types[value.type].label, courseLabel: catalog.types[value.type].courses[value.courseId], supervisorName: catalog.supervisors[value.supervisorId], revision: (previous.revision || 0) + 1, updatedAt: new Date().toISOString() };
    app.storage.writeProposals(records.map(item => item.id === id ? record : item));
    return record;
  }

  function withdraw(id, revision) {
    const records = app.storage.readProposals();
    const previous = getEditable(records, id, revision);
    const record = { ...previous, status: 'da-rut', revision: (previous.revision || 0) + 1, withdrawnAt: new Date().toISOString() };
    app.storage.writeProposals(records.map(item => item.id === id ? record : item));
    return record;
  }

  function listMyTopics() {
    return app.storage.readProposals().map(record => ({
      id: record.id, requestId: record.id, title: record.title,
      type: record.type === 'khoa-luan' ? 'khoa-luan' : 'do-an', typeLabel: record.typeLabel,
      courseId: record.courseId, semester: record.semester,
      academicYear: record.academicYear, lecturer: record.supervisorName,
      lecturerLabel: 'Giảng viên nhận đề xuất', groupName: 'Chưa xác nhận',
      status: record.status, statusLabel: record.status === 'da-rut' ? 'Đã rút' : 'Chờ duyệt', createdAt: record.createdAt,
      detailUrl: `chi-tiet-de-xuat-da-luu.html?proposal=${encodeURIComponent(record.id)}`,
    }));
  }

  app.services.proposals = { catalog, validate, create, findById, update, withdraw, listMyTopics };
})();
