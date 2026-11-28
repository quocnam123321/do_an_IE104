import express from "express";
import { assertWebsiteOrigin, sameOrigin } from "./auth-routes.js";
import { AuthError, requiredRole, requireSameAccount } from "./auth-security.js";
import { sendFile } from "./shared-files.js";
import {
  cancelSupervisionInvitation, createSupervisionInvitation, decideSupervisionInvitation, listSupervisionInvitations,
  markSupervisionRead, maxAttachmentBytes, parseSupervisionForm, readSupervisionFile, replyToSupervision,
} from "./supervision-data.js";

export const supervisionRouter = express.Router();
supervisionRouter.use((_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
}, requiredRole(), requireSameAccount);

const json = [sameOrigin, express.json({ limit: "16kb" })];
const upload = [(request, _response, next) => {
  assertWebsiteOrigin(request);
  if (!request.is("multipart/form-data")) throw new AuthError(415, "Yêu cầu cần có biểu mẫu lời mời.");
  next();
}, express.raw({ type: "multipart/form-data", limit: maxAttachmentBytes + 64 * 1024, inflate: false })];

supervisionRouter.get("/", async (_request, response) => {
  response.json({ invitations: await listSupervisionInvitations(response.locals.account) });
});
supervisionRouter.post("/", requiredRole("student"), upload, async (request, response) => {
  response.status(201).json(await createSupervisionInvitation(response.locals.account, await parseSupervisionForm(request)));
});
supervisionRouter.post("/:id/messages", upload, async (request, response) => {
  response.status(201).json({ record: await replyToSupervision(response.locals.account, request.params.id, await parseSupervisionForm(request)) });
});
supervisionRouter.patch("/:id/decision", json, async (request, response) => {
  response.json({ record: await decideSupervisionInvitation(response.locals.account, request.params.id, request.body?.status, request.body?.note) });
});
supervisionRouter.patch("/:id/receipt", json, async (request, response) => {
  response.json({ record: await markSupervisionRead(response.locals.account, request.params.id, request.body?.count) });
});
supervisionRouter.patch("/:id/cancellation", json, async (request, response) => {
  const { projectId, revision } = request.body ?? {};
  response.json({ project: await cancelSupervisionInvitation(response.locals.account, request.params.id, projectId, revision) });
});
supervisionRouter.get("/:id/attachments/:fileId", async (request, response) => {
  const file = await readSupervisionFile(response.locals.account, request.params.id, request.params.fileId);
  sendFile(response, file);
});
