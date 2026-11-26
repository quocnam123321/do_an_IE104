(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};
  const catalog = {
    types: {
      'do-an-mon-hoc': {
        label: 'Đồ án môn học',
        courses: {
          IE104: 'IE104 - Internet và Công nghệ Web',
          IT004: 'IT004 - Cơ sở dữ liệu',
          IE101: 'IE101 - Cơ sở hạ tầng công nghệ thông tin',
          IE108: 'IE108 - Phân tích thiết kế phần mềm',
          IE103: 'IE103 - Quản lý thông tin',
          IE105: 'IE105 - Nhập môn bảo đảm và an ninh thông tin',
        },
      },
      'do-an-tot-nghiep': { label: 'Đồ án tốt nghiệp', courses: { IE501: 'IE501 - Đồ án tốt nghiệp' } },
      'khoa-luan': { label: 'Khóa luận tốt nghiệp', courses: { IE505: 'IE505 - Khóa luận tốt nghiệp' } },
    },
    semesters: ['1', '2', 'he'],
    academicYears: ['2026-2027', '2025-2026'],
    supervisors: {},
  };
  const labels = { 'cho-duyet': 'Chờ duyệt', 'da-rut': 'Đã rút', 'da-duyet': 'Đã duyệt', 'tu-choi': 'Từ chối' };
  const sampleStatuses = { pending: 'cho-duyet', approved: 'da-duyet', rejected: 'tu-choi', withdrawn: 'da-rut' };
  const topicCodePrefixes = { 'do-an-mon-hoc': 'ISEDAMH', 'do-an-tot-nghiep': 'ISEDATN', 'khoa-luan': 'ISEKLTN' };
  const detailUrl = id => `chi-tiet-de-tai-cho-duyet-sinh-vien.html?proposal=${encodeURIComponent(id)}`;
  const clone = value => JSON.parse(JSON.stringify(value));
  const defaultStudent = () => app.data.currentStudent;
  const lecturerIdFor = supervisorId =>
    app.data.proposalLecturers?.find(person => person.choiceId === supervisorId)?.id || supervisorId;
  const assignedLecturer = record => record.lecturerId || lecturerIdFor(record.supervisorId);
  const studentOwns = record => (record.student || app.data.legacyProposalStudent)?.code === defaultStudent()?.code;

  async function listSupervisors() {
    const teachers = await globalThis.IE104SupervisionEntry.getTeachers();
    catalog.supervisors = Object.fromEntries(teachers.map(teacher => [teacher.id, teacher.name]));
    return teachers;
  }

  function catalogFor(record) {
    const id = record?.supervisorId;
    if (!id || !record.supervisorName || Object.hasOwn(catalog.supervisors, id)) return catalog;
    return { ...catalog, supervisors: { ...catalog.supervisors, [id]: record.supervisorName } };
  }

  function notify() {
    globalThis.dispatchEvent?.(new Event('ie104:proposals-updated'));
  }

  function save(records) {
    app.storage.writeProposals(records);
    notify();
  }

  function submittingStudent() {
    const profile = app.services.profile?.getState() || defaultStudent();
    return profile ? { code: profile.code, name: profile.name } : null;
  }

  function validateForStudent(input, student, options = catalog) {
    const outline = input.outline;
    if ([1, 2, 3].includes(outline?.version) && outline.members === undefined && student) {
      input = { ...input, outline: { ...outline, members: [{ ...student, role: 'nhom-truong' }] } };
    }
    return app.validation.validateProposal(input, options, student);
  }

  function validate(input, record) {
    return validateForStudent(input, record ? record.student || defaultStudent() : submittingStudent(), catalogFor(record));
  }

  function nextTopicCode(type, proposals = app.storage.readProposals()) {
    if (!Object.hasOwn(topicCodePrefixes, type)) return '';
    const prefix = topicCodePrefixes[type];
    const uit = globalThis.UITLecturerCatalog;
    const lecturerTopics = app.services.lecturerTopics;
    const topics = [
      ...(uit?.records || []),
      ...(uit?.pending || []),
      ...(uit?.rejected || []),
      ...(app.services.lecturerTopicRepository?.read() || []),
      ...(lecturerTopics?.allCreated() || []),
      ...(lecturerTopics?.list('supervised') || []),
      ...(app.services.studentTopicCodes?.allocatedSamples() || []),
    ];
    const used = proposals.map(record => record.topicCode || record.id);
    for (const topic of topics) {
      const code = topic.topicCode || topic.code || topic.id;
      used.push(topic.id, code, topic.displayId || uit?.formatCode(topic.topicType, code));
    }
    let highest = 0;
    for (const code of used) {
      const match = /^(ISEDAMH|ISEDATN|ISEKLTN|ISEKTLN)-(\d+)$/.exec(code);
      if (!match || match[1].replace('ISEKTLN', 'ISEKLTN') !== prefix) continue;
      highest = Math.max(highest, Number(match[2]));
    }
    if (highest >= 999) throw new Error('Đã hết mã ba chữ số cho loại đề tài này.');
    return `${prefix}-${String(highest + 1).padStart(3, '0')}`;
  }

  function create(input) {
    const student = submittingStudent();
    const checked = validateForStudent(input, student);
    if (checked.errors.length) throw new Error(checked.errors[0].message);
    const value = checked.value;
    if (!student?.code || !assignedLecturer(value)) throw new Error('Chưa có thông tin sinh viên hoặc giảng viên nhận đề xuất.');
    const records = app.storage.readProposals();
    rejectDuplicate(records, value);
    const record = {
      ...value,
      id: `DX-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
      topicCode: nextTopicCode(value.type, records),
      typeLabel: catalog.types[value.type].label,
      courseLabel: catalog.types[value.type].courses[value.courseId],
      supervisorName: catalog.supervisors[value.supervisorId],
      lecturerId: assignedLecturer(value),
      student,
      status: 'cho-duyet',
      revision: 0,
      createdAt: new Date().toISOString(),
    };
    save([...records, record]);
    return record;
  }

  function findById(id) {
    return findStudentSample(id) || app.storage.readProposals().find(record => record.id === id && studentOwns(record)) || null;
  }

  function sampleCourseId(record) {
    return record.courseId || globalThis.UITLecturerCatalog.subjectLabel(record, true).match(/^([A-Z]+\d{3}) - /)?.[1] || '';
  }

  function studentSample(record) {
    const attachment = record.attachmentFileKey ? {
      fileKey: record.attachmentFileKey, name: record.attachment, size: record.attachmentSize, type: record.attachmentType,
    } : null;
    return {
      ...record,
      type: record.topicType,
      typeLabel: record.topicTypeLabel,
      courseId: sampleCourseId(record),
      semester: record.semester === '3' ? 'he' : record.semester,
      academicYear: record.academicYear.replace('–', '-'),
      student: { code: record.studentId, name: record.studentName },
      status: sampleStatuses[record.status],
      attachment,
      attachmentName: record.attachment,
    };
  }

  function findStudentSample(id) {
    const record = globalThis.IE104Proposals?.getStudentSeed?.(id);
    return record ? studentSample(record) : null;
  }

  async function updateSample(id, input, revision) {
    const updated = await globalThis.IE104Proposals.changeStudentSeed(id, revision, seed => {
      const previous = studentSample(seed);
      const checked = validate({ ...input, outline: input.outline ?? previous.outline }, previous);
      if (checked.errors.length) throw new Error(checked.errors[0].message);
      const { title, type, courseId, semester, academicYear, supervisorId, description, objectives, outcomes, outline, attachment, coverImage } = checked.value;
      const supervisorName = catalogFor(previous).supervisors[supervisorId];
      const keepSampleFile = !attachment && input.keepAttachmentName && previous.attachmentSample;
      return {
        title, topicType: type, topicTypeLabel: catalog.types[type].label, course: courseId, courseId,
        courseLabel: catalog.types[type].courses[courseId], semester, academicYear,
        supervisorId, supervisorName, lecturerName: supervisorName, description, objectives, outcomes, outline,
        attachment: attachment?.name || (keepSampleFile ? previous.attachmentName : ''),
        attachmentSize: attachment?.size, attachmentType: attachment?.type, attachmentFileKey: attachment?.fileKey,
        attachmentSample: keepSampleFile || null, coverImage: coverImage === undefined ? previous.coverImage : coverImage,
      };
    });
    return studentSample(updated);
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
    if (findStudentSample(id)) return updateSample(id, input, revision);
    const records = app.storage.readProposals();
    const previous = getEditable(records, id, revision);
    const checked = validate(input.outline === undefined && previous.outline ? { ...input, outline: previous.outline } : input, previous);
    if (checked.errors.length) throw new Error(checked.errors[0].message);
    const value = checked.value;
    rejectDuplicate(records, value, id);
    const lecturerId = value.supervisorId === previous.supervisorId ? assignedLecturer(previous) : lecturerIdFor(value.supervisorId);
    const record = { ...previous, ...value, student: previous.student || clone(defaultStudent()), lecturerId, typeLabel: catalog.types[value.type].label, courseLabel: catalog.types[value.type].courses[value.courseId], supervisorName: catalogFor(previous).supervisors[value.supervisorId], revision: (previous.revision || 0) + 1, updatedAt: new Date().toISOString() };
    save(records.map(item => item.id === id ? record : item));
    return record;
  }

  function withdraw(id, revision) {
    if (findStudentSample(id)) return globalThis.IE104Proposals.changeStudentSeed(id, revision).then(studentSample);
    const records = app.storage.readProposals();
    const previous = getEditable(records, id, revision);
    const record = { ...previous, status: 'da-rut', revision: (previous.revision || 0) + 1, withdrawnAt: new Date().toISOString() };
    save(records.map(item => item.id === id ? record : item));
    return record;
  }

  function listMyTopics() {
    const approved = app.services.approvedProjects;
    const pending = app.storage.readProposals().filter(record => studentOwns(record) && !(record.status === 'da-duyet' && approved)).map(record => ({
      id: record.id, requestId: record.id, displayId: record.topicCode, title: record.title, coverImage: record.coverImage,
      type: record.type === 'khoa-luan' ? 'khoa-luan' : 'do-an', typeLabel: record.typeLabel,
      courseId: record.courseId, courseLabel: record.courseLabel, semester: record.semester,
      academicYear: record.academicYear, lecturer: record.supervisorName,
      lecturerLabel: 'Giảng viên nhận đề xuất', groupName: 'Chưa xác nhận',
      status: record.status === 'da-duyet' ? 'dang-thuc-hien' : record.status, statusLabel: record.status === 'da-duyet' ? 'Đang thực hiện' : labels[record.status], requestStatusLabel: labels[record.status], feedback: record.decision?.reason || '', createdAt: record.createdAt,
      detailUrl: detailUrl(record.id),
    }));
    const uit = globalThis.UITLecturerCatalog;
    const sharedSamples = [...(uit?.pending || []), ...(uit?.rejected || [])]
      .filter(seed => seed.studentVisible)
      .map(seed => globalThis.IE104Proposals?.get(seed.id)).filter(Boolean).map(record => ({
        id: record.id, requestId: record.id, displayId: record.topicCode, title: record.title, coverImage: record.coverImage,
        type: record.topicType, typeLabel: record.topicTypeLabel,
        courseId: sampleCourseId(record),
        courseLabel: record.courseLabel, semester: record.semester, academicYear: record.academicYear.replace('–', '-'),
        lecturer: record.supervisorName, lecturerId: record.lecturerId, lecturerLabel: 'Giảng viên nhận đề xuất',
        representativeName: record.studentName, representativeCode: record.studentId, outline: clone(record.outline),
        groupName: '', source: 'uit-demo',
        status: record.status === 'approved' ? 'dang-thuc-hien' : sampleStatuses[record.status],
        statusLabel: record.status === 'approved' ? 'Đang thực hiện' : labels[sampleStatuses[record.status]],
        requestStatusLabel: labels[sampleStatuses[record.status]],
        createdAt: record.submittedAt, feedback: record.reason || '',
        detailUrl: record.status === 'approved'
          ? `chi-tiet-de-tai-sinh-vien.html?project=${encodeURIComponent(record.topicId)}`
          : `chi-tiet-de-tai-cho-duyet-sinh-vien.html?ma=${encodeURIComponent(record.id)}`,
      }));
    return [...sharedSamples, ...pending, ...(approved?.list('student') || []).filter(project => project.source === 'approved-proposal').map(project => ({ ...project, requestStatusLabel: 'Đã duyệt', feedback: '' }))];
  }

  function canReview(lecturerId) {
    const actor = app.data.currentLecturer?.id;
    return Boolean(actor && lecturerId && (actor === lecturerId ||
      (actor === app.data.proposalDemoReviewerId && /^giang-vien-\d+$/.test(lecturerId))));
  }

  function listForLecturer() {
    return app.storage.readProposals().filter(record => canReview(assignedLecturer(record))).map(record => {
      const student = record.student || app.data.legacyProposalStudent;
      return {
        id: record.id, topicId: `DT-${record.id}`, topicCode: record.topicCode, title: record.title, source: 'student', revision: record.revision || 0,
        status: ({ 'cho-duyet': 'pending', 'da-duyet': 'approved', 'tu-choi': 'rejected', 'da-rut': 'withdrawn' })[record.status],
        topicStatus: record.status === 'da-duyet' ? 'in-progress' : record.status,
        topicType: record.type, topicTypeLabel: record.typeLabel, courseId: record.courseId,
        course: ({ IE104: 'internet-va-cong-nghe-web', IT004: 'co-so-du-lieu', IE501: 'do-an-tot-nghiep', IE505: 'khoa-luan' })[record.courseId] || record.courseId,
        courseLabel: record.courseLabel, semester: record.semester, academicYear: record.academicYear,
        supervisionRole: 'huong-dan-chinh', supervisionRoleLabel: 'Hướng dẫn chính',
        studentName: student.name, studentId: student.code, submittedAt: record.createdAt,
        description: record.description, objectives: record.objectives, outcomes: record.outcomes, outline: record.outline ? clone(record.outline) : null,
        attachment: record.attachment?.name || '', attachmentSize: record.attachment?.size, attachmentFileKey: record.attachment?.fileKey,
        coverImage: record.coverImage,
        lecturerId: assignedLecturer(record), supervisorName: record.supervisorName,
        reason: record.decision?.reason || '', decidedAt: record.decision?.decidedAt || '',
      };
    });
  }

  function withWriteLock(operation, { reservesTopicCode = false } = {}) {
    const locks = globalThis.navigator?.locks;
    if (!locks?.request) return operation();
    const lecturerKey = app.services.lecturerTopicRepository?.key;
    return locks.request(app.storage.proposalKey, () => reservesTopicCode && lecturerKey
      ? locks.request(lecturerKey, operation) : operation());
  }

  async function decide(id, status, reason, revision) {
    const apply = () => {
      const records = app.storage.readProposals();
      const previous = records.find(record => record.id === id);
      if (!previous) throw new Error('Không tìm thấy đề xuất.');
      const lecturerId = assignedLecturer(previous);
      if (!canReview(lecturerId)) throw new Error('Giảng viên hiện tại không được xử lý đề xuất này.');
      if (previous.status !== 'cho-duyet') throw new Error('Đề xuất đã rút hoặc đã được xử lý. Hãy tải lại kết quả mới nhất.');
      if (!Number.isInteger(revision) || revision !== (previous.revision || 0)) throw new Error('Sinh viên đã sửa đề xuất. Hãy tải lại để đọc nội dung mới trước khi xét duyệt.');
      if (!['approved', 'rejected'].includes(status)) throw new Error('Quyết định không hợp lệ.');
      const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
      if (status === 'rejected' && trimmedReason.length < 10) throw new Error('Vui lòng nhập lý do từ chối từ 10 ký tự.');
      const record = { ...previous, student: previous.student || clone(app.data.legacyProposalStudent), lecturerId, status: status === 'approved' ? 'da-duyet' : 'tu-choi', revision: revision + 1, decision: { lecturerId, reason: status === 'rejected' ? trimmedReason : '', decidedAt: new Date().toISOString(), proposalRevision: revision } };
      save(records.map(item => item.id === id ? record : item));
      return listForLecturer().find(item => item.id === id);
    };
    return withWriteLock(apply);
  }

  app.services.proposals = { catalog, catalogFor, listSupervisors, lecturerIdFor, labels, detailUrl, validate, nextTopicCode, create, findById, findStudentSample, update, withdraw, listMyTopics, listForLecturer, canReview, withWriteLock, decide };
})();
