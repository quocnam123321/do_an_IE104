(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};

  function validateRegistration(value, rules = { minMembers: 2, maxMembers: 3 }) {
    const errors = [];
    const groupName = String(value.groupName || '').trim();
    const message = String(value.message || '').trim();
    const members = (Array.isArray(value.members) ? value.members : []).map(member => ({
      code: String(member.code || '').trim().toUpperCase(),
      name: String(member.name || '').trim(),
      role: member.role,
    }));
    if (!groupName || groupName.length > 100) errors.push({ field: 'groupName', message: 'Nhập tên nhóm từ 1 đến 100 ký tự.' });
    if (message.length > 2000) errors.push({ field: 'message', message: 'Lời nhắn tối đa 2000 ký tự.' });
    if (members.length < rules.minMembers || members.length > rules.maxMembers) errors.push({ field: 'members', message: `Nhóm cần từ ${rules.minMembers} đến ${rules.maxMembers} thành viên.` });
    const seen = new Set();
    members.forEach((member, index) => {
      if (!member.code || member.code.length > 20 || /\s/.test(member.code)) errors.push({ field: `members.${index}.code`, message: 'Nhập MSSV tối đa 20 ký tự, không có khoảng trắng.' });
      if (member.code && seen.has(member.code)) errors.push({ field: `members.${index}.code`, message: 'MSSV này đã có trong nhóm.' });
      seen.add(member.code);
      if (!member.name || member.name.length > 100) errors.push({ field: `members.${index}.name`, message: 'Nhập họ tên từ 1 đến 100 ký tự.' });
      if (!['nhom-truong', 'thanh-vien'].includes(member.role)) errors.push({ field: `members.${index}.role`, message: 'Chọn vai trò hợp lệ.' });
    });
    if (members.filter(member => member.role === 'nhom-truong').length !== 1) errors.push({ field: 'members', message: 'Nhóm cần đúng một nhóm trưởng.' });
    return { errors, value: { groupName, message, members } };
  }

  function validateProposal(input, catalog) {
    const errors = [];
    const value = {};
    const labels = { title: 'tên đề tài', description: 'mô tả đề tài', objectives: 'mục tiêu', outcomes: 'kết quả dự kiến' };
    Object.entries(labels).forEach(([field, label]) => {
      value[field] = String(input[field] || '').trim();
      if (!value[field]) errors.push({ field, message: `Vui lòng nhập ${label}.` });
    });
    ['type', 'courseId', 'semester', 'academicYear', 'supervisorId'].forEach(field => { value[field] = String(input[field] || '').trim(); });
    const type = Object.hasOwn(catalog.types, value.type) ? catalog.types[value.type] : null;
    if (!type) errors.push({ field: 'type', message: 'Chọn loại đề tài hợp lệ.' });
    if (!type || !Object.hasOwn(type.courses, value.courseId)) errors.push({ field: 'courseId', message: 'Chọn môn học phù hợp với loại đề tài.' });
    if (!catalog.semesters.includes(value.semester)) errors.push({ field: 'semester', message: 'Chọn học kỳ hợp lệ.' });
    if (!catalog.academicYears.includes(value.academicYear)) errors.push({ field: 'academicYear', message: 'Chọn năm học hợp lệ.' });
    if (!Object.hasOwn(catalog.supervisors, value.supervisorId)) errors.push({ field: 'supervisorId', message: 'Vui lòng chọn giảng viên hướng dẫn.' });
    const file = input.attachment;
    value.attachment = null;
    if (file) {
      if (typeof file.name !== 'string' || !file.name.trim() || !Number.isFinite(file.size) || file.size < 0) errors.push({ field: 'attachment', message: 'Thông tin tệp không hợp lệ. Vui lòng chọn lại tệp.' });
      else value.attachment = { name: file.name, size: file.size, type: String(file.type || '') };
    }
    return { errors, value };
  }

  app.validation = { ...app.validation, validateRegistration, validateProposal };
})();
