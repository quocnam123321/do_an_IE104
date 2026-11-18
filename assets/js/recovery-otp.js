(() => {
  const emailForm = document.getElementById("recovery-email-form");
  const otpForm = document.getElementById("recovery-otp-form");
  const resetForm = document.getElementById("recovery-reset-form");
  const stepElements = document.querySelectorAll("[data-recovery-step]");
  const email = document.getElementById("recovery-email");
  const maskedEmail = document.getElementById("recovery-masked-email");
  const status = document.getElementById("recovery-otp-status");
  const resend = document.getElementById("recovery-resend");
  const changeEmail = document.getElementById("recovery-change-email");
  const inputs = Array.from(otpForm.querySelectorAll(".recovery-otp__digits input"));
  const password = document.getElementById("recovery-new-password");
  const confirmation = document.getElementById("recovery-confirm-password");
  const strength = document.getElementById("recovery-strength");
  const strengthLabel = document.getElementById("recovery-strength-label");
  const match = document.getElementById("recovery-match");
  const matchIcon = match.querySelector("svg");
  const matchText = document.getElementById("recovery-match-text");
  const save = document.getElementById("recovery-save-password");
  const resetResult = document.getElementById("recovery-reset-result");
  const returnLink = document.getElementById("recovery-reset-return");

  let countdown = null;

  function startCountdown() {
    const availableAt = Date.now() + 60_000;
    function update() {
      const seconds = Math.max(0, Math.ceil((availableAt - Date.now()) / 1000));
      resend.disabled = seconds > 0;
      resend.textContent = seconds > 0 ? `Gửi lại sau ${seconds} giây` : "Gửi lại mã";
      if (!seconds) window.clearInterval(countdown);
    }

    window.clearInterval(countdown);
    update();
    countdown = window.setInterval(update, 250);
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

  emailForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const address = email.value.trim();
    const domain = address.slice(address.lastIndexOf("@"));
    maskedEmail.textContent = `${address[0]}***${domain}`;
    otpForm.reset();
    status.textContent = "";
    showStep("otp", inputs[0]);
    startCountdown();
  });

  inputs.forEach((input, index) => {
    input.addEventListener("focus", () => input.select());
    input.addEventListener("input", (event) => {
      status.textContent = "";
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
      const digits = event.clipboardData.getData("text").replace(/[^0-9]/g, "");
      if (!digits) return;
      status.textContent = "";
      fillDigits(digits, digits.length >= inputs.length ? 0 : index);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Backspace" || input.value || index === 0) return;
      event.preventDefault();
      inputs[index - 1].value = "";
      inputs[index - 1].focus();
      status.textContent = "";
    });
  });

  otpForm.addEventListener("submit", (event) => {
    event.preventDefault();
    otpForm.reset();
    showStep("reset", password);
  });

  resend.addEventListener("click", () => {
    otpForm.reset();
    startCountdown();
    inputs[0].focus();
    status.textContent = "Đã bắt đầu lại bộ đếm trong bản demo.";
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
    save.disabled = !meetsMinimum || !matches;
  }

  resetForm.addEventListener("input", () => {
    updatePasswordFeedback();
    resetResult.hidden = returnLink.hidden = true;
  });
  resetForm.addEventListener("change", updatePasswordFeedback);

  resetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updatePasswordFeedback();
    if (save.disabled) return;
    resetForm.reset();
    updatePasswordFeedback();
    resetResult.hidden = returnLink.hidden = false;
    returnLink.focus();
  });

  changeEmail.addEventListener("click", () => showStep("email", email));
  emailForm.querySelector('button[type="submit"]').disabled = false;
})();
