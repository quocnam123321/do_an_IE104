(() => {
  const app = globalThis.IE104;
  const root = document.querySelector('[data-proposal-outline]');
  if (!root || !app?.data?.currentStudent) return;
  const keys = ['startDate', 'progressReportDate', 'finalReportDate', 'methodAndScope', 'plan'];
  const fields = Object.fromEntries(keys.map(key => [key, document.querySelector(`[data-outline-field="${key}"]`)]));
  const datePicker = app.ui?.proposalDatePicker;
  const membersTemplate = document.getElementById('proposal-edit-members');
  const supervisorId = document.getElementById('supervisor-id');
  let original;
  let members;
  let add;
  let count = 0;
  function addMember(value, leader = false) {
    const index = count++;
    const row = document.createElement('div');
    row.className = 'proposal-member';
    row.dataset.outlineMember = '';
    const heading = document.createElement('h3');
    heading.textContent = leader ? 'Sinh viên gửi đề xuất - Nhóm trưởng' : 'Thành viên thực hiện';
    row.append(heading);
    for (const [key, label] of [['name', 'Họ và tên'], ['code', 'MSSV']]) {
      const field = document.createElement('div');
      field.className = 'proposal-form__field';
      const caption = document.createElement('label');
      const input = document.createElement('input');
      input.id = `outline-member-${index}-${key}`;
      input.dataset.memberField = key;
      input.maxLength = key === 'code' ? 20 : 100;
      input.value = value?.[key] || '';
      input.readOnly = leader;
      const databaseLeader = leader && app.proposalDatabase;
      input.required = !(databaseLeader && key === 'code');
      if (databaseLeader && key === 'code') input.placeholder = 'Chưa có thông tin';
      caption.htmlFor = input.id;
      caption.textContent = databaseLeader && key === 'name' ? 'Tài khoản sinh viên' : label;
      field.append(caption, input);
      row.append(field);
    }
    row.dataset.role = leader ? 'nhom-truong' : 'thanh-vien';
    if (!leader) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'proposal-outline-button';
      remove.textContent = 'Xóa thành viên';
      remove.addEventListener('click', () => { row.remove(); add.disabled = false; add.focus(); });
      row.append(remove);
    }
    members.append(row);
    add.disabled = members.children.length >= 4;
    return row;
  }
  function mountMembers() {
    root.after(membersTemplate.content);
    members = document.getElementById('proposal-members');
    add = document.getElementById('proposal-add-member');
    add.addEventListener('click', () => {
      if (members.children.length >= 4) return;
      addMember().querySelector('input').focus();
    });
  }
  function fill(record) {
    original = record;
    const outline = { ...record?.outline };
    outline.finalReportDate ??= outline.endDate;
    outline.methodAndScope ??= [outline.method, outline.scope].filter(Boolean).join('\n\n');
    keys.forEach(key => {
      const field = fields[key];
      const value = outline[key] || '';
      if (datePicker && field.hasAttribute('data-proposal-picker')) datePicker.fill(field, value);
      else field.value = value;
    });
    if (!record) return;
    if (!members) mountMembers();
    members.replaceChildren();
    const people = outline.members || [{ ...(record?.student || app.data.currentStudent), role: 'nhom-truong' }];
    people.forEach(person => addMember(person, person.role === 'nhom-truong'));
    add.disabled = people.length >= 4;
  }
  function read() {
    const value = {
      version: 3,
      englishTitle: original?.outline?.englishTitle || '',
      endDate: original?.outline?.endDate || '',
      supervisor: supervisorId.value === original?.supervisorId ? { ...original.outline?.supervisor } : {},
      secondarySupervisor: { ...original?.outline?.secondarySupervisor },
    };
    keys.forEach(key => {
      const field = fields[key];
      value[key] = datePicker && field.hasAttribute('data-proposal-picker') ? datePicker.read(field) : field.value;
    });
    if (members) {
      value.members = [...members.children].map(row => ({ role: row.dataset.role,
        ...Object.fromEntries([...row.querySelectorAll('[data-member-field]')].map(input => [input.dataset.memberField, input.value])) }));
    }
    return value;
  }
  function getField(path) {
    const key = path.replace(/^outline\./, '');
    if (key === 'members') return members;
    const match = key.match(/^members\.(\d+)\.(code|name)$/);
    if (match) return members?.children[Number(match[1])]?.querySelector(`[data-member-field="${match[2]}"]`);
    return fields[key];
  }
  function setType(type) {
    for (const key of ['methodAndScope', 'plan']) {
      fields[key].required = type === 'khoa-luan';
      const star = fields[key].closest('.proposal-form__field').querySelector('[data-outline-required]');
      if (star) star.hidden = type !== 'khoa-luan';
    }
  }
  app.ui ||= {};
  app.ui.proposalOutline = { read, fill, getField, setType };
  fill();
})();
