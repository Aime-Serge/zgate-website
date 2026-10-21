/**
 * Read-side data access for public pages, over the CMS's JSON API
 * (backend/content/views.py - Django + Wagtail, reached at CMS_URL).
 *
 * The API serves published content only: a draft can't leak through a
 * missed filter. The only credential this server presents is the API read
 * token (CMS_API_TOKEN), which can read nothing that isn't already public.
 *
 * Each function is wrapped in React's `cache`, so a page and its metadata
 * share one request per render.
 */
import { cache } from "react";
import {
  type Article,
  type Course,
  type Demo,
  type Division,
  isDivisionSlug,
  type Page,
  type Redirect,
  type SiteSetting,
} from "@zgate/cms-contracts";
import { env } from "@/lib/env";

export class CmsError extends Error {
  constructor(
    readonly path: string,
    readonly status: number,
  ) {
    super(`CMS request ${path} failed with HTTP ${status}`);
  }
}

async function request(path: string): Promise<Response> {
  const { CMS_URL, CMS_API_TOKEN } = env();
  return fetch(`${CMS_URL}${path}`, {
    headers: {
      Accept: "application/json",
      ...(CMS_API_TOKEN ? { Authorization: `Bearer ${CMS_API_TOKEN}` } : {}),
    },
    signal: AbortSignal.timeout(10_000),
  });
}

async function get<T>(path: string): Promise<T> {
  const response = await request(path);
  if (!response.ok) throw new CmsError(path, response.status);
  return (await response.json()) as T;
}

/** One document, or null when the CMS has no published one (HTTP 404). */
async function getOne<T>(path: string): Promise<T | null> {
  const response = await request(path);
  if (response.status === 404) return null;
  if (!response.ok) throw new CmsError(path, response.status);
  return (await response.json()) as T;
}

const list = async <T>(path: string): Promise<T[]> => (await get<{ docs: T[] }>(path)).docs;

const segment = (value: string) => encodeURIComponent(value);

export const getSiteSettings = cache((): Promise<SiteSetting> =>
  get<SiteSetting>("/api/site-settings"),
);

export const getPageBySlug = cache((slug: string): Promise<Page | null> =>
  getOne<Page>(`/api/pages/${segment(slug)}`),
);

export const getDivisionBySlug = cache(async (slug: string): Promise<Division | null> => {
  // Only the four division slugs are ever asked for.
  if (!isDivisionSlug(slug)) return null;
  return getOne<Division>(`/api/divisions/${slug}`);
});

export const listDivisions = cache((): Promise<Division[]> => list<Division>("/api/divisions"));

/** Oldest first: courses are added in cohort order (Cohort 1 before 2). */
export const listCourses = cache((): Promise<Course[]> => list<Course>("/api/courses"));

export const getCourseBySlug = cache((slug: string): Promise<Course | null> =>
  getOne<Course>(`/api/courses/${segment(slug)}`),
);

export const listArticles = cache((limit: number = 50): Promise<Article[]> =>
  list<Article>(`/api/articles?limit=${limit}`),
);

export const getArticleBySlug = cache((slug: string): Promise<Article | null> =>
  getOne<Article>(`/api/articles/${segment(slug)}`),
);

/** CMS-managed redirect for a path, if any (checked before returning 404). */
export const findRedirect = cache((path: string): Promise<Redirect | null> =>
  getOne<Redirect>(`/api/redirects?from=${encodeURIComponent(path)}`),
);

/** Forms only collect personal data once a privacy notice is live. */
export async function isPrivacyNoticeLive(): Promise<boolean> {
  return (await getPageBySlug("privacy")) !== null;
}

/** Every published page (without its blocks), for the sitemap. */
export const listPages = cache((): Promise<Page[]> => list<Page>("/api/pages"));

/** Solution pages (one per kind of business), in the CMS's page order. */
export const listSolutions = cache(async (): Promise<Page[]> =>
  (await listPages()).filter((page) => page.pageType === "solution"),
);

/** The Demo Library, newest first (placeholders included). */
export const listDemos = cache((): Promise<Demo[]> => list<Demo>("/api/demos"));
