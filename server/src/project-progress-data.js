import { pool } from "./db.js";
import { AuthError, demoDisplayName, isUuid, transaction } from "./auth-security.js";
import { lockProject, readProject } from "./project-data.js";
import validation from "../../web/assets/js/services/project-progress-service.js";

const { validateTask, validateUpdate, defaultPercent } = validation;

function checkedInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AuthError(400, "Thông tin công việc không hợp lệ.");
  }
  return input;
}

function validated(result) {
  if (result.errors.length) throw new AuthError(400, result.errors[0].message);
  if (Object.values(result.value).some(value => typeof value === "string" && value.includes("\0"))) {
    throw new AuthError(400, "Nội dung chứa ký tự không hợp lệ.");
  }
  return result.value;
}

function findTask(progress, taskId) {
  const task = progress.tasks.find(item => item.id === taskId);
  if (!task) throw new AuthError(404, "Công việc không còn tồn tại.");
  return task;
}

async function changeProgress(account, id, revision, { manage = false } = {}, change) {
  return transaction(async client => {
    const projectId = await lockProject(account, id, client);
    const { project, team, progress } = await readProject(account, id, client);
    const member = team.members.find(item => item.assignmentKey === progress.viewerMemberKey);
    if (account.role !== "student" || !member || (manage && member.role !== "nhom-truong")) {
      throw new AuthError(403, manage ? "Chỉ nhóm trưởng được thay đổi công việc." : "Chỉ thành viên nhóm được cập nhật tiến độ.");
    }
    if (project.status !== "dang-thuc-hien") throw new AuthError(409, "Đề tài hiện chỉ cho xem tiến độ.");
    if (!Number.isInteger(revision) || revision !== progress.revision) {
      throw new AuthError(409, "Tiến độ đã thay đổi. Hãy mở lại hộp thoại để xem bản mới.");
    }
    await change({ client, projectId, team, progress, member });
    await client.query("UPDATE projects SET progress_revision = progress_revision + 1 WHERE id = $1", [projectId]);
    return (await readProject(account, id, client)).progress;
  });
}

export function saveProjectTask(account, id, taskId, input, revision) {
  return changeProgress(account, id, revision, { manage: true }, async ({ client, projectId, team, progress }) => {
    const previous = taskId ? findTask(progress, taskId) : null;
    const value = validated(validateTask(checkedInput(input), team, { editing: Boolean(previous) }));
    const status = value.status ?? previous?.status ?? "chua-thuc-hien";
    const percent = status === previous?.status ? previous.percent : defaultPercent[status];
    const fields = [value.title, value.description ?? "", value.deadline, status, percent];
    let savedId = taskId;
    if (previous) {
      await client.query("UPDATE project_tasks SET title=$1, description=$2, deadline=$3, status=$4, percent=$5 WHERE project_id=$6 AND id=$7",
        [...fields, projectId, taskId]);
      await client.query("DELETE FROM project_task_assignees WHERE project_id=$1 AND task_id=$2", [projectId, taskId]);
    } else {
      const { rows: [task] } = await client.query(`
        INSERT INTO project_tasks (title, description, deadline, status, percent, project_id)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
      `, [...fields, projectId]);
      savedId = task.id;
    }
    await client.query(`
      INSERT INTO project_task_assignees (project_id, task_id, member_position)
      SELECT $1, $2, position FROM unnest($3::integer[]) AS member(position)
    `, [projectId, savedId, value.assigneeCodes.map(key => Number(key.slice("member-".length)))]);
  });
}

export function deleteProjectTasks(account, id, taskIds, revision) {
  if (!Array.isArray(taskIds) || !taskIds.length || !taskIds.every(isUuid) || new Set(taskIds).size !== taskIds.length) {
    throw new AuthError(400, "Chọn ít nhất một công việc hợp lệ để xóa.");
  }
  return changeProgress(account, id, revision, { manage: true }, async ({ client, projectId, progress }) => {
    taskIds.forEach(taskId => findTask(progress, taskId));
    await client.query("DELETE FROM project_tasks WHERE project_id=$1 AND id=ANY($2::uuid[])", [projectId, taskIds]);
  });
}

export function updateProjectProgress(account, id, taskId, input, revision) {
  return changeProgress(account, id, revision, {}, async ({ client, projectId, progress, member }) => {
    const task = findTask(progress, taskId);
    if (member.role !== "nhom-truong" && !task.assigneeCodes.includes(member.assignmentKey)) {
      throw new AuthError(403, "Bạn chỉ được cập nhật công việc được phân công cho mình.");
    }
    const { status, percent, content } = validated(validateUpdate({ ...checkedInput(input), taskId }));
    await client.query("UPDATE project_tasks SET status=$1, percent=$2 WHERE project_id=$3 AND id=$4",
      [status, percent, projectId, taskId]);
    await client.query(`
      INSERT INTO project_progress_updates (project_id, task_id, task_title, actor_account_id, actor_name, actor_code, content, status, percent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [projectId, taskId, task.title, account.id, member.name, member.code, content, status, percent]);
  });
}

function commentAuthor(account, { team, progress }) {
  if (account.role === "student") {
    const member = team.members.find(item => item.assignmentKey === progress.viewerMemberKey);
    if (!member) throw new AuthError(403, "Chỉ thành viên nhóm được bình luận.");
    return member.name;
  }
  return demoDisplayName("lecturer") || account.display_name || account.username || account.email || "Giảng viên";
}

function browserComment(row, projectId) {
  return { id: row.id, projectId, taskId: row.task_id, parentId: row.parent_id, content: row.content,
    createdAt: row.created_at, author: { role: row.author_role, name: row.author_name } };
}

export async function readProjectTaskComments(account, id, taskId) {
  const state = await readProject(account, id);
  findTask(state.progress, taskId);
  const author = { role: account.role, name: commentAuthor(account, state) };
  const { rows } = await pool.query("SELECT * FROM project_task_comments WHERE task_id=$1 ORDER BY created_at, id", [taskId]);
  return { author, comments: rows.map(row => browserComment(row, id)) };
}

export async function addProjectTaskComment(account, id, taskId, { content, parentId = null } = {}) {
  const comment = typeof content === "string" ? content.trim() : "";
  if (!comment || comment.length > 2000 || comment.includes("\0")) {
    throw new AuthError(400, "Nhập bình luận từ 1 đến 2000 ký tự.");
  }
  return transaction(async client => {
    await lockProject(account, id, client);
    const state = await readProject(account, id, client);
    findTask(state.progress, taskId);
    const name = commentAuthor(account, state);
    if (parentId !== null) {
      if (!isUuid(parentId)) throw new AuthError(400, "Chọn bình luận cần phản hồi.");
      const parent = await client.query("SELECT id FROM project_task_comments WHERE id=$1 AND task_id=$2 AND parent_id IS NULL", [parentId, taskId]);
      if (!parent.rowCount) throw new AuthError(400, "Chọn một bình luận gốc của công việc để phản hồi.");
    }
    const { rows: [entry] } = await client.query(`
      INSERT INTO project_task_comments (task_id, parent_id, author_account_id, author_name, author_role, content)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [taskId, parentId, account.id, name, account.role, comment]);
    return browserComment(entry, id);
  });
}
