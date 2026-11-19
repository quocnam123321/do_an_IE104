const { RecoveryError } = require("./recovery.cjs");

const subject = "Mã OTP demo Quên mật khẩu IE104";

function otpMessage(code) {
  return [
    `Mã xác minh cho bản demo Quên mật khẩu IE104: ${code}`,
    "Mã có hiệu lực trong 10 phút và dùng một lần.",
    "Bạn có thể bỏ qua email này nếu không yêu cầu mã.",
  ].join("\n\n");
}

async function sendBrevoEmail({ apiKey, from, to, text, fetchEmail = fetch, logError = () => {} }) {
  let response;
  try {
    response = await fetchEmail("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { email: from, name: "IE104 Nhóm 7" },
        to: [{ email: to }],
        subject,
        textContent: text,
      }),
      signal: AbortSignal.timeout(7_000),
    });
  } catch {
    logError();
    throw new RecoveryError(502, "delivery-failed");
  }
  if (response.status !== 201) {
    logError(response.status);
    throw new RecoveryError(502, "delivery-failed");
  }
}

module.exports = { otpMessage, sendBrevoEmail, subject };
