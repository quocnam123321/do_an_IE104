(() => {
  const service = globalThis.IE104?.services?.requests;
  const articles = [...document.querySelectorAll('.request-detail[data-request-type="dang-ky"]')];
  const legacyProposals = [...document.querySelectorAll('.request-detail[data-request-type="de-xuat"]')];
  const dialog = document.getElementById('request-action-dialog');
  if (!service || !articles.length || !dialog) return;
  const backLink = articles[0].querySelector('.request-detail__back');
  document.body.classList.add('legacy-requests-enhanced');
  const status = document.querySelector('[data-request-result]');
  const error = dialog.querySelector('[data-request-action-error]');
  const confirm = dialog.querySelector('[data-request-confirm]');
  const title = dialog.querySelector('h2');
  const summary = dialog.querySelector('[data-request-review]');
  let pending = null;
  let editing = false;
  let saving = false;
  const actionNames = { edit: 'Lưu chỉnh sửa thử', withdraw: 'Rút yêu cầu thử', resubmit: 'Gửi lại yêu cầu thử', remove: 'Xóa khỏi danh sách thử' };
  const proposalUrl = id => `chi-tiet-de-tai-cho-duyet-sinh-vien.html?proposal=${encodeURIComponent(id)}`;

  function node(tag, text, className) {
    const item = document.createElement(tag);
    if (text !== undefined) item.textContent = text;
    if (className) item.className = className;
    return item;
  }

  function row(list, label, value) {
    const item = node('div');
    item.append(node('dt', label), node('dd', value || 'Chưa có thông tin'));
    list.append(item);
  }

  function navigate(hash) {
    history.pushState(null, '', hash);
    editing = false;
    render();
    if (hash.endsWith('-chinh-sua')) document.querySelector(`${hash} input, ${hash} textarea, ${hash} select`)?.focus();
  }

  function review(record, action, input = null) {
    pending = { id: record.id, revision: record.revision, action, input };
    title.textContent = actionNames[action];
    summary.replaceChildren();
    const details = node('dl');
    const value = { ...record, ...(input || {}) };
    row(details, 'Mã yêu cầu', record.id);
    row(details, 'Đề tài', value.title);
    if (input) {
      row(details, 'Hình thức', value.mode === 'nhom' ? 'Nhóm' : 'Cá nhân');
      if (value.mode === 'nhom') row(details, 'Nhóm', value.groupName);
      row(details, 'Thành viên', value.members.map(member => `${member.name} - ${member.code} - ${member.role === 'nhom-truong' ? 'Nhóm trưởng' : 'Thành viên'}`).join('\n'));
      row(details, 'Lời nhắn', value.message);
    }
    summary.append(details, node('p', action === 'remove' ? 'Yêu cầu sẽ được ẩn khỏi danh sách, bản lưu và lịch sử vẫn được giữ. Chưa gửi thao tác đến hệ thống.' : 'Thao tác chỉ lưu trên trình duyệt này, chưa gửi đến giảng viên hoặc hệ thống.'));
    error.hidden = true;
    confirm.textContent = actionNames[action];
    dialog.showModal();
  }

  function buildEditor(record) {
    const slug = record.id.toLowerCase();
    const section = node('section', undefined, 'request-detail__edit');
    section.id = `${slug}-chinh-sua`;
    section.append(node('h3', `Chỉnh sửa ${record.id}`));
    const form = node('form', undefined, 'legacy-request-form');
    form.noValidate = true;
    const formError = node('p', '', 'legacy-request-error');
    formError.setAttribute('role', 'alert');
    formError.id = `request-edit-error-${slug}`;
    formError.hidden = true;
    form.append(formError);

    function field(parent, key, label, value, options = null, multiline = false) {
      const wrapper = node('div', undefined, 'legacy-request-field');
      const control = node(options ? 'select' : multiline ? 'textarea' : 'input');
      control.id = `request-edit-${slug}-${key}`;
      control.name = key;
      control.setAttribute('aria-describedby', formError.id);
      if (!options && !multiline) control.type = 'text';
      if (multiline) control.rows = 3;
      if (options) options.forEach(([id, text]) => control.add(new Option(text, id)));
      control.value = value || '';
      const caption = node('label', label);
      caption.htmlFor = control.id;
      wrapper.append(caption, control);
      parent.append(wrapper);
      return control;
    }

    const mode = field(form, 'mode', 'Hình thức', record.mode, record.allowedModes.map(value => [value, value === 'nhom' ? 'Nhóm' : 'Cá nhân']));
    const group = field(form, 'groupName', 'Tên nhóm *', record.groupName);
    group.maxLength = 100;
    const members = node('fieldset', undefined, 'legacy-request-members');
    members.append(node('legend', 'Thành viên trong yêu cầu'));
    const memberRows = node('div');
    members.append(memberRows);
    const add = node('button', '+ Thêm thành viên');
    add.type = 'button';
    members.append(add);
    form.append(members);
    let draftMembers = record.members.map(member => ({ ...member }));
    let groupMembers = record.members.map(member => ({ ...member }));
    function readMembers() {
      return [...memberRows.children].map(item => Object.fromEntries(['name', 'code', 'role'].map(key => [key, item.querySelector(`[data-member-field="${key}"]`).value])));
    }
    function drawMembers() {
      memberRows.replaceChildren();
      draftMembers.forEach((member, index) => {
        const item = node('div', undefined, 'legacy-member-row');
        [['name', 'Họ tên', null], ['code', 'MSSV', null], ['role', 'Vai trò', [['nhom-truong', 'Nhóm trưởng/người gửi'], ['thanh-vien', 'Thành viên']]]].forEach(([key, label, options]) => {
          const control = field(item, `member-${index}-${key}`, `${label} ${index + 1}`, member[key], options);
          control.dataset.memberField = key;
        });
        if (mode.value === 'nhom') {
          const remove = node('button', `Xóa thành viên ${index + 1}`);
          remove.type = 'button';
          remove.disabled = draftMembers.length <= 2;
          remove.addEventListener('click', () => { draftMembers = readMembers(); draftMembers.splice(index, 1); drawMembers(); });
          item.append(remove);
        }
        memberRows.append(item);
      });
      add.hidden = mode.value !== 'nhom';
      add.disabled = draftMembers.length >= 3;
      group.closest('.legacy-request-field').hidden = mode.value !== 'nhom';
    }
    mode.addEventListener('change', () => {
      draftMembers = readMembers();
      if (mode.value === 'ca-nhan') { groupMembers = draftMembers; draftMembers = [{ ...draftMembers[0], role: 'nhom-truong' }]; }
      else draftMembers = groupMembers.length >= 2 ? groupMembers : [...draftMembers, { name: '', code: '', role: 'thanh-vien' }];
      drawMembers();
    });
    add.addEventListener('click', () => {
      draftMembers = readMembers();
      if (draftMembers.length >= 3) return;
      draftMembers.push({ name: '', code: '', role: 'thanh-vien' });
      drawMembers();
      memberRows.lastElementChild.querySelector('input').focus();
    });
    drawMembers();
    field(form, 'message', 'Lời nhắn', record.message, null, true).maxLength = 2000;
    const actions = node('div', undefined, 'legacy-request-actions');
    const save = node('button', 'Lưu chỉnh sửa');
    save.type = 'submit';
    save.dataset.action = 'edit';
    actions.append(save);
    if (service.permissions(record).resubmit) {
      const send = node('button', 'Lưu và gửi lại');
      send.type = 'submit';
      send.dataset.action = 'resubmit';
      actions.append(send);
    }
    const cancel = node('button', 'Hủy');
    cancel.type = 'button';
    cancel.addEventListener('click', () => navigate(`#${slug}`));
    actions.append(cancel);
    form.append(actions);
    form.addEventListener('submit', event => {
      event.preventDefault();
      form.querySelectorAll('[aria-invalid]').forEach(control => control.removeAttribute('aria-invalid'));
      const input = { ...Object.fromEntries(new FormData(form)), members: readMembers() };
      const checked = service.validate(input, record);
      if (checked.errors.length) {
        formError.textContent = checked.errors.map(item => item.message).join(' ');
        formError.hidden = false;
        let first;
        checked.errors.forEach(item => {
          const match = item.field.match(/^members\.(\d+)\.(\w+)$/);
          const control = match ? memberRows.children[Number(match[1])]?.querySelector(`[data-member-field="${match[2]}"]`) : form.elements.namedItem(item.field);
          if (control) { control.setAttribute('aria-invalid', 'true'); first ||= control; }
        });
        if (first) first.focus();
        else { formError.tabIndex = -1; formError.focus(); }
        return;
      }
      formError.hidden = true;
      review(record, event.submitter?.dataset.action === 'resubmit' ? 'resubmit' : 'edit', checked.value);
    });
    section.append(form);
    return section;
  }

  function render() {
    try {
      const records = service.list(true);
      const selectedProposal = legacyProposals.find(article => location.hash === `#${article.id}` || location.hash.startsWith(`#${article.id}-`));
      if (selectedProposal) {
        const record = records.find(item => item.id === selectedProposal.dataset.requestId);
        const editingProposal = location.hash === `#${selectedProposal.id}-chinh-sua` && service.permissions(record).edit;
        location.replace(editingProposal ? `tao-de-xuat.html?proposal=${encodeURIComponent(record.id)}` : proposalUrl(selectedProposal.dataset.requestId));
        return;
      }
      editing = false;
      articles.forEach(article => {
        const record = records.find(item => item.id === article.dataset.requestId);
        const slug = article.id;
        const permission = service.permissions(record);
        if (location.hash === `#${slug}-chinh-sua` && !permission.edit) history.replaceState(null, '', `#${slug}`);
        article.dataset.requestActive = String(location.hash === `#${slug}` || location.hash.startsWith(`#${slug}-`));
        const heading = node('h2', `${record.id} - Đăng ký đề tài`);
        heading.id = `${slug}-title`;
        article.replaceChildren(heading);
        if (backLink) article.append(backLink.cloneNode(true));
        if (record.deletedAt) { article.append(node('p', 'Yêu cầu đã được xóa khỏi danh sách thử. Bản lưu lịch sử vẫn được giữ.')); return; }
        article.dataset.requestStatus = record.status;
        article.append(node('h3', record.title));
        const details = node('dl', undefined, 'request-detail__meta');
        [['Trạng thái', service.labels[record.status]], ['Hình thức', record.mode === 'nhom' ? 'Nhóm' : 'Cá nhân'], ['Giảng viên tiếp nhận', record.lecturerName], ['Ngày gửi ban đầu', new Date(record.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })]].forEach(([label, value]) => row(details, label, value));
        if (record.mode === 'nhom') row(details, 'Tên nhóm', record.groupName);
        row(details, 'Thành viên', record.members.map(member => `${member.name} - ${member.code} - ${member.role === 'nhom-truong' ? 'Nhóm trưởng/người gửi' : 'Thành viên'}`).join('\n'));
        if (record.resubmittedAt) row(details, 'Gửi lại gần nhất', new Date(record.resubmittedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));
        row(details, record.resubmittedAt ? 'Phản hồi trước khi gửi lại' : 'Phản hồi gần nhất', record.feedback);
        row(details, 'Lời nhắn', record.message);
        article.append(details);
        const actions = node('div', undefined, 'legacy-request-actions');
        if (permission.edit) {
          const edit = node('button', 'Chỉnh sửa');
          edit.type = 'button';
          edit.addEventListener('click', () => navigate(`#${slug}-chinh-sua`));
          actions.append(edit);
        }
        ['withdraw', 'remove'].forEach(action => {
          if (!permission[action]) return;
          const button = node('button', action === 'withdraw' ? 'Rút yêu cầu' : 'Xóa khỏi danh sách');
          button.type = 'button';
          button.addEventListener('click', () => review(record, action));
          actions.append(button);
        });
        article.append(actions);
        if (permission.edit) {
          const editor = buildEditor(record);
          editor.hidden = location.hash !== `#${slug}-chinh-sua`;
          if (!editor.hidden) editing = true;
          article.append(editor);
        } else article.append(node('p', 'Trạng thái hiện tại chỉ cho xem lại yêu cầu.'));
        if (record.history.length) {
          const history = node('details');
          history.append(node('summary', 'Lịch sử thao tác thử'));
          const list = node('ol');
          record.history.forEach(item => list.append(node('li', `${new Date(item.at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} - ${actionNames[item.action]} - ${service.labels[item.from]} → ${service.labels[item.to]}`)));
          history.append(list);
          article.append(history);
        }
      });
      const menu = document.querySelector('.request-detail-notice ul');
      const chooser = document.querySelector('.request-detail-notice');
      if (chooser) chooser.hidden = articles.some(article => article.dataset.requestActive === 'true');
      if (menu) {
        menu.replaceChildren();
        records.filter(record => !record.deletedAt).forEach(record => {
          const item = node('li');
          const link = node('a', `${record.id} - ${record.title} - ${service.labels[record.status]}`);
          link.href = record.kind === 'de-xuat' ? proposalUrl(record.id) : `#${record.id.toLowerCase()}`;
          item.append(link);
          menu.append(item);
        });
      }
      document.body.dataset.requestsReady = 'true';
    } catch (failure) {
      articles.forEach(article => { const heading = node('h2', article.dataset.requestId); heading.id = `${article.id}-title`; article.replaceChildren(heading, node('p', failure.message)); });
      status.textContent = failure.message;
    }
  }

  confirm.addEventListener('click', () => {
    if (!pending || saving) return;
    saving = true;
    confirm.disabled = true;
    try {
      const record = service.mutate(pending.id, pending.revision, pending.action, pending.input);
      dialog.close();
      navigate(`#${record.id.toLowerCase()}`);
      status.textContent = 'Đã lưu thao tác thử trên trình duyệt. Chưa gửi đến giảng viên hoặc hệ thống.';
      status.tabIndex = -1;
      status.focus();
    } catch (failure) { error.textContent = failure.message; error.hidden = false; error.focus(); }
    finally { saving = false; confirm.disabled = false; }
  });
  dialog.addEventListener('close', () => { pending = null; });
  window.addEventListener('hashchange', render);
  window.addEventListener('popstate', render);
  window.addEventListener('storage', event => {
    if (![globalThis.IE104.storage.requestKey, null].includes(event.key) && !event.key?.startsWith('ie104.proposal-decision.v1.')) return;
    if (editing || dialog.open) status.textContent = 'Dữ liệu yêu cầu đã thay đổi ở tab khác. Biểu mẫu đang nhập được giữ lại; cần mở lại trước khi xác nhận.';
    else render();
  });
  window.addEventListener('pageshow', () => { if (!editing && !dialog.open) render(); });
  render();
})();
