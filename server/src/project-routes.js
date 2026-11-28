import express from "express";
import { sameOrigin } from "./auth-routes.js";
import { requiredRole, requireSameAccount } from "./auth-security.js";
import { listDemoTeams, listProjects, readProject, readProjectCover } from "./project-data.js";
import { sendFile } from "./shared-files.js";
import { listDemoEvaluations } from "./project-evaluation-data.js";
import { changeProjectMember } from "./project-team-data.js";
import { addProjectTaskComment, deleteProjectTasks, readProjectTaskComments,
  saveProjectTask, updateProjectProgress } from "./project-progress-data.js";

export const projectRouter = express.Router();

projectRouter.use((_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
}, requiredRole(), requireSameAccount, sameOrigin, express.json({ limit: "64kb" }));

projectRouter.get("/", async (request, response) => {
  const account = response.locals.account;
  const [projects, demoEvaluations, demoTeams] = await Promise.all([
    listProjects(account), listDemoEvaluations(account), listDemoTeams(account, request.query.demoWorkspace),
  ]);
  response.json({ projects, demoEvaluations, demoTeams });
});

projectRouter.get("/:id", async (request, response) => {
  response.json(await readProject(response.locals.account, request.params.id));
});

projectRouter.get("/:id/cover/:fileId", async (request, response) => {
  const file = await readProjectCover(response.locals.account, request.params.id, request.params.fileId);
  sendFile(response, file, { inline: true });
});

projectRouter.post("/:id/team/members", async (request, response) => {
  response.status(201).json({ project: await changeProjectMember(response.locals.account, request.params.id,
    null, request.body?.member, request.body?.revision) });
});
projectRouter.patch("/:id/team/members/:key", async (request, response) => {
  response.json({ project: await changeProjectMember(response.locals.account, request.params.id,
    request.params.key, request.body?.member, request.body?.revision) });
});
projectRouter.delete("/:id/team/members/:key", async (request, response) => {
  response.json({ project: await changeProjectMember(response.locals.account, request.params.id,
    request.params.key, null, request.body?.revision, true) });
});

projectRouter.post("/:id/tasks", async (request, response) => {
  const { task, revision } = request.body ?? {};
  const progress = await saveProjectTask(response.locals.account, request.params.id, null, task, revision);
  response.status(201).json({ progress });
});

projectRouter.patch("/:id/tasks/:taskId", async (request, response) => {
  const { task, revision } = request.body ?? {};
  const progress = await saveProjectTask(response.locals.account, request.params.id, request.params.taskId, task, revision);
  response.json({ progress });
});

projectRouter.delete("/:id/tasks", async (request, response) => {
  const { taskIds, revision } = request.body ?? {};
  const progress = await deleteProjectTasks(response.locals.account, request.params.id, taskIds, revision);
  response.json({ progress });
});

projectRouter.post("/:id/tasks/:taskId/updates", async (request, response) => {
  const { update, revision } = request.body ?? {};
  const progress = await updateProjectProgress(response.locals.account, request.params.id, request.params.taskId, update, revision);
  response.status(201).json({ progress });
});

projectRouter.get("/:id/tasks/:taskId/comments", async (request, response) => {
  response.json(await readProjectTaskComments(response.locals.account, request.params.id, request.params.taskId));
});

projectRouter.post("/:id/tasks/:taskId/comments", async (request, response) => {
  const comment = await addProjectTaskComment(response.locals.account, request.params.id, request.params.taskId, request.body ?? {});
  response.status(201).json({ comment });
});
