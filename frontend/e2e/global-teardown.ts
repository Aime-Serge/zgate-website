import { setPrivacyStatus, withDb } from "./db";

/** Leads the form tests submitted - nothing else is ever touched. */
const TEST_LEADS = "select id from leads_lead where name like 'E2E %'";

export default async function globalTeardown() {
  await setPrivacyStatus("draft");
  await withDb(async (client) => {
    // Their service-area links first: Django cascades in Python, so the
    // database's foreign key has no ON DELETE CASCADE of its own.
    await client.query("begin");
    await client.query(`delete from leads_lead_service_areas where lead_id in (${TEST_LEADS})`);
    await client.query("delete from leads_lead where name like 'E2E %'");
    await client.query("commit");
  });
}
