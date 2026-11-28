(() => {
  'use strict';

  const card = document.querySelector('[data-supervision-shortcut]');
  if (!card) return;
  const isTeacher = card.dataset.supervisionShortcut === 'teacher';
  const summary = card.querySelector('[data-supervision-summary]');
  const link = card.querySelector('a');
  const preview = card.querySelector('[data-supervision-preview]');
  const rowTemplate = card.querySelector('[data-supervision-row]');
  const inboxUrl = link.href;
  const store = window.IE104Supervision;
  const entry = window.IE104SupervisionEntry;
  const previewDateFormat = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    hourCycle: 'h23', timeZone: 'Asia/Ho_Chi_Minh',
  });
  const previewLimit = 2;
  let currentStudent;
  let teacherSession;

  function invitationRow(record, index) {
    const row = rowTemplate.content.cloneNode(true);
    const title = row.querySelector('h3');
    title.id = `overview-invitation-title-${index}`;
    title.textContent = record.subject;

    const time = row.querySelector('time');
    if (isTeacher) {
      const code = store.studentCode(record);
      row.querySelector('[data-invitation-sender]').textContent = code
        ? `${record.student.name} · ${code}` : record.student.name;
      time.dateTime = record.messages.at(-1).sentAt;
    } else {
      row.querySelector('[data-invitation-recipient]').textContent = record.teacher.name;
      time.dateTime = record.createdAt;
    }
    const { day, month, year, hour, minute } = Object.fromEntries(previewDateFormat
      .formatToParts(new Date(time.dateTime)).map(({ type, value }) => [type, value]));
    time.textContent = `${hour}:${minute} · ${day}/${month}/${year}`;

    const action = row.querySelector('a');
    const destination = new URL(inboxUrl);
    destination.searchParams.set('loi-moi', record.id);
    action.href = destination.href;
    action.setAttribute('aria-describedby', title.id);
    return row;
  }

  function renderTeacher() {
    let waiting = [];
    let status;
    if (!teacherSession) {
      status = teacherSession === null
        ? 'Đăng nhập bằng tài khoản giảng viên để xem lời mời đã nhận.'
        : 'Đang kiểm tra phiên đăng nhập…';
    } else {
      try {
        waiting = store.listForTeacher(teacherSession).filter(store.needsTeacherReply).slice(0, previewLimit);
        status = waiting.length ? '' : 'Hiện chưa có lời mời nào cần giảng viên phản hồi.';
      } catch (error) {
        status = error.message;
      }
    }
    summary.textContent = status;
    summary.hidden = !status;
    preview.replaceChildren(...waiting.map(invitationRow));
    preview.hidden = !waiting.length;
  }

  function renderStudent() {
    let sent = [];
    let status;
    if (!currentStudent) {
      status = currentStudent === null
        ? 'Đăng nhập bằng tài khoản sinh viên để theo dõi lời mời và phản hồi.'
        : 'Đang kiểm tra phiên đăng nhập…';
    } else {
      try {
        sent = store.listForStudent(currentStudent)
          .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
          .slice(0, previewLimit);
        status = sent.length ? '' : 'Bạn chưa gửi lời mời hướng dẫn.';
      } catch (error) {
        status = error.message;
      }
    }
    summary.textContent = status;
    summary.hidden = !status;
    preview.replaceChildren(...sent.map(invitationRow));
    preview.hidden = !sent.length;
  }

  const render = isTeacher ? renderTeacher : renderStudent;
  store.subscribe(render);
  render();
  const refreshSession = async () => {
    if (isTeacher) {
      teacherSession = undefined;
      render();
      teacherSession = await entry.getTeacherInboxSession().catch(() => null);
    } else {
      currentStudent = undefined;
      render();
      currentStudent = await entry.getStudent().catch(() => null);
    }
    render();
  };
  refreshSession();
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) refreshSession();
  });
})();
