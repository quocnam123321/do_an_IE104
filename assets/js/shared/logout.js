(() => {
  "use strict";

  const boundButtons = new WeakSet();

  function bindLogout(dialog, buttons, loginPage) {
    const controls = Array.from(buttons);
    if (!controls.length) return;
    // Giữ chữ ký dùng chung với menu trang công khai; không còn bước xác nhận.
    dialog?.remove();
    let signingOut = false;

    function showError() {
      let feedback = document.querySelector("[data-logout-feedback]");
      if (!feedback) {
        feedback = document.createElement("p");
        feedback.className = "logout-feedback";
        feedback.setAttribute("data-logout-feedback", "");
        feedback.setAttribute("role", "alert");
        document.body.append(feedback);
      }
      feedback.textContent = "Không thể đăng xuất lúc này. Vui lòng thử lại.";
      feedback.hidden = false;
    }

    for (const button of controls) {
      if (boundButtons.has(button)) continue;
      boundButtons.add(button);
      button.removeAttribute("aria-controls");
      button.removeAttribute("aria-haspopup");
      button.disabled = false;
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        if (signingOut) return;
        signingOut = true;
        const feedback = document.querySelector("[data-logout-feedback]");
        if (feedback) feedback.hidden = true;
        const labels = controls.map(control => control.textContent);
        for (const control of controls) {
          control.disabled = true;
          control.setAttribute("aria-busy", "true");
          control.textContent = "Đang đăng xuất…";
        }

        try {
          if (location.protocol !== "file:") {
            const { getFirebaseAuth, useRecoveryEmulator } = await import("../firebase-client.js?v=20261119-otp");
            const { clearWebsiteSession } = await import("../website-session.js");
            // Giữ xử lý đăng xuất Firebase cho cả client mặc định và emulator.
            const clients = useRecoveryEmulator ? [false, true] : [false];
            await Promise.all(clients.map(async (emulator) => {
              const { auth, sdk } = await getFirebaseAuth(emulator);
              await sdk.signOut(auth);
            }));
            clearWebsiteSession();
          }
          sessionStorage.removeItem("ie104-calendar-selection");
          location.replace(loginPage.href);
        } catch {
          signingOut = false;
          controls.forEach((control, index) => {
            control.disabled = false;
            control.removeAttribute("aria-busy");
            control.textContent = labels[index];
          });
          showError();
          button.focus({ preventScroll: true });
        }
      });
    }
  }

  window.IE104BindLogout = bindLogout;
  if (document.currentScript) {
    const loginPage = new URL("../../../pages/chung/dang-nhap.html", document.currentScript.src);
    bindLogout(document.getElementById("logout-dialog"),
      document.querySelectorAll('button[aria-controls="logout-dialog"]'), loginPage);
  }
})();
