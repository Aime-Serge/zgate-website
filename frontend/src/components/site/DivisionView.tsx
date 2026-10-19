import Link from "next/link";
import { GateMark, Lockup } from "@/components/brand/GateMark";
import type { Course, Division, SiteSetting } from "@zgate/cms-contracts";
import { CourseCard } from "./CourseCard";
import { CommitmentGrid, CtaRow, Eyebrow, QuestionList, SectionHead } from "./Section";

const COMMITMENT_NOTE =
  "Targets from our client service agreements: commitments we are held to, not past results.";

/**
 * One room behind the gate. A fixed sequence for every division: who it's
 * for -> what's included -> commitments as figures -> honest answers ->
 * the other three rooms -> call to action. The page wears the division's
 * own colour; Academy also lists its courses, the route through the gate
 * to the e-learning platform (or its waitlist until that launches).
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
  const tone = `tone--${division.slug}`;
  const others = divisions.filter((other) => other.slug !== division.slug);
  const questions = [division.objection, ...(division.faq ?? [])];
  return (
    <>
      <section className={`hero hero--room ${tone}`}>
        <div className="max hero__inner">
          <div className="hero__text">
            <p className="hero__lockup">
              <Lockup division={division.slug} name={division.shortName} />
              {division.subtitle ? (
                <span className="hero__subtitle">{division.subtitle}</span>
              ) : null}
            </p>
            <h1>{division.headline || division.mission}</h1>
            {audienceLine ? <p className="hero__audience">{audienceLine}</p> : null}
            <p className="lede">{division.headline ? division.mission : division.about}</p>
            <CtaRow settings={settings} topic={division.shortName} {...division.cta} />
          </div>
        </div>
      </section>

      <section className={`block ${tone}`}>
        <div className="max split">
          <div>
            <Eyebrow>Who it&rsquo;s for</Eyebrow>
            {division.audience ? <p className="split__lead">{division.audience}</p> : null}
            {division.headline ? <p>{division.about}</p> : null}
          </div>
          <div className="panel">
            <h2 className="panel__heading">What&rsquo;s included</h2>
            <ul className="checklist">
              {division.included.map((entry) => (
                <li key={entry.id ?? entry.item}>{entry.item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {division.slug === "academy" && courses.length > 0 ? (
        <section className={`block ${tone}`}>
          <div className="max">
            <SectionHead eyebrow="Courses" heading="Short, practical, built from real cases" />
            <div className="course-grid">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className={`block ${tone}`}>
        <div className="max">
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

      <section className={`block ${tone}`}>
        <div className="max">
          <SectionHead eyebrow="Questions" heading="Straight answers" />
          <QuestionList items={questions} />
        </div>
      </section>

      {others.length > 0 ? (
        <section className="block">
          <div className="max">
            <SectionHead
              eyebrow="One gate, four rooms"
              heading="Three more rooms, the same relationship"
            />
            <ul className="rooms rooms--compact">
              {others.map((other) => (
                <li key={other.id} className={`room tone--${other.slug}`}>
                  <Link href={`/${other.slug}`} className="room__link">
                    <span className="room__lockup">
                      <GateMark division={other.slug} className="gate-mark room__mark" />
                      <span className="room__name">{other.name}</span>
                    </span>
                    {other.pillar ? <span className="room__pillar">{other.pillar}</span> : null}
                    <span className="room__go">
                      Explore {other.shortName} <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className={`block ${tone}`}>
        <div className="max">
          <div className="cta-band">
            <h2>Talk to {division.name}</h2>
            <p>A real person will reply — not an automated response.</p>
            <CtaRow settings={settings} topic={division.shortName} {...division.cta} />
          </div>
        </div>
      </section>
    </>
  );
}
