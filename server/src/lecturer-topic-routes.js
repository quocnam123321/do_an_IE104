import express from "express";
import { AuthError, requiredRole, requireSameAccount } from "./auth-security.js";
import { sameOrigin } from "./auth-routes.js";
import { listLecturerTopics, readLecturerTopicFile, saveLecturerTopic, setLecturerTopicRegistration } from "./lecturer-topic-data.js";
import { registerForTopic } from "./registration-data.js";
import { parseRecordUpload, recordUpload, sendFile } from "./shared-files.js";

export const lecturerTopicRouter = express.Router();
lecturerTopicRouter.use((_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
}, requiredRole(), requireSameAccount);

function forRole(response, role) {
  const account = response.locals.account;
  if (account.role !== role) throw new AuthError(403, "Bạn không có quyền thực hiện thao tác này.");
  return account;
}

lecturerTopicRouter.get("/", async (_request, response) => {
  response.json({ topics: await listLecturerTopics(response.locals.account) });
});
lecturerTopicRouter.get("/:code/files/:fileId", async (request, response) => {
  const { file, inline } = await readLecturerTopicFile(response.locals.account, request.params.code, request.params.fileId);
  sendFile(response, file, { inline });
});
lecturerTopicRouter.post("/", recordUpload, async (request, response) => {
  const account = forRole(response, "lecturer");
  const { payload, files } = await parseRecordUpload(request, { lecturerTopic: true });
  const { topic, topicCodeFormId } = payload ?? {};
  response.status(201).json({ topic: await saveLecturerTopic(account, topic, { topicCodeFormId, files }) });
});
lecturerTopicRouter.patch("/:code", recordUpload, async (request, response) => {
  const account = forRole(response, "lecturer");
  const { payload, files } = await parseRecordUpload(request, { lecturerTopic: true });
  response.json({ topic: await saveLecturerTopic(account, payload?.topic,
    { code: request.params.code, revision: payload?.revision, files }) });
});
const json = [sameOrigin, express.json({ limit: "256kb" })];
lecturerTopicRouter.patch("/:code/registration", json, async (request, response) => {
  response.json({ topic: await setLecturerTopicRegistration(forRole(response, "lecturer"), request.params.code, request.body ?? {}) });
});
lecturerTopicRouter.post("/:code/registrations", json, async (request, response) => {
  response.status(201).json(await registerForTopic(forRole(response, "student"), request.params.code, request.body ?? {}));
});
