import express from "express";
import { AuthError, requiredRole, requireSameAccount } from "./auth-security.js";
import { sameOrigin } from "./auth-routes.js";
import {
  availableLecturers, changeProposalStatus, createProposal, listProposals, readProposal, readProposalFile, updateProposal,
} from "./proposal-data.js";
import { parseRecordUpload, recordUpload, sendFile } from "./shared-files.js";

export const proposalRouter = express.Router();
proposalRouter.use((_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
});
proposalRouter.use(requiredRole(), requireSameAccount, (_request, response, next) => {
  const account = response.locals.account;
  if (!["student", "lecturer"].includes(account.role)) throw new AuthError(403, "Bạn không có quyền truy cập đề xuất.");
  next();
});

function forRole(response, role) {
  const account = response.locals.account;
  if (account.role !== role) throw new AuthError(403, "Bạn không có quyền thực hiện thao tác này.");
  return account;
}

proposalRouter.get("/", async (_request, response) => {
  const account = response.locals.account;
  response.json({ accountId: account.id, records: await listProposals(account) });
});

proposalRouter.get("/lecturers", async (_request, response) => {
  forRole(response, "student");
  response.json({ lecturers: await availableLecturers() });
});

proposalRouter.get("/:id", async (request, response) => {
  response.json({ record: await readProposal(response.locals.account, request.params.id) });
});

proposalRouter.get("/:id/files/:fileId", async (request, response) => {
  const { file, inline } = await readProposalFile(response.locals.account, request.params.id, request.params.fileId);
  sendFile(response, file, { inline });
});

proposalRouter.post("/", recordUpload, async (request, response) => {
  const { payload, files } = await parseRecordUpload(request);
  const record = await createProposal(forRole(response, "student"), payload, files);
  response.status(201).json({ record });
});

proposalRouter.patch("/:id", recordUpload, async (request, response) => {
  const { payload, files } = await parseRecordUpload(request);
  const record = await updateProposal(forRole(response, "student"), request.params.id, payload?.revision, payload?.proposal, files);
  response.json({ record });
});

const json = [sameOrigin, express.json({ limit: "256kb" })];
proposalRouter.patch("/:id/withdrawal", json, async (request, response) => {
  response.json(await changeProposalStatus(forRole(response, "student"), request.params.id, request.body?.revision, "withdraw"));
});

proposalRouter.patch("/:id/decision", json, async (request, response) => {
  response.json(await changeProposalStatus(forRole(response, "lecturer"), request.params.id, request.body?.revision,
    request.body?.decision, request.body?.reason));
});
