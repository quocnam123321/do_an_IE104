(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};

  function validateRegistration(value, rules = { minMembers: 2, maxMembers: 3 }) {
    const errors = [];
    const groupName = String(value.groupName || '').trim();
    const message = String(value.message || '').trim();
    const members = (Array.isArray(value.members) ? value.members : []).map(member => ({
      code: String(member?.code || '').trim().toUpperCase(),
      name: String(member?.name || '').trim(),
      role: member?.role,
    }));
    const groupNameRequired = rules.groupNameRequired !== false;
    if ((!groupName && groupNameRequired) || groupName.length > 100) {
      errors.push({ field: 'groupName', message: groupNameRequired ? 'Nhập tên nhóm từ 1 đến 100 ký tự.' : 'Tên nhóm tối đa 100 ký tự.' });
    }
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

  function validateProposalOutline(input, type, student) {
    const errors = [];
    if (!input || input.version !== 1) return { errors: [{ field: 'outline.englishTitle', message: 'Thông tin đề cương không hợp lệ.' }], value: null };
    const value = { version: 1 };
    const limits = { englishTitle: 250, startDate: 10, endDate: 10, method: 10000, scope: 10000, plan: 10000 };
    const labels = { englishTitle: 'tên tiếng Anh', startDate: 'ngày bắt đầu', endDate: 'ngày kết thúc', method: 'phương pháp thực hiện', scope: 'nội dung chính, phạm vi và cách đánh giá', plan: 'kế hoạch thực hiện và phân công' };
    Object.entries(limits).forEach(([key, max]) => {
      value[key] = String(input[key] || '').trim();
      if (value[key].length > max) errors.push({ field: `outline.${key}`, message: `${labels[key]} tối đa ${max} ký tự.` });
      if (type === 'khoa-luan' && !value[key]) errors.push({ field: `outline.${key}`, message: `Vui lòng nhập ${labels[key]} cho đề cương khóa luận.` });
    });
    const validDate = text => /^\d{4}-\d{2}-\d{2}$/.test(text) && Number.isFinite(Date.parse(text)) && new Date(text).toISOString().slice(0, 10) === text && Number(text.slice(0, 4)) > 0;
    for (const key of ['startDate', 'endDate']) if (value[key] && !validDate(value[key])) errors.push({ field: `outline.${key}`, message: 'Chọn ngày tồn tại theo định dạng ngày/tháng/năm.' });
    if (type !== 'khoa-luan' && Boolean(value.startDate) !== Boolean(value.endDate)) errors.push({ field: `outline.${value.startDate ? 'endDate' : 'startDate'}`, message: 'Điền cả ngày bắt đầu và kết thúc dự kiến.' });
    if (validDate(value.startDate) && validDate(value.endDate) && value.endDate <= value.startDate) errors.push({ field: 'outline.endDate', message: 'Ngày kết thúc phải sau ngày bắt đầu.' });
    for (const key of ['supervisor', 'secondarySupervisor']) {
      const person = input[key] || {};
      value[key] = {};
      for (const field of ['name', 'degree', 'workplace']) {
        value[key][field] = String(person[field] || '').trim();
        if (value[key][field].length > 250) errors.push({ field: `outline.${key}.${field}`, message: 'Thông tin người hướng dẫn tối đa 250 ký tự mỗi mục.' });
      }
    }
    if (!value.secondarySupervisor.name && (value.secondarySupervisor.degree || value.secondarySupervisor.workplace)) errors.push({ field: 'outline.secondarySupervisor.name', message: 'Nhập tên người hướng dẫn phụ hoặc xóa học vị và đơn vị công tác tương ứng.' });
    const members = validateRegistration({ groupName: 'Đề cương', members: input.members }, { minMembers: 1, maxMembers: 4 });
    errors.push(...members.errors.map(error => ({ ...error, field: `outline.${error.field}` })));
    value.members = members.value.members;
    if (student && !value.members.some(member => member.code === student.code && member.name === student.name && member.role === 'nhom-truong')) errors.push({ field: 'outline.members', message: 'Sinh viên gửi đề xuất phải là nhóm trưởng trong danh sách thực hiện.' });
    return { errors, value };
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
    if (input.outline !== undefined) {
      const checked = validateProposalOutline(input.outline, value.type, app.data.currentStudent);
      value.outline = checked.value;
      if (value.outline) value.outline.supervisor.name = catalog.supervisors[value.supervisorId] || ''; 
      errors.push(...checked.errors);
    }
    const file = input.attachment;
    value.attachment = null;
    if (file) {
      if (typeof file.name !== 'string' || !file.name.trim() || !Number.isFinite(file.size) || file.size < 0) errors.push({ field: 'attachment', message: 'Thông tin tệp không hợp lệ. Vui lòng chọn lại tệp.' });
      else value.attachment = { name: file.name, size: file.size, type: String(file.type || '') };
    }
    return { errors, value };
  }

  app.validation = { ...app.validation, validateRegistration, validateProposal, validateProposalOutline };
})();
