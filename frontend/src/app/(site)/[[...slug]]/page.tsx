import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { RenderBlocks } from "@/components/blocks/RenderBlocks";
import { CoursesView, CourseView } from "@/components/site/CourseView";
import { DivisionView } from "@/components/site/DivisionView";
import { ArticleView, InsightsView } from "@/components/site/InsightsView";
import { SiteShell } from "@/components/site/SiteShell";
import { env } from "@/lib/env";
import {
  findRedirect,
  getDivisionBySlug,
  getSiteSettings,
  isPrivacyNoticeLive,
  listCourses,
  listDivisions,
} from "@/lib/cms";
import { pathFor, resolveRoute, type Route } from "@/lib/routes";
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

type Props = { params: Promise<{ slug?: string[] }> };

function describe(route: Route, settings: SiteSetting): { title: string; description: string } {
  const suffix = settings.legalName;
  switch (route.kind) {
    case "page": {
      const { page } = route;
      const isHome = page.slug === "home";
      return {
        title:
          page.meta?.title ||
          (isHome ? `${suffix} — ${settings.motto}` : `${page.title} — ${suffix}`),
        description: page.meta?.description || settings.elevatorPitch,
      };
    }
    case "division":
      return {
        title: route.division.meta?.title || `${route.division.name} — ${suffix}`,
        description: route.division.meta?.description || route.division.mission,
      };
    case "courses":
      return { title: `Courses — ${suffix} Academy`, description: settings.elevatorPitch };
    case "course":
      return {
        title: route.course.meta?.title || `${route.course.title} — ${suffix} Academy`,
        description:
          route.course.meta?.description || route.course.summary || route.course.audience,
      };
    case "insights":
      return { title: `Insights — ${suffix}`, description: settings.elevatorPitch };
    case "article":
      return {
        title: route.article.meta?.title || `${route.article.title} — ${suffix}`,
        description: route.article.meta?.description || route.article.excerpt,
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

  const [route, settings, divisions, courses, privacyLive] = await Promise.all([
    resolveRoute(slug),
    getSiteSettings(),
    listDivisions(),
    listCourses(),
    isPrivacyNoticeLive(),
  ]);

  if (!route) {
    // Old URLs editors have redirected in the CMS, before giving up.
    const moved = await findRedirect(pathFor(slug));
    if (moved) (moved.permanent ? permanentRedirect : redirect)(moved.to);
    notFound();
  }

  let body: React.ReactNode;
  switch (route.kind) {
    case "page":
      body = (
        <RenderBlocks
          blocks={route.page.layout}
          settings={settings}
          divisions={divisions}
          courses={courses}
          privacyLive={privacyLive}
          audienceLine={route.page.slug === "home" ? settings.audienceLine : null}
        />
      );
      break;
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
      body = <CoursesView courses={route.courses} intro={academy?.proof} />;
      break;
    }
    case "course":
      body = (
        <CourseView
          course={route.course}
          settings={settings}
          siteUrl={env().SITE_URL}
          privacyLive={privacyLive}
        />
      );
      break;
    case "insights":
      body = <InsightsView articles={route.articles} />;
      break;
    case "article":
      body = <ArticleView article={route.article} />;
      break;
  }

  return (
    <SiteShell settings={settings} privacyLive={privacyLive} divisions={divisions}>
      {body}
    </SiteShell>
  );
}
