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
    if (!record || id !== record.id || !isTeacher(record.teacher) ||
        !isStudent(record.student) ||
        !isText(record.subject, subjectLimit) || !isDate(record.createdAt) || !isDate(record.updatedAt) ||
        !Array.isArray(record.messages) || record.messages[0]?.role !== 'student') {
      return false;
    }
    const hasValidDecision = record.status === 'pending'
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
    if (raw === null) return null;
    try {
      const record = JSON.parse(raw);
      if (isRecord(record, id)) return record;
    } catch {
      // Báo lỗi bên dưới để cả dữ liệu cũ và JSON lỗi có cùng thông báo.
    }
    throw new Error('Dữ liệu lời mời đã lưu không hợp lệ.');
  }

  function getAll() {
    const ids = [];
    try {
      const storage = window.localStorage;
      for (let index = 0; index < storage.length; index++) {
        const key = storage.key(index);
        if (key?.startsWith(prefix)) ids.push(key.slice(prefix.length));
      }
    } catch {
      throw new Error('Không đọc được lời mời. Hãy kiểm tra quyền lưu trữ của trình duyệt.');
    }
    return ids.map(read).filter(Boolean).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
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
    return Math.max(0, responseCount(record) - readReceipt(receiptKey(record)));
  }

  async function markResponsesRead(record) {
    // Chỉ đánh dấu các phản hồi trong bản lời mời mà sinh viên đang xem.
    const count = responseCount(record);
    if (count === 0) return false;
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

  function needsTeacherReply(record) {
    return record.status === 'pending' && record.messages.at(-1)?.role === 'student';
  }

  async function create({ student: sender = student, teacher, subject, message, attachment }) {
    if (!isStudent(sender)) throw new Error('Tài khoản sinh viên gửi lời mời không hợp lệ.');
    if (!isTeacher(teacher)) throw new Error('Giảng viên nhận lời mời không hợp lệ.');
    const title = validateText(subject, 'Tiêu đề', subjectLimit);
    const text = validateText(message, 'Lời nhắn', messageLimit);
    return withAttachment(attachment, (metadata) => {
      const now = new Date().toISOString();
      const initial = { role: 'student', text, sentAt: now };
      if (metadata) initial.attachment = metadata;
      const record = {
        id: randomId(),
        teacher: { id: teacher.id, name: teacher.name.trim() },
        student: { id: sender.id, name: sender.name.trim() },
        subject: title,
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
  }

  async function update(id, change) {
    const save = () => {
      const record = read(id);
      if (!record) throw new Error('Không tìm thấy lời mời.');
      if (record.status !== 'pending') throw new Error('Giảng viên đã phản hồi lời mời này.');
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
    const text = validateText(message, 'Phản hồi', messageLimit);
    return withAttachment(attachment, (metadata) => update(id, (record, now) => {
      const fromStudent = actor?.role === 'student' && actor.id === record.student.id;
      const fromTeacher = actor?.role === 'teacher' && actor.id === record.teacher.id;
      if (!fromStudent && !fromTeacher) throw new Error('Vui lòng mở lời mời bằng đúng vai trò đã tham gia.');
      const response = { role: actor.role, text, sentAt: now };
      if (metadata) response.attachment = metadata;
      record.messages.push(response);
    }));
  }

  async function decide(id, teacherId, status, note = '') {
    if (!finalStatuses.includes(status)) throw new Error('Quyết định không hợp lệ.');
    const text = validateText(note, 'Lời nhắn kèm theo', messageLimit, true);
    return update(id, (record, now) => {
      if (record.teacher.id !== teacherId) throw new Error('Chỉ giảng viên nhận lời mời mới có thể quyết định.');
      record.status = status;
      record.decision = { at: now, note: text };
    });
  }

  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key.startsWith(prefix) || event.key.startsWith(receiptPrefix)) notify();
  });
  window.addEventListener('pageshow', notify);
  window.IE104Supervision = Object.freeze({
    student, getAll, create, reply, decide, getUnreadResponses, markResponsesRead, needsTeacherReply,
    attachmentLimit, getAttachment,
    subscribe(listener) {
      changes.addEventListener('change', listener);
      return () => changes.removeEventListener('change', listener);
    },
  });
})();
