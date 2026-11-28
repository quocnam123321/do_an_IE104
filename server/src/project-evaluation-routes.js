import express from "express";
import { assertWebsiteOrigin } from "./auth-routes.js";
import { AuthError, requiredRole, requireSameAccount } from "./auth-security.js";
import { sendFile } from "./shared-files.js";
import { assertEvaluator, parseEvaluationForm, publishProjectEvaluation, readEvaluationAttachment, readProjectEvaluation } from "./project-evaluation-data.js";
import fileLimits from "../../web/assets/js/services/student-submissions-service.js";

export const projectEvaluationRouter = express.Router({ mergeParams: true });
projectEvaluationRouter.use((_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
}, requiredRole(), requireSameAccount);

projectEvaluationRouter.post("/", async (request, response, next) => {
  assertWebsiteOrigin(request);
  assertEvaluator(response.locals.account);
  if (!request.is("multipart/form-data")) throw new AuthError(415, "Yêu cầu cần có biểu mẫu đánh giá.");
  await readProjectEvaluation(response.locals.account, request.params.id);
  next();
}, express.raw({ type: "multipart/form-data", limit: fileLimits.maxBytes + 1024 * 1024, inflate: false }), async (request, response) => {
  const input = await parseEvaluationForm(request);
  response.status(201).json(await publishProjectEvaluation(response.locals.account, request.params.id, input));
});

projectEvaluationRouter.get("/attachments/:fileId", async (request, response) => {
  const file = await readEvaluationAttachment(response.locals.account, request.params.id, request.params.fileId);
  sendFile(response, file);
});
