import Link from "next/link";
import { GateMark } from "@/components/brand/GateMark";
import { coursePath, formatPrice } from "@/components/site/CourseCard";
import { Eyebrow } from "@/components/site/Section";
import { ArrowRight } from "@/components/ui/icons";
import {
  arrowLink,
  buttonSecondary,
  cardLink,
  chip,
  container,
  cx,
  section,
  sectionHeading,
} from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";
import type { BlockContext, BlockOf } from "./types";

type Item = {
  key: string;
  kind: "Course" | "Insight";
  title: string;
  detail?: string | null;
  href: string;
};

/**
 * What's new: the newest course as a feature card, then the other courses
 * and the latest articles as rows. Built only from what's published, and
 * absent when there is nothing to show.
 */
export function Latest({ block, context }: { block: BlockOf<"latest">; context: BlockContext }) {
  const { courses, articles } = context;
  const [featured, ...otherCourses] = [...courses].reverse();
  const rows: Item[] = [
    ...otherCourses.map((course) => ({
      key: `course-${course.id}`,
      kind: "Course" as const,
      title: course.title,
      detail: [course.duration, course.format].filter(Boolean).join(" · "),
      href: coursePath(course),
    })),
    ...articles.map((article) => ({
      key: `article-${article.id}`,
      kind: "Insight" as const,
      title: article.title,
      detail: article.excerpt,
      href: `/insights/${article.slug}`,
    })),
  ].slice(0, 3);
  if (!featured && rows.length === 0) return null;

  return (
    <section className={section}>
      <div className={container}>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[46rem]">
            <Eyebrow>{block.eyebrow}</Eyebrow>
            <h2 className={sectionHeading}>{block.heading}</h2>
            {block.intro ? (
              <p className="mt-4 text-[1.0625rem] text-paper-dim">{block.intro}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/academy/courses" className={buttonSecondary}>
              All courses
            </Link>
            {articles.length > 0 ? (
              <Link href="/insights" className={buttonSecondary}>
                Insights
              </Link>
            ) : null}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {featured ? (
            <Link
              href={coursePath(featured)}
              className={cx(tone("academy"), cardLink, "overflow-hidden")}
            >
              <span
                aria-hidden="true"
                className="flex h-44 items-center justify-center border-b border-line bg-[radial-gradient(ellipse_80%_100%_at_30%_0%,var(--glow-strong),transparent_70%)]"
              >
                <GateMark division="academy" className="w-20" />
              </span>
              <span className="flex flex-1 flex-col gap-3 p-6 sm:p-8">
                <span className={cx(chip, "self-start")}>Course</span>
                <span className="font-display text-2xl leading-[1.2] font-bold tracking-[-0.02em]">
                  {featured.title}
                </span>
                {featured.summary ? (
                  <span className="text-paper-dim">{featured.summary}</span>
                ) : null}
                <span className="font-mono text-xs tracking-[0.08em] text-paper-dim uppercase">
                  {[featured.duration, featured.format, formatPrice(featured)]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span className={cx(arrowLink, "mt-auto pt-2")}>
                  See the course
                  <ArrowRight className="size-4" />
                </span>
              </span>
            </Link>
          ) : null}
          {rows.length > 0 ? (
            <ul className="grid list-none content-start gap-4">
              {rows.map((row) => (
                <li key={row.key} className={tone(row.kind === "Course" ? "academy" : "gate")}>
                  <Link href={row.href} className={cx(cardLink, "gap-3 p-6")}>
                    <span className={cx(chip, "self-start")}>{row.kind}</span>
                    <span className="font-display text-lg leading-[1.3] font-bold">
                      {row.title}
                    </span>
                    {row.detail ? (
                      <span className="line-clamp-2 text-[0.9375rem] text-paper-dim">
                        {row.detail}
                      </span>
                    ) : null}
                    <span className={cx(arrowLink, "mt-1")}>
                      {row.kind === "Course" ? "See the course" : "Read"}
                      <ArrowRight className="size-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
