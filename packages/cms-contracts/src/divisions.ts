/**
 * The four divisions. Shared by the Divisions collection (the slug column
 * is a Postgres enum built from this list) and the website frontend, which
 * must never query that column with an arbitrary string.
 */
export const DIVISION_SLUGS = ["advisory", "academy", "tech", "data"] as const;
export type DivisionSlug = (typeof DIVISION_SLUGS)[number];

/** Narrowing guard - the slug column is a Postgres enum, so never query it with an arbitrary string. */
export function isDivisionSlug(value: string): value is DivisionSlug {
  return (DIVISION_SLUGS as readonly string[]).includes(value);
}
