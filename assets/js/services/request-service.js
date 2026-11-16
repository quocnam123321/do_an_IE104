(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};
  const labels = { 'cho-duyet': 'Chờ duyệt', 'da-duyet': 'Đã duyệt', 'yeu-cau-chinh-sua': 'Yêu cầu chỉnh sửa', 'da-rut': 'Đã rút', 'tu-choi': 'Từ chối' };
  const clone = value => JSON.parse(JSON.stringify(value));

  function recordsFrom(saved) {
    if (saved.some(record => !app.data.initialRequests.some(initial => initial.id === record.id && initial.kind === record.kind))) throw new Error('Dữ liệu yêu cầu đã lưu không khớp danh mục hiện tại.');
    return app.data.initialRequests.map(initial => {
      const record = clone({ ...initial, ...(saved.find(item => item.id === initial.id) || {}), allowedModes: initial.allowedModes });
      const store = globalThis.IE104Proposals;
      if (record.id !== 'DX001' || !store) return record;
      const decision = store.get('DX001');
      if (store.getError()) throw new Error(store.getError());
      if (decision && ['approved', 'rejected'].includes(decision.status) && record.status !== 'da-rut' && !record.deletedAt) {
        record.status = decision.status === 'approved' ? 'da-duyet' : 'tu-choi';
        record.feedback = decision.status === 'approved' ? 'Đề xuất đã được giảng viên duyệt.' : decision.reason;
        record.decidedAt = decision.decidedAt;
      }
      return record;
    });
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

  function mutate(id, revision, action, input) {
    const saved = app.storage.readRequests();
    const record = recordsFrom(saved).find(item => item.id === id);
    if (!record || record.deletedAt) throw new Error('Không tìm thấy yêu cầu hoặc yêu cầu đã được xóa khỏi danh sách.');
    const permission = permissions(record);
    if (!Object.hasOwn(permission, action) || !permission[action]) throw new Error('Trạng thái hiện tại không cho phép thao tác này.');
    if (!Number.isInteger(revision) || record.revision !== revision) throw new Error('Yêu cầu đã thay đổi ở tab khác. Hãy mở lại biểu mẫu để đọc bản mới.');
    const from = record.status;
    if (action === 'edit' || action === 'resubmit') {
      const checked = validate(input, record);
      if (checked.errors.length) throw new Error(checked.errors[0].message);
      Object.assign(record, checked.value);
      if (record.kind === 'de-xuat') {
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

  function applyToTopics(topics) {
    const requests = list(true);
    return topics.flatMap(topic => {
      const record = requests.find(item => item.id === topic.id);
      if (!record) return [{ ...topic }];
      if (record.deletedAt) return [];
      return [{ ...topic, title: record.title, type: record.type, typeLabel: record.typeLabel, courseId: record.courseId, lecturer: record.lecturerName, feedback: record.feedback, status: record.status === 'da-duyet' ? 'dang-thuc-hien' : record.status, statusLabel: record.status === 'da-duyet' ? 'Đang thực hiện' : labels[record.status] }];
    });
  }

  function recent(topics) {
    const legacy = list().map(record => ({ id: record.id, requestId: record.id, title: record.title, status: record.status === 'da-duyet' ? 'dang-thuc-hien' : record.status, statusLabel: record.status === 'da-duyet' ? 'Đang thực hiện' : labels[record.status], createdAt: record.resubmittedAt || record.createdAt, requestType: record.kind === 'dang-ky' ? 'Đăng ký đề tài' : 'Đề xuất đề tài', feedback: record.feedback, detailUrl: `chi-tiet-dang-ky-va-de-xuat-sinh-vien.html#${record.id.toLowerCase()}` }));
    const current = topics.filter(topic => topic.requestId && !app.data.initialRequests.some(record => record.id === topic.requestId)).map(topic => ({ ...topic, feedback: '', requestType: topic.requestId.startsWith('DK-') ? 'Đăng ký đề tài' : 'Đề xuất đề tài' }));
    return [...legacy, ...current].sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt) || first.id.localeCompare(second.id));
  }

  app.services.requests = { list, findById, permissions, validate, mutate, applyToTopics, recent, labels };
})();
