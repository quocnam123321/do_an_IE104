const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { normalizeEmail } = require("./recovery.cjs");

async function provision() {
  const [projectId, rawEmail, role] = process.argv.slice(2);
  if (!projectId || !["student", "lecturer"].includes(role)) {
    throw new Error("Cách dùng: node functions/provision-user.cjs <project-id> <email> <student|lecturer>");
  }
  if (Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST) !== projectId.startsWith("demo-")) {
    throw new Error("Dùng project demo-* khi trỏ vào Auth Emulator.");
  }
  const auth = getAuth(initializeApp({ projectId }));
  const email = normalizeEmail(rawEmail);
  const password = process.env.IE104_INITIAL_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("Đặt IE104_INITIAL_PASSWORD trong môi trường quản trị trước khi cấp tài khoản.");
  }
  const user = await auth.createUser({ email, password, disabled: true });
  await auth.setCustomUserClaims(user.uid, { ie104Role: role });
  await auth.updateUser(user.uid, { disabled: false });
  console.log(`Đã cấp tài khoản ${email}.`);
}

provision().catch((error) => {
  console.error(error.code ?? error.message);
  process.exitCode = 1;
});
