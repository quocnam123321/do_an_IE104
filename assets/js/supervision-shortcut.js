(() => {
  'use strict';

  const card = document.querySelector('[data-supervision-shortcut]');
  const isTeacher = card.dataset.supervisionShortcut === 'teacher';
  const summary = card.querySelector('[data-supervision-summary]');
  const link = card.querySelector('a');
  const inboxUrl = link.href;
  const store = window.IE104Supervision;
  const entry = window.IE104SupervisionEntry;
  const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  let currentStudent;
  let teacherSession;

  function latestResponse(records) {
    let latest;
    for (const record of records) {
      if (record.student.id !== currentStudent.id) continue;
      const time = record.decision?.at ?? record.messages.findLast(({ role }) => role === 'teacher')?.sentAt;
      if (time && (!latest || Date.parse(time) > Date.parse(latest.time))) latest = { record, time };
    }
    return latest;
  }

  function render() {
    link.href = inboxUrl;
    link.textContent = 'Xem lời mời';

    if (!isTeacher && !currentStudent) {
      summary.textContent = currentStudent === null
        ? 'Đăng nhập bằng tài khoản sinh viên để theo dõi lời mời và phản hồi.'
        : 'Đang kiểm tra phiên đăng nhập…';
      return;
    }

    if (isTeacher && !teacherSession) {
      summary.textContent = teacherSession === null
        ? 'Đăng nhập bằng tài khoản giảng viên để xem lời mời đã nhận.'
        : 'Đang kiểm tra phiên đăng nhập…';
      return;
    }

    let records;
    try {
      records = store.getAll();
    } catch (error) {
      summary.textContent = error.message;
      return;
    }

    if (isTeacher) {
      const waiting = records.filter(record => (teacherSession.demo || teacherSession.teacherIds.includes(record.teacher.id)) &&
        store.needsTeacherReply(record)).length;
      summary.textContent = waiting ? `${waiting} lời mời đang chờ trả lời`
        : 'Hiện chưa có lời mời nào cần giảng viên phản hồi.';
      return;
    }

    const latest = latestResponse(records);
    if (!latest) {
      summary.textContent = 'Chưa có phản hồi từ giảng viên.';
      return;
    }
    const { record, time } = latest;
    const label = record.status === 'accepted' ? 'Đã đồng ý hướng dẫn'
      : record.status === 'rejected' ? 'Đã từ chối'
      : 'Đã gửi phản hồi';
    summary.textContent = `${label} · ${record.subject} · ${dateFormat.format(new Date(time))}`;
    const destination = new URL(inboxUrl);
    destination.searchParams.set('loi-moi', record.id);
    link.href = destination.href;
    link.textContent = 'Xem phản hồi';
  }

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
