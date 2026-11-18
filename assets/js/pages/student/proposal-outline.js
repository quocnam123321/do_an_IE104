(() => {
  const app = globalThis.IE104;
  const root = document.querySelector('[data-proposal-outline]');
  if (!root || !app?.data?.currentStudent) return;
  const keys = ['englishTitle', 'startDate', 'endDate', 'method', 'scope', 'plan', 'supervisor.degree', 'supervisor.workplace', 'secondarySupervisor.name', 'secondarySupervisor.degree', 'secondarySupervisor.workplace'];
  const fields = Object.fromEntries(keys.map(key => [key, document.querySelector(`[data-outline-field="${key}"]`)]));
  const members = document.getElementById('proposal-members');
  const add = document.getElementById('proposal-add-member');
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
      input.required = true;
      caption.htmlFor = input.id;
      caption.textContent = label;
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
  function fill(record) {
    const outline = record?.outline || {};
    keys.forEach(key => {
      const [a, b] = key.split('.');
      fields[key].value = b ? outline[a]?.[b] || '' : outline[a] || '';
    });
    members.replaceChildren();
    const people = outline.members || [{ ...(record?.student || app.data.currentStudent), role: 'nhom-truong' }];
    people.forEach(person => addMember(person, person.role === 'nhom-truong'));
    add.disabled = people.length >= 4;
  }
  add.disabled = false;
  add.addEventListener('click', () => {
    if (members.children.length >= 4) return;
    addMember().querySelector('input').focus();
  });
  function read() {
    const value = { version: 1, supervisor: { name: '' }, secondarySupervisor: {} };
    keys.forEach(key => {
      const [a, b] = key.split('.');
      if (b) value[a][b] = fields[key].value;
      else value[a] = fields[key].value;
    });
    value.members = [...members.children].map(row => ({ role: row.dataset.role,
      ...Object.fromEntries([...row.querySelectorAll('[data-member-field]')].map(input => [input.dataset.memberField, input.value])) }));
    return value;
  }
  function getField(path) {
    const key = path.replace(/^outline\./, '');
    if (key === 'members') return members;
    const match = key.match(/^members\.(\d+)\.(code|name)$/);
    if (match) return members.children[Number(match[1])]?.querySelector(`[data-member-field="${match[2]}"]`);
    return fields[key];
  }
  function setType(type) {
    for (const key of ['englishTitle', 'startDate', 'endDate', 'method', 'scope', 'plan']) {
      fields[key].required = type === 'khoa-luan';
      const star = fields[key].closest('.proposal-form__field').querySelector('[data-outline-required]');
      if (star) star.hidden = type !== 'khoa-luan';
    }
  }
  app.ui ||= {};
  app.ui.proposalOutline = { read, fill, getField, setType };
  fill();
})();
