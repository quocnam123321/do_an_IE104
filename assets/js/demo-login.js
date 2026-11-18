(() => {
  const form = document.getElementById("demo-login-form");
  if (!form) return;

  const username = form.elements.namedItem("tai-khoan");
  const password = form.elements.namedItem("mat-khau");
  const submitButton = form.querySelector('button[type="submit"]');
  const error = document.getElementById("login-error");
  const demoNotice = document.getElementById("login-demo");
  const demoPassword = document.getElementById("demo-password").textContent.trim();
  const destinations = new Map(
    Array.from(demoNotice.querySelectorAll("[data-demo-destination]"), (account) => [
      account.textContent.trim(),
      account.dataset.demoDestination,
    ]),
  );

  function clearError() {
    error.textContent = "";
    username.removeAttribute("aria-invalid");
    password.removeAttribute("aria-invalid");
  }

  form.addEventListener("input", clearError);
  form.addEventListener("reset", clearError);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearError();

    const account = username.value.trim().toLowerCase();
    if (!account) {
      username.setAttribute("aria-invalid", "true");
      error.textContent = "Vui lòng nhập tài khoản mẫu.";
      username.focus();
      return;
    }

    const destination = destinations.get(account);
    if (!destination || password.value !== demoPassword) {
      username.setAttribute("aria-invalid", "true");
      password.setAttribute("aria-invalid", "true");
      error.textContent = "Tài khoản hoặc mật khẩu không đúng. Vui lòng kiểm tra thông tin mẫu.";
      (destination ? password : username).focus();
      return;
    }

    form.reset();
    window.location.assign(destination);
  });

  submitButton.disabled = false;
})();
