import Link from "next/link";
import { Lockup } from "@/components/brand/GateMark";
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
    <>
      <script
        type="application/ld+json"
        // JSON.stringify escaped for "<" so CMS text can't close the script tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(courseJsonLd(course, settings, siteUrl)).replace(/</g, "\\u003c"),
        }}
      />
      <section className="hero hero--room tone--academy">
        <div className="max hero__inner">
          <div className="hero__text">
            <p className="hero__lockup">
              <Link href="/academy" className="hero__crumb">
                <Lockup division="academy" name="Academy" />
              </Link>
              <Link href="/academy/courses" className="hero__subtitle">
                All courses
              </Link>
            </p>
            <h1>{course.title}</h1>
            {course.summary ? <p className="lede">{course.summary}</p> : null}
          </div>
        </div>
      </section>

      <section className="block tone--academy">
        <div className="max split">
          <dl className="facts">
            {facts.map((fact) => (
              <div key={fact.term}>
                <dt>{fact.term}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
          {course.outcomes && course.outcomes.length > 0 ? (
            <div className="panel">
              <h2 className="panel__heading">What you&rsquo;ll be able to do</h2>
              <ul className="checklist">
                {course.outcomes.map((entry) => (
                  <li key={entry.id ?? entry.outcome}>{entry.outcome}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className="block tone--academy" id="enroll">
        <div className="max form-section">
          {lms ? (
            <div className="cta-band cta-band--left">
              <h2>Ready to start?</h2>
              <p>Enrollment, lessons and certificates are on Z-GATE Academy Online.</p>
              <div className="cta-row">
                <a
                  className="button"
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
              <h2>Interested?</h2>
              <p>
                Registration isn&rsquo;t open yet. Message us and we&rsquo;ll let you know as soon
                as it is.
              </p>
            </div>
          )}
          <div className="contact-aside">
            <ContactChannels
              settings={settings}
              heading={lms || privacyLive ? "Questions first?" : "Message, call or email us"}
              topic={`the ${course.title} course`}
            />
          </div>
        </div>
      </section>
    </>
  );
}

export function CoursesView({ courses, intro }: { courses: Course[]; intro?: string | null }) {
  return (
    <>
      <section className="hero hero--room tone--academy">
        <div className="max hero__inner">
          <div className="hero__text">
            <p className="hero__lockup">
              <Link href="/academy" className="hero__crumb">
                <Lockup division="academy" name="Academy" />
              </Link>
            </p>
            <h1>Courses</h1>
            {intro ? <p className="lede">{intro}</p> : null}
          </div>
        </div>
      </section>
      <section className="block tone--academy">
        <div className="max">
          <SectionHead
            eyebrow="Short, practical courses"
            heading="Choose a course"
            intro="Each course page shows who it's for, how long it takes and the fee, then takes you through to registration."
          />
          {courses.length > 0 ? (
            <div className="course-grid">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <p>
              No courses are open right now. <Link href="/contact">Contact us</Link> to hear when
              the next one starts.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
