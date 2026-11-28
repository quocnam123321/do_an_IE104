(() => {
  const emailForm = document.getElementById("recovery-email-form");
  const otpForm = document.getElementById("recovery-otp-form");
  const resetForm = document.getElementById("recovery-reset-form");
  const stepElements = document.querySelectorAll("[data-recovery-step]");
  const email = document.getElementById("recovery-email");
  const maskedEmail = document.getElementById("recovery-masked-email");
  const status = document.getElementById("recovery-otp-status");
  const emailError = document.getElementById("recovery-email-error");
  const otpError = document.getElementById("recovery-otp-error");
  const resend = document.getElementById("recovery-resend");
  const changeEmail = document.getElementById("recovery-change-email");
  const send = emailForm.querySelector('button[type="submit"]');
  const verify = otpForm.querySelector('button[type="submit"]');
  const inputs = Array.from(otpForm.querySelectorAll(".recovery-otp__digits input"));
  const password = document.getElementById("recovery-new-password");
  const confirmation = document.getElementById("recovery-confirm-password");
  const strength = document.getElementById("recovery-strength");
  const strengthLabel = document.getElementById("recovery-strength-label");
  const match = document.getElementById("recovery-match");
  const matchIcon = match.querySelector("svg");
  const matchText = document.getElementById("recovery-match-text");
  const save = document.getElementById("recovery-save-password");
  const returnLink = document.getElementById("recovery-reset-return");

  let countdown = null;
  let address = "";
  let challengeId = "";
  let verified = false;
  let pending = false;
  let availableAt = 0;
  const unavailable = "Hiện chưa thể kết nối dịch vụ khôi phục. Kiểm tra mạng rồi thử lại.";
  const loadClient = () => import("./firebase-client.js?v=20261119-otp");

  async function request(endpoint, body) {
    const { recoveryEndpoint } = await loadClient();
    const response = await fetch(`${recoveryEndpoint}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      signal: AbortSignal.timeout(25_000),
    });
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.code), { retryAfterMs: data.retryAfterMs });
    return data;
  }

  function waitLabel(seconds) {
    if (seconds >= 3600) return `${Math.ceil(seconds / 3600)} giờ`;
    if (seconds > 60) return `${Math.ceil(seconds / 60)} phút`;
    return `${seconds} giây`;
  }

  function updateResend() {
    const seconds = Math.max(0, Math.ceil((availableAt - Date.now()) / 1000));
    resend.disabled = pending || seconds > 0;
    resend.textContent = seconds ? `Gửi lại sau ${waitLabel(seconds)}` : "Gửi lại mã";
    if (!seconds) window.clearInterval(countdown);
  }

  function startCountdown(retryAfterMs) {
    window.clearInterval(countdown);
    availableAt = Date.now() + retryAfterMs;
    countdown = window.setInterval(updateResend, 1000);
    updateResend();
  }

  async function run(button, label, task) {
    if (pending) return;
    pending = true;
    const initialLabel = button.textContent;
    send.disabled = verify.disabled = changeEmail.disabled = save.disabled = resend.disabled = true;
    email.readOnly = password.readOnly = confirmation.readOnly = true;
    inputs.forEach((input) => { input.readOnly = true; });
    button.textContent = label;
    try {
      await task();
    } finally {
      pending = false;
      button.textContent = initialLabel;
      send.disabled = verify.disabled = changeEmail.disabled = false;
      email.readOnly = password.readOnly = confirmation.readOnly = false;
      inputs.forEach((input) => { input.readOnly = false; });
      updateResend();
      updatePasswordFeedback();
    }
  }

  function showStep(step, focusTarget) {
    window.clearInterval(countdown);
    stepElements.forEach((element) => {
      element.hidden = element.dataset.recoveryStep !== step;
    });
    focusTarget.focus();
  }

  function fillDigits(digits, start) {
    const remaining = inputs.length - start;
    const code = digits.slice(0, remaining);
    for (let index = 0; index < code.length; index++) {
      inputs[start + index].value = code[index];
    }
    inputs[Math.min(start + code.length, inputs.length - 1)].focus();
  }

  async function sendCode(target, isResend) {
    const error = isResend ? otpError : emailError;
    error.textContent = "";
    status.textContent = "";
    try {
      const result = await request("request", { email: target });
      address = target;
      challengeId = result.challengeId;
      const domain = address.slice(address.lastIndexOf("@"));
      maskedEmail.textContent = `${address[0]}***${domain}`;
      otpForm.reset();
      showStep("otp", inputs[0]);
      startCountdown(result.retryAfterMs);
      status.textContent = result.delivery === "test"
        ? "Mở hộp thư thử trong Firebase Emulator để lấy mã."
        : "Kiểm tra hộp thư đến hoặc thư rác trong Gmail. Mã có hiệu lực 10 phút.";
    } catch (failure) {
      if (failure.message === "invalid-email") {
        error.textContent = "Nhập địa chỉ có đuôi @gmail.com.";
      } else if (failure.message === "rate-limited" && Number.isFinite(failure.retryAfterMs)) {
        const seconds = Math.ceil(failure.retryAfterMs / 1000);
        error.textContent = `Đã đạt giới hạn gửi mã. Bạn có thể thử lại sau ${waitLabel(seconds)}.`;
        if (isResend) startCountdown(failure.retryAfterMs);
      } else if (failure.message === "delivery-failed") {
        error.textContent = "Chưa gửi được mã qua email. Hãy kiểm tra địa chỉ và thử lại sau.";
      } else {
        error.textContent = unavailable;
      }
    }
  }

  email.addEventListener("input", () => { emailError.textContent = ""; });
  emailForm.addEventListener("submit", (event) => {
    event.preventDefault();
    run(send, "Đang gửi mã…", () => sendCode(email.value.trim(), false));
  });

  inputs.forEach((input, index) => {
    input.addEventListener("focus", () => input.select());
    input.addEventListener("input", (event) => {
      otpError.textContent = "";
      if (event.inputType === "insertText" && /^[0-9]$/.test(event.data)) {
        input.value = event.data;
        inputs[index + 1]?.focus();
        return;
      }

      const digits = input.value.replace(/[^0-9]/g, "");
      input.value = digits.slice(0, 1);
      if (digits.length > 1) fillDigits(digits, digits.length === inputs.length ? 0 : index);
      else if (digits && event.inputType !== "insertText") inputs[index + 1]?.focus();
    });

    input.addEventListener("paste", (event) => {
      event.preventDefault();
      if (pending) return;
      const digits = event.clipboardData.getData("text").replace(/[^0-9]/g, "");
      if (!digits) return;
      otpError.textContent = "";
      fillDigits(digits, digits.length >= inputs.length ? 0 : index);
    });

    input.addEventListener("keydown", (event) => {
      if (pending || event.key !== "Backspace" || input.value || index === 0) return;
      event.preventDefault();
      inputs[index - 1].value = "";
      inputs[index - 1].focus();
      otpError.textContent = "";
    });
  });

  otpForm.addEventListener("submit", (event) => {
    event.preventDefault();
    run(verify, "Đang xác nhận…", async () => {
      otpError.textContent = "";
      try {
        const code = inputs.map((input) => input.value).join("");
        const result = await request("verify", { email: address, challengeId, code });
        if (result.verified !== true) throw new Error("invalid-code");
        verified = true;
        address = challengeId = email.value = "";
        otpForm.reset();
        showStep("reset", password);
      } catch (failure) {
        const invalid = failure.message === "invalid-code";
        otpError.textContent = invalid
          ? "Mã không đúng hoặc đã hết hạn. Kiểm tra mã mới nhất hoặc yêu cầu gửi lại."
          : unavailable;
        if (invalid) inputs[0].focus();
      }
    });
  });

  resend.addEventListener("click", () => {
    run(resend, "Đang gửi mã…", () => sendCode(address, true));
  });

  function passwordLevel(value, length, meetsMinimum) {
    if (!meetsMinimum || /1234|qwerty|password|matkhau|(.)\1{3}/iu.test(value)) return 1;
    const varied = /\p{Lu}/u.test(value) && /\p{Ll}/u.test(value) && /[^\p{L}\p{Nd}\s]/u.test(value);
    return length >= 12 || (length >= 10 && varied) ? 3 : 2;
  }

  function updatePasswordFeedback() {
    const value = password.value;
    const length = Array.from(value).length;
    const meetsMinimum = length >= password.minLength && /\p{L}/u.test(value) && /\p{Nd}/u.test(value);
    const level = passwordLevel(value, length, meetsMinimum);
    const label = value ? `Độ mạnh: ${["Yếu", "Trung bình", "Mạnh"][level - 1]}` : "";
    strength.hidden = !value;
    strength.dataset.level = level;
    if (strengthLabel.textContent !== label) strengthLabel.textContent = label;

    const hasConfirmation = confirmation.value !== "";
    const matches = hasConfirmation && confirmation.value === value;
    const mismatch = hasConfirmation && !matches;
    const message = matches ? "Mật khẩu đã khớp." : "Mật khẩu xác nhận chưa khớp.";
    if (hasConfirmation) match.dataset.state = matches ? "match" : "error";
    else delete match.dataset.state;
    matchIcon.toggleAttribute("hidden", !matches);
    const feedback = hasConfirmation ? message : "";
    if (matchText.textContent !== feedback) matchText.textContent = feedback;
    if (mismatch) confirmation.setAttribute("aria-invalid", "true");
    else confirmation.removeAttribute("aria-invalid");
    save.disabled = pending || !verified || !meetsMinimum || !matches;
  }

  resetForm.addEventListener("input", updatePasswordFeedback);
  resetForm.addEventListener("change", updatePasswordFeedback);

  resetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updatePasswordFeedback();
    if (save.disabled) return;
    verified = false;
    resetForm.reset();
    updatePasswordFeedback();
    showStep("done", returnLink);
  });

  changeEmail.addEventListener("click", () => {
    address = challengeId = "";
    emailError.textContent = "";
    showStep("email", email);
  });
  if (window.location.protocol === "file:") {
    emailError.textContent = "Mở trang qua localhost hoặc HTTPS để gửi mã xác minh.";
    return;
  }
  send.disabled = false;
})();
