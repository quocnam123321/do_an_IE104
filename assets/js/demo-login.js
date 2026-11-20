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
  const roleDestinations = new Map(
    Array.from(demoNotice.querySelectorAll("[data-website-role]"), (account) => [
      account.dataset.websiteRole,
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
  async function signInWebsiteAccount(email, value) {
    const { getFirebaseAuth, useRecoveryEmulator } = await import("./firebase-client.js?v=20261119-otp");
    const { auth, sdk } = await getFirebaseAuth(useRecoveryEmulator);
    const { user } = await sdk.signInWithEmailAndPassword(auth, email, value);
    try {
      const { claims } = await user.getIdTokenResult();
      const destination = roleDestinations.get(claims.ie104Role);
      if (!destination) throw new Error("Tài khoản chưa được cấp quyền truy cập website.");
      return destination;
    } catch (failure) {
      await sdk.signOut(auth);
      throw failure;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitButton.disabled || document.getElementById("login-google")?.getAttribute("aria-disabled") === "true") return;
    clearError();

    const account = username.value.trim().toLowerCase();
    if (!account) {
      username.setAttribute("aria-invalid", "true");
      error.textContent = "Vui lòng nhập email hoặc tên tài khoản mẫu.";
      username.focus();
      return;
    }

    if (account.includes("@")) {
      if (window.location.protocol === "file:") {
        error.textContent = "Mở trang qua localhost hoặc HTTPS để đăng nhập bằng email.";
        return;
      }
      submitButton.disabled = true;
      form.setAttribute("aria-busy", "true");
      username.readOnly = password.readOnly = true;
      const label = submitButton.textContent;
      submitButton.textContent = "Đang đăng nhập…";
      try {
        const destination = await signInWebsiteAccount(account, password.value);
        form.reset();
        window.location.assign(destination);
      } catch (failure) {
        const temporarilyUnavailable = [
          "auth/network-request-failed", "auth/operation-not-allowed", "auth/too-many-requests",
        ].includes(failure?.code) || failure instanceof TypeError;
        error.textContent = temporarilyUnavailable
          ? "Hiện chưa thể đăng nhập bằng email. Vui lòng thử lại sau."
          : "Email hoặc mật khẩu không đúng, hoặc tài khoản chưa được cấp quyền.";
      } finally {
        username.readOnly = password.readOnly = false;
        submitButton.disabled = false;
        submitButton.textContent = label;
        form.removeAttribute("aria-busy");
      }
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
