import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import express from "express";
import { pool } from "./db.js";
import { AuthError, activeAccount, requiredRole, requireSameAccount, systemDemoEnabled } from "./auth-security.js";
import { authRouter, sameOrigin } from "./auth-routes.js";
import { adminRouter } from "./admin-routes.js";
import { readAcademic } from "./academic-data.js";
import { contactRouter } from "./contact-requests.js";
import { noticesRouter } from "./notices-routes.js";
import { readAdminCatalog } from "./admin-catalog-data.js";
import { proposalRouter } from "./proposal-routes.js";
import { projectRouter } from "./project-routes.js";
import { projectSubmissionRouter } from "./project-submission-routes.js";
import { projectEvaluationRouter } from "./project-evaluation-routes.js";
import { lecturerTopicRouter } from "./lecturer-topic-routes.js";
import { proposalPage } from "./proposal-pages.js";
import { reserveTopicCode } from "./topic-code-data.js";
import { supervisionRouter } from "./supervision-routes.js";
import { profileAvatarRouter } from "./profile-avatar-routes.js";
import { profileRouter } from "./profile-routes.js";

const host = process.env.HOST?.trim() || "127.0.0.1";
const port = Number(process.env.PORT || 3000);
const webRoot = new URL("../../web/", import.meta.url);
const webPath = (relative) => fileURLToPath(new URL(relative, webRoot));

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT phải là số nguyên từ 1 đến 65535.");
}

const app = express();
app.disable("x-powered-by");
app.disable("etag");

app.get("/api/health", async (_request, response) => {
  response.set("Cache-Control", "no-store");

  try {
    await pool.query({ text: "SELECT 1", query_timeout: 4000 });
  } catch (error) {
    console.error("Kiểm tra PostgreSQL thất bại:", error.code ?? error.name);
    return response.status(503).json({ status: "unavailable", database: "unavailable" });
  }

  return response.json({ status: "ok", database: "connected" });
});

authRouter.use("/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/contact-requests", contactRouter);
app.use("/api/notices", noticesRouter);
app.get("/api/academic", async (_request, response) => {
  response.set("Cache-Control", "no-store").json(await readAcademic());
});
app.use("/api/proposals", proposalRouter);
app.use("/api/supervision-invitations", supervisionRouter);
app.use("/api/projects/:id/submission-board", projectSubmissionRouter);
app.use("/api/projects/:id/evaluation", projectEvaluationRouter);
app.use("/api/projects", projectRouter);
app.use("/api/lecturer-topics", lecturerTopicRouter);
app.use("/api/profile/avatar", profileAvatarRouter);
app.use("/api/profile", profileRouter);
app.post("/api/topic-codes", requiredRole(), requireSameAccount, sameOrigin, express.json({ limit: "2kb" }), async (request, response) => {
  response.set("Cache-Control", "no-store");
  const { type, formId } = request.body ?? {};
  response.json({ code: await reserveTopicCode(response.locals.account, type, formId) });
});
app.use("/api", (_request, response) => response.status(404).json({ error: "API không tồn tại." }));

const loginPage = "/pages/chung/dang-nhap.html";
const roleFolders = [
  ["sinh-vien", "student"],
  ["giang-vien", "lecturer"],
  ["quan-tri", "admin"],
];
const adminCatalogPages = new Set(["tong-quan-quan-tri.html", "de-tai-va-ho-so.html", "chi-tiet-dot-dang-ky.html"]);
const adminPages = new Set([...adminCatalogPages, "hoc-ky-va-dot-dang-ky.html", "tai-khoan.html", "thong-bao.html", "yeu-cau-lien-he.html"]);
const websiteDatabaseMeta = '<meta name="ie104-website-db" content="connected">';
const dataScript = (id, value) => `<script type="application/json" id="${id}">${JSON.stringify(value).replaceAll("<", "\\u003c")}</script>`;

for (const [folder, role] of roleFolders) {
  app.use("/pages/" + folder, async (request, response, next) => {
    response.set("Cache-Control", "no-store");
    const account = await activeAccount(request, role);
    if (!account) return response.redirect(302, loginPage);
    if (account.role !== role) return response.status(403).type("text/plain").send("Tài khoản không có quyền mở trang này.");
    response.locals.account = account;
    const page = role === "admin" && ["GET", "HEAD"].includes(request.method) ? decodeURIComponent(request.path.slice(1)).toLowerCase() : "";
    if (adminPages.has(page)) {
      const [html, academic, catalog] = await Promise.all([
        readFile(webPath("pages/quan-tri/" + page), "utf8"),
        page === "hoc-ky-va-dot-dang-ky.html" || adminCatalogPages.has(page) ? readAcademic() : null,
        adminCatalogPages.has(page) ? readAdminCatalog() : null,
      ]);
      const mode = systemDemoEnabled ? "demo" : "database";
      const meta = page === "tai-khoan.html" ? `<meta name="ie104-admin-accounts" content="${mode}">` : "";
      const bootstrap = (academic ? dataScript("ie104-academic-data", academic) : "") +
        (catalog ? dataScript("ie104-admin-catalog-data", catalog) : "");
      return response.type("html").send(html.replace("<head>", () => "<head>" + websiteDatabaseMeta + meta + bootstrap));
    }
    next();
  }, proposalPage(folder, role), express.static(webPath("pages/" + folder)));
}

app.get("/", (_request, response) => response.redirect(302, "/pages/chung/gioi-thieu.html"));
app.get("/index.html", (_request, response) => response.sendFile(webPath("index.html")));
app.use("/assets", express.static(webPath("assets"), { index: false }));
app.get(["/pages/chung/lien-he.html", "/pages/chung/thong-bao.html", "/pages/chung/chi-tiet-thong-bao.html"], async (request, response) => {
  const html = await readFile(webPath(request.path.toLowerCase().slice(1)), "utf8");
  response.type("html").send(html.replace("<head>", "<head>" + websiteDatabaseMeta));
});
app.use("/pages/chung", express.static(webPath("pages/chung")));

app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);
  if (error instanceof AuthError) {
    return response.status(error.status).json({ error: error.message, field: error.field });
  }
  if (error.type === "entity.parse.failed" || error.type === "entity.too.large") {
    return response.status(error.status).json({ error: "Nội dung yêu cầu không hợp lệ." });
  }
  console.error("Xử lý yêu cầu thất bại:", error.code ?? error.name);
  if (request.path.startsWith("/api/")) {
    return response.status(500).json({ error: "Không thể thực hiện yêu cầu lúc này. Vui lòng thử lại." });
  }
  return response.status(503).type("text/plain").send("Không thể mở trang lúc này. Vui lòng thử lại.");
});

const server = app.listen(port, host);

server.on("listening", () => {
  console.log("API IE104 đang lắng nghe trên", host, "cổng", port);
});

server.on("error", (error) => {
  console.error("Không thể khởi động API IE104:", error.code ?? error.name);
  process.exitCode = 1;
});

function shutdown() {
  if (server.listening) {
    server.close(() => {
      pool.end().catch(() => {
        process.exitCode = 1;
      });
    });
  }
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
