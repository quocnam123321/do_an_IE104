(() => {
  'use strict';

  const id = new URLSearchParams(location.search).get('loi-moi');
  if (id === null) return;

  const entry = window.IE104SupervisionEntry;
  const context = document.getElementById('invitation-login-context');
  const form = document.getElementById('demo-login-form');
  context.hidden = false;
  document.getElementById('invitation-login-back').hidden = false;
  form.setAttribute('aria-describedby', 'login-demo invitation-login-context');

  function showInvalidInvitation() {
    context.textContent = 'Không tìm thấy giảng viên đã chọn. Hãy chọn lại từ trang Hướng nghiên cứu.';
  }

  let destination;
  try {
    destination = id === 'da-gui'
      ? '../sinh-vien/de-tai-cua-toi-sinh-vien.html#loi-moi-huong-dan'
      : entry.getComposeUrl(id);
  } catch {
    showInvalidInvitation();
    return;
  }

  window.IE104SupervisionLogin = {
    destinationFor(role) {
      if (role === 'student') return destination;
      context.textContent = 'Bạn đã đăng nhập bằng tài khoản giảng viên. Hãy dùng tài khoản sinh viên để tiếp tục.';
      return null;
    },
  };

  context.textContent = id === 'da-gui'
    ? 'Đăng nhập bằng tài khoản sinh viên để xem lời mời đã gửi.'
    : 'Đăng nhập bằng tài khoản sinh viên để tiếp tục gửi lời mời hướng dẫn.';
  if (id !== 'da-gui') {
    const initialMessage = context.textContent;
    entry.getTeacher(id).then((teacher) => {
      if (context.textContent === initialMessage) {
        context.textContent = `Đăng nhập bằng tài khoản sinh viên để gửi lời mời đến ${teacher.name}.`;
      }
    }).catch(() => {});
  }
})();
