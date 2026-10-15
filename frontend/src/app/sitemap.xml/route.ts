import { env } from "@/lib/env";
import { listArticles, listCourses, listDivisions, listPages } from "@/lib/cms";

// Built per request (cached by CDNs for an hour) from published content and
// the runtime SITE_URL - never at build time, which would need the CMS and
// bake in a placeholder origin (finding N-2).
export const dynamic = "force-dynamic";

type Entry = { path: string; updatedAt?: string | null };

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const site = env().SITE_URL;
  const [pages, divisions, courses, articles] = await Promise.all([
    listPages(),
    listDivisions(),
    listCourses(),
    listArticles(),
  ]);

  const entries: Entry[] = [
    ...pages.map((page) => ({
      path: page.slug === "home" ? "/" : `/${page.slug}`,
      updatedAt: page.updatedAt,
    })),
    ...divisions.map((division) => ({ path: `/${division.slug}`, updatedAt: division.updatedAt })),
    { path: "/academy/courses" },
    ...courses.map((course) => ({
      path: `/academy/courses/${course.slug}`,
      updatedAt: course.updatedAt,
    })),
    ...(articles.length > 0 ? [{ path: "/insights" }] : []),
    ...articles.map((article) => ({
      path: `/insights/${article.slug}`,
      updatedAt: article.updatedAt,
    })),
  ];

  const urls = entries
    .map(({ path, updatedAt }) => {
      const lastmod = updatedAt ? `<lastmod>${updatedAt.slice(0, 10)}</lastmod>` : "";
      return `  <url><loc>${escapeXml(site + path)}</loc>${lastmod}</url>`;
    })
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
