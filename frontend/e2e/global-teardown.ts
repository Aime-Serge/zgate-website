import { setPrivacyStatus, withDb } from "./db";

export default async function globalTeardown() {
  await setPrivacyStatus("draft");
  // Remove only what the form tests submitted.
  await withDb((client) => client.query("delete from leads where name like 'E2E %'"));
}
