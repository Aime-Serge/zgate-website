import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { RenderBlocks } from "@/components/blocks/RenderBlocks";
import { CoursesView, CourseView } from "@/components/site/CourseView";
import { DivisionView } from "@/components/site/DivisionView";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ArticleView, articlePath, InsightsView } from "@/components/site/InsightsView";
import { JsonLd } from "@/components/site/JsonLd";
import { DemosView } from "@/components/site/DemosView";
import { SearchView } from "@/components/site/SearchView";
import { SiteShell } from "@/components/site/SiteShell";
import { env } from "@/lib/env";
import {
  findRedirect,
  getDivisionBySlug,
  getSiteSettings,
  isPrivacyNoticeLive,
  listArticles,
  listCourses,
  listDemos,
  listDivisions,
  listPages,
  listSolutions,
} from "@/lib/cms";
import { pathFor, resolveRoute, type Route } from "@/lib/routes";
import { buildSearchIndex } from "@/lib/search";
import {
  breadcrumbJsonLd,
  type Crumb,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/structuredData";
import { shortDescription } from "@/lib/text";
import type { SiteSetting } from "@zgate/cms-contracts";

/*
 * Rendering model: no page is built at `next build` (no CMS at build time -
 * the same image must run in every environment). Each URL renders on its
 * first request, is cached, and is re-rendered after content is published
 * (the CMS's webhook, src/app/api/revalidate/route.ts). The hourly
 * revalidate is only a safety net in case a webhook is ever lost.
 */
export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ slug?: string[] }>;
};

/**
 * Fallbacks when an editor hasn't filled "Search & sharing". Titles use the
 * trading name with service words; "Z-GATE LTD" is for legal lines only
 * (marketing review #4).
 */
function describe(route: Route, settings: SiteSetting): { title: string; description: string } {
  const brand = settings.tradingName || settings.legalName;
  const fallback = shortDescription(settings.elevatorPitch);
  switch (route.kind) {
    case "page": {
      const { page } = route;
      const isHome = page.slug === "home";
      return {
        title:
          page.meta?.title ||
          (isHome ? `${brand} — ${settings.motto}` : `${page.title} — ${brand}`),
        description: page.meta?.description || fallback,
      };
    }
    case "solution":
      return {
        title: route.page.meta?.title || `${route.page.title} — ${brand}`,
        description: route.page.meta?.description || fallback,
      };
    case "demos":
      return {
        title: `Demo Library — ${brand}`,
        description:
          "Short walkthroughs of how Z-GATE's Advisory, Academy, Tech and Data teams work, and a live walkthrough for your business.",
      };
    case "search":
      return {
        title: `Search — ${brand}`,
        description: "Search Z-GATE's services, solutions, courses and articles in one place.",
      };
    case "division": {
      const { division } = route;
      return {
        title:
          division.meta?.title ||
          (division.subtitle
            ? `${division.name} — ${division.subtitle}`
            : `${division.name} — ${brand}`),
        description: division.meta?.description || shortDescription(division.mission),
      };
    }
    case "courses":
      return {
        title: "Courses — Z-GATE Academy",
        description:
          "Short, practical courses in tax, bookkeeping and EBM from Z-GATE Academy, built from real Advisory cases.",
      };
    case "course": {
      // Search shows about 60 characters; long course names go without the suffix.
      const titled = `${route.course.title} — Z-GATE Academy`;
      return {
        title: route.course.meta?.title || (titled.length <= 60 ? titled : route.course.title),
        description: shortDescription(
          route.course.meta?.description || route.course.summary || route.course.audience,
        ),
      };
    }
    case "insights":
      return { title: `Insights — ${brand}`, description: fallback };
    case "article":
      return {
        title: route.article.meta?.title || `${route.article.title} — ${brand}`,
        description: shortDescription(route.article.meta?.description || route.article.excerpt),
      };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [route, settings] = await Promise.all([resolveRoute(slug), getSiteSettings()]);
  if (!route) return {};
  const siteUrl = env().SITE_URL;
  const { title, description } = describe(route, settings);
  const path = pathFor(slug);
  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: { canonical: path },
    // One page whose results depend on the visitor's query: not worth indexing.
    ...(route.kind === "search" ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      type: route.kind === "article" ? "article" : "website",
      url: `${siteUrl}${path}`,
    },
  };
}

export default async function SitePage({ params }: Props) {
  const { slug } = await params;
  // "home" is the homepage's CMS slug, not a second URL for it.
  if (slug?.length === 1 && slug[0] === "home") permanentRedirect("/");

  const [route, settings, divisions, courses, articles, privacyLive, solutions] = await Promise.all(
    [
      resolveRoute(slug),
      getSiteSettings(),
      listDivisions(),
      listCourses(),
      // Shared with the header and footer through React's cache.
      listArticles(3),
      isPrivacyNoticeLive(),
      listSolutions(),
    ],
  );

  if (!route) {
    // Old URLs editors have redirected in the CMS, before giving up.
    const moved = await findRedirect(pathFor(slug));
    if (moved) (moved.permanent ? permanentRedirect : redirect)(moved.to);
    notFound();
  }

  const siteUrl = env().SITE_URL;
  const blockContext = { settings, divisions, courses, articles, privacyLive, solutions };
  let body: React.ReactNode;
  switch (route.kind) {
    case "page": {
      const isHome = route.page.slug === "home";
      body = (
        <>
          {isHome ? (
            <>
              <JsonLd data={organizationJsonLd(settings, divisions, siteUrl)} />
              <JsonLd data={websiteJsonLd(settings, siteUrl)} />
            </>
          ) : null}
          <RenderBlocks
            blocks={route.page.layout}
            {...blockContext}
            audienceLine={isHome ? settings.audienceLine : null}
          />
        </>
      );
      break;
    }
    case "solution": {
      const trail: Crumb[] = [
        { label: "Home", href: "/" },
        { label: "Solutions", href: "/solutions" },
        { label: route.page.title, href: `/solutions/${route.page.slug}` },
      ];
      body = (
        <>
          <JsonLd data={breadcrumbJsonLd(trail, siteUrl)} />
          <Breadcrumbs trail={trail} />
          <RenderBlocks blocks={route.page.layout} {...blockContext} />
        </>
      );
      break;
    }
    case "demos":
      body = <DemosView demos={await listDemos()} settings={settings} />;
      break;
    case "search": {
      // Everything published, not just the three newest articles.
      const [pages, allArticles] = await Promise.all([listPages(), listArticles()]);
      const index = buildSearchIndex({ pages, divisions, courses, articles: allArticles });
      body = <SearchView index={index} settings={settings} />;
      break;
    }
    case "division":
      body = (
        <DivisionView
          division={route.division}
          divisions={divisions}
          audienceLine={settings.audienceLine}
          courses={courses}
          settings={settings}
        />
      );
      break;
    case "courses": {
      // Intro reuses the Academy division's approved proof copy rather
      // than new, unreviewed marketing text.
      const academy = await getDivisionBySlug("academy");
      body = <CoursesView courses={route.courses} intro={academy?.proof} settings={settings} />;
      break;
    }
    case "course":
      body = (
        <CourseView
          course={route.course}
          settings={settings}
          siteUrl={siteUrl}
          privacyLive={privacyLive}
          responseTimeCommitment={settings.responseTimeCommitment}
        />
      );
      break;
    case "insights":
      body = <InsightsView articles={route.articles} />;
      break;
    case "article":
      body = (
        <>
          <JsonLd
            data={breadcrumbJsonLd(
              [
                { label: "Home", href: "/" },
                { label: "Insights", href: "/insights" },
                { label: route.article.title, href: articlePath(route.article) },
              ],
              siteUrl,
            )}
          />
          <ArticleView article={route.article} />
        </>
      );
      break;
  }

  return (
    <SiteShell settings={settings} privacyLive={privacyLive} divisions={divisions}>
      {body}
    </SiteShell>
  );
}
