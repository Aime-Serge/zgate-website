import Link from "next/link";
import type { Course, Division } from "@zgate/cms-contracts";
import { CourseCard } from "./CourseCard";

/**
 * The fixed division structure: mission -> included -> proof -> objection
 * -> CTA. Academy also lists its courses, the route into the waitlist (and
 * later the e-learning platform).
 */
export function DivisionView({
  division,
  audienceLine,
  courses = [],
}: {
  division: Division;
  audienceLine?: string | null;
  courses?: Course[];
}) {
  return (
    <>
      <section className={`max block block--hero accent--${division.slug}`}>
        <p className="eyebrow">{division.name}</p>
        <h1>{division.mission}</h1>
        {audienceLine ? <p className="muted">{audienceLine}</p> : null}
        <p className="lede">{division.about}</p>
      </section>
      <section className="max block">
        <h2>What&rsquo;s included</h2>
        <ul className="checklist">
          {division.included.map((entry) => (
            <li key={entry.id ?? entry.item}>{entry.item}</li>
          ))}
        </ul>
      </section>
      {division.slug === "academy" && courses.length > 0 ? (
        <section className="max block">
          <h2>Courses</h2>
          <div className="grid grid--2">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          <p>
            <Link href="/academy/courses">See all courses</Link>
          </p>
        </section>
      ) : null}
      <section className="max block">
        <h2>Our commitment</h2>
        <p>{division.proof}</p>
      </section>
      <section className="max block">
        <h2>{division.objection.question}</h2>
        <p>{division.objection.answer}</p>
      </section>
      <section className="max block block--cta">
        <Link href={division.cta.href} className="button">
          {division.cta.label}
        </Link>
      </section>
    </>
  );
}
