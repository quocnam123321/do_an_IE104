(() => {
  'use strict';

  const entry = window.IE104SupervisionEntry;
  const store = window.IE104Supervision;
  const form = document.getElementById('invitation-form');
  const subject = form.elements.subject;
  const message = form.elements.message;
  const attachment = window.IE104SupervisionAttachments.createPicker(form.querySelector('[data-supervision-picker]'), 'invitation-attachment');
  const submit = document.getElementById('invitation-send');
  const error = document.getElementById('invitation-error');
  const loading = document.getElementById('invitation-load');
  const teacherId = new URLSearchParams(location.search).get('giang-vien');
  let teacher;
  let saving = false;

  function validate(field, label) {
    const value = field.value.trim();
    const hint = document.getElementById(`${field.id}-error`);
    const problem = !value ? `Vui lòng nhập ${label}.`
      : value.length > field.maxLength ? `${label} được nhập tối đa ${field.maxLength} ký tự.`
      : '';
    hint.textContent = problem;
    hint.hidden = !problem;
    if (problem) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    return !problem;
  }

  async function initialize() {
    if (!teacherId) {
      error.textContent = 'Hãy chọn giảng viên từ trang Hướng nghiên cứu để gửi lời mời.';
      return;
    }
    try {
      if (!entry.hasStudentSession()) {
        location.replace(entry.getLoginUrl(teacherId));
        return;
      }
      loading.hidden = false;
      teacher = await entry.getTeacher(teacherId);
      document.getElementById('invitation-recipient').textContent = teacher.name;
      document.getElementById('invitation-back').hash = teacher.id;
      form.hidden = false;
    } catch (problem) {
      error.textContent = problem.message;
    } finally {
      loading.hidden = true;
    }
  }

  subject.addEventListener('input', () => {
    if (subject.hasAttribute('aria-invalid')) validate(subject, 'tiêu đề');
  });
  message.addEventListener('input', () => {
    if (message.hasAttribute('aria-invalid')) validate(message, 'lời nhắn');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (saving || !teacher) return;
    if (!entry.hasStudentSession()) {
      location.replace(entry.getLoginUrl(teacherId));
      return;
    }
    error.textContent = '';
    const subjectValid = validate(subject, 'tiêu đề');
    const messageValid = validate(message, 'lời nhắn');
    const attachmentValid = attachment.validate();
    if (!subjectValid || !messageValid) {
      (subjectValid ? message : subject).focus();
      return;
    }
    if (!attachmentValid) {
      attachment.focus();
      return;
    }

    saving = true;
    submit.disabled = true;
    try {
      const record = await store.create({ teacher, subject: subject.value, message: message.value, attachment: attachment.getFile() });
      location.assign(`de-tai-cua-toi-sinh-vien.html?loi-moi=${encodeURIComponent(record.id)}#loi-moi-huong-dan`);
    } catch (problem) {
      error.textContent = problem.message;
      saving = false;
      submit.disabled = false;
    }
  });

  // Back/Forward có thể khôi phục trang từ bộ nhớ đệm sau khi đã gửi.
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted || !saving) return;
    form.reset();
    saving = false;
    submit.disabled = false;
  });

  initialize();
})();
