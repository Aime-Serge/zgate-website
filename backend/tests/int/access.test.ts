/**
 * Role and data-protection rules, exercised through Payload's Local API
 * as real users (overrideAccess: false) against a real database.
 *
 * Skips cleanly without DATABASE_URL / PAYLOAD_SECRET - the
 * same pattern as the e-learning API's DB-dependent tests. CI provides all
 * three and applies migrations first.
 */
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AuditLog, Lead, User } from "@zgate/cms-contracts/payload-types";

const canRun = Boolean(process.env["DATABASE_URL"] && process.env["PAYLOAD_SECRET"]);
const run = `t${Date.now()}`;
const forbidden = { status: 403 };

describe.skipIf(!canRun)("website CMS access rules", () => {
  let payload: Payload;
  let admin: User;
  let publisher: User;
  let editor: User;
  let lead: Lead;
  const created = { pages: [] as number[], leads: [] as number[], users: [] as number[] };

  const password = (label: string) => `pw-${run}-${label}-A1!`;

  const makeUser = async (role: "admin" | "publisher" | "editor", label: string = role) => {
    const user = await payload.create({
      collection: "users",
      overrideAccess: true,
      data: {
        email: `${run}-${label}@test.invalid`,
        password: password(label),
        name: label,
        roles: [role],
      },
    });
    created.users.push(user.id);
    return user;
  };

  /** Newest audit entry matching `where`, read as the system. */
  const latestLog = async (where: object): Promise<AuditLog | undefined> => {
    const logs = await payload.find({
      collection: "audit-logs",
      where: where as never,
      sort: "-createdAt",
      limit: 1,
      overrideAccess: true,
    });
    return logs.docs[0];
  };

  const pageData = (slug: string, status: "draft" | "published") => ({
    title: slug,
    slug,
    pageType: "marketing" as const,
    layout: [
      { blockType: "callToAction" as const, heading: "Next", label: "Go", href: "/contact" },
    ],
    _status: status,
  });

  beforeAll(async () => {
    const [{ getPayload }, { default: config }] = await Promise.all([
      import("payload"),
      import("@payload-config"),
    ]);
    payload = await getPayload({ config });
    admin = await makeUser("admin");
    publisher = await makeUser("publisher");
    editor = await makeUser("editor");
    lead = await payload.create({
      collection: "leads",
      overrideAccess: true,
      data: {
        kind: "contact",
        status: "new",
        name: `${run} Person`,
        contact: "+250 700 000 000",
        consent: {
          contactAllowed: true,
          noticeVersion: "test",
          consentedAt: new Date().toISOString(),
        },
      },
    });
    created.leads.push(lead.id);
  });

  afterAll(async () => {
    if (!payload) return;
    for (const id of created.pages)
      await payload.delete({ collection: "pages", id, overrideAccess: true });
    for (const id of created.leads)
      await payload.delete({ collection: "leads", id, overrideAccess: true });
    for (const id of created.users)
      await payload
        .delete({ collection: "users", id, overrideAccess: true })
        .catch(() => undefined); // already deleted by a test
    // Every entry this run wrote as a test user (by the email snapshot -
    // the actor link is gone once the user is), or about a test user.
    await payload.delete({
      collection: "audit-logs",
      where: {
        or: [
          { actorEmail: { like: `${run}-` } },
          {
            and: [
              { targetCollection: { equals: "users" } },
              { docIds: { in: created.users.map(String) } },
            ],
          },
        ],
      },
      overrideAccess: true,
    });
  });

  describe("publishing workflow", () => {
    it("lets an editor save a draft", async () => {
      const page = await payload.create({
        collection: "pages",
        data: pageData(`${run}-draft`, "draft"),
        draft: true,
        user: editor,
        overrideAccess: false,
      });
      created.pages.push(page.id);
      expect(page._status).toBe("draft");
    });

    it("refuses to let an editor publish", async () => {
      await expect(
        payload.create({
          collection: "pages",
          data: pageData(`${run}-editor-pub`, "published"),
          user: editor,
          overrideAccess: false,
        }),
      ).rejects.toMatchObject(forbidden);
    });

    it("lets a publisher publish", async () => {
      const page = await payload.create({
        collection: "pages",
        data: pageData(`${run}-pub`, "published"),
        user: publisher,
        overrideAccess: false,
      });
      created.pages.push(page.id);
      expect(page._status).toBe("published");
    });

    it("never shows drafts to anonymous visitors, even when they ask for drafts", async () => {
      const result = await payload.find({
        collection: "pages",
        where: { slug: { equals: `${run}-draft` } },
        draft: true,
        overrideAccess: false,
      });
      expect(result.docs).toHaveLength(0);
    });
  });

  describe("leads (personal data)", () => {
    it("are hidden from editors", async () => {
      await expect(
        payload.find({ collection: "leads", user: editor, overrideAccess: false }),
      ).rejects.toMatchObject(forbidden);
    });

    it("can't be created over the API, even by an admin", async () => {
      await expect(
        payload.create({
          collection: "leads",
          data: {
            kind: "contact",
            status: "new",
            name: "x",
            contact: "y",
            consent: {
              contactAllowed: true,
              noticeVersion: "x",
              consentedAt: new Date().toISOString(),
            },
          },
          user: admin,
          overrideAccess: false,
        }),
      ).rejects.toMatchObject(forbidden);
    });

    it("records every staff read in the audit log", async () => {
      await payload.findByID({
        collection: "leads",
        id: lead.id,
        user: publisher,
        overrideAccess: false,
      });
      const logs = await payload.find({
        collection: "audit-logs",
        where: {
          and: [{ actor: { equals: publisher.id } }, { targetCollection: { equals: "leads" } }],
        },
        overrideAccess: true,
      });
      expect(
        logs.docs.some(
          (log) => log.action === "read" && (log.docIds as string[]).includes(String(lead.id)),
        ),
      ).toBe(true);
    });

    it("keeps consent records immutable after submission", async () => {
      const updated = await payload.update({
        collection: "leads",
        id: lead.id,
        data: {
          status: "contacted",
          consent: {
            contactAllowed: false,
            noticeVersion: "tampered",
            consentedAt: lead.consent.consentedAt,
          },
        },
        user: publisher,
        overrideAccess: false,
      });
      expect(updated.status).toBe("contacted");
      expect(updated.consent.contactAllowed).toBe(true);
      expect(updated.consent.noticeVersion).toBe("test");
    });

    it("logs which fields an update changed - names, never values", async () => {
      // The update in the test above: status changed; the consent tamper
      // was refused by field access, so consent didn't change.
      const entry = await latestLog({
        and: [
          { actor: { equals: publisher.id } },
          { targetCollection: { equals: "leads" } },
          { action: { equals: "update" } },
        ],
      });
      expect(entry?.changedFields).toEqual(["status"]);
      expect(entry?.actorEmail).toBe(publisher.email);
      expect(JSON.stringify(entry)).not.toContain("contacted");
    });
  });

  describe("accounts and audit log", () => {
    it("doesn't let a user raise their own role", async () => {
      const updated = await payload.update({
        collection: "users",
        id: editor.id,
        data: { roles: ["admin"] },
        user: editor,
        overrideAccess: false,
      });
      expect(updated.roles).toEqual(["editor"]);
    });

    it("records a role grant - who granted it, to whom, and that roles changed", async () => {
      const staff = await makeUser("editor", "promoted");
      await payload.update({
        collection: "users",
        id: staff.id,
        data: { roles: ["publisher"] },
        user: admin,
        overrideAccess: false,
      });
      const entry = await latestLog({
        and: [
          { targetCollection: { equals: "users" } },
          { action: { equals: "update" } },
          { docIds: { in: [String(staff.id)] } },
        ],
      });
      expect(entry).toMatchObject({ actorType: "user", actorEmail: admin.email });
      expect(entry?.changedFields).toContain("roles");
    });

    it("records a password change without storing it", async () => {
      const newPassword = password("editor-changed");
      await payload.update({
        collection: "users",
        id: editor.id,
        data: { password: newPassword },
        user: editor,
        overrideAccess: false,
      });
      const entry = await latestLog({
        and: [
          { targetCollection: { equals: "users" } },
          { action: { equals: "update" } },
          { docIds: { in: [String(editor.id)] } },
        ],
      });
      expect(entry?.changedFields).toEqual(["password"]);
      expect(JSON.stringify(entry)).not.toContain(newPassword);
    });

    it("records every staff sign-in", async () => {
      await payload.login({
        collection: "users",
        data: { email: publisher.email, password: password("publisher") },
      });
      const entry = await latestLog({
        and: [{ action: { equals: "login" } }, { docIds: { in: [String(publisher.id)] } }],
      });
      expect(entry).toMatchObject({ actorType: "user", actorEmail: publisher.email });
    });

    it("still says who read a lead after their account is deleted", async () => {
      const leaver = await makeUser("publisher", "leaver");
      await payload.findByID({
        collection: "leads",
        id: lead.id,
        user: leaver,
        overrideAccess: false,
      });
      await payload.delete({
        collection: "users",
        id: leaver.id,
        user: admin,
        overrideAccess: false,
      });
      const read = await latestLog({
        and: [{ actorEmail: { equals: leaver.email } }, { action: { equals: "read" } }],
      });
      expect(read?.docIds).toContain(String(lead.id));
      // The relationship is cleared with the account; the snapshot is not.
      expect(read?.actor ?? null).toBeNull();
      const removal = await latestLog({
        and: [
          { targetCollection: { equals: "users" } },
          { action: { equals: "delete" } },
          { docIds: { in: [String(leaver.id)] } },
        ],
      });
      expect(removal?.actorEmail).toBe(admin.email);
    });

    it("keeps the audit log append-only, even for admins", async () => {
      const entry = await payload.find({
        collection: "audit-logs",
        limit: 1,
        user: admin,
        overrideAccess: false,
      });
      const first = entry.docs[0];
      expect(first).toBeDefined();
      await expect(
        payload.update({
          collection: "audit-logs",
          id: first!.id,
          data: { action: "create" },
          user: admin,
          overrideAccess: false,
        }),
      ).rejects.toMatchObject(forbidden);
      await expect(
        payload.delete({
          collection: "audit-logs",
          id: first!.id,
          user: admin,
          overrideAccess: false,
        }),
      ).rejects.toMatchObject(forbidden);
    });

    it("hides the audit log from publishers", async () => {
      await expect(
        payload.find({ collection: "audit-logs", user: publisher, overrideAccess: false }),
      ).rejects.toMatchObject(forbidden);
    });
  });
});
