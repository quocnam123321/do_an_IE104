(() => {
  'use strict';

  // Dữ liệu lời mời chỉ dùng cho bản demo trên trình duyệt.
  const prefix = 'ie104.supervision-invitation.v1.';
  const receiptPrefix = 'ie104.supervision-read.v1.';
  const student = Object.freeze({ id: '24520001', name: 'Nguyễn Minh Anh' });
  const subjectLimit = 120;
  const messageLimit = 2000;
  const attachmentLimit = 10 * 1024 * 1024;
  const attachmentDatabase = 'ie104.supervision-attachments.v1';
  const finalStatuses = ['accepted', 'rejected'];
  const changes = new EventTarget();
  const database = window.IE104?.proposalDatabase;
  const demoTeacher = { id: 'giang-vien-0', name: 'ThS. Nguyễn Hoàng An' };
  const demoInvitations = new Map([
    ['inv-demo-01', 'Nguyễn Minh Anh', '24520001', '2026-11-25T14:20:00+07:00',
      'Mời đồng hướng dẫn đề tài Website quản lý hoạt động học tập',
      'Em muốn trao đổi về cách thiết kế phần theo dõi tiến độ học tập và kiểm thử với dữ liệu mẫu. Thầy có thể góp ý cho nhóm em được không ạ?'],
    ['inv-demo-02', 'Trần Quốc Bảo', '23520148', '2026-11-25T09:45:00+07:00',
      'Xin hướng dẫn khóa luận về tìm kiếm ngữ nghĩa cho học liệu số',
      'Em dự kiến xây dựng công cụ tìm kiếm theo ngữ nghĩa cho học liệu tiếng Việt. Em mong được trao đổi với thầy về phạm vi và cách đánh giá.'],
    ['inv-demo-03', 'Lê Hoàng Gia Huy', '24520312', '2026-11-24T16:10:00+07:00',
      'Xin hướng dẫn đồ án IE104 về hệ thống đặt lịch phòng lab',
      'Nhóm em muốn làm website đặt lịch phòng lab theo khung giờ. Nhóm mong thầy góp ý về quy trình đăng ký và điều kiện hủy lịch.'],
    ['inv-demo-04', 'Phạm Ngọc Hà', '24520256', '2026-11-24T10:30:00+07:00',
      'Xin hướng dẫn đề tài hệ thống góp ý cho thư viện số',
      'Em muốn dùng đề tài này để tìm hiểu cách thu thập và phân loại góp ý của người dùng thư viện. Em xin hẹn thầy trao đổi về đề cương.'],
    ['inv-demo-05', student.name, student.id, '2026-11-24T09:00:00+07:00',
      'Xin hướng dẫn đề tài tìm kiếm tài liệu học tập tiếng Việt',
      'Em muốn xây dựng công cụ tìm tài liệu theo nội dung câu hỏi. Em mong thầy góp ý về cách chọn dữ liệu và đánh giá kết quả tìm kiếm.',
      { id: 'giang-vien-1', name: 'TS. Nguyễn Văn Kiệt' }],
    ['inv-demo-06', student.name, student.id, '2026-11-23T16:00:00+07:00',
      'Xin hướng dẫn đề tài nhận diện email giả mạo',
      'Em dự định làm công cụ đánh dấu email có dấu hiệu giả mạo. Em mong thầy góp ý để xác định phạm vi phù hợp với đồ án môn học.',
      { id: 'giang-vien-3', name: 'PGS.TS. Nguyễn Tấn Cầm' }],
    ['inv-demo-07', student.name, student.id, '2026-11-22T10:00:00+07:00',
      'Xin hướng dẫn đề tài phân loại phản hồi sinh viên',
      'Em muốn phân loại phản hồi khảo sát theo chủ đề. Em xin cô góp ý về cách xây dựng bộ nhãn và đánh giá mô hình.',
      { id: 'giang-vien-37', name: 'ThS. Tạ Thu Thủy' }],
  ].map(([id, name, code, createdAt, subject, message, teacher = demoTeacher]) => [id, {
    id, teacher, student: { id: `demo:${code}`, name, code }, subject,
    status: 'pending', createdAt, updatedAt: createdAt, decision: null,
    messages: [{ role: 'student', text: message, sentAt: createdAt }],
  }]));

  function isText(value, limit, optional = false) {
    return typeof value === 'string' && value.length <= limit && (optional || value.trim().length > 0);
  }

  function validateText(value, label, limit, optional = false) {
    const text = typeof value === 'string' ? value.trim() : value;
    if (!isText(text, limit, optional)) {
      if (!optional && text === '') throw new Error(`Vui lòng nhập ${label.toLowerCase()}.`);
      throw new Error(`${label} phải có tối đa ${limit} ký tự.`);
    }
    return text;
  }

  const isTeacher = (teacher) => typeof teacher?.id === 'string' && /^giang-vien-\d+$/.test(teacher.id) &&
    typeof teacher.name === 'string' && teacher.name.trim().length > 0;
  const isDate = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
  const isStudent = (sender) => typeof sender?.id === 'string'
    && (sender.id === student.id || /^firebase:.{1,128}$/.test(sender.id))
    && typeof sender.name === 'string' && sender.name.trim().length > 0;

  function isAttachment(file) {
    return typeof file?.id === 'string' && /^[a-f0-9]{32}$/.test(file.id) &&
      typeof file.name === 'string' && file.name.trim().length > 0 &&
      Number.isInteger(file.size) && file.size > 0 && file.size <= attachmentLimit;
  }

  function isRecord(record, id) {
    const sample = demoInvitations.get(id);
    const sender = record?.student;
    const validSender = sample
      ? sender?.id === sample.student.id && sender.name === sample.student.name && sender.code === sample.student.code
      : isStudent(sender);
    if (!record || id !== record.id || !isTeacher(record.teacher) ||
        !validSender ||
        (record.projectId !== undefined && !isText(record.projectId, 120)) ||
        !isText(record.subject, subjectLimit) || !isDate(record.createdAt) || !isDate(record.updatedAt) ||
        !Array.isArray(record.messages) || record.messages[0]?.role !== 'student') {
      return false;
    }
    const hasValidDecision = record.status === 'pending' || (record.projectId && record.status === 'cancelled')
      ? record.decision === null
      : finalStatuses.includes(record.status) && isDate(record.decision?.at) &&
        isText(record.decision.note, messageLimit, true);
    return hasValidDecision && record.messages.every((message) =>
      ['student', 'teacher'].includes(message?.role) &&
      isText(message.text, messageLimit) && isDate(message.sentAt) &&
      (message.attachment === undefined || isAttachment(message.attachment)));
  }

  function read(id) {
    let raw;
    try {
      raw = window.localStorage.getItem(prefix + id);
    } catch {
      throw new Error('Không đọc được lời mời. Hãy kiểm tra quyền lưu trữ của trình duyệt.');
    }
    if (raw === null) {
      const sample = demoInvitations.get(id);
      return sample ? structuredClone(sample) : null;
    }
    try {
      const record = JSON.parse(raw);
      if (isRecord(record, id)) return record;
    } catch {
      // Báo lỗi bên dưới để cả dữ liệu cũ và JSON lỗi có cùng thông báo.
    }
    throw new Error('Dữ liệu lời mời đã lưu không hợp lệ.');
  }

  function readAll(includeDemo = false) {
    const ids = new Set(includeDemo ? demoInvitations.keys() : []);
    try {
      const storage = window.localStorage;
      for (let index = 0; index < storage.length; index++) {
        const key = storage.key(index);
        if (!key?.startsWith(prefix)) continue;
        const id = key.slice(prefix.length);
        if (includeDemo || !demoInvitations.has(id)) ids.add(id);
      }
    } catch {
      throw new Error('Không đọc được lời mời. Hãy kiểm tra quyền lưu trữ của trình duyệt.');
    }
    return Array.from(ids, read).filter(record => record && record.status !== 'cancelled')
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }

  const getAll = () => database ? database.supervisionInvitations() : readAll();

  function listForTeacher(session) {
    if (database) return getAll();
    if (session.demo) return readAll(true);
    return getAll().filter(({ teacher }) => session.teacherIds.includes(teacher.id));
  }

  function isInvitationStudent(record, id) {
    return record.student.id === id || (id === student.id && demoInvitations.get(record.id)?.student.code === id);
  }

  function listForStudent(sender) {
    if (database) return getAll();
    return readAll(sender.id === student.id).filter(record => isInvitationStudent(record, sender.id));
  }

  function studentCode(record) {
    return record.student.code || (record.student.id === student.id ? student.id : '');
  }

  function write(record) {
    try {
      window.localStorage.setItem(prefix + record.id, JSON.stringify(record));
    } catch {
      throw new Error('Không lưu được lời mời. Hãy kiểm tra quyền lưu trữ hoặc dung lượng trình duyệt.');
    }
  }

  function notify() {
    changes.dispatchEvent(new Event('change'));
  }

  function randomId() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  function openAttachmentDatabase() {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(attachmentDatabase, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('files');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function accessAttachments(mode, operation) {
    const database = await openAttachmentDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = database.transaction('files', mode);
        const request = operation(transaction.objectStore('files'));
        transaction.oncomplete = () => resolve(request.result);
        transaction.onabort = () => reject(transaction.error);
      });
    } finally {
      database.close();
    }
  }

  async function withAttachment(file, writeMessage) {
    if (file === undefined) return writeMessage(undefined);
    if (!(file instanceof File) || !file.name.trim()) throw new Error('Tệp đính kèm không hợp lệ.');
    if (!file.size) throw new Error('Tệp đính kèm đang trống. Hãy chọn tệp khác.');
    if (file.size > attachmentLimit) throw new Error('Tệp đính kèm vượt quá 10 MB. Hãy chọn tệp nhỏ hơn.');
    const metadata = { id: randomId(), name: file.name, size: file.size };
    try {
      await accessAttachments('readwrite', (files) => files.add(file, metadata.id));
    } catch {
      throw new Error('Không lưu được tệp đính kèm. Hãy kiểm tra quyền lưu trữ hoặc dung lượng trình duyệt.');
    }
    try {
      return await writeMessage(metadata);
    } catch (error) {
      // Xóa tệp nếu lời mời hoặc phản hồi chưa được ghi.
      try { await accessAttachments('readwrite', (files) => files.delete(metadata.id)); } catch {}
      throw error;
    }
  }

  async function getAttachment(metadata) {
    if (database && metadata?.invitationId) return database.readSupervisionAttachment(metadata.invitationId, metadata.id);
    if (!isAttachment(metadata)) throw new Error('Thông tin tệp đính kèm không hợp lệ.');
    let file;
    try {
      file = await accessAttachments('readonly', (files) => files.get(metadata.id));
    } catch {
      throw new Error('Không đọc được tệp đính kèm. Hãy kiểm tra quyền lưu trữ của trình duyệt.');
    }
    if (!(file instanceof Blob) || file.size !== metadata.size) {
      throw new Error('Tệp đính kèm không còn trong bộ nhớ trình duyệt.');
    }
    return file;
  }

  function responseCount(record) {
    return record.messages.filter(({ role }) => role === 'teacher').length + Number(record.decision !== null);
  }

  function receiptKey(record) {
    return `${receiptPrefix}${record.student.id}.${record.id}`;
  }

  function readReceipt(key) {
    try {
      const count = Number(window.localStorage.getItem(key));
      return Number.isSafeInteger(count) && count >= 0 ? count : 0;
    } catch {
      throw new Error('Không đọc được trạng thái đã xem. Hãy kiểm tra quyền lưu trữ của trình duyệt.');
    }
  }

  function getUnreadResponses(record) {
    if (database) return Math.max(0, responseCount(record) - record.readCount);
    return Math.max(0, responseCount(record) - readReceipt(receiptKey(record)));
  }

  async function markResponsesRead(record) {
    // Chỉ đánh dấu các phản hồi trong bản lời mời mà sinh viên đang xem.
    const count = responseCount(record);
    if (count === 0) return false;
    if (database) {
      if (count <= record.readCount) return false;
      await database.markSupervisionRead(record.id, count);
      return true;
    }
    const key = receiptKey(record);
    const advance = () => {
      if (count <= readReceipt(key)) return false;
      try {
        window.localStorage.setItem(key, String(count));
      } catch {
        throw new Error('Không lưu được trạng thái đã xem. Hãy kiểm tra quyền lưu trữ của trình duyệt.');
      }
      return true;
    };
    const changed = navigator.locks?.request ? await navigator.locks.request(key, advance) : advance();
    if (changed) notify();
    return changed;
  }

  function canReply(record) {
    return record?.status === 'pending' || Boolean(record?.projectId && record.status === 'accepted');
  }

  function needsTeacherReply(record) {
    const last = record.messages.at(-1);
    return canReply(record) && last?.role === 'student' &&
      (!record.decision || record.messages.length > (record.decision.messageCount ?? 0) &&
        (record.decision.messageCount !== undefined || Date.parse(last.sentAt) > Date.parse(record.decision.at)));
  }

  async function create({ student: sender = student, teacher, subject, message, attachment, projectId, revision }) {
    if (database) return database.sendSupervision({ teacher, subject, message, attachment, projectId, revision });
    if (!isStudent(sender)) throw new Error('Tài khoản sinh viên gửi lời mời không hợp lệ.');
    if (!isTeacher(teacher)) throw new Error('Giảng viên nhận lời mời không hợp lệ.');
    const title = validateText(subject, 'Tiêu đề', subjectLimit);
    const text = validateText(message, 'Lời nhắn', messageLimit);
    if (projectId !== undefined && !isText(projectId, 120)) throw new Error('Không tìm thấy thông tin nhóm của đề tài.');
    const save = () => withAttachment(attachment, (metadata) => {
      if (projectId && getAll().some(record => record.projectId === projectId && record.teacher.id === teacher.id &&
        (record.status === 'pending' || record.status === 'accepted'))) {
        throw new Error('Giảng viên đã tham gia đề tài hoặc đã có lời mời đang chờ.');
      }
      const now = new Date().toISOString();
      const initial = { role: 'student', text, sentAt: now };
      if (metadata) initial.attachment = metadata;
      const record = {
        id: randomId(),
        teacher: { id: teacher.id, name: teacher.name.trim() },
        student: { id: sender.id, name: sender.name.trim() },
        subject: title,
        ...(projectId ? { projectId } : {}),
        status: 'pending',
        messages: [initial],
        createdAt: now,
        updatedAt: now,
        decision: null,
      };
      write(record);
      notify();
      return record;
    });
    const key = `${prefix}project.${projectId}.${teacher.id}`;
    return projectId && navigator.locks?.request ? navigator.locks.request(key, save) : save();
  }

  async function update(id, change, allowed = record => record.status === 'pending') {
    const save = () => {
      const record = read(id);
      if (!record) throw new Error('Không tìm thấy lời mời.');
      if (!allowed(record)) throw new Error('Giảng viên đã phản hồi lời mời này.');
      const now = new Date().toISOString();
      change(record, now);
      record.updatedAt = now;
      write(record);
      return record;
    };
    // Mỗi thao tác đọc lại lời mời trong cùng khóa trước khi cập nhật.
    const record = navigator.locks?.request ? await navigator.locks.request(prefix + id, save) : save();
    notify();
    return record;
  }

  async function reply(id, actor, message, attachment) {
    if (database) return database.replySupervision(id, message, attachment);
    const text = validateText(message, 'Phản hồi', messageLimit);
    return withAttachment(attachment, (metadata) => update(id, (record, now) => {
      const fromStudent = actor?.role === 'student' && isInvitationStudent(record, actor.id);
      const fromTeacher = actor?.role === 'teacher' && actor.id === record.teacher.id;
      if (!fromStudent && !fromTeacher) throw new Error('Vui lòng mở lời mời bằng đúng vai trò đã tham gia.');
      const response = { role: actor.role, text, sentAt: now };
      if (metadata) response.attachment = metadata;
      record.messages.push(response);
    }, canReply));
  }

  async function decide(id, teacherId, status, note = '') {
    if (database) return database.decideSupervision(id, status, note);
    if (!finalStatuses.includes(status)) throw new Error('Quyết định không hợp lệ.');
    const text = validateText(note, 'Lời nhắn kèm theo', messageLimit, true);
    return update(id, (record, now) => {
      if (record.teacher.id !== teacherId) throw new Error('Chỉ giảng viên nhận lời mời mới có thể quyết định.');
      record.status = status;
      record.decision = { at: now, note: text, ...(record.projectId ? { messageCount: record.messages.length } : {}) };
    });
  }

  function cancelProjectInvitation(id, studentId, projectId) {
    return update(id, (record) => {
      if (!projectId || record.projectId !== projectId || record.student.id !== studentId) {
        throw new Error('Vui lòng mở lời mời bằng đúng vai trò đã tham gia.');
      }
      record.status = 'cancelled';
    });
  }

  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key.startsWith(prefix) || event.key.startsWith(receiptPrefix)) notify();
  });
  window.addEventListener('pageshow', notify);
  window.addEventListener('ie104:proposals-updated', notify);
  window.IE104Supervision = Object.freeze({
    student, getAll, listForTeacher, listForStudent, studentCode, create, reply, decide, cancelProjectInvitation, getUnreadResponses, markResponsesRead, needsTeacherReply, canReply,
    attachmentLimit, getAttachment,
    subscribe(listener) {
      changes.addEventListener('change', listener);
      return () => changes.removeEventListener('change', listener);
    },
  });
})();
