/**
 * Role and data-protection rules, exercised through Payload's Local API
 * as real users (overrideAccess: false) against a real database.
 *
 * Skips cleanly without DATABASE_URL / PAYLOAD_SECRET / SITE_URL - the
 * same pattern as apps/learn-api's DB-dependent tests. CI provides all
 * three and applies migrations first.
 */
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Lead, User } from "@/payload-types";

const canRun = Boolean(
  process.env["DATABASE_URL"] && process.env["PAYLOAD_SECRET"] && process.env["SITE_URL"],
);
const run = `t${Date.now()}`;
const forbidden = { status: 403 };

describe.skipIf(!canRun)("website CMS access rules", () => {
  let payload: Payload;
  let admin: User;
  let publisher: User;
  let editor: User;
  let lead: Lead;
  const created = { pages: [] as number[], leads: [] as number[], users: [] as number[] };

  const makeUser = async (role: "admin" | "publisher" | "editor") => {
    const user = await payload.create({
      collection: "users",
      overrideAccess: true,
      data: {
        email: `${run}-${role}@test.invalid`,
        password: `pw-${run}-${role}-A1!`,
        name: role,
        roles: [role],
      },
    });
    created.users.push(user.id);
    return user;
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
    await payload.delete({
      collection: "audit-logs",
      where: { actor: { in: created.users } },
      overrideAccess: true,
    });
    for (const id of created.users)
      await payload.delete({ collection: "users", id, overrideAccess: true });
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
