import Link from "next/link";
import { Lockup } from "@/components/brand/GateMark";
import {
  button,
  checkItem,
  container,
  courseGrid,
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
import { ContactChannels } from "./ContactChannels";
import { SectionHead } from "./Section";
import { CourseCard, coursePath, formatPrice } from "./CourseCard";

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
    provider: { "@type": "Organization", name: settings.legalName, url: siteUrl },
    ...(offers ? { offers } : {}),
    ...(instances.length > 0 ? { hasCourseInstance: instances } : {}),
  };
}

type Props = {
  course: Course;
  settings: SiteSetting;
  siteUrl: string;
  privacyLive: boolean;
};

/**
 * A course's page on the website is the gate, not the classroom: what a
 * visitor needs to decide (who it's for, format, length, fee, what they'll
 * be able to do), then the way through - the e-learning platform once it's
 * live, its waitlist until then. Module outlines, lessons, assessment and
 * certificates live on the platform (ADR-007), so they aren't shown here.
 */
export function CourseView({ course, settings, siteUrl, privacyLive }: Props) {
  const price = formatPrice(course);
  const lms = settings.enrollmentMode === "lms" && settings.lmsBaseUrl ? settings.lmsBaseUrl : null;
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
      <script
        type="application/ld+json"
        // JSON.stringify escaped for "<" so CMS text can't close the script tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(courseJsonLd(course, settings, siteUrl)).replace(/</g, "\\u003c"),
        }}
      />
      <section className={heroRoom}>
        <div className={container}>
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
      </section>

      <section className={cx(section, sectionRule)}>
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

      <section className={cx(section, sectionRule)} id="enroll">
        <div className={cx(container, formSplit)}>
          {lms ? (
            <div className={ctaBandRoom}>
              <h2 className={sectionHeading}>Ready to start?</h2>
              <p className="mt-3 text-paper-dim">
                Enrollment, lessons and certificates are on Z-GATE Academy Online.
              </p>
              <div className={ctaRow}>
                <a
                  className={button}
                  href={`${lms}/courses/${encodeURIComponent(course.slug)}/enroll`}
                >
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

export function CoursesView({ courses, intro }: { courses: Course[]; intro?: string | null }) {
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
            intro="Each course page shows who it's for, how long it takes and the fee, then takes you through to registration."
          />
          {courses.length > 0 ? (
            <div className={courseGrid}>
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
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
