import type { CollectionConfig } from "payload";
import { isAdmin, isPublisherOrAdmin, nobody } from "@/access/roles";
import { auditChanges, auditDeletes, auditReads } from "@/hooks/audit";

/**
 * Contact enquiries and course-waitlist sign-ups - personal data
 * (Confidential). This inbox is the record of truth until leads are
 * forwarded to a CRM (ADR-007).
 *
 * Nothing can create a lead over the REST API: the site's own form handler
 * validates input and writes through the Local API (step 3), so the public
 * attack surface is that one handler, not Payload's generic endpoint.
 */
export const Leads: CollectionConfig = {
  slug: "leads",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "kind", "interest", "status", "createdAt"],
    description: "Personal data. Every view and change is recorded in the audit log.",
  },
  access: {
    create: nobody,
    read: isPublisherOrAdmin,
    update: isPublisherOrAdmin,
    delete: isAdmin,
  },
  hooks: {
    afterOperation: [auditReads],
    afterChange: [auditChanges],
    afterDelete: [auditDeletes],
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "kind",
          type: "select",
          required: true,
          options: [
            { label: "Contact enquiry", value: "contact" },
            { label: "Course waitlist", value: "waitlist" },
          ],
        },
        {
          name: "status",
          type: "select",
          required: true,
          defaultValue: "new",
          options: ["new", "contacted", "qualified", "closed"].map((value) => ({
            label: value,
            value,
          })),
        },
      ],
    },
    { name: "name", type: "text", required: true, maxLength: 200 },
    {
      name: "contact",
      type: "text",
      required: true,
      maxLength: 200,
      // Deliberately free-form: email, phone or WhatsApp number (v1's
      // validated market choice - docs/release/COMMERCIAL_READINESS.md §6).
      admin: { description: "Email, phone or WhatsApp - whatever the person gave us." },
    },
    {
      name: "interest",
      type: "select",
      options: [
        { label: "Advisory", value: "advisory" },
        { label: "Academy", value: "academy" },
        { label: "Tech", value: "tech" },
        { label: "Data", value: "data" },
        { label: "Not sure yet", value: "not-sure" },
      ],
    },
    { name: "course", type: "relationship", relationTo: "courses" },
    { name: "message", type: "textarea", maxLength: 2000 },
    {
      name: "consent",
      type: "group",
      admin: {
        description: "Recorded at submission. Never edit - a new consent needs a new record.",
      },
      access: { update: () => false },
      fields: [
        { name: "contactAllowed", type: "checkbox", required: true },
        { name: "marketingAllowed", type: "checkbox", defaultValue: false },
        { name: "noticeVersion", type: "text", required: true, maxLength: 40 },
        { name: "consentedAt", type: "date", required: true },
      ],
    },
    {
      name: "attribution",
      type: "group",
      access: { update: () => false },
      fields: [
        { name: "utmSource", type: "text", maxLength: 100 },
        { name: "utmMedium", type: "text", maxLength: 100 },
        { name: "utmCampaign", type: "text", maxLength: 100 },
        { name: "utmContent", type: "text", maxLength: 100 },
        { name: "utmTerm", type: "text", maxLength: 100 },
        { name: "landingPage", type: "text", maxLength: 500 },
        { name: "referrer", type: "text", maxLength: 500 },
      ],
    },
    { name: "staffNotes", type: "textarea", maxLength: 4000 },
  ],
};
