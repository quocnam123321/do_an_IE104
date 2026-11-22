(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};
  const labels = { 'cho-duyet': 'Chờ duyệt', 'da-duyet': 'Đã duyệt', 'yeu-cau-chinh-sua': 'Yêu cầu chỉnh sửa', 'da-rut': 'Đã rút', 'tu-choi': 'Từ chối' };
  const clone = value => JSON.parse(JSON.stringify(value));
  const detailUrl = id => `chi-tiet-de-tai-cho-duyet-sinh-vien.html?proposal=${encodeURIComponent(id)}`;

  function withSeedDecision(record) {
    if (record.kind !== 'de-xuat' || record.status !== 'cho-duyet') return record;
    const decision = globalThis.IE104Proposals?.getSeedDecision?.(record.id);
    if (!decision) return record;
    return { ...record, status: decision.status === 'approved' ? 'da-duyet' : 'tu-choi', feedback: decision.reason, decision };
  }

  function recordsFrom(saved) {
    if (saved.some(record => !app.data.initialRequests.some(initial => initial.id === record.id && initial.kind === record.kind))) throw new Error('Dữ liệu yêu cầu đã lưu không khớp danh mục hiện tại.');
    return app.data.initialRequests.map(initial => withSeedDecision(clone({ ...initial, ...(saved.find(record => record.id === initial.id) || {}), allowedModes: initial.allowedModes })));
  }

  function list(includeDeleted = false) {
    return recordsFrom(app.storage.readRequests()).filter(record => includeDeleted || !record.deletedAt);
  }

  function findById(id) {
    return list(true).find(record => record.id === id) || null;
  }

  function permissions(record) {
    if (!record || record.deletedAt) return { edit: false, withdraw: false, resubmit: false, remove: false };
    return { edit: ['cho-duyet', 'yeu-cau-chinh-sua'].includes(record.status), withdraw: record.status === 'cho-duyet', resubmit: record.status === 'yeu-cau-chinh-sua', remove: ['yeu-cau-chinh-sua', 'da-rut', 'tu-choi'].includes(record.status) };
  }

  function isStudentProposal(record) {
    const ownerCode = app.data.legacyProposalStudent?.code;
    return record?.kind === 'de-xuat' && Boolean(ownerCode && ownerCode === app.data.currentStudent?.code);
  }

  function findStudentProposal(id) {
    const record = findById(id);
    return isStudentProposal(record) ? record : null;
  }

  function proposalForEdit(record) {
    const semester = String(record.semester ?? '').trim();
    return {
      ...record,
      type: record.type === 'do-an' ? 'do-an-mon-hoc' : record.type,
      semester: ['3', 'summer'].includes(semester) ? 'he' : semester,
      academicYear: String(record.academicYear ?? '').replace(/\s*[-–]\s*/g, '-'),
      supervisorId: record.supervisorId || record.lecturerId,
      supervisorName: record.lecturerName,
      outline: record.outline || { scope: record.scope, members: record.members },
    };
  }

  function proposalCatalog(record) {
    return app.services.proposals.catalogFor({
      supervisorId: record.supervisorId || record.lecturerId,
      supervisorName: record.lecturerName,
    });
  }

  function validateProposal(input, record) {
    const checked = app.validation.validateProposal(input, proposalCatalog(record));
    const value = checked.value;
    if (value.title.length > 200) checked.errors.push({ field: 'title', message: 'Nhập tên đề tài từ 1 đến 200 ký tự.' });
    const memberCount = value.outline?.members.length;
    const mode = memberCount === 1 ? 'ca-nhan' : 'nhom';
    if (memberCount && !record.allowedModes.includes(mode)) checked.errors.push({ field: 'outline.members', message: 'Đề xuất này cần ít nhất hai sinh viên thực hiện.' });
    return checked;
  }

  function proposalChanges(input, record) {
    const checked = validateProposal(input, record);
    if (checked.errors.length) return checked;
    const { value } = checked;
    const catalog = proposalCatalog(record);
    const sameSupervisor = value.supervisorId === (record.supervisorId || record.lecturerId);
    return {
      errors: [],
      value: {
        ...value,
        supervisorId: value.supervisorId,
        lecturerId: sameSupervisor ? record.lecturerId : app.services.proposals.lecturerIdFor(value.supervisorId),
        lecturerName: catalog.supervisors[value.supervisorId],
        typeLabel: catalog.types[value.type].label,
        courseLabel: catalog.types[value.type].courses[value.courseId],
        ...(value.outline ? { members: value.outline.members, scope: value.outline.methodAndScope ?? value.outline.scope, mode: value.outline.members.length === 1 ? 'ca-nhan' : 'nhom' } : {}),
        attachmentName: value.attachment?.name || (input.keepAttachmentName ? record.attachmentName : ''),
      },
    };
  }

  function validate(input, record) {
    input = input || {};
    const mode = input.mode || record.mode;
    const checked = app.validation.validateRegistration({ groupName: mode === 'ca-nhan' ? 'Cá nhân' : input.groupName, message: input.message, members: input.members }, mode === 'ca-nhan' ? { minMembers: 1, maxMembers: 1 } : { minMembers: 2, maxMembers: 3 });
    const errors = [...checked.errors];
    if (!record.allowedModes.includes(mode)) errors.push({ field: 'mode', message: 'Hình thức không phù hợp với yêu cầu này.' });
    const value = { ...checked.value, mode, groupName: mode === 'ca-nhan' ? '' : checked.value.groupName };
    if (record.kind === 'de-xuat') {
      ['title', 'description', 'objectives', 'scope', 'outcomes', 'lecturerId', 'type'].forEach(key => { value[key] = String(input[key] ?? record[key] ?? '').trim(); });
      if (!value.title || value.title.length > 200) errors.push({ field: 'title', message: 'Nhập tên đề tài từ 1 đến 200 ký tự.' });
      if (!value.description) errors.push({ field: 'description', message: 'Nhập mô tả đề tài.' });
      if (!['do-an', 'khoa-luan'].includes(value.type)) errors.push({ field: 'type', message: 'Chọn loại đề tài hợp lệ.' });
      if (!app.data.requestLecturers.some(lecturer => lecturer.id === value.lecturerId)) errors.push({ field: 'lecturerId', message: 'Chọn giảng viên trong danh mục của yêu cầu.' });
    }
    return { errors, value };
  }

  function mutate(id, revision, action, input, useProposalEditor = false) {
    const saved = app.storage.readRequests();
    const record = recordsFrom(saved).find(item => item.id === id);
    if (!record || record.deletedAt) throw new Error('Không tìm thấy yêu cầu hoặc yêu cầu đã được xóa khỏi danh sách.');
    if (useProposalEditor && !isStudentProposal(record)) throw new Error('Không tìm thấy đề xuất của sinh viên hiện tại.');
    const permission = permissions(record);
    if (!Object.hasOwn(permission, action) || !permission[action]) throw new Error('Trạng thái hiện tại không cho phép thao tác này.');
    if (!Number.isInteger(revision) || record.revision !== revision) throw new Error('Yêu cầu đã thay đổi ở tab khác. Hãy mở lại biểu mẫu để đọc bản mới.');
    const from = record.status;
    if (action === 'edit' || action === 'resubmit') {
      const checked = useProposalEditor ? proposalChanges(input, record) : validate(input, record);
      if (checked.errors.length) throw new Error(checked.errors[0].message);
      Object.assign(record, checked.value);
      if (record.kind === 'de-xuat' && !useProposalEditor) {
        record.lecturerName = app.data.requestLecturers.find(lecturer => lecturer.id === record.lecturerId).name;
        record.typeLabel = record.type === 'khoa-luan' ? 'Khóa luận tốt nghiệp' : 'Đồ án môn học';
        record.courseId = record.type === 'khoa-luan' ? 'IE505' : 'IE104';
        record.courseLabel = record.type === 'khoa-luan' ? 'IE505 - Khóa luận tốt nghiệp' : 'IE104 - Internet và Công nghệ Web';
      }
    }
    const at = new Date().toISOString();
    if (action === 'withdraw') { record.status = 'da-rut'; record.withdrawnAt = at; }
    if (action === 'resubmit') { record.status = 'cho-duyet'; record.resubmittedAt = at; }
    if (action === 'remove') record.deletedAt = at;
    record.revision += 1;
    record.updatedAt = at;
    record.history.push({ action, from, to: record.status, at });
    app.storage.writeRequests([...saved.filter(item => item.id !== id), record]);
    return clone(record);
  }

  function mutateProposal(id, revision, action, input) {
    const apply = () => mutate(id, revision, action, input, true);
    const locks = globalThis.navigator?.locks;
    const lock = `ie104.proposal-decision.v1.${id}`;
    return locks?.request ? locks.request(lock, () => locks.request(app.storage.requestKey, apply)) : apply();
  }

  function updateProposal(id, input, revision, resubmit = false) {
    return mutateProposal(id, revision, resubmit ? 'resubmit' : 'edit', input);
  }

  function withdrawProposal(id, revision) {
    return mutateProposal(id, revision, 'withdraw');
  }

  function removeProposal(id, revision) {
    return mutateProposal(id, revision, 'remove');
  }

  function applyToTopics(topics) {
    const requests = list(true);
    return topics.flatMap(topic => {
      const record = requests.find(item => item.id === topic.id);
      if (!record) return [{ ...topic }];
      if (record.deletedAt) return [];
      const proposal = record.kind === 'de-xuat';
      const approved = proposal && record.status === 'da-duyet';
      return [{ ...topic, title: record.title, type: record.type, typeLabel: record.typeLabel, courseId: record.courseId, courseLabel: record.courseLabel, lecturer: record.lecturerName,
        status: approved ? 'dang-thuc-hien' : record.status, statusLabel: approved ? 'Đang thực hiện' : labels[record.status],
        ...(proposal ? { semester: record.semester, academicYear: record.academicYear, detailUrl: detailUrl(record.id) } : {}),
      }];
    });
  }

  function recent(topics) {
    const legacy = list().map(record => ({ id: record.id, requestId: record.id, title: record.title, status: record.status, statusLabel: labels[record.status], createdAt: record.resubmittedAt || record.createdAt, requestType: record.kind === 'dang-ky' ? 'Đăng ký đề tài' : 'Đề xuất đề tài', feedback: record.feedback, detailUrl: record.kind === 'de-xuat' ? detailUrl(record.id) : `chi-tiet-dang-ky-va-de-xuat-sinh-vien.html#${record.id.toLowerCase()}` }));
    const current = topics.filter(topic => topic.requestId && !app.data.initialRequests.some(record => record.id === topic.requestId)).map(topic => ({ ...topic, detailUrl: topic.requestDetailUrl || topic.detailUrl, statusLabel: topic.requestStatusLabel || topic.statusLabel, feedback: topic.feedback || '', requestType: topic.requestId.startsWith('DK-') ? 'Đăng ký đề tài' : 'Đề xuất đề tài' }));
    return [...legacy, ...current].sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt) || first.id.localeCompare(second.id));
  }

  app.services.requests = { list, findById, permissions, validate, mutate, applyToTopics, recent, labels, findStudentProposal, proposalForEdit, proposalCatalog, validateProposal, updateProposal, withdrawProposal, removeProposal };
})();
