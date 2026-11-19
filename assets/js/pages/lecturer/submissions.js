(() => {
  const ui = globalThis.IE104?.ui?.lecturerWorkspace;
  if (!ui) return;
  const { el, button, field, modal, service } = ui;
  const panel = ui.region('submissions-section', 'bai-nop');
  let deleteMode = false;
  const fileChecks = new Set();
  const refreshFiles = () => fileChecks.forEach(check => check());
  window.addEventListener('focus', refreshFiles);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshFiles(); });
  const localDate = value => new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 16);
  function editRequirement(item) {
    modal(item ? 'Sửa yêu cầu bài nộp' : 'Tạo yêu cầu bài nộp', 'Lưu yêu cầu', body => {
      field(body, 'title', 'Tên yêu cầu', 'text', item?.title || '', { required: true, maxLength: 200 });
      field(body, 'content', 'Nội dung yêu cầu', 'textarea', item?.content || '', { required: true, maxLength: 5000, rows: 5 });
      field(body, 'deadline', 'Hạn nộp (giờ Việt Nam)', 'datetime-local', item ? localDate(item.deadline) : '', { required: true });
    }, (values, snapshot) => service.saveRequirement(snapshot.projectId, item?.id || null, Object.fromEntries(values), snapshot.revision));
  }
  function lock(item, locked) {
    modal(locked ? 'Khóa nhận bài' : 'Mở nhận bài', 'Xác nhận', body => {
      body.append(el('p', `${locked ? 'Khóa' : 'Mở'} nhận bài ${item ? `cho yêu cầu “${item.title}”` : 'cho toàn bộ đề tài'}?`));
      body.append(el('p', 'Khóa nhận bài không xóa bài đã nộp. Hạn nộp vẫn được dùng để xác định bài trễ hạn.'));
    }, (_, snapshot) => service.setLocked(snapshot.projectId, item?.id || null, locked, snapshot.revision));
  }
  function viewRequirement(item) {
    globalThis.IE104.ui.workflowDetails({ title: 'Chi tiết yêu cầu bài nộp', fields: [['Tên bài nộp', item.title], ['Nội dung yêu cầu', item.content, true], ['Hạn nộp', ui.date(item.deadline)]], actionText: 'Sửa yêu cầu', action: () => editRequirement(item), disabled: !ui.state?.canManageRequirements, extraActions: [{ text: item.locked ? 'Mở nhận bài' : 'Khóa nhận bài', action: () => lock(item, !item.locked), disabled: item.locked && !ui.state?.canManageRequirements }] });
  }
  function board(title, groups, cardBuilder, className) {
    const section = el('section', '', 'teaching-card');
    section.dataset.workflowBoard = title === 'Danh sách yêu cầu' ? 'requirements' : 'submissions';
    section.append(el('h3', title));
    const columns = el('div', '', `teaching-board ${className || ''}`);
    groups.forEach(group => {
      const column = el('section', '', 'teaching-column');
      const heading = el('h4', `${group.title} (${group.items.length})`);
      heading.prepend(globalThis.IE104.ui.workflowIcon(group.title === 'Đã nộp' || group.title === 'Chờ phản hồi' ? 'progress' : group.title === 'Đã phản hồi' ? 'done' : 'pending'));
      const list = el('div', '', 'teaching-column-list');
      list.tabIndex = 0;
      list.setAttribute('role', 'region');
      list.setAttribute('aria-label', group.title);
      group.items.forEach(item => list.append(cardBuilder(item)));
      if (!group.items.length) list.append(el('p', 'Chưa có dữ liệu.'));
      column.append(heading, list);
      columns.append(column);
    });
    section.append(columns);
    return section;
  }
  ui.subscribe(state => {
    fileChecks.clear();
    panel.replaceChildren();
    if (!state) return;
    const toolbar = el('div', '', 'teaching-toolbar');
    const mode = button(deleteMode ? 'Xong' : 'Xóa', () => { deleteMode = !deleteMode; ui.refresh(); }, !state.canManageRequirements); mode.classList.add('workflow-delete-mode'); mode.setAttribute('aria-pressed', String(deleteMode));
    toolbar.append(el('h2', 'Yêu cầu bài nộp'), button('+ Tạo yêu cầu', () => editRequirement(null), !state.canManageRequirements), button(state.submissionsLocked ? 'Mở nhận bài toàn đề tài' : 'Khóa nhận bài toàn đề tài', () => lock(null, !state.submissionsLocked), state.readOnly || (state.submissionsLocked && !state.canManageRequirements)));
    toolbar.children[1].classList.add('workflow-primary-action');
    toolbar.insertBefore(mode, toolbar.children[1]);
    if (deleteMode) toolbar.querySelector('h2').append(el('span', ' Chế độ xóa', 'student-delete-mode-label'));
    panel.append(toolbar, el('p', state.readOnly ? 'Chưa có dữ liệu yêu cầu và bài nộp cho nhóm này.' : state.submissionsLocked ? 'Toàn bộ đề tài đang khóa nhận bài.' : state.canManageRequirements ? 'Đang mở nhận bài theo từng yêu cầu.' : 'Đề tài đã hoàn thành. Không mở nhận bài mới.'));
    const requirements = state.requirements.filter(item => !item.deletedAt);
    const stage = item => {
      const linked = state.submissions.filter(submission => submission.requirementId === item.id);
      return linked.length ? linked.every(submission => Boolean(submission.feedback)) ? 'reviewed' : 'submitted' : item.sourceStage || 'pending';
    };
    panel.append(board('Danh sách yêu cầu', [['pending', 'Chưa nộp'], ['submitted', 'Đã nộp']].map(([id, title]) => ({ title, items: requirements.filter(item => id === 'pending' ? stage(item) === 'pending' : stage(item) !== 'pending') })), item => {
      const card = el('article', '', 'teaching-board-card');
      card.dataset.requirementId = item.id;
      const controls = el('div', '', 'teaching-actions');
      const hasSubmissions = state.submissions.some(submission => submission.requirementId === item.id) || item.sourceStage !== 'pending';
      const remove = button('Xóa', () => modal('Xóa yêu cầu bài nộp', 'Xóa yêu cầu', body => body.append(el('p', `Xóa yêu cầu “${item.title}”? Lịch sử thay đổi vẫn được giữ.`)), (_, snapshot) => service.deleteRequirement(snapshot.projectId, item.id, snapshot.revision)), !state.canManageRequirements || hasSubmissions);
      if (hasSubmissions) remove.title = 'Yêu cầu đã có bài nộp. Có thể khóa nhận bài để giữ lịch sử.';
      if (deleteMode) { remove.textContent = '−'; remove.classList.add('workflow-requirement-remove'); remove.setAttribute('aria-label', `Xóa yêu cầu: ${item.title}`); controls.append(remove); }
      const open = el('button', '', 'workflow-requirement-open'); open.type = 'button'; open.setAttribute('aria-haspopup', 'dialog'); const date=el('p','','workflow-card-date'); date.append(globalThis.IE104.ui.workflowIcon('calendar'),el('span',ui.date(item.deadline))); open.append(el('h5', item.title), date); open.addEventListener('click', () => viewRequirement(item));
      if (!hasSubmissions && Date.now() > Date.parse(item.deadline)) open.append(el('span','Quá hạn · Chưa nộp','workflow-overdue-badge'));
      card.append(open, controls);
      return card;
    }, 'teaching-board--two'));
    panel.append(board('Bài đã nộp', [false, true].map(reviewed => ({ title: reviewed ? 'Đã phản hồi' : 'Chờ phản hồi', items: state.submissions.filter(item => Boolean(item.feedback) === reviewed) })), item => {
      const card = el('article', '', 'teaching-board-card');
      card.dataset.submissionId = item.id;
      const fileName=el('p','','workflow-submission-file'), submitted=el('p','','workflow-submission-date'); fileName.append(globalThis.IE104.ui.workflowIcon('file'),el('span',item.fileName)); submitted.append(globalThis.IE104.ui.workflowIcon('calendar'),el('span',ui.date(item.submittedAt))); card.append(el('h5', item.title),fileName,submitted);
      const requirement = requirements.find(value => value.id === item.requirementId);
      if (requirement) { const late = Date.parse(item.submittedAt) > Date.parse(requirement.deadline); const badge=el('span',late?'Đã nộp trễ':'Đúng hạn','workflow-due-badge'); badge.dataset.late=String(late); badge.title=`Hạn nộp: ${ui.date(requirement.deadline)}. Ngày nộp: ${ui.date(item.submittedAt)}.`; card.append(badge); }
      if (!item.requirementId) card.append(el('p', 'Bài mẫu chưa liên kết yêu cầu.'));
      const files = globalThis.IE104.services.submissionFiles;
      let downloading = false;
      let checking = false;
      const fileStatus = el('p', 'Đang kiểm tra tệp…');
      fileStatus.dataset.fileStatus = 'checking';
      const retryFile = button('Kiểm tra lại tệp', async () => {
        await checkFile();
        if (retryFile.isConnected && fileStatus.dataset.fileStatus === 'ready') ui.notify('Tệp đã sẵn sàng để tải.');
      });
      retryFile.hidden = true;
      const download = button('Tải xuống', async () => {
        if (downloading || !files) return;
        downloading = true;
        download.disabled = true;
        download.textContent = 'Đang chuẩn bị…';
        try {
          const file = await files.read(state.projectId, item.id);
          if (!download.isConnected || ui.state?.projectId !== state.projectId) return;
          globalThis.IE104.ui.downloadFile(file);
        } catch (failure) {
          if (download.isConnected) ui.notify(failure.message, true);
        } finally {
          downloading = false;
          download.textContent = 'Tải xuống';
          if (download.isConnected) checkFile();
        }
      }, true);
      download.dataset.downloadSubmission = item.id;
      download.title = 'Đang kiểm tra nội dung tệp bài nộp.';
      async function checkFile() {
        if (checking || downloading || !download.isConnected) return;
        checking = true;
        download.disabled = true;
        retryFile.hidden = true;
        try {
          if (!files) throw new Error('Chưa tải được chức năng đọc tệp. Hãy tải lại trang.');
          const result = await files.availability(state.projectId, item.id);
          if (!download.isConnected) return;
          download.disabled = !result.available;
          download.title = result.available ? `Tải ${item.fileName}` : result.reason;
          fileStatus.textContent = result.available ? 'Tệp đã sẵn sàng.' : 'Chưa có nội dung tệp.';
          fileStatus.dataset.fileStatus = result.available ? 'ready' : 'missing';
        } catch (failure) {
          if (!download.isConnected) return;
          download.title = failure.message;
          fileStatus.textContent = 'Không đọc được tệp đã lưu.';
          fileStatus.dataset.fileStatus = 'error';
          retryFile.hidden = false;
        } finally { checking = false; }
      }
      const actions = el('div','','workflow-submission-actions');
      actions.append(download, button(item.feedback ? 'Xem phản hồi' : 'Phản hồi', () => modal('Phản hồi bài nộp', 'Lưu phản hồi', body => {
        body.append(el('h3', item.title), el('p', `${item.fileName} - ${ui.date(item.submittedAt)}`));
        field(body, 'submission-feedback', 'Nội dung phản hồi', 'textarea', item.feedback || '', { required: true, maxLength: 2000, rows: 6 });
        if (item.feedbackAt) body.append(el('p', `Phản hồi gần nhất: ${ui.date(item.feedbackAt)}`));
        item.feedbackHistory.slice().reverse().forEach(previous => body.append(el('p', `${previous.at ? ui.date(previous.at) : 'Phản hồi trước'}: ${previous.content}`, 'teaching-prewrap')));
      }, (values, snapshot) => service.saveFeedback(snapshot.projectId, item.id, values.get('submission-feedback'), snapshot.revision))), fileStatus, retryFile);
      actions.querySelector('button:nth-child(2)').classList.add('workflow-feedback-button');
      card.append(actions);
      queueMicrotask(checkFile);
      fileChecks.add(checkFile);
      return card;
    }, 'teaching-board--two'));
    panel.append(el('p', 'Chỉ tải được bài đã có nội dung tệp thật. Bài mới có tên tệp sẽ chưa bật tải xuống.'));
  });
})();
