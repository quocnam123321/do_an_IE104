/* Password visibility only; authentication remains outside this demo. */
(() => {
  document.querySelectorAll(".password-field__toggle[aria-controls]").forEach((toggle) => {
    const input = document.getElementById(toggle.getAttribute("aria-controls"));
    if (!(input instanceof HTMLInputElement) || input.type !== "password") return;

    function setVisible(visible) {
      input.type = visible ? "text" : "password";
      const label = visible ? "Ẩn mật khẩu" : "Hiện mật khẩu";
      toggle.setAttribute("aria-label", label);
      toggle.setAttribute("title", label);
      toggle.setAttribute("aria-pressed", String(visible));
      toggle.querySelector('[data-password-icon="show"]')?.toggleAttribute("hidden", visible);
      toggle.querySelector('[data-password-icon="hide"]')?.toggleAttribute("hidden", !visible);
    }

    toggle.addEventListener("click", () => setVisible(input.type === "password"));
    input.form?.addEventListener("reset", () => setVisible(false));
    window.addEventListener("pageshow", () => setVisible(false));
    setVisible(false);
    toggle.hidden = false;
  });
})();
