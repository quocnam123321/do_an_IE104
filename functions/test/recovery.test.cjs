const assert = require("node:assert/strict");
const test = require("node:test");
const { createRecovery, RecoveryError } = require("../recovery.cjs");
const { otpMessage, sendBrevoEmail, subject } = require("../brevo.cjs");

const EMAIL = "guestdemo@gmail.com";
const rejectsOtp = { code: "invalid-code" };

function fixture() {
  const records = new Map();
  const inbox = [];
  let quota;
  let now = 1_800_000_000_000;
  let deliveryFails = false;
  const recovery = createRecovery({
    store: {
      async change(key, update, countDelivery) {
        const { next, nextQuota, result } = update(records.get(key), countDelivery ? quota : undefined);
        if (next) records.set(key, next);
        if (nextQuota) quota = nextQuota;
        return result;
      },
    },
    secret: "a hermetic local test secret at least 32 characters",
    async sendEmail(to, code) {
      if (deliveryFails) throw new RecoveryError(502, "delivery-failed");
      inbox.push({ to, code });
    },
    clock: () => now,
  });
  return {
    ...recovery, records, inbox,
    advance: (ms) => { now += ms; },
    failDelivery: () => { deliveryFails = true; },
  };
}

test("xác minh Gmail chưa đăng ký và chỉ mở bước mô phỏng một lần", async () => {
  const demo = fixture();
  const { challengeId } = await demo.issueCode(" GuestDemo@gmail.com ");
  const [{ to, code }] = demo.inbox;
  assert.equal(to, EMAIL);
  assert.match(code, /^\d{6}$/u);
  const [record] = demo.records.values();
  assert.equal(record.challenge.otpDigest.length, 64);
  assert.equal(record.email, undefined);
  const wrong = code === "000000" ? "000001" : "000000";
  await assert.rejects(demo.verifyCode(EMAIL, challengeId, wrong), rejectsOtp);
  const outcomes = await Promise.allSettled([
    demo.verifyCode(EMAIL, challengeId, code),
    demo.verifyCode(EMAIL, challengeId, code),
  ]);
  assert.deepEqual(outcomes[0], { status: "fulfilled", value: { verified: true } });
  assert.equal(outcomes[1].reason.code, "invalid-code");
  assert.equal([...demo.records.values()][0].challenge, undefined);
});

test("chỉ nhận Gmail và áp dụng chung giới hạn cho tên có dấu chấm hoặc thẻ cộng", async () => {
  const demo = fixture();
  await assert.rejects(demo.issueCode("other@example.com"), { code: "invalid-email" });
  await assert.rejects(demo.issueCode("guest..demo@gmail.com"), { code: "invalid-email" });
  await demo.issueCode(EMAIL);
  await assert.rejects(demo.issueCode("guest.demo+anything@gmail.com"), {
    code: "rate-limited",
    retryAfterMs: 60_000,
  });
  for (let send = 1; send < 5; send++) {
    demo.advance(60_000);
    await demo.issueCode("guest.demo+" + send + "@gmail.com");
  }
  demo.advance(60_000);
  await assert.rejects(demo.issueCode(EMAIL), { code: "rate-limited" });
  assert.equal(demo.inbox.length, 5);
});

test("hết hạn, giới hạn nhập sai và vô hiệu hóa mã cũ khi gửi lại thành công", async () => {
  const demo = fixture();
  const first = await demo.issueCode(EMAIL);
  demo.advance(60_000);
  const second = await demo.issueCode(EMAIL);
  await assert.rejects(demo.verifyCode(EMAIL, first.challengeId, demo.inbox[0].code), rejectsOtp);
  const { code } = demo.inbox[1];
  const wrong = code === "000000" ? "000001" : "000000";
  for (let attempt = 0; attempt < 5; attempt++) {
    await assert.rejects(demo.verifyCode(EMAIL, second.challengeId, wrong), rejectsOtp);
  }
  await assert.rejects(demo.verifyCode(EMAIL, second.challengeId, code), rejectsOtp);

  demo.advance(60_000);
  const third = await demo.issueCode(EMAIL);
  demo.advance(600_000);
  await assert.rejects(demo.verifyCode(EMAIL, third.challengeId, demo.inbox[2].code), rejectsOtp);
});

test("mã cũ vẫn xác minh được khi nhà cung cấp từ chối lần gửi lại", async () => {
  const demo = fixture();
  const { challengeId } = await demo.issueCode(EMAIL);
  demo.advance(60_000);
  demo.failDelivery();
  await assert.rejects(demo.issueCode(EMAIL), { code: "delivery-failed" });
  assert.deepEqual(await demo.verifyCode(EMAIL, challengeId, demo.inbox[0].code), { verified: true });
});

test("giới hạn toàn bộ bản demo ở 240 lượt trong 24 giờ", async () => {
  const demo = fixture();
  for (let send = 0; send < 240; send++) {
    await demo.issueCode("guest" + send + "@gmail.com");
  }
  await assert.rejects(demo.issueCode(EMAIL), { code: "rate-limited", retryAfterMs: 86_400_000 });
  assert.equal(demo.inbox.length, 240);
  demo.advance(86_400_000);
  await demo.issueCode(EMAIL);
  assert.equal(demo.inbox.length, 241);
});

test("gửi nội dung OTP đến Gmail qua đúng endpoint giao dịch của Brevo", async () => {
  const text = otpMessage("001234");
  await sendBrevoEmail({
    apiKey: "test-key",
    from: "verified@example.test",
    to: EMAIL,
    text,
    async fetchEmail(url, options) {
      assert.equal(url, "https://api.brevo.com/v3/smtp/email");
      assert.equal(options.method, "POST");
      assert.equal(options.headers["api-key"], "test-key");
      assert.deepEqual(JSON.parse(options.body), {
        sender: { email: "verified@example.test", name: "IE104 Nhóm 7" },
        to: [{ email: EMAIL }],
        subject,
        textContent: text,
      });
      assert.match(text, /001234/);
      assert.match(text, /demo/);
      return { status: 201 };
    },
  });
});

test("lỗi Brevo không trở thành báo gửi mã thành công", async () => {
  const options = { apiKey: "test-key", from: "verified@example.test", to: EMAIL, text: otpMessage("000000") };
  for (const status of [400, 401, 429, 500]) {
    await assert.rejects(
      sendBrevoEmail({ ...options, fetchEmail: async () => ({ status }) }),
      { status: 502, code: "delivery-failed" },
    );
  }
  await assert.rejects(
    sendBrevoEmail({ ...options, fetchEmail: async () => { throw new TypeError("Network unavailable"); } }),
    { status: 502, code: "delivery-failed" },
  );
});
