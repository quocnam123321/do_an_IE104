(() => {
  "use strict";

  function bindLogout(dialog, buttons, loginPage) {
    if (!dialog || typeof dialog.showModal !== "function") return;

    const confirm = dialog.querySelector("[data-logout-confirm]");
    const cancel = dialog.querySelector("[data-logout-cancel]");
    const status = dialog.querySelector("[data-logout-status]");
    if (!confirm || !cancel || !status) return;

    const description = dialog.querySelector("h2 + p");
    if (description) {
      description.id = "logout-description";
      dialog.setAttribute("aria-describedby", description.id);
    }

    dialog.classList.replace("confirmation-dialog", "logout-dialog");
    const actions = cancel.parentElement === dialog ? document.createElement("div") : cancel.parentElement;
    actions.classList.add("logout-dialog__actions");
    if (!actions.isConnected) cancel.before(actions);
    actions.append(cancel, confirm);
    actions.before(status);
    confirm.textContent = "Đăng xuất";
    let signingOut = false;

    for (const button of buttons) {
      button.addEventListener("click", () => {
        if (dialog.open) return;
        status.textContent = "";
        const menu = button.closest(".account-menu__disclosure, .mobile-nav__disclosure");
        if (menu) {
          menu.open = false;
          menu.querySelector("summary")?.focus({ preventScroll: true });
        }
        dialog.showModal();
      });
      button.setAttribute("aria-haspopup", "dialog");
      button.disabled = false;
    }

    cancel.addEventListener("click", (event) => {
      event.preventDefault();
      if (!signingOut) dialog.close();
    });
    dialog.addEventListener("cancel", (event) => {
      if (signingOut) event.preventDefault();
    });

    confirm.addEventListener("click", async () => {
      if (signingOut) return;
      signingOut = true;
      confirm.disabled = cancel.disabled = true;
      status.textContent = "Đang đăng xuất…";

      try {
        if (location.protocol !== "file:") {
          const { getFirebaseAuth, useRecoveryEmulator } = await import("../firebase-client.js?v=20261119-otp");
          const { clearWebsiteSession } = await import("../website-session.js");
          // Google uses the default client. Local email sign-in can use the emulator.
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
        status.textContent = "Không thể đăng xuất lúc này. Vui lòng thử lại.";
        signingOut = false;
        confirm.disabled = cancel.disabled = false;
        confirm.focus();
      }
    });
  }

  if (document.currentScript) {
    const loginPage = new URL("../../../pages/chung/dang-nhap.html", document.currentScript.src);
    bindLogout(document.getElementById("logout-dialog"),
      document.querySelectorAll('button[aria-controls="logout-dialog"]'), loginPage);
  } else {
    // Trang chung thêm menu và hộp thoại sau khi xác nhận phiên đăng nhập.
    window.IE104BindLogout = bindLogout;
  }
})();
