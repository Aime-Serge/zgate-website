import type { GlobalConfig } from "payload";
import { isAdminField, isPublisherOrAdmin, isStaffField } from "@/access/roles";
import { linkFields } from "@/fields/common";
import { enforceGlobalPublishPermission } from "@/hooks/publishing";
import { revalidateGlobalAfterChange } from "@/hooks/revalidate";

/**
 * Facts the business, not a developer, should control. Several close
 * commercial-readiness findings directly: footer phone/WhatsApp (CR-10),
 * response-time commitment (CR-5) and an explicit audience line (KI-20).
 */
export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  access: {
    read: () => true,
    update: isPublisherOrAdmin,
  },
  versions: { drafts: true, max: 50 },
  hooks: {
    beforeChange: [enforceGlobalPublishPermission],
    afterChange: [revalidateGlobalAfterChange],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Company",
          fields: [
            { name: "legalName", type: "text", required: true, maxLength: 80 },
            { name: "tradingName", type: "text", required: true, maxLength: 80 },
            { name: "motto", type: "text", required: true, maxLength: 80 },
            { name: "elevatorPitch", type: "textarea", required: true, maxLength: 700 },
            {
              name: "audienceLine",
              type: "text",
              maxLength: 160,
              admin: {
                description:
                  'Who the site is for, in one line (e.g. "For growing businesses in Rwanda"). Shown on home and division pages. Leave empty until the business has agreed the wording.',
              },
            },
            {
              name: "boilerplate",
              type: "textarea",
              maxLength: 600,
              admin: { description: "The approved company paragraph. Shown in the footer." },
            },
            {
              name: "companyFacts",
              type: "array",
              maxRows: 5,
              admin: {
                description:
                  "Verifiable facts only (registration, TIN, licence) - shown in the fact strip and footer.",
              },
              fields: [{ name: "fact", type: "text", required: true, maxLength: 80 }],
            },
          ],
        },
        {
          label: "Announcement",
          fields: [
            {
              name: "announcement",
              type: "group",
              admin: {
                description:
                  "A banner above every page - for a real, dated event only (e.g. a free EBM clinic). Leave empty otherwise.",
              },
              fields: [{ name: "text", type: "text", maxLength: 140 }, ...linkFields(false)],
            },
          ],
        },
        {
          label: "Contact",
          fields: [
            { name: "email", type: "email", required: true },
            { name: "phone", type: "text", required: true, maxLength: 30 },
            {
              name: "whatsapp",
              type: "text",
              maxLength: 30,
              admin: {
                description:
                  "International format, e.g. +250 7xx xxx xxx. Leave empty if the phone number is the WhatsApp number.",
              },
            },
            { name: "address", type: "textarea", required: true, maxLength: 300 },
            {
              name: "responseTimeCommitment",
              type: "text",
              maxLength: 120,
              admin: {
                description:
                  'Shown after a form is sent, e.g. "within one business day". Only enter a promise the team can keep.',
              },
            },
            {
              name: "leadNotificationEmail",
              type: "email",
              // Settings are publicly readable (the website frontend reads them over
              // REST); the staff inbox address is not.
              access: { read: isStaffField },
              admin: {
                description:
                  "Internal inbox told about each new enquiry. The email only says one arrived and links to the CMS - the person's details stay in the CMS.",
              },
            },
            {
              name: "social",
              type: "array",
              fields: [
                {
                  name: "network",
                  type: "select",
                  required: true,
                  options: ["facebook", "linkedin", "instagram", "x", "youtube"].map((value) => ({
                    label: value,
                    value,
                  })),
                },
                {
                  name: "url",
                  type: "text",
                  required: true,
                  validate: (v: string | null | undefined) =>
                    (typeof v === "string" && v.startsWith("https://")) ||
                    "Use a full https:// address.",
                },
              ],
            },
          ],
        },
        {
          label: "Academy",
          fields: [
            {
              name: "enrollmentMode",
              type: "radio",
              required: true,
              defaultValue: "waitlist",
              options: [
                {
                  label:
                    "Waitlist - collect interest on this site (before the e-learning platform launches)",
                  value: "waitlist",
                },
                {
                  label: "E-learning platform - course buttons link to the platform",
                  value: "lms",
                },
              ],
              // Switching to "lms" sends visitors to the e-learning platform:
              // a release decision gated on the customer journey passing
              // (docs/architecture/ADR/ADR-011-website-release-gate.md), so
              // only an admin may change it. A publisher's change is dropped.
              access: { update: isAdminField },
              admin: {
                description:
                  "The planned hand-over point to the e-learning platform (ADR-007). Admins only: switch to the platform only after the customer journey has passed on staging (ADR-011).",
              },
            },
            {
              name: "lmsBaseUrl",
              type: "text",
              access: { update: isAdminField },
              admin: {
                condition: (_, siblingData) => siblingData?.["enrollmentMode"] === "lms",
                description: "e.g. https://learn.example.rw",
              },
              validate: (
                value: string | null | undefined,
                { siblingData }: { siblingData: { enrollmentMode?: string } },
              ) => {
                if (siblingData.enrollmentMode !== "lms") return true;
                return (
                  (typeof value === "string" && /^https:\/\/[^\s/]+$/.test(value)) ||
                  "Enter the platform's https:// origin, without a trailing path."
                );
              },
            },
          ],
        },
        {
          label: "Privacy",
          fields: [
            {
              name: "privacyNoticeVersion",
              type: "text",
              required: true,
              defaultValue: "draft",
              maxLength: 40,
              admin: {
                description:
                  'Stored with every consent. Change it (e.g. "2026-11-01") whenever the published privacy notice changes.',
              },
            },
          ],
        },
      ],
    },
  ],
};
