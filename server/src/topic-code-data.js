import { AuthError, isUuid, transaction } from "./auth-security.js";
import configuration from "../../assets/js/services/proposal-service.js";

const { topicCodePrefixes } = configuration;

async function allocateTopicCode(client, account, type) {
  const { rows: [counter] } = await client.query(`
    UPDATE proposal_code_counters SET last_number = last_number + 1
    WHERE type = $1 AND last_number < 999 RETURNING last_number
  `, [type]);
  if (!counter) throw new AuthError(409, "Đã hết mã ba chữ số cho loại đề tài này.");
  const prefix = account.role === "lecturer" && type === "khoa-luan" ? "ISEKTLN" : topicCodePrefixes[type];
  return prefix + "-" + String(counter.last_number).padStart(3, "0");
}

export async function reserveTopicCode(account, type, formId) {
  if (!["student", "lecturer"].includes(account.role)) throw new AuthError(403, "Bạn không có quyền lấy mã đề tài.");
  if (typeof type !== "string" || !Object.hasOwn(topicCodePrefixes, type) || !isUuid(formId)) {
    throw new AuthError(400, "Loại đề tài hoặc biểu mẫu không hợp lệ.");
  }
  return transaction(async client => {
    // Khóa bộ đếm trước khi đọc để các yêu cầu lặp của cùng biểu mẫu nhận cùng mã.
    await client.query("SELECT type FROM proposal_code_counters WHERE type = $1 FOR UPDATE", [type]);
    const { rows: [existing] } = await client.query(`
      SELECT topic_code FROM topic_code_reservations
      WHERE account_id = $1 AND form_id = $2 AND type = $3
    `, [account.id, formId, type]);
    if (existing) return existing.topic_code;
    const code = await allocateTopicCode(client, account, type);
    await client.query(`
      INSERT INTO topic_code_reservations (account_id, form_id, type, topic_code)
      VALUES ($1, $2, $3, $4)
    `, [account.id, formId, type, code]);
    return code;
  });
}

export async function useTopicCode(client, account, type, formId) {
  if (formId === undefined) return allocateTopicCode(client, account, type);
  if (!isUuid(formId)) throw new AuthError(400, "Biểu mẫu cấp mã đề tài không hợp lệ.");
  const { rows: [reserved] } = await client.query(`
    UPDATE topic_code_reservations SET used_at = now()
    WHERE account_id = $1 AND form_id = $2 AND type = $3 AND used_at IS NULL
    RETURNING topic_code
  `, [account.id, formId, type]);
  if (!reserved) throw new AuthError(409, "Mã đề tài không khả dụng cho biểu mẫu này. Vui lòng tải lại để lấy mã mới.");
  return reserved.topic_code;
}
