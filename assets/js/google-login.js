(async () => {
  const button = document.getElementById("login-google");
  if (!button) return;

  const hint = document.getElementById("login-google-hint");
  const error = document.getElementById("login-google-error");
  if (window.location.protocol === "file:") {
    hint.textContent = "Mở trang qua localhost để đăng nhập bằng Google.";
    return;
  }

  const emailDomains = new Map(
    Array.from(document.querySelectorAll("[data-uit-email-domain][data-demo-destination]"), (account) => [
      account.dataset.uitEmailDomain,
      account.dataset.demoDestination,
    ]),
  );
  const readyMessage = "Dùng tài khoản email UIT.";
  const errorMessages = new Map([
    ["auth/popup-closed-by-user", "Bạn đã đóng cửa sổ đăng nhập. Hãy thử lại khi sẵn sàng."],
    ["auth/popup-blocked", "Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép cửa sổ bật lên rồi thử lại."],
    ["auth/network-request-failed", "Kết nối mạng bị gián đoạn. Vui lòng thử lại."],
    ["auth/unauthorized-domain", "Địa chỉ website này chưa được cho phép trong Firebase."],
    ["auth/operation-not-allowed", "Phương thức đăng nhập Google chưa được bật trong Firebase."],
  ]);

  try {
    hint.textContent = "Đang kết nối với Firebase…";
    const { getFirebaseAuth } = await import("./firebase-client.js?v=20261119-otp");
    const { auth, sdk } = await getFirebaseAuth();
    const { GoogleAuthProvider, signInWithPopup, signOut } = sdk;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    button.addEventListener("click", async () => {
      if (button.getAttribute("aria-disabled") === "true"
          || document.getElementById("demo-login-form")?.getAttribute("aria-busy") === "true") return;
      button.setAttribute("aria-disabled", "true");
      error.textContent = "";
      hint.textContent = "Đang chờ đăng nhập Google…";

      try {
        const { user } = await signInWithPopup(auth, provider);
        const email = (user.email ?? "").trim().toLowerCase();
        const domain = /^[^@\s]+@([^@\s]+)$/.exec(email)?.[1];
        const destination = user.emailVerified ? emailDomains.get(domain) : undefined;
        if (!destination) {
          await signOut(auth);
          error.textContent = "Vui lòng sử dụng tài khoản email UIT đã xác minh.";
          return;
        }

        window.location.assign(destination);
      } catch (failure) {
        error.textContent = errorMessages.get(failure?.code) ?? "Không thể đăng nhập bằng Google. Vui lòng thử lại.";
      } finally {
        hint.textContent = readyMessage;
        button.removeAttribute("aria-disabled");
      }
    });

    hint.textContent = readyMessage;
    button.disabled = false;
  } catch {
    hint.textContent = "Không kết nối được với Firebase. Hãy tải lại trang để thử lại.";
  }
})();
