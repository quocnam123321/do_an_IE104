import express from "express";
import { assertWebsiteOrigin, sameOrigin } from "./auth-routes.js";
import { AuthError, requiredRole, requireSameAccount } from "./auth-security.js";
import { readProject } from "./project-data.js";
import { sendFile } from "./shared-files.js";
import { assertSubmissionRole, deleteRequirement, parseSubmissionUpload, readSubmissionFile,
  saveRequirement, saveSubmissionFeedback, setSubmissionsLocked, submitAssignment } from "./project-submission-data.js";
import fileLimits from "../../web/assets/js/services/student-submissions-service.js";

export const projectSubmissionRouter = express.Router({ mergeParams: true });
projectSubmissionRouter.use((_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
}, requiredRole(), requireSameAccount);

projectSubmissionRouter.post("/requirements/:requirementId/submissions", async (request, response, next) => {
  assertWebsiteOrigin(request);
  assertSubmissionRole(response.locals.account, "student");
  if (!request.is("multipart/form-data")) throw new AuthError(415, "Yêu cầu cần chứa tệp bài nộp.");
  const { progress } = await readProject(response.locals.account, request.params.id);
  if (!progress.viewerMemberKey) throw new AuthError(403, "Chỉ thành viên nhóm được nộp bài.");
  next();
}, express.raw({ type: "multipart/form-data", limit: fileLimits.maxBytes + 1024 * 1024, inflate: false }), async (request, response) => {
  const input = await parseSubmissionUpload(request);
  response.status(201).json(await submitAssignment(response.locals.account, request.params.id, request.params.requirementId, input));
});

projectSubmissionRouter.use(sameOrigin, express.json({ limit: "32kb" }));

projectSubmissionRouter.post("/requirements", async (request, response) => {
  response.status(201).json(await saveRequirement(response.locals.account, request.params.id, null, request.body ?? {}));
});
projectSubmissionRouter.patch("/requirements/:requirementId", async (request, response) => {
  response.json(await saveRequirement(response.locals.account, request.params.id, request.params.requirementId, request.body ?? {}));
});
projectSubmissionRouter.delete("/requirements/:requirementId", async (request, response) => {
  response.json(await deleteRequirement(response.locals.account, request.params.id, request.params.requirementId, request.body?.revision));
});
projectSubmissionRouter.patch("/lock", async (request, response) => {
  response.json(await setSubmissionsLocked(response.locals.account, request.params.id, null, request.body ?? {}));
});
projectSubmissionRouter.patch("/requirements/:requirementId/lock", async (request, response) => {
  response.json(await setSubmissionsLocked(response.locals.account, request.params.id, request.params.requirementId, request.body ?? {}));
});
projectSubmissionRouter.post("/submissions/:submissionId/feedback", async (request, response) => {
  response.status(201).json(await saveSubmissionFeedback(response.locals.account, request.params.id,
    request.params.submissionId, request.body ?? {}));
});
projectSubmissionRouter.get("/submissions/:submissionId/files/:fileId", async (request, response) => {
  const file = await readSubmissionFile(response.locals.account, request.params.id, request.params.submissionId, request.params.fileId);
  sendFile(response, file);
});
