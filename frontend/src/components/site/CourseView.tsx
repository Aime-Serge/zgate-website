import Link from "next/link";
import { LeadForm } from "@/components/forms/LeadForm";
import type { Course, SiteSetting } from "@zgate/cms-contracts";
import { ContactChannels } from "./ContactChannels";
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

export function CourseView({ course, settings, siteUrl, privacyLive }: Props) {
  const price = formatPrice(course);
  const lms = settings.enrollmentMode === "lms" && settings.lmsBaseUrl ? settings.lmsBaseUrl : null;
  const upcoming = (course.intakes ?? []).filter(
    (intake) => new Date(intake.startsOn) >= new Date(),
  );
  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify escaped for "<" so CMS text can't close the script tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(courseJsonLd(course, settings, siteUrl)).replace(/</g, "\\u003c"),
        }}
      />
      <section className="max block block--hero accent--academy">
        <p className="eyebrow">
          <Link href="/academy">Z-GATE Academy</Link> · <Link href="/academy/courses">Courses</Link>
        </p>
        <h1>{course.title}</h1>
        {course.summary ? <p className="lede">{course.summary}</p> : null}
      </section>

      <section className="max block">
        <dl className="facts">
          <div>
            <dt>Who it&rsquo;s for</dt>
            <dd>{course.audience}</dd>
          </div>
          {course.format ? (
            <div>
              <dt>Format</dt>
              <dd>{course.format}</dd>
            </div>
          ) : null}
          {course.duration ? (
            <div>
              <dt>Duration</dt>
              <dd>{course.duration}</dd>
            </div>
          ) : null}
          {price ? (
            <div>
              <dt>Fee</dt>
              <dd>{price}</dd>
            </div>
          ) : null}
          <div>
            <dt>Next intake</dt>
            <dd>
              {upcoming[0]
                ? `${upcoming[0].label} — ${dayFormat.format(new Date(upcoming[0].startsOn))}`
                : "Dates to be announced"}
            </dd>
          </div>
        </dl>
      </section>

      {course.outcomes && course.outcomes.length > 0 ? (
        <section className="max block">
          <h2>What you&rsquo;ll be able to do</h2>
          <ul className="checklist">
            {course.outcomes.map((entry) => (
              <li key={entry.id ?? entry.outcome}>{entry.outcome}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {course.syllabus && course.syllabus.length > 0 ? (
        <section className="max block">
          <h2>Course outline</h2>
          <ol className="syllabus">
            {course.syllabus.map((module) => (
              <li key={module.id ?? module.title}>
                <h3>{module.title}</h3>
                {module.summary ? <p>{module.summary}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="max block form-section" id="enroll">
        {lms ? (
          <>
            <h2>Ready to start?</h2>
            <a className="button" href={`${lms}/courses/${encodeURIComponent(course.slug)}/enroll`}>
              Enroll on Z-GATE Academy Online
            </a>
          </>
        ) : privacyLive ? (
          <LeadForm
            variant="waitlist"
            heading="Join the waitlist"
            intro="Registration isn't open yet. Leave your details and we'll tell you as soon as it is."
            courses={[{ id: course.id, title: course.title }]}
            fixedCourse={{ id: course.id, title: course.title }}
          />
        ) : (
          <>
            <h2>Interested?</h2>
            <p>
              Registration isn&rsquo;t open yet. Contact us and we&rsquo;ll let you know when it is.
            </p>
          </>
        )}
        <ContactChannels
          settings={settings}
          heading={lms || privacyLive ? "Questions first?" : undefined}
          topic={`the ${course.title} course`}
        />
      </section>
    </>
  );
}

export function CoursesView({ courses, intro }: { courses: Course[]; intro?: string | null }) {
  return (
    <>
      <section className="max block block--hero accent--academy">
        <p className="eyebrow">
          <Link href="/academy">Z-GATE Academy</Link>
        </p>
        <h1>Courses</h1>
        {intro ? <p className="lede">{intro}</p> : null}
      </section>
      <section className="max block">
        {courses.length > 0 ? (
          <div className="grid grid--2">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <p>
            No courses are open right now. <Link href="/contact">Contact us</Link> to hear when the
            next one starts.
          </p>
        )}
      </section>
    </>
  );
}
