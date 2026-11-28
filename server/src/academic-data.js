import { pool } from "./db.js";
import { AuthError, systemDemoEnabled, transaction } from "./auth-security.js";

const offset = 7 * 3600000;
const minute = 60000;
const types = ["course", "graduation", "thesis"];
export const vietnamMinute = timestamp => new Date(new Date(timestamp).getTime() + offset).toISOString().slice(0, 16);
export const academicTermId = (year, semester) => {
  const firstYear = /^20\d{2}(?=\s*[-–])/.exec(String(year ?? ""))?.[0];
  const term = ["he", "summer"].includes(semester) ? "3" : String(semester);
  return firstYear && /^[1-4]$/.test(term) ? firstYear + "-" + term : null;
};

function timestamp(value) {
  if (typeof value !== "string" || !/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const milliseconds = Date.parse(value + "+07:00");
  return Number.isFinite(milliseconds) && vietnamMinute(milliseconds) === value ? new Date(milliseconds) : null;
}

export const roundEnd = row => new Date(row.ends_at.getTime() + (row.source ? minute : 0));

function roundView(row) {
  return { id: row.id, term: row.term, name: row.name, type: row.type, start: vietnamMinute(row.starts_at),
    end: vietnamMinute(row.ends_at), source: row.source, sample: row.is_sample, revision: row.revision };
}

export async function readAcademic() {
  const [terms, rounds] = await Promise.all([
    pool.query("SELECT id FROM academic_terms ORDER BY id DESC"),
    pool.query("SELECT * FROM registration_rounds WHERE NOT is_sample OR $1 ORDER BY starts_at DESC, id", [systemDemoEnabled]),
  ]);
  return { terms: terms.rows.map(term => term.id), rounds: rounds.rows.map(roundView) };
}

export async function addAcademicTerm({ year, number } = {}) {
  if (typeof year !== "string" || !/^20\d{2}$/.test(year) || !/^[1-3]$/.test(number)) {
    throw new AuthError(400, "Hãy nhập năm bắt đầu từ 2000 đến 2099 và chọn học kỳ 1, 2 hoặc 3.");
  }
  if (Number(year) < Number(vietnamMinute(Date.now()).slice(0, 4))) throw new AuthError(400, "Năm bắt đầu phải từ năm hiện tại trở đi.");
  const id = year + "-" + number;
  const result = await pool.query("INSERT INTO academic_terms (id) VALUES ($1) ON CONFLICT DO NOTHING", [id]);
  if (!result.rowCount) throw new AuthError(409, "Học kỳ này đã tồn tại.");
  return { id };
}

export async function saveAcademicRound(input, id) {
  const { term, type, revision } = input;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const start = timestamp(input.start);
  const end = timestamp(input.end);
  if (!name || name.length > 120 || name.includes("\0")) throw new AuthError(400, "Hãy nhập tên đợt đăng ký.");
  if (!start || !end || start >= end) throw new AuthError(400, "Thời điểm đóng phải sau thời điểm mở đăng ký.");
  if (typeof term !== "string" || !/^20\d{2}-[1-4]$/.test(term) || !types.includes(type)) {
    throw new AuthError(400, "Hãy chọn học kỳ và loại đề tài hợp lệ.");
  }
  return transaction(async client => {
    let current;
    if (id) {
      ({ rows: [current] } = await client.query("SELECT * FROM registration_rounds WHERE id = $1 AND (NOT is_sample OR $2) FOR UPDATE", [id, systemDemoEnabled]));
      if (!current || current.revision !== revision) throw new AuthError(409, "Đợt đã thay đổi. Hãy đóng biểu mẫu và mở lại.");
      if (term !== current.term || type !== current.type) {
        const linked = await client.query(`SELECT 1 FROM lecturer_topics WHERE registration_round_id=$1
          UNION ALL SELECT 1 FROM proposals WHERE registration_round_id=$1 LIMIT 1`, [id]);
        if (linked.rowCount) throw new AuthError(409, "Đợt đã có đề tài. Hãy giữ học kỳ và loại đề tài hiện tại.");
      }
    }
    const firstAllowed = Math.ceil(Date.now() / minute) * minute;
    for (const [key, value, previous] of [["start", start, current?.starts_at], ["end", end, current?.ends_at]]) {
      if (value.getTime() !== previous?.getTime() && value.getTime() < firstAllowed) {
        throw Object.assign(new AuthError(400, "Mốc mới phải từ thời điểm hiện tại trở đi."), { field: key });
      }
    }
    if (!(await client.query("SELECT 1 FROM academic_terms WHERE id = $1", [term])).rowCount) {
      throw new AuthError(400, "Hãy chọn học kỳ và loại đề tài hợp lệ.");
    }
    if (!current) {
      const { rows: [number] } = await client.query("SELECT nextval('registration_round_number') AS id");
      id = "DOT-" + String(number.id).padStart(2, "0");
      await client.query("INSERT INTO registration_rounds (id, term, type, name, starts_at, ends_at) VALUES ($1,$2,$3,$4,$5,$6)",
        [id, term, type, name, start, end]);
    } else {
      const unchanged = term === current.term && type === current.type &&
        start.getTime() === current.starts_at.getTime() && end.getTime() === current.ends_at.getTime();
      await client.query(`
        UPDATE registration_rounds SET term=$2, type=$3, name=$4, starts_at=$5, ends_at=$6,
          source=$7, revision=revision+1 WHERE id=$1
      `, [id, term, type, name, start, end, unchanged ? current.source : null]);
    }
    const { rows: [saved] } = await client.query("SELECT * FROM registration_rounds WHERE id=$1", [id]);
    return { id, round: roundView(saved) };
  });
}

export async function lockRound(client, id) {
  const { rows: [row] } = await client.query(
    "SELECT * FROM registration_rounds WHERE id = $1 AND (NOT is_sample OR $2) FOR SHARE", [id, systemDemoEnabled]);
  return row;
}

export async function selectAcademicRound(client, id, { academicYear, semester, topicType }, { keep = false, allowUpcoming = false } = {}) {
  if (typeof id !== "string" || id.length > 80 || id.includes("\0")) throw new AuthError(400, "Đợt đăng ký không hợp lệ.");
  const round = await lockRound(client, id);
  if (!round || round.term !== academicTermId(academicYear, semester) || round.type !== topicType) {
    throw new AuthError(400, "Chọn đợt đăng ký phù hợp với học kỳ và loại đề tài.");
  }
  const now = Date.now();
  if (!keep && roundEnd(round).getTime() <= now) throw new AuthError(409, "Đợt đăng ký đã đóng.");
  if (!keep && !allowUpcoming && round.starts_at.getTime() > now) throw new AuthError(409, "Đợt đăng ký chưa mở.");
  return round;
}
