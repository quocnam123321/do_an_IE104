import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { listProposals, proposalStudent } from "./proposal-data.js";
import { isDemoTeamId, listDemoTeams, listProjects } from "./project-data.js";
import { listDemoEvaluations } from "./project-evaluation-data.js";
import { listLecturerTopics } from "./lecturer-topic-data.js";
import { demoDisplayName } from "./auth-security.js";
import { listSupervisionInvitations } from "./supervision-data.js";

const studentPages = new Set([
  "tao-de-xuat.html", "loi-moi-huong-dan.html", "chi-tiet-de-tai-cho-duyet-sinh-vien.html", "de-tai-cua-toi-sinh-vien.html",
  "tong-quan-sinh-vien.html", "chi-tiet-de-tai-sinh-vien.html", "lich-han-nop.html",
  "dang-ky-de-tai.html", "chi-tiet-de-tai-gv-mo-dang-ky.html", "chi-tiet-de-tai-mo-dang-ky.html",
]);
const supervisionPages = new Set([
  "loi-moi-huong-dan.html", "tao-de-xuat.html", "de-tai-cua-toi-sinh-vien.html", "tong-quan-sinh-vien.html",
  "chi-tiet-de-tai-sinh-vien.html", "yeu-cau-cho-duyet.html", "tong-quan-giang-vien.html",
]);
const lecturerPages = new Set([
  "yeu-cau-cho-duyet.html", "chi-tiet-de-xuat-giang-vien.html", "danh-sach-de-tai-dang-huong-dan.html",
  "tong-quan-giang-vien.html", "chi-tiet-de-tai-dang-huong-dan-giang-vien.html",
  "chi-tiet-de-tai-da-tao-giang-vien.html", "chi-tiet-loi-moi-huong-dan.html", "chinh-sua-de-tai-giang-vien.html",
  "danh-sach-de-tai-da-tao.html", "tao-de-tai-giang-vien.html",
]);

export function proposalPage(folder, role) {
  const allowed = role === "student" ? studentPages : role === "lecturer" ? lecturerPages : null;
  return async (request, response, next) => {
    if (!allowed || !["GET", "HEAD"].includes(request.method)) return next();
    const page = decodeURIComponent(request.path.slice(1));
    const name = role === "lecturer" ? demoDisplayName(role) : null;
    const profile = page === (role === "lecturer" ? "ho-so-ca-nhan-giang-vien.html" : "ho-so-ca-nhan.html");
    if (!allowed.has(page) && !profile) return next();

    const meta = name && (profile || page === "tong-quan-giang-vien.html")
      ? '<meta name="ie104-demo-lecturer" content="' + name + '">' : "";
    const htmlSource = readFile(new URL("../../pages/" + folder + "/" + page, import.meta.url), "utf8");
    const account = response.locals.account;
    if (profile) {
      const html = await htmlSource;
      const profileMeta = `<meta name="ie104-profile-account" content="${account.id}" data-role="${role}" data-sample-identity="${account.is_demo}">`;
      const scripts = '<script src="/assets/js/services/profile-api.js"></script>' +
        '<script src="/assets/js/services/profile-avatar-api.js?v=20261128-profile"></script>';
      return response.type("html").send(html.replace("<head>", () => "<head>" + meta + profileMeta + scripts));
    }

    const studentDetail = page === "chi-tiet-de-tai-sinh-vien.html";
    const lecturerDetail = page === "chi-tiet-de-tai-dang-huong-dan-giang-vien.html";
    const topicAlias = lecturerDetail && !request.query.project && typeof request.query.topic === "string"
      ? `UIT-SV-${request.query.topic}` : null;
    const detailProject = request.query.project || (studentDetail ? "UIT-SV-ISE-001" : topicAlias);
    const demoWorkspace = page === "lich-han-nop.html" ? "deadlines" :
      (studentDetail || lecturerDetail) && isDemoTeamId(detailProject) ? detailProject : undefined;
    const [html, records, projects, topics, demoEvaluations, invitations, demoTeams] = await Promise.all([
      htmlSource,
      listProposals(account),
      listProjects(account),
      listLecturerTopics(account),
      listDemoEvaluations(account),
      supervisionPages.has(page) ? listSupervisionInvitations(account) : undefined,
      listDemoTeams(account, demoWorkspace),
    ]);
    if (topicAlias && Object.hasOwn(demoTeams, topicAlias)) {
      const search = new URLSearchParams(request.url.split("?", 2)[1]);
      search.delete("topic");
      search.set("project", topicAlias);
      return response.redirect(302, `${page}?${search}`);
    }
    const data = JSON.stringify({
      account: { id: account.id, role: account.role },
      student: role === "student" ? proposalStudent(account) : null,
      records,
      projects,
      topics,
      demoEvaluations,
      demoTeams,
      demoWorkspace,
      invitations,
      topicCodeFormId: page === "tao-de-xuat.html" || page === "tao-de-tai-giang-vien.html" ? randomUUID() : undefined,
    }).replaceAll("<", "\\u003c");
    // Các trang hiện có dùng defer và cần dữ liệu ngay khi khởi tạo danh sách.
    const bootstrap = meta + '<script type="application/json" id="ie104-proposal-data">' + data + '</script>'
      + '<script src="/assets/js/services/proposal-database.js?v=20261128-demo-workspaces"></script>';
    return response.type("html").send(html.replace("<head>", () => "<head>" + bootstrap));
  };
}
