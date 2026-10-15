/**
 * Maps a public URL to the content that should render it.
 *
 * Every public URL goes through the one catch-all route on purpose: it is
 * never prerendered at `next build`, so no build ever needs the CMS
 * (a plain route like /academy/courses would be). See
 * src/app/(site)/[[...slug]]/page.tsx for the caching model.
 */
import {
  getArticleBySlug,
  getCourseBySlug,
  getDivisionBySlug,
  getPageBySlug,
  listArticles,
  listCourses,
} from "@/lib/cms";
import type { Article, Course, Division, Page } from "@zgate/website-backend/contracts";

export type Route =
  | { kind: "page"; page: Page }
  | { kind: "division"; division: Division }
  | { kind: "courses"; courses: Course[] }
  | { kind: "course"; course: Course }
  | { kind: "insights"; articles: Article[] }
  | { kind: "article"; article: Article };

export async function resolveRoute(slug: string[] | undefined): Promise<Route | null> {
  const [first, second, third, ...rest] = slug ?? [];
  if (rest.length > 0) return null;

  if (!first) {
    const page = await getPageBySlug("home");
    return page ? { kind: "page", page } : null;
  }

  if (first === "academy" && second === "courses") {
    if (!third) return { kind: "courses", courses: await listCourses() };
    const course = await getCourseBySlug(third);
    return course ? { kind: "course", course } : null;
  }

  if (first === "insights" && !third) {
    if (!second) {
      // The section only exists once something is published.
      const articles = await listArticles();
      return articles.length > 0 ? { kind: "insights", articles } : null;
    }
    const article = await getArticleBySlug(second);
    return article ? { kind: "article", article } : null;
  }

  if (second) return null;
  const page = await getPageBySlug(first);
  if (page) return { kind: "page", page };
  const division = await getDivisionBySlug(first);
  return division ? { kind: "division", division } : null;
}

export function pathFor(slug: string[] | undefined): string {
  return slug && slug.length > 0 ? `/${slug.join("/")}` : "/";
}
