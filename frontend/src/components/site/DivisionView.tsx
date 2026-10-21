import Link from "next/link";
import { GateMark, Lockup } from "@/components/brand/GateMark";
import {
  buttonSmall,
  checkItem,
  container,
  courseGrid,
  ctaBandRoom,
  cx,
  eyebrow,
  goLink,
  hairlineGrid,
  heroAudience,
  heroLockup,
  heroRoom,
  heroSubtitle,
  lede,
  panel,
  roomHeading,
  section,
  sectionHeading,
  sectionRule,
  split,
} from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";
import type { Course, Division, SiteSetting } from "@zgate/cms-contracts";
import { CourseCard, learningPlatform } from "./CourseCard";
import { CommitmentGrid, CtaRow, QuestionList, SectionHead } from "./Section";

/** Anchored sections clear the header and the section bar when jumped to. */
const anchored = "scroll-mt-36";

/**
 * The page's own sticky bar under the site header (a product-page
 * pattern): jump links to each section and the division's main action.
 * Plain anchors - nothing here needs a script.
 */
function SectionBar({
  name,
  items,
  cta,
}: {
  name: string;
  items: { href: string; label: string }[];
  cta: { label?: string | null; href?: string | null };
}) {
  return (
    <nav
      aria-label={`${name} sections`}
      className="sticky top-[4.3rem] z-20 border-y border-line bg-ink/90 backdrop-blur"
    >
      <div className={cx(container, "flex items-center justify-between gap-6")}>
        <ul className="flex list-none gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <li key={item.href} className="shrink-0">
              <a
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-paper-dim no-underline transition-colors hover:bg-paper/8 hover:text-paper"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        {cta.label && cta.href ? (
          // Phones already have the quick-contact bar.
          <span className="hidden shrink-0 sm:block">
            <Link href={cta.href} className={buttonSmall}>
              {cta.label}
            </Link>
          </span>
        ) : null}
      </div>
    </nav>
  );
}

const COMMITMENT_NOTE =
  "Targets from our client service agreements: commitments we are held to, not past results.";

/**
 * One room behind the gate. A fixed sequence for every division: who it's
 * for -> what's included -> commitments as figures -> honest answers ->
 * the other three rooms -> call to action. The whole page wears the
 * division's tone; Academy also lists its courses, the route through the
 * gate to the e-learning platform (or its waitlist until that launches).
 */
export function DivisionView({
  division,
  divisions,
  settings,
  audienceLine,
  courses = [],
}: {
  division: Division;
  divisions: Division[];
  settings: SiteSetting;
  audienceLine?: string | null;
  courses?: Course[];
}) {
  const others = divisions.filter((other) => other.slug !== division.slug);
  const questions = [division.objection, ...(division.faq ?? [])];
  const block = cx(section, sectionRule);
  const featuredCommitment = division.commitments?.[0];
  const contactCta =
    division.cta.href === "/contact"
      ? { ...division.cta, href: `/contact?service=${encodeURIComponent(division.slug)}` }
      : division.cta;
  return (
    <div className={tone(division.slug)}>
      <section className={heroRoom}>
        <div
          className={cx(
            container,
            "grid items-center gap-10",
            featuredCommitment && "nav:grid-cols-[1.2fr_0.8fr] nav:gap-14",
          )}
        >
          <div>
            <p className={heroLockup}>
              <Lockup division={division.slug} name={division.shortName} size="lg" />
              {division.subtitle ? <span className={heroSubtitle}>{division.subtitle}</span> : null}
            </p>
            <h1 className={roomHeading}>{division.headline || division.mission}</h1>
            {audienceLine ? <p className={heroAudience}>{audienceLine}</p> : null}
            {/* The about text, not the mission: the mission is on the home cards,
                and under a headline it repeated it (marketing review #1). */}
            <p className={lede}>{division.about}</p>
            <CtaRow settings={settings} topic={division.shortName} {...contactCta} />
          </div>
          {featuredCommitment ? (
            <aside className="relative overflow-hidden rounded-lg border border-line bg-ink-2 p-6 sm:p-8">
              <div
                aria-hidden="true"
                className="absolute -top-20 -right-16 size-48 rounded-full bg-accent/10 blur-3xl"
              />
              <div className="relative">
                <p className={eyebrow}>A commitment in writing</p>
                <p className="font-display text-figure font-semibold text-accent">
                  {featuredCommitment.figure}
                </p>
                <p className="mt-4 text-paper">{featuredCommitment.label}</p>
                <p className="mt-5 border-t border-line pt-4 font-mono text-xs leading-relaxed text-paper-dim">
                  An agreement target we are held to — not a past-results claim.
                </p>
              </div>
            </aside>
          ) : null}
        </div>
      </section>

      <SectionBar
        name={division.shortName}
        items={[
          { href: "#overview", label: "Overview" },
          ...(division.slug === "academy" && courses.length > 0
            ? [{ href: "#courses", label: "Courses" }]
            : []),
          { href: "#commitments", label: "Commitments" },
          { href: "#questions", label: "Questions" },
          { href: "#talk", label: "Talk to us" },
        ]}
        cta={contactCta}
      />

      <section className={cx(block, anchored)} id="overview">
        <div className={cx(container, split)}>
          <div>
            <p className={eyebrow}>Who it&rsquo;s for</p>
            <p className="font-display text-subtitle leading-[1.35]">
              {division.audience || division.mission}
            </p>
          </div>
          <div className={panel}>
            <h2 className="mb-4 text-xl">What&rsquo;s included</h2>
            <ul className="grid list-none gap-3">
              {division.included.map((entry) => (
                <li key={entry.id ?? entry.item} className={checkItem}>
                  {entry.item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {division.slug === "academy" && courses.length > 0 ? (
        <section className={cx(block, anchored)} id="courses">
          <div className={container}>
            <SectionHead eyebrow="Courses" heading="Short, practical, built from real cases" />
            <div className={courseGrid}>
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} platform={learningPlatform(settings)} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className={cx(block, anchored)} id="commitments">
        <div className={container}>
          <SectionHead
            eyebrow="The number first"
            heading="What we commit to"
            intro={division.proof}
          />
          {division.commitments && division.commitments.length > 0 ? (
            <CommitmentGrid
              items={division.commitments.map((item) => ({ ...item, division: division.slug }))}
              note={COMMITMENT_NOTE}
            />
          ) : null}
        </div>
      </section>

      <section className={cx(block, anchored)} id="questions">
        <div className={container}>
          <SectionHead eyebrow="Questions" heading="Straight answers" />
          <QuestionList items={questions} />
        </div>
      </section>

      {others.length > 0 ? (
        // The other rooms' links each wear their own tone; the section's
        // eyebrow keeps the master gate tone.
        <section className={cx(block, tone("gate"))}>
          <div className={container}>
            <SectionHead
              eyebrow="One gate, four rooms"
              heading="Three more rooms, the same relationship"
            />
            <ul className={cx(hairlineGrid, "list-none md:grid-cols-2 wide:grid-cols-3")}>
              {others.map((other) => (
                <li key={other.id} className={cx(tone(other.slug), "bg-ink")}>
                  <Link
                    href={`/${other.slug}`}
                    className="flex h-full flex-col gap-3 border-t-2 border-transparent px-6 py-8 no-underline transition-colors duration-150 hover:border-accent hover:bg-ink-2"
                  >
                    <span className="flex items-center gap-2.5">
                      <GateMark division={other.slug} className="w-6" />
                      <span className="font-display text-xl font-semibold">{other.name}</span>
                    </span>
                    {other.pillar ? (
                      <span className="font-mono text-xs tracking-[0.12em] text-accent uppercase">
                        {other.pillar}
                      </span>
                    ) : null}
                    <span className={goLink}>
                      Explore {other.shortName} <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className={cx(block, anchored)} id="talk">
        <div className={container}>
          <div className={cx(ctaBandRoom, "text-center")}>
            <h2 className={sectionHeading}>Talk to {division.name}</h2>
            <p className="mt-3 text-paper-dim">
              A real person will reply — not an automated response.
            </p>
            <CtaRow
              settings={settings}
              topic={division.shortName}
              className="justify-center"
              {...contactCta}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
