import { AuthError, transaction } from "./auth-security.js";
import { lockTeamProject, readTeamProject } from "./project-data.js";

export function assertTeamLeader(account, { team, project }, revision) {
  if (account.role !== "student" || !team.members.some(member =>
    member.assignmentKey === team.viewerMemberKey && member.role === "nhom-truong")) {
    throw new AuthError(403, "Chỉ nhóm trưởng được thay đổi thành viên và lời mời.");
  }
  if (project.status !== "dang-thuc-hien") throw new AuthError(409, "Đề tài hiện chỉ cho xem thông tin nhóm.");
  if (team.revision !== revision) throw new AuthError(409, "Thông tin nhóm đã thay đổi. Hãy mở lại hộp thoại.");
}

export async function bumpTeamRevision(client, projectId) {
  await client.query("UPDATE projects SET team_revision = team_revision + 1 WHERE id = $1", [projectId]);
}

export function changeProjectMember(account, id, key, input, revision, remove = false) {
  return transaction(async client => {
    const projectId = await lockTeamProject(account, id, client);
    const state = await readTeamProject(account, id, client);
    assertTeamLeader(account, state, revision);
    const { team } = state;
    const previous = key ? team.members.find(member => member.assignmentKey === key) : null;
    if (key && (!previous || previous.role !== "thanh-vien")) {
      throw new AuthError(404, "Không tìm thấy thành viên có thể thay đổi.");
    }
    const position = key ? Number(key.slice("member-".length)) : null;
    if (remove) {
      await client.query(
        "DELETE FROM project_task_assignees WHERE project_id = $1 AND member_position = $2", [projectId, position],
      );
      await client.query("DELETE FROM project_members WHERE project_id = $1 AND position = $2", [projectId, position]);
    } else {
      const name = typeof input?.name === "string" ? input.name.trim() : "";
      const code = typeof input?.code === "string" ? input.code.trim().toUpperCase() : "";
      if (!name || name.length > 100 || name.includes("\0")) throw new AuthError(400, "Nhập họ tên từ 1 đến 100 ký tự.");
      if (!code || code.length > 20 || /[\s\0]/u.test(code)) throw new AuthError(400, "Nhập MSSV tối đa 20 ký tự, không có khoảng trắng.");
      if (team.members.some(member => member !== previous && member.code.toUpperCase() === code)) {
        throw new AuthError(409, "MSSV này đã có trong nhóm.");
      }
      if (previous) {
        await client.query("UPDATE project_members SET display_name = $3, student_code = $4 WHERE project_id = $1 AND position = $2",
          [projectId, position, name, code]);
      } else {
        if (team.members.length >= team.maxMembers) throw new AuthError(409, `Nhóm đã đủ ${team.maxMembers} thành viên.`);
        await client.query(`
          INSERT INTO project_members (project_id, position, display_name, student_code, role)
          SELECT $1, COALESCE(max(position), 0) + 1, $2, $3, 'thanh-vien'
          FROM project_members WHERE project_id = $1
        `, [projectId, name, code]);
      }
    }
    await client.query("UPDATE projects SET team_revision = team_revision + 1, progress_revision = progress_revision + 1 WHERE id = $1", [projectId]);
    return readTeamProject(account, id, client);
  });
}
