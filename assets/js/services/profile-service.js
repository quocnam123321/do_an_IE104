(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};

  function validate(input) {
    const value = { name: String(input.name || '').trim(), email: String(input.email || '').trim(), phone: String(input.phone || '').trim().replace(/[\s().-]/g, '') };
    const errors = [];
    if (!value.name || value.name.length > 100) errors.push({ field: 'name', message: 'Nhập họ tên từ 1 đến 100 ký tự.' });
    if (value.email && (value.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email))) errors.push({ field: 'email', message: 'Nhập email hợp lệ hoặc để trống.' });
    if (value.phone && !/^\+?\d{7,15}$/.test(value.phone)) errors.push({ field: 'phone', message: 'Nhập số điện thoại từ 7 đến 15 chữ số, có thể bắt đầu bằng +, hoặc để trống.' });
    return { errors, value };
  }

  function getState() {
    const initial = app.data.studentProfile;
    const record = app.storage.readProfile();
    if (!record) return { ...initial, revision: 0 };
    if (record.code !== initial.code || validate(record).errors.length) throw new Error('Hồ sơ đã lưu không hợp lệ với sinh viên mẫu hiện tại.');
    return { ...initial, name: record.name, email: record.email, phone: record.phone, revision: record.revision, updatedAt: record.updatedAt };
  }

  function update(input, revision) {
    const previous = getState();
    if (!Number.isInteger(revision) || previous.revision !== revision) throw new Error('Hồ sơ đã thay đổi ở tab khác. Hãy đóng hộp thoại và mở lại để đọc bản mới.');
    const checked = validate(input);
    if (checked.errors.length) throw new Error(checked.errors[0].message);
    const record = { ...checked.value, code: previous.code, revision: revision + 1, updatedAt: new Date().toISOString() };
    app.storage.writeProfile(record);
    return { ...previous, ...record };
  }

  function validatePassword(input) {
    const errors = [];
    if (!input.current) errors.push({ field: 'current', message: 'Nhập mật khẩu hiện tại.' });
    if (!input.next) errors.push({ field: 'next', message: 'Nhập mật khẩu mới.' });
    if (input.next && input.next === input.current) errors.push({ field: 'next', message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
    if (!input.confirm || input.confirm !== input.next) errors.push({ field: 'confirm', message: 'Xác nhận mật khẩu mới chưa khớp.' });
    return errors;
  }

  app.services.profile = { getState, validate, update, validatePassword };
})();
