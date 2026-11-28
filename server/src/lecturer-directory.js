import { readFile } from "node:fs/promises";
import { load } from "cheerio/slim";

const source = new URL("../../pages/chung/huong-nghien-cuu.html", import.meta.url);
let directoryRequest;
const keyFor = (email) => email?.trim().toLowerCase() || "";

function publishedDirectory() {
  directoryRequest ??= readFile(source, "utf8").then((html) => {
    const $ = load(html);
    return $(".research-card[id]").map((_index, card) => {
      const profile = $(card);
      const id = profile.attr("id");
      const name = profile.find("h2").first().text().trim();
      if (!name || !/^giang-vien-\d+$/.test(id)) return null;
      const department = profile.find(".research-affiliations > div").filter((_position, row) =>
        $(row).find("dt").text().trim() === "Bộ môn").first().find("dd").text().trim();
      const email = profile.find(".research-email span").first().text().trim();
      return { id, name, department, email };
    }).get();
  }).catch((error) => {
    directoryRequest = undefined;
    throw error;
  });
  return directoryRequest;
}

function uniqueByEmail(records, getEmail) {
  const matching = new Map();
  for (const record of records) {
    const key = keyFor(getEmail(record));
    if (key) matching.set(key, matching.has(key) ? null : record);
  }
  return matching;
}

export async function combineLecturerDirectory(accounts, demoAccount) {
  const directory = await publishedDirectory();
  if (demoAccount) {
    return directory.map(profile => ({
      ...profile, directoryId: profile.id, canReceive: true, demoReceiver: demoAccount.display_name,
    }));
  }
  const byVerifiedEmail = uniqueByEmail(accounts, (account) => account.authoritative_email);
  const byPublishedEmail = uniqueByEmail(directory, (profile) => profile.email);
  const used = new Set();
  const connected = [];
  const unconnected = [];

  for (const profile of directory) {
    const email = keyFor(profile.email);
    const account = byPublishedEmail.get(email) === profile ? byVerifiedEmail.get(email) : null;
    if (!account) {
      unconnected.push({ ...profile, canReceive: false });
      continue;
    }
    used.add(account.id);
    connected.push({ ...profile, id: account.id, directoryId: profile.id, canReceive: true });
  }

  const standalone = accounts.filter((account) => !used.has(account.id)).map((account) => ({
    id: account.id,
    name: account.username || account.email || "Chưa có thông tin",
    department: "",
    email: "",
    canReceive: true,
  }));
  return [...connected, ...standalone, ...unconnected];
}
