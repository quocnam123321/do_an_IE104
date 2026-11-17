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
      blankField.setCustomValidity("Vui lòng nhập nội dung cho trường này.");
      blankField.reportValidity();
      return;
    }

    result.showModal();
  });

  closeButton.addEventListener("click", () => result.close());
  submitButton.disabled = false;
})();
