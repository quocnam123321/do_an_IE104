const { CalendarError } = require("./google-calendar.cjs");

const verifiedDomains = new Map([["gm.uit.edu.vn", "student"], ["uit.edu.vn", "lecturer"]]);
const actor = (token) => {
  const email = (token.email ?? "").trim().toLowerCase();
  const domain = /^[^@\s]+@([^@\s]+)$/.exec(email)?.[1];
  const googleRole = token.email_verified === true && token.firebase?.sign_in_provider === "google.com"
    ? verifiedDomains.get(domain) : undefined;
  const declared = token.ie104Role;
  const role = ["student", "lecturer"].includes(declared) ? declared : googleRole ?? null;
  return { uid: token.uid, email, role, verifiedUitStudent: role === "student" && googleRole === "student" };
};
const editable = (item) => !item.id.endsWith("--deadline");

function validateEdit(input) {
  if (typeof input.name !== "string" || typeof input.description !== "string" || typeof input.due !== "string"
      || !Number.isSafeInteger(input.revision) || input.revision < 0) {
    throw new CalendarError(400, "calendar-invalid-edit");
  }
  const name = input.name.trim();
  const description = input.description.trim();
  const due = input.due;
  const instant = Date.parse(due);
  if (!name || name.length > 200 || !description || description.length > 4000
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}\+07:00$/.test(due)
      || !Number.isFinite(instant) || new Date(instant + 7 * 3_600_000).toISOString().slice(0, 16) !== due.slice(0, 16)) {
    throw new CalendarError(400, "calendar-invalid-edit");
  }
  return { name, description, due };
}

function withOverride(seed, override) {
  return {
    ...seed, revision: override?.revision ?? 0,
    name: override?.name ?? seed.name,
    description: override?.description ?? seed.description ?? "",
    due: override?.due ?? seed.due,
  };
}

module.exports = { actor, editable, validateEdit, withOverride };
