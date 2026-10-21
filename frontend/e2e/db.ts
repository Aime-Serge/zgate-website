/** Direct database access for e2e setup only (never used by the app). */
import pg from "pg";

export async function withDb<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) throw new Error("DATABASE_URL is required for e2e setup");
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/**
 * Forms only render once a privacy notice is published. e2e makes the
 * seeded draft live for the run and takes it down afterwards. Written
 * straight to Wagtail's page table (`live` is what the CMS API serves),
 * which skips the CMS's cache-clearing webhook - so no page may be
 * requested before setup runs (CI only polls /api/health while waiting),
 * or it would stay cached in its pre-publish state.
 */
export const setPrivacyStatus = (status: "draft" | "published") =>
  withDb((client) =>
    client.query("update wagtailcore_page set live = $1 where slug = 'privacy'", [
      status === "published",
    ]),
  );
