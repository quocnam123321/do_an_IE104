(() => {
  "use strict";

  const form = document.getElementById("contact-form");
  const result = document.getElementById("contact-result");
  if (!form || typeof result?.showModal !== "function") {
    return;
  }

  const requiredFields = [...form.querySelectorAll("[required]")];
  const submitButton = form.querySelector('button[type="submit"]');
  const error = document.getElementById("contact-submit-error");
  const closeButton = result.querySelector(".contact-result__close");

  form.addEventListener("input", (event) => {
    const field = event.target;
    if (field.validity?.customError) {
      if (globalThis.IE104Language) globalThis.IE104Language.setCustomValidity(field, "");
      else field.setCustomValidity("");
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitButton.disabled) return;
    error.hidden = true;

    const blankField = requiredFields.find((field) => !field.value.trim());
    if (blankField) {
      const message = "Vui lòng nhập nội dung cho trường này.";
      if (globalThis.IE104Language) globalThis.IE104Language.setCustomValidity(blankField, message);
      else blankField.setCustomValidity(message);
      blankField.reportValidity();
      return;
    }

    const values = new FormData(form);
    const value = (name) => values.get(name).trim();
    const request = {
      name: value("ho-ten"), email: value("email"), phone: value("so-dien-thoai"),
      subject: value("chu-de"), message: value("noi-dung"),
    };
    submitButton.disabled = true;
    form.setAttribute("aria-busy", "true");
    try {
      const { getWebsiteSession } = await import("./website-session.js");
      const session = await getWebsiteSession().catch(() => null);
      await globalThis.IE104ContactRequests.submit({ ...request, role: session?.role ?? "guest" });
      form.reset();
      result.showModal();
    } catch {
      error.textContent = "Không thể lưu lời nhắn thử nghiệm. Vui lòng thử lại.";
      error.hidden = false;
    } finally {
      form.removeAttribute("aria-busy");
      submitButton.disabled = false;
    }
  });

  closeButton.addEventListener("click", () => result.close());
  result.addEventListener("close", () => submitButton.focus());
  submitButton.disabled = false;
})();
