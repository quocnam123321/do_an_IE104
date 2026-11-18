(() => {
  'use strict';

  const destinationId = new URLSearchParams(location.search).get('loi-moi');
  if (destinationId === null) return;

  const entry = window.IE104SupervisionEntry;
  const container = document.getElementById('invitation-login');
  const context = document.getElementById('invitation-login-context');
  const help = document.getElementById('invitation-login-help');
  const error = document.getElementById('invitation-login-error');
  const button = document.getElementById('invitation-login-submit');

  document.getElementById('login-form').hidden = true;
  document.getElementById('login-help').hidden = true;
  container.hidden = false;

  async function prepareLogin() {
    let destination;
    try {
      if (destinationId === 'da-gui') {
        context.textContent = 'Đăng nhập để theo dõi lời mời hướng dẫn của bạn.';
        destination = '../sinh-vien/de-tai-cua-toi-sinh-vien.html#loi-moi-huong-dan';
      } else {
        context.textContent = 'Đang tải thông tin giảng viên…';
        context.hidden = false;
        context.setAttribute('role', 'status');
        const teacher = await entry.getTeacher(destinationId);
        context.textContent = `Đăng nhập để gửi lời mời đến ${teacher.name}.`;
        destination = entry.getComposeUrl(teacher.id);
      }
    } catch (cause) {
      context.hidden = true;
      help.hidden = true;
      error.hidden = false;
      error.textContent = cause.message || 'Không mở được phiên đăng nhập mẫu.';
      return;
    }

    context.hidden = false;
    button.hidden = false;
    button.addEventListener('click', () => {
      try {
        entry.startStudentSession();
        location.replace(destination);
      } catch {
        error.hidden = false;
        error.textContent = 'Không thể lưu phiên mẫu. Vui lòng cho phép trang lưu dữ liệu và thử lại.';
      }
    });
  }

  prepareLogin();
})();
