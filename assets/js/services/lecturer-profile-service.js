(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services ||= {};
  const prefix = 'ie104.demo.lecturer-profile.v1.';
  const actor = () => app.data.currentLecturer;
  const key = () => prefix + actor().id;
  function validate(input) {
    const value = Object.fromEntries(['name', 'email', 'phone', 'expertise'].map(field => [field, String(input[field] || '').trim()]));
    value.phone = value.phone.replace(/[\s().-]/g, '');
    const errors = [];
    if (!value.name || value.name.length > 100) errors.push({ field: 'name', message: 'Nhập họ tên từ 1 đến 100 ký tự.' });
    if (!value.email || value.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) errors.push({ field: 'email', message: 'Nhập email hợp lệ.' });
    if (value.phone && !/^\+?\d{7,15}$/.test(value.phone)) errors.push({ field: 'phone', message: 'Số điện thoại cần có 7 đến 15 chữ số.' });
    if (value.expertise.length > 500) errors.push({ field: 'expertise', message: 'Chuyên môn tối đa 500 ký tự.' });
    return { value, errors };
  }
  function getState() {
    if (globalThis.location?.protocol === 'file:') throw new Error('Mở website qua localhost để lưu hồ sơ thử giữa các trang.');
    const initial = { id: actor().id, name: actor().name, email: '', phone: '', expertise: '', avatar: '', revision: 0 };
    try {
      const raw = localStorage.getItem(key());
      if (raw === null) return initial;
      const parsed = JSON.parse(raw);
      const record = parsed.record;
      if (parsed.version !== 1 || !record || record.id !== initial.id || !Number.isInteger(record.revision) || record.revision < 1 ||
          !Number.isFinite(Date.parse(record.updatedAt)) || !['name', 'email', 'phone', 'expertise', 'avatar'].every(field => typeof record[field] === 'string') ||
          !record.name.trim() || record.name.length > 100 || validate(record).errors.some(item => item.field !== 'email' || record.email) ||
          (record.avatar && (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/.test(record.avatar) || record.avatar.length > 3000000))) throw new Error();
      return { ...initial, ...record };
    } catch { throw new Error('Không đọc được hồ sơ giảng viên đã lưu. Dữ liệu cũ chưa bị thay thế.'); }
  }
  async function update(input, revision, expectedId, avatar) {
    const commit = () => {
      if (actor().id !== expectedId) throw new Error('Giảng viên hiện tại đã thay đổi. Hãy mở lại hộp thoại.');
      const previous = getState();
      if (!Number.isInteger(revision) || previous.revision !== revision) throw new Error('Hồ sơ đã thay đổi ở tab khác. Hãy mở lại để đọc bản mới.');
      const checked = validate(input);
      if (avatar === undefined && checked.errors.length) throw new Error(checked.errors[0].message);
      if (avatar !== undefined && avatar !== '' && (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/.test(avatar) || avatar.length > 3000000)) throw new Error('Ảnh đại diện không hợp lệ.');
      const record = { ...previous, ...(avatar === undefined ? checked.value : { avatar }), revision: revision + 1, updatedAt: new Date().toISOString() };
      try { localStorage.setItem(key(), JSON.stringify({ version: 1, record })); }
      catch { throw new Error('Chưa lưu được hồ sơ. Trình duyệt có thể chặn lưu trữ hoặc đã hết dung lượng.'); }
      globalThis.dispatchEvent?.(new Event('ie104:lecturer-profile-updated'));
      return record;
    };
    return globalThis.navigator?.locks?.request ? navigator.locks.request(key(), commit) : commit();
  }
  app.services.lecturerProfile = { prefix, getState, validate, update };
})();
