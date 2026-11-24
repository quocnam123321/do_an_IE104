(() => {
  "use strict";

  const form = document.getElementById("contact-form");
  const result = document.getElementById("contact-result");
  if (!form || typeof result?.showModal !== "function") {
    return;
  }

  const requiredFields = [...form.querySelectorAll("[required]")];
  const submitButton = form.querySelector('button[type="submit"]');
  const closeButton = result.querySelector(".contact-result__close");

  form.addEventListener("input", (event) => {
    const field = event.target;
    if (field.validity?.customError) {
      field.setCustomValidity("");
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const blankField = requiredFields.find((field) => !field.value.trim());
    if (blankField) {
      const message = "Vui lòng nhập nội dung cho trường này.";
      if (globalThis.IE104Language) globalThis.IE104Language.setCustomValidity(blankField, message);
      else blankField.setCustomValidity(message);
      blankField.reportValidity();
      return;
    }

    result.showModal();
  });

  closeButton.addEventListener("click", () => result.close());
  submitButton.disabled = false;
})();
