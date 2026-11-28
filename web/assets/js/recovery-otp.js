(() => {
  const emailForm = document.getElementById("recovery-email-form");
  const otpForm = document.getElementById("recovery-otp-form");
  const resetForm = document.getElementById("recovery-reset-form");
  const stepElements = document.querySelectorAll("[data-recovery-step]");
  const email = document.getElementById("recovery-email");
  const changeEmail = document.getElementById("recovery-change-email");
  const send = emailForm.querySelector('button[type="submit"]');
  const inputs = Array.from(otpForm.querySelectorAll(".recovery-otp__digits input"));
  const password = document.getElementById("recovery-new-password");
  const confirmation = document.getElementById("recovery-confirm-password");
  const strength = document.getElementById("recovery-strength");
  const strengthLabel = document.getElementById("recovery-strength-label");
  const match = document.getElementById("recovery-match");
  const matchIcon = match.querySelector("svg");
  const matchText = document.getElementById("recovery-match-text");
  const save = document.getElementById("recovery-save-password");
  const saveError = document.getElementById("recovery-save-error");
  const resultTitle = document.getElementById("recovery-result-title");
  const result = document.getElementById("recovery-reset-result");
  const returnLink = document.getElementById("recovery-reset-return");
  let saving = false;

  function showStep(step, focusTarget) {
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
    otpForm.reset();
    showStep("otp", inputs[0]);
  });

  inputs.forEach((input, index) => {
    input.addEventListener("focus", () => input.select());
    input.addEventListener("input", (event) => {
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
      fillDigits(digits, digits.length >= inputs.length ? 0 : index);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Backspace" || input.value || index === 0) return;
      event.preventDefault();
      inputs[index - 1].value = "";
      inputs[index - 1].focus();
    });
  });

  otpForm.addEventListener("submit", (event) => {
    event.preventDefault();
    otpForm.reset();
    showStep("reset", password);
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
    save.disabled = saving || resetForm.hidden || !meetsMinimum || !matches;
  }

  resetForm.addEventListener("input", () => {
    saveError.textContent = "";
    updatePasswordFeedback();
  });
  resetForm.addEventListener("change", updatePasswordFeedback);

  async function saveDemoPassword() {
    if (location.protocol === "file:") return false;
    const { authConfig, authRequest } = await import("./auth-api.js");
    const config = await authConfig();
    if (!config?.systemDemo) return false;
    await authRequest("demo/password/reset", {
      method: "POST",
      body: { email: email.value, password: password.value },
    });
    return true;
  }

  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    updatePasswordFeedback();
    if (save.disabled) return;

    saving = true;
    save.disabled = password.readOnly = confirmation.readOnly = true;
    save.textContent = "Đang lưu mật khẩu…";
    saveError.textContent = "";
    resetForm.setAttribute("aria-busy", "true");
    try {
      if (await saveDemoPassword()) {
        resultTitle.textContent = "Đã lưu mật khẩu demo";
        result.textContent = "Dùng email vừa nhập và mật khẩu mới để đăng nhập Sinh viên demo trên trình duyệt này.";
      }
      emailForm.reset();
      resetForm.reset();
      showStep("done", returnLink);
    } catch (error) {
      saveError.textContent = error.message;
      password.focus();
    } finally {
      saving = false;
      password.readOnly = confirmation.readOnly = false;
      save.textContent = "Đặt lại mật khẩu";
      resetForm.removeAttribute("aria-busy");
      updatePasswordFeedback();
    }
  });

  changeEmail.addEventListener("click", () => {
    showStep("email", email);
  });
  send.disabled = false;
})();
