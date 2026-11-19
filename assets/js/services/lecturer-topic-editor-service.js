(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services ||= {};
  const catalog = {
    types: { course: 'Đồ án môn học', graduation: 'Đồ án tốt nghiệp', thesis: 'Khóa luận' },
    courses: { web: 'Internet và công nghệ Web', database: 'Cơ sở dữ liệu', software: 'Công nghệ phần mềm', 'phan-tich-thiet-ke-he-thong': 'Phân tích và thiết kế hệ thống', 'thuong-mai-dien-tu': 'Thương mại điện tử', 'quan-ly-du-an-cntt': 'Quản lý dự án CNTT' },
    semesters: { '1': 'Học kỳ 1', '2': 'Học kỳ 2', summer: 'Học kỳ hè' },
    years: ['2026-2027'],
  };
  const text = value => String(value ?? '').normalize('NFC').trim();
  const date = value => {
    const raw = text(value);
    if (!raw) return '';
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00` : raw;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) return null;
    const instant = new Date(`${normalized}:00+07:00`);
    if (!Number.isFinite(instant.getTime()) || new Date(instant.getTime() + 7 * 3600000).toISOString().slice(0, 16) !== normalized) return null;
    return instant.toISOString();
  };
  function validate(input, previous = null, now = new Date()) {
    const value = Object.fromEntries(['id', 'title', 'topicType', 'course', 'semester', 'academicYear', 'description', 'objectives', 'outcomes', 'requirements', 'domain', 'technologies', 'opensAt', 'deadline', 'startsAt', 'completesAt'].map(field => [field, text(input[field])]));
    value.id = value.id.toUpperCase();
    value.minMembers = text(input.minMembers) ? Number(input.minMembers) : NaN;
    value.maxMembers = text(input.maxMembers) ? Number(input.maxMembers) : NaN;
    const errors = [];
    const error = (field, message) => errors.push({ field, message });
    if (!/^[A-Z0-9][A-Z0-9_-]{0,29}$/.test(value.id)) error('id', 'Mã đề tài gồm 1–30 chữ cái, chữ số, dấu gạch ngang hoặc gạch dưới.');
    if (previous && value.id !== previous.id) error('id', 'Không được đổi mã của đề tài đã tạo.');
    for (const [field, limit] of [['title', 200], ['description', 10000], ['objectives', 5000], ['outcomes', 5000], ['requirements', 5000]]) if (!value[field] || value[field].length > limit) error(field, `Nhập nội dung từ 1 đến ${limit} ký tự.`);
    if (!Object.hasOwn(catalog.types, value.topicType)) error('topicType', 'Chọn loại đề tài trong danh sách.');
    if (value.topicType === 'course' && !Object.hasOwn(catalog.courses, value.course)) error('course', 'Chọn môn học trong danh sách.');
    if (value.topicType !== 'course') value.course = '';
    if (!Object.hasOwn(catalog.semesters, value.semester)) error('semester', 'Chọn học kỳ trong danh sách.');
    if (!catalog.years.includes(value.academicYear)) error('academicYear', 'Chọn năm học trong danh sách.');
    if (!Number.isInteger(value.minMembers) || value.minMembers < 1 || value.minMembers > 100) error('minMembers', 'Nhập số nguyên từ 1 đến 100.');
    if (!Number.isInteger(value.maxMembers) || value.maxMembers < value.minMembers || value.maxMembers > 100) error('maxMembers', 'Số tối đa phải là số nguyên, không nhỏ hơn tối thiểu và không vượt quá 100.');
    for (const [field, limit] of [['domain', 100], ['technologies', 300]]) if (value[field].length > limit) error(field, `Nội dung tối đa ${limit} ký tự.`);
    for (const field of ['opensAt', 'deadline', 'startsAt', 'completesAt']) { const converted = date(value[field]); if (converted === null || (field === 'deadline' && !converted)) error(field, 'Nhập ngày và giờ hợp lệ.'); value[field] = converted; }
    if (value.deadline && Date.parse(value.deadline) <= now.getTime() && value.deadline !== (previous?.registration?.deadline ? new Date(previous.registration.deadline).toISOString() : null)) error('deadline', 'Hạn đăng ký mới phải sau thời điểm hiện tại.');
    if (value.opensAt && value.deadline && value.opensAt >= value.deadline) error('opensAt', 'Thời điểm mở phải trước hạn đăng ký.');
    if (value.startsAt && value.completesAt && value.startsAt >= value.completesAt) error('completesAt', 'Hạn hoàn thành phải sau ngày bắt đầu.');
    return { value, errors };
  }
  function save(id, input, revision, files = {}, expectedOwner) {
    const actor = app.data.currentLecturer;
    if (!actor?.id || !actor.name || actor.id !== expectedOwner) throw new Error('Giảng viên hiện tại đã thay đổi. Hãy tải lại trang.');
    const repository = app.services.lecturerTopicRepository;
    const saved = repository.read();
    const all = app.services.lecturerTopics.list('created');
    const previous = id ? app.services.lecturerTopics.get('created', id) : null;
    if (previous && (!Number.isInteger(revision) || revision !== (previous.revision || 0))) throw new Error('Đề tài đã thay đổi ở tab khác. Hãy tải lại sau khi sao chép nội dung đang nhập.');
    const checked = validate(input, previous);
    if (checked.errors.length) throw new Error(checked.errors[0].message);
    const value = checked.value;
    const seeds = (app.data.lecturerTopics || []).filter(topic => topic.kind === 'created');
    if (!previous && [...seeds, ...saved].some(topic => topic.id === value.id)) throw new Error('Mã đề tài đã tồn tại. Chọn mã khác.');
    if (all.some(topic => topic.id !== previous?.id && topic.title.normalize('NFC').toLocaleLowerCase('vi') === value.title.toLocaleLowerCase('vi') && topic.academicYear === value.academicYear && String(topic.semester) === value.semester)) throw new Error('Đã có đề tài cùng tên trong học kỳ và năm học này.');
    for (const purpose of ['image', 'attachment']) if (Object.hasOwn(files, purpose) && files[purpose] !== null && (!files[purpose] || typeof files[purpose].key !== 'string' || files[purpose].ownerId !== actor.id || files[purpose].topicId !== (previous?.id || value.id) || files[purpose].purpose !== purpose)) throw new Error('Thông tin tệp chưa hợp lệ.');
    const now = new Date();
    const createdAt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const record = {
      ...previous, patchOnly: false, id: previous?.id || value.id, kind: 'created', ownerId: actor.id,
      title: value.title, topicType: value.topicType, typeLabel: previous?.sourceRecord?.type === 'Luận văn thạc sĩ' && value.topicType === previous.topicType ? previous.typeLabel : catalog.types[value.topicType], course: value.course, courseLabel: catalog.courses[value.course] || '',
      semester: value.semester, academicYear: value.academicYear, description: value.description,
      ...Object.fromEntries(['objectives', 'outcomes', 'requirements'].map(field => [field, value[field].split(/\r?\n/).map(text).filter(Boolean)])),
      domain: value.domain, technologies: value.technologies,
      registration: { ...previous?.registration, minMembers: value.minMembers, maxMembers: value.maxMembers, deadline: value.deadline, opensAt: value.opensAt || '' },
      startsAt: value.startsAt || '', completesAt: value.completesAt || '',
      supervisor: previous?.supervisor || { name: actor.name, faculty: '', email: '', research: '' },
      status: previous?.status || 'open', statusLabel: previous?.statusLabel || 'Đang mở đăng ký', createdAt: previous?.createdAt || createdAt,
      revision: (previous?.revision || 0) + 1, updatedAt: now.toISOString(),
    };
    for (const purpose of ['image', 'attachment']) if (Object.hasOwn(files, purpose)) record[`${purpose}Ref`] = files[purpose];
    if (Object.hasOwn(files, 'attachment')) record.attachmentName = files.attachment?.name || '';
    repository.write([...saved.filter(topic => topic.id !== record.id), record]);
    return JSON.parse(JSON.stringify(record));
  }
  function setRegistration(id, open, deadline, revision, expectedOwner) {
    const actor = app.data.currentLecturer;
    if (!actor?.id || actor.id !== expectedOwner) throw new Error('Giảng viên hiện tại đã thay đổi.');
    if (typeof open !== 'boolean') throw new Error('Trạng thái đăng ký không hợp lệ.');
    const repository = app.services.lecturerTopicRepository;
    const saved = repository.read(); const topic = app.services.lecturerTopics.get('created',id);
    if (!Number.isInteger(revision) || revision !== (topic.revision || 0)) throw new Error('Đề tài đã đổi ở tab khác. Hãy mở lại hộp xác nhận.');
    let registration;
    if (open) {
      if (!app.services.publishedTopics.complete(topic)) throw new Error('Bổ sung đầy đủ thông tin đề tài trong trang Chỉnh sửa trước khi mở đăng ký.');
      const converted = date(deadline);
      if (!converted || Date.parse(converted) <= Date.now()) throw new Error('Hạn đăng ký mới phải là ngày giờ hợp lệ trong tương lai.');
      if (topic.registration.opensAt && Date.parse(topic.registration.opensAt) >= Date.parse(converted)) throw new Error('Hạn đóng phải sau thời điểm mở đăng ký.');
      registration = { ...topic.registration, deadline:converted };
    }
    const previous = saved.find(record => record.id === id);
    const record = previous && !previous.patchOnly ? { ...previous } : { id, kind:'created', ownerId:actor.id, patchOnly:true };
    if (previous?.registration && record.patchOnly) record.registration = previous.registration;
    Object.assign(record,{ status:open?'open':'closed',statusLabel:open?'Đang mở đăng ký':'Đã đóng đăng ký',revision:(topic.revision||0)+1,updatedAt:new Date().toISOString() });
    if (registration) record.registration = registration;
    repository.write([...saved.filter(item => item.id !== id),record]);
    return app.services.lecturerTopics.get('created',id);
  }
  app.services.lecturerTopicEditor = { catalog, validate, setRegistration, create: (input, files, owner) => save(null, input, null, files, owner), update: (id, input, revision, files, owner) => save(id, input,revision,files,owner) };
})();
