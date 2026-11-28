(() => {
  "use strict";

  const boundButtons = new WeakSet();
  const roleSessionPrefix = "ie104.website.session.v2.";

  function guardRolePage(loginPage) {
    const role = /\/pages\/(sinh-vien|giang-vien)\//.exec(location.pathname)?.[1];
    if (!role || location.protocol === "file:") return;

    const expectedRole = role === "sinh-vien" ? "student" : "lecturer";
    const page = document.documentElement;
    const visibleStyle = page.style.visibility;
    let checkVersion = 0;

    async function checkSession() {
      const version = ++checkVersion;
      let session;
      try {
        // Phiên đã được ghi nhận khi đăng nhập có thể giữ giao diện trong lúc xác minh.
        if (!localStorage.getItem(roleSessionPrefix + expectedRole)) {
          page.style.visibility = "hidden";
        }
        const { getWebsiteSession } = await import("../website-session.js");
        session = await getWebsiteSession(expectedRole);
      } catch {
        // Khi phiên không xác minh được, yêu cầu đăng nhập lại.
      }
      if (version !== checkVersion) return;
      if (session?.role === expectedRole) page.style.visibility = visibleStyle;
      else {
        page.style.visibility = "hidden";
        location.replace(loginPage.href);
      }
    }

    window.addEventListener("pagehide", () => { checkVersion += 1; });
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) checkSession();
    });
    window.addEventListener("storage", (event) => {
      if (event.storageArea === localStorage && (event.key === roleSessionPrefix + expectedRole || event.key === roleSessionPrefix + "database" || event.key === null)) {
        checkSession();
      }
    });
    checkSession();
  }

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
            const { signOutWebsite } = await import("../website-session.js");
            await signOutWebsite();
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
    guardRolePage(loginPage);
    bindLogout(document.getElementById("logout-dialog"),
      document.querySelectorAll('button[aria-controls="logout-dialog"]'), loginPage);
  }
})();
