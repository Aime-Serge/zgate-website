import Link from "next/link";
import { Lockup } from "@/components/brand/GateMark";
import {
  button,
  checkItem,
  container,
  ctaBandRoom,
  ctaRow,
  cx,
  formSplit,
  hairlineGrid,
  heroLockup,
  heroRoom,
  heroSubtitle,
  label,
  lede,
  panel,
  roomHeading,
  section,
  sectionHeading,
  sectionRule,
  split,
} from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";
import { LeadForm } from "@/components/forms/LeadForm";
import type { Course, SiteSetting } from "@zgate/cms-contracts";
import { breadcrumbJsonLd } from "@/lib/structuredData";
import { ContactChannels } from "./ContactChannels";
import { JsonLd } from "./JsonLd";
import { SectionHead } from "./Section";
import {
  CourseCard,
  CourseRequestCard,
  coursePath,
  enrollAction,
  formatPrice,
  learningPlatform,
} from "./CourseCard";

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** schema.org Course markup - only fields that hold real data. */
function courseJsonLd(course: Course, settings: SiteSetting, siteUrl: string) {
  const offers =
    typeof course.priceAmount === "number"
      ? {
          "@type": "Offer",
          price: course.priceAmount,
          priceCurrency: course.currency ?? "RWF",
          category: "Paid",
        }
      : undefined;
  const instances = (course.intakes ?? []).map((intake) => ({
    "@type": "CourseInstance",
    name: intake.label,
    startDate: intake.startsOn.slice(0, 10),
    ...(course.format ? { courseMode: course.format } : {}),
  }));
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary || course.audience,
    url: `${siteUrl}${coursePath(course)}`,
    provider: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: settings.legalName,
      url: siteUrl,
    },
    ...(offers ? { offers } : {}),
    ...(instances.length > 0 ? { hasCourseInstance: instances } : {}),
  };
}

type Props = {
  course: Course;
  settings: SiteSetting;
  siteUrl: string;
  privacyLive: boolean;
  responseTimeCommitment?: string | null;
};

/**
 * A course's page on the website is the gate, not the classroom: what a
 * visitor needs to decide (who it's for, format, length, fee, what they'll
 * be able to do), then the way through - the e-learning platform once it's
 * live, its waitlist until then. Module outlines, lessons, assessment and
 * certificates live on the platform (ADR-007), so they aren't shown here.
 */
export function CourseView({
  course,
  settings,
  siteUrl,
  privacyLive,
  responseTimeCommitment,
}: Props) {
  const price = formatPrice(course);
  const lms = learningPlatform(settings);
  const upcoming = (course.intakes ?? []).filter(
    (intake) => new Date(intake.startsOn) >= new Date(),
  );
  const facts = [
    { term: "Who it’s for", value: course.audience },
    { term: "Format", value: course.format },
    { term: "Duration", value: course.duration },
    { term: "Fee", value: price },
    {
      term: "Next intake",
      value: upcoming[0]
        ? `${upcoming[0].label} — ${dayFormat.format(new Date(upcoming[0].startsOn))}`
        : "Dates to be announced",
    },
  ].filter((fact): fact is { term: string; value: string } => Boolean(fact.value));
  return (
    <div className={tone("academy")}>
      <JsonLd data={courseJsonLd(course, settings, siteUrl)} />
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { label: "Home", href: "/" },
            { label: "Academy", href: "/academy" },
            { label: "Courses", href: "/academy/courses" },
            { label: course.title, href: coursePath(course) },
          ],
          siteUrl,
        )}
      />
      <section className={heroRoom}>
        <div
          className={cx(
            container,
            "grid items-center gap-10 nav:grid-cols-[1.2fr_0.8fr] nav:gap-14",
          )}
        >
          <div>
            <p className={heroLockup}>
              <Link href="/academy" className="no-underline">
                <Lockup division="academy" name="Academy" size="lg" />
              </Link>
              <Link
                href="/academy/courses"
                className={cx(heroSubtitle, "underline underline-offset-4")}
              >
                All courses
              </Link>
            </p>
            <h1 className={roomHeading}>{course.title}</h1>
            {course.summary ? <p className={lede}>{course.summary}</p> : null}
          </div>
          <aside className="rounded-lg border border-line bg-ink-2 p-6 sm:p-8">
            <p className={label}>Course at a glance</p>
            <dl className="mt-5 grid gap-4">
              {course.duration ? (
                <div>
                  <dt className={label}>Duration</dt>
                  <dd className="mt-1 font-display text-lg font-semibold">{course.duration}</dd>
                </div>
              ) : null}
              {price ? (
                <div>
                  <dt className={label}>Fee</dt>
                  <dd className="mt-1 font-display text-lg font-semibold">{price}</dd>
                </div>
              ) : null}
              <div>
                <dt className={label}>Next intake</dt>
                <dd className="mt-1 font-display text-lg font-semibold">
                  {upcoming[0]
                    ? `${upcoming[0].label} — ${dayFormat.format(new Date(upcoming[0].startsOn))}`
                    : "Dates to be announced"}
                </dd>
              </div>
            </dl>
            <Link href="#enroll" className={cx(button, "mt-6 w-full")}>
              View enrollment options
            </Link>
            <Link
              href="#course-details"
              className="mt-4 inline-block min-h-11 py-3 text-sm text-paper-dim underline underline-offset-4 hover:text-paper"
            >
              See course details
            </Link>
          </aside>
        </div>
      </section>

      <section className={cx(section, sectionRule, "scroll-mt-24")} id="course-details">
        <div className={cx(container, split)}>
          <dl className={cx(hairlineGrid, "w-full")}>
            {facts.map((fact) => (
              <div key={fact.term} className="bg-ink px-6 py-4">
                <dt className={label}>{fact.term}</dt>
                <dd className="mt-1">{fact.value}</dd>
              </div>
            ))}
          </dl>
          {course.outcomes && course.outcomes.length > 0 ? (
            <div className={panel}>
              <h2 className="mb-4 text-xl">What you&rsquo;ll be able to do</h2>
              <ul className="grid list-none gap-3">
                {course.outcomes.map((entry) => (
                  <li key={entry.id ?? entry.outcome} className={checkItem}>
                    {entry.outcome}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className={cx(section, sectionRule, "scroll-mt-24")} id="enroll">
        <div className={cx(container, formSplit)}>
          {lms ? (
            <div className={ctaBandRoom}>
              <h2 className={sectionHeading}>Ready to start?</h2>
              <p className="mt-3 text-paper-dim">
                Enrollment, lessons and certificates are on Z-GATE Academy Online.
              </p>
              <div className={ctaRow}>
                <a className={button} href={enrollAction(course, lms).href}>
                  Enroll on Z-GATE Academy Online
                </a>
              </div>
            </div>
          ) : privacyLive ? (
            <LeadForm
              variant="waitlist"
              heading="Join the waitlist"
              intro="Registration isn't open yet. Leave your details and we'll tell you as soon as it is."
              courses={[{ id: course.id, title: course.title }]}
              responseTimeCommitment={responseTimeCommitment}
              fixedCourse={{ id: course.id, title: course.title }}
            />
          ) : (
            <div>
              <h2 className={sectionHeading}>Interested?</h2>
              <p className="mt-3 text-paper-dim">
                Registration isn&rsquo;t open yet. Message us and we&rsquo;ll let you know as soon
                as it is.
              </p>
            </div>
          )}
          <div className="grid content-start gap-8">
            <ContactChannels
              settings={settings}
              heading={lms || privacyLive ? "Questions first?" : "Message, call or email us"}
              topic={`the ${course.title} course`}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export function CoursesView({
  courses,
  intro,
  settings,
}: {
  courses: Course[];
  intro?: string | null;
  settings: SiteSetting;
}) {
  const platform = learningPlatform(settings);
  return (
    <div className={tone("academy")}>
      <section className={heroRoom}>
        <div className={container}>
          <p className={heroLockup}>
            <Link href="/academy" className="no-underline">
              <Lockup division="academy" name="Academy" size="lg" />
            </Link>
          </p>
          <h1 className={roomHeading}>Courses</h1>
          {intro ? <p className={lede}>{intro}</p> : null}
        </div>
      </section>
      <section className={cx(section, sectionRule)}>
        <div className={container}>
          <SectionHead
            eyebrow="Short, practical courses"
            heading="Choose a course"
            intro={
              platform
                ? "Who each course is for, how long it takes and the fee. Enroll on Z-GATE Academy Online, or open the details first."
                : "Who each course is for, how long it takes and the fee. Registration opens on Z-GATE Academy Online; until then, join a course's waitlist and we'll tell you when you can sign up."
            }
          />
          {courses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 wide:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} platform={platform} />
              ))}
              <CourseRequestCard />
            </div>
          ) : (
            <p>
              No courses are open right now.{" "}
              <Link href="/contact" className="underline underline-offset-2">
                Contact us
              </Link>{" "}
              to hear when the next one starts.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
