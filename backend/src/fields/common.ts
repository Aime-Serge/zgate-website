import type { Field, TextFieldSingleValidation } from "payload";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const validateSlug: TextFieldSingleValidation = (value) => {
  if (!value) return "A slug is required.";
  return (
    SLUG_PATTERN.test(value) ||
    "Use lowercase letters, numbers and single hyphens (e.g. tax-basics)."
  );
};

export const slugField = (description?: string): Field => ({
  name: "slug",
  type: "text",
  required: true,
  unique: true,
  index: true,
  validate: validateSlug,
  admin: { position: "sidebar", ...(description ? { description } : {}) },
});

/**
 * Links editors can enter: site-relative paths, or absolute https URLs
 * (e.g. the e-learning platform). No javascript:, data: or plain http.
 */
export const validateHref: TextFieldSingleValidation = (value) => {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (/^https:\/\/[^\s]+$/.test(value)) return true;
  return "Use a site path like /contact, or a full https:// address.";
};

export const linkFields = (required: boolean): Field[] => [
  { name: "label", type: "text", required, maxLength: 60 },
  { name: "href", type: "text", required, validate: validateHref },
];

/** SEO metadata. Limits follow what search results actually display. */
export const metaField: Field = {
  name: "meta",
  type: "group",
  label: "Search & sharing",
  fields: [
    {
      name: "title",
      type: "text",
      maxLength: 60,
      admin: { description: "Shown in search results. Defaults to the page title." },
    },
    { name: "description", type: "textarea", maxLength: 160 },
  ],
};
