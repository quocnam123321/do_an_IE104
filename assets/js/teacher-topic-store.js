/* Local demo data copied from existing topic cards; missing content stays empty. */
(() => {
  const seeds = [
  {
    "id": "DA001",
    "code": "DA001",
    "name": "Website qu\u1ea3n l\u00fd th\u01b0 vi\u1ec7n",
    "type": "course",
    "course": "web",
    "semester": "1",
    "year": "2026-2027",
    "status": "open",
    "created": "2026-10-28",
    "minimum": "2",
    "maximum": "3",
    "description": "X\u00e2y d\u1ef1ng website h\u1ed7 tr\u1ee3 qu\u1ea3n l\u00fd s\u00e1ch, b\u1ea1n \u0111\u1ecdc v\u00e0 ho\u1ea1t \u0111\u1ed9ng m\u01b0\u1ee3n tr\u1ea3 t\u1ea1i th\u01b0 vi\u1ec7n. H\u1ec7 th\u1ed1ng gi\u00fap tra c\u1ee9u th\u00f4ng tin v\u00e0 theo d\u00f5i t\u00ecnh tr\u1ea1ng s\u00e1ch.",
    "objectives": "Qu\u1ea3n l\u00fd danh m\u1ee5c s\u00e1ch v\u00e0 th\u00f4ng tin b\u1ea1n \u0111\u1ecdc\nH\u1ed7 tr\u1ee3 tra c\u1ee9u, m\u01b0\u1ee3n v\u00e0 tr\u1ea3 s\u00e1ch\nTheo d\u00f5i v\u00e0 th\u1ed1ng k\u00ea ho\u1ea1t \u0111\u1ed9ng th\u01b0 vi\u1ec7n",
    "outcomes": "Website qu\u1ea3n l\u00fd th\u01b0 vi\u1ec7n v\u1edbi c\u00e1c ch\u1ee9c n\u0103ng c\u01a1 b\u1ea3n\nB\u00e1o c\u00e1o v\u00e0 t\u00e0i li\u1ec7u h\u01b0\u1edbng d\u1eabn s\u1eed d\u1ee5ng",
    "requirements": "C\u00f3 ki\u1ebfn th\u1ee9c HTML, CSS, JavaScript v\u00e0 c\u01a1 s\u1edf d\u1eef li\u1ec7u\nC\u00f3 kh\u1ea3 n\u0103ng l\u00e0m vi\u1ec7c nh\u00f3m v\u00e0 t\u1ef1 nghi\u00ean c\u1ee9u",
    "opens": "",
    "closes": "2026-11-15T23:59",
    "starts": "",
    "ends": "",
    "field": "",
    "technology": "",
    "image": "",
    "attachment": null,
    "revision": 0
  },
  {
    "id": "DA002",
    "code": "DA002",
    "name": "H\u1ec7 th\u1ed1ng qu\u1ea3n l\u00fd b\u00e1n h\u00e0ng",
    "type": "course",
    "course": "database",
    "semester": "1",
    "year": "2026-2027",
    "status": "open",
    "created": "2026-10-26",
    "minimum": "2",
    "maximum": "3",
    "description": "",
    "objectives": "",
    "outcomes": "",
    "requirements": "",
    "opens": "",
    "closes": "",
    "starts": "",
    "ends": "",
    "field": "",
    "technology": "",
    "image": "",
    "attachment": null,
    "revision": 0
  },
  {
    "id": "DA003",
    "code": "DA003",
    "name": "\u1ee8ng d\u1ee5ng \u0111\u1eb7t l\u1ecbch h\u1ecdc nh\u00f3m",
    "type": "course",
    "course": "software",
    "semester": "1",
    "year": "2026-2027",
    "status": "closed",
    "created": "2026-10-24",
    "minimum": "2",
    "maximum": "3",
    "description": "",
    "objectives": "",
    "outcomes": "",
    "requirements": "",
    "opens": "",
    "closes": "",
    "starts": "",
    "ends": "",
    "field": "",
    "technology": "",
    "image": "",
    "attachment": null,
    "revision": 0
  },
  {
    "id": "DA004",
    "code": "DA004",
    "name": "Website qu\u1ea3n l\u00fd c\u00e2u l\u1ea1c b\u1ed9",
    "type": "course",
    "course": "web",
    "semester": "1",
    "year": "2026-2027",
    "status": "open",
    "created": "2026-10-22",
    "minimum": "2",
    "maximum": "3",
    "description": "",
    "objectives": "",
    "outcomes": "",
    "requirements": "",
    "opens": "",
    "closes": "",
    "starts": "",
    "ends": "",
    "field": "",
    "technology": "",
    "image": "",
    "attachment": null,
    "revision": 0
  },
  {
    "id": "DA005",
    "code": "DA005",
    "name": "H\u1ec7 th\u1ed1ng h\u1ed7 tr\u1ee3 \u0111\u0103ng k\u00fd h\u1ecdc ph\u1ea7n",
    "type": "course",
    "course": "database",
    "semester": "1",
    "year": "2026-2027",
    "status": "closed",
    "created": "2026-10-20",
    "minimum": "2",
    "maximum": "3",
    "description": "",
    "objectives": "",
    "outcomes": "",
    "requirements": "",
    "opens": "",
    "closes": "",
    "starts": "",
    "ends": "",
    "field": "",
    "technology": "",
    "image": "",
    "attachment": null,
    "revision": 0
  }
  ];
  const key = 'ie104.teacher-topic-records.v1';
  const codePrefixes = Object.freeze({ course: 'DA', graduation: 'DATN', thesis: 'KL' });
  const copy = value => JSON.parse(JSON.stringify(value));
  const catalogs = {
    type: { course: 'Đồ án môn học', graduation: 'Đồ án tốt nghiệp', thesis: 'Khóa luận' },
    course: { web: 'Internet và công nghệ Web', database: 'Cơ sở dữ liệu', software: 'Công nghệ phần mềm' },
    semester: { 1: 'Học kỳ 1', 2: 'Học kỳ 2', summer: 'Học kỳ hè' },
    year: { '2026-2027': '2026–2027' },
  };
  function read() {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return copy(seeds);
    const records = JSON.parse(raw);
    const strings = ['id', 'code', 'name', 'type', 'course', 'semester', 'year', 'status', 'created',
      'description', 'objectives', 'outcomes', 'requirements', 'minimum', 'maximum', 'opens', 'closes', 'starts', 'ends', 'image'];
    if (!Array.isArray(records) || records.some(t => !t || strings.some(k => typeof t[k] !== 'string') ||
        !t.id || !['open', 'closed'].includes(t.status) || !Number.isFinite(Date.parse(t.created)) ||
        !Number.isSafeInteger(t.revision) || t.revision < 0 ||
        (t.image && !/^data:image\/(png|jpeg);base64,/.test(t.image)) ||
        (t.attachment && (typeof t.attachment.name !== 'string' || typeof t.attachment.data !== 'string' || !t.attachment.data.startsWith('data:')))) ||
        new Set(records.map(t => t.id)).size !== records.length) {
      throw new Error('Dữ liệu đề tài đã lưu không hợp lệ. Không thể tiếp tục lưu để tránh mất dữ liệu.');
    }
    return records;
  }
  function validDate(value, dateOnly = false) {
    const pattern = dateOnly ? /^\d{4}-\d{2}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (!pattern.test(value)) return false;
    const date = new Date(value.slice(0, 10) + 'T00:00:00Z');
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value.slice(0, 10)) return false;
    return dateOnly || (Number(value.slice(11, 13)) < 24 && Number(value.slice(14, 16)) < 60);
  }
  function validate(t, records, mode) {
    const errors = {};
    const required = ['name', 'type', 'course', 'semester', 'year', 'description', 'objectives', 'requirements', 'minimum', 'maximum', 'closes'];
    // Keep each existing form's required fields; do not add fields to either page.
    required.push(...(mode === 'edit' ? ['code', 'opens', 'ends'] : ['outcomes']));
    for (const k of required) if (!String(t[k] ?? '').trim()) errors[k] = 'Vui lòng nhập thông tin bắt buộc.';
    for (const [k, values] of Object.entries(catalogs)) if (!Object.hasOwn(values, t[k])) errors[k] = 'Vui lòng chọn giá trị hợp lệ.';
    if (mode === 'edit') {
      if (records.some(r => r.id !== t.id && r.code.trim().toLocaleLowerCase('vi') === String(t.code).trim().toLocaleLowerCase('vi'))) errors.code = 'Mã đề tài đã tồn tại.';
      if (String(t.code).length > 60) errors.code = 'Mã đề tài tối đa 60 ký tự.';
    }
    if (String(t.name).length > 300) errors.name = 'Tên đề tài tối đa 300 ký tự.';
    for (const k of ['description', 'objectives', 'requirements', 'outcomes']) if (String(t[k] || '').length > 10000) errors[k] = 'Nội dung tối đa 10.000 ký tự.';
    for (const k of ['minimum', 'maximum']) if (!Number.isSafeInteger(Number(t[k])) || Number(t[k]) < 1) errors[k] = 'Số thành viên phải là số nguyên dương.';
    if (+t.minimum > +t.maximum) errors.maximum = 'Số tối đa phải lớn hơn hoặc bằng số tối thiểu.';
    for (const k of ['opens', 'closes', 'starts', 'ends']) if (t[k] && !validDate(t[k], k === 'starts')) errors[k] = 'Mốc thời gian không hợp lệ.';
    if (t.opens && t.closes && t.opens >= t.closes) errors.closes = 'Đóng đăng ký phải sau mở đăng ký.';
    if (t.closes && t.ends && t.closes >= t.ends) errors.ends = 'Hạn hoàn thành phải sau đóng đăng ký.';
    if (t.starts && t.ends && t.starts + 'T00:00' >= t.ends) errors.starts = 'Ngày bắt đầu phải trước hạn hoàn thành.';
    return errors;
  }
  function nextCode(type, records) {
    const prefix = codePrefixes[type];
    const pattern = new RegExp('^' + prefix + '(\\d+)$', 'i');
    let largest = 0n;
    for (const record of records) {
      const suffix = pattern.exec(record.code.trim())?.[1];
      if (suffix && BigInt(suffix) > largest) largest = BigInt(suffix);
    }
    const code = prefix + String(largest + 1n).padStart(3, '0');
    if (code.length > 60) throw new Error('Đã hết mã đề tài có thể cấp cho loại này.');
    return code;
  }

  async function save(topic, revision, mode) {
    const write = () => {
      const records = read();
      const old = records.find(t => t.id === topic.id);
      if ((mode === 'edit' && !old) || (mode !== 'edit' && old) || (old?.revision || 0) !== revision) {
        throw new Error('Đề tài đã thay đổi ở tab khác hoặc không còn tồn tại. Hãy sao chép nội dung đang nhập trước khi tải lại trang.');
      }
      if (old && old.code !== topic.code) throw new Error('Không được đổi mã đề tài khi chỉnh sửa.');
      if (Object.keys(validate(topic, records, mode)).length) throw new Error('Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.');
      const next = { ...copy(topic), revision: revision + 1, updated: new Date().toISOString() };
      if (!old) next.code = nextCode(topic.type, records);
      window.localStorage.setItem(key, JSON.stringify(old ? records.map(t => t.id === next.id ? next : t) : [...records, next]));
      return copy(next);
    };
    // Serialize writes across tabs when supported; revision also guards stale edits.
    return withWriteLock(write);
  }
  function withWriteLock(write) {
    return window.navigator?.locks?.request ? window.navigator.locks.request(key, write) : write();
  }
  async function setRegistrationStatus(id, revision, status) {
    return withWriteLock(() => {
      if (status !== 'open' && status !== 'closed') throw new Error('Trạng thái đăng ký không hợp lệ.');
      const records = read();
      const topic = records.find(record => record.id === id);
      if (!topic || topic.revision !== revision || topic.status === status) {
        throw new Error('Trạng thái đề tài đã thay đổi. Hãy kiểm tra và xác nhận lại.');
      }
      const next = { ...topic, status, revision: revision + 1, updated: new Date().toISOString() };
      window.localStorage.setItem(key, JSON.stringify(records.map(record => record.id === id ? next : record)));
      return next;
    });
  }
  function studentTopics(samples) {
    const library = samples.find(topic => topic.id === 'DT001');
    const types = { course: 'do-an-mon-hoc', graduation: 'do-an-tot-nghiep', thesis: 'khoa-luan' };
    const courses = { web: 'IE104', database: 'co-so-du-lieu', software: 'cong-nghe-phan-mem' };
    const managed = read().map(record => {
      // Preserve the existing student identifier used by saved registrations.
      const sample = record.id === 'DA001' ? library : undefined;
      const id = sample?.id || record.id;
      return {
        id,
        code: sample?.id || record.code,
        title: record.name,
        type: types[record.type],
        typeLabel: catalogs.type[record.type],
        courseId: courses[record.course],
        courseLabel: record.course === 'web' && library ? library.courseLabel : catalogs.course[record.course],
        semester: record.semester,
        academicYear: record.year,
        lecturer: sample?.lecturer || 'Nguyễn Văn Minh',
        createdAt: record.created,
        detailUrl: sample?.detailUrl || 'chi-tiet-de-tai-mo-dang-ky.html?topic=' + encodeURIComponent(id),
        registrationRules: { minMembers: Number(record.minimum), maxMembers: Number(record.maximum) },
        status: record.status,
        record,
      };
    });
    return [...samples.filter(topic => topic.id !== 'DT001'), ...managed];
  }
  window.TeacherTopicStore = { key, catalogs, codePrefixes, read, validate, save, setRegistrationStatus, studentTopics };
})();
