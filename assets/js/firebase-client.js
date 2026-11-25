import { firebaseConfig } from "./firebase-config.js?v=20261119-otp";

const localProject = "demo-ie104-recovery";
export const useRecoveryEmulator = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  && window.location.port === "8012";
export const recoveryEndpoint = useRecoveryEmulator
  ? `http://127.0.0.1:5001/${localProject}/asia-southeast1/accountRecovery`
  : `https://asia-southeast1-${firebaseConfig.projectId}.cloudfunctions.net/accountRecovery`;

const clients = new Map();

export function getFirebaseAuth(emulator = false, role) {
  const appName = (emulator ? localProject : "ie104") + (role ? "-website-" + role : "");
  if (!clients.has(appName)) {
    const client = Promise.all([
      import("https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js"),
    ]).then(([appSdk, sdk]) => {
      const config = emulator ? { apiKey: "demo-key", projectId: localProject } : firebaseConfig;
      const app = appSdk.initializeApp(config, role || emulator ? appName : "[DEFAULT]");
      const auth = sdk.initializeAuth(app, {
        persistence: role ? sdk.browserLocalPersistence : sdk.browserSessionPersistence,
        popupRedirectResolver: sdk.browserPopupRedirectResolver,
      });
      if (emulator) sdk.connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      auth.languageCode = "vi";
      return { auth, sdk };
    }).catch((error) => {
      clients.delete(appName);
      throw error;
    });
    clients.set(appName, client);
  }
  return clients.get(appName);
}
