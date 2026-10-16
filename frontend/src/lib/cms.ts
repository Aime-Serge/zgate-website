/**
 * Read-side data access for public pages, over the CMS's REST API
 * (website/backend, reached at CMS_URL on the internal network).
 *
 * Every request is anonymous and asks for the published version
 * (`draft=false`), so the collections' own read rules - published
 * documents only - decide what the public site can show. A draft can't
 * leak through a missed filter, and this server holds no CMS credentials.
 *
 * Each function is wrapped in React's `cache`, so a page and its metadata
 * share one request per render.
 */
import { cache } from "react";
import {
  type Article,
  type Course,
  type Division,
  isDivisionSlug,
  type Page,
  type Redirect,
  type SiteSetting,
} from "@zgate/cms-contracts";
import { env } from "@/lib/env";

type Query = Record<string, unknown>;

/** Payload's REST query format: nested objects in bracket notation. */
export function toQueryString(query: Query): string {
  const params = new URLSearchParams();
  const add = (prefix: string, value: unknown) => {
    if (value === undefined) return;
    if (value !== null && typeof value === "object") {
      for (const [key, nested] of Object.entries(value)) add(`${prefix}[${key}]`, nested);
    } else {
      params.append(prefix, String(value));
    }
  };
  for (const [key, value] of Object.entries(query)) add(key, value);
  return params.toString();
}

export class CmsError extends Error {
  constructor(
    readonly path: string,
    readonly status: number,
  ) {
    super(`CMS request ${path} failed with HTTP ${status}`);
  }
}

async function get<T>(path: string, query: Query = {}): Promise<T> {
  const url = `${env().CMS_URL}${path}?${toQueryString({ draft: false, ...query })}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new CmsError(path, response.status);
  return (await response.json()) as T;
}

const find = async <T>(collection: string, query: Query): Promise<T[]> =>
  (await get<{ docs: T[] }>(`/api/${collection}`, query)).docs;

export const getSiteSettings = cache((): Promise<SiteSetting> =>
  get<SiteSetting>("/api/globals/site-settings"),
);

export const getPageBySlug = cache(
  async (slug: string): Promise<Page | null> =>
    (await find<Page>("pages", { where: { slug: { equals: slug } }, limit: 1, depth: 1 }))[0] ??
    null,
);

export const getDivisionBySlug = cache(async (slug: string): Promise<Division | null> => {
  // Unknown values would hit the enum column and fail (22P02) instead of
  // simply not matching - the website's version of finding N-7.
  if (!isDivisionSlug(slug)) return null;
  return (
    (await find<Division>("divisions", { where: { slug: { equals: slug } }, limit: 1 }))[0] ?? null
  );
});

export const listDivisions = cache((): Promise<Division[]> =>
  find<Division>("divisions", { sort: "order", limit: 10 }),
);

export const listCourses = cache((): Promise<Course[]> =>
  find<Course>("courses", { sort: "title", limit: 50 }),
);

export const getCourseBySlug = cache(
  async (slug: string): Promise<Course | null> =>
    (await find<Course>("courses", { where: { slug: { equals: slug } }, limit: 1 }))[0] ?? null,
);

export const listArticles = cache((limit: number = 50): Promise<Article[]> =>
  find<Article>("articles", { sort: "-publishedOn", limit }),
);

export const getArticleBySlug = cache(
  async (slug: string): Promise<Article | null> =>
    (await find<Article>("articles", { where: { slug: { equals: slug } }, limit: 1 }))[0] ?? null,
);

/** CMS-managed redirect for a path, if any (checked before returning 404). */
export const findRedirect = cache(
  async (path: string): Promise<Redirect | null> =>
    (await find<Redirect>("redirects", { where: { from: { equals: path } }, limit: 1 }))[0] ?? null,
);

/** Forms only collect personal data once a privacy notice is live. */
export async function isPrivacyNoticeLive(): Promise<boolean> {
  return (await getPageBySlug("privacy")) !== null;
}

export const listPages = cache((): Promise<Page[]> =>
  find<Page>("pages", { limit: 200, depth: 0 }),
);
