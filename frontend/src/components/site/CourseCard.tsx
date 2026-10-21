import Link from "next/link";
import type { Course } from "@zgate/cms-contracts";
import {
  coursePath,
  enrollAction,
  type EnrollAction,
  formatPrice,
  nextIntake,
} from "@/lib/courses";
import { ArrowRight, Form } from "@/components/ui/icons";
import { buttonSmall, buttonSmallSecondary, chip, cx, label } from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";

export {
  coursePath,
  enrollAction,
  type EnrollAction,
  formatPrice,
  learningPlatform,
  nextIntake,
} from "@/lib/courses";

export function EnrollButton({ action, className }: { action: EnrollAction; className?: string }) {
  return action.external ? (
    <a href={action.href} className={cx(buttonSmall, className)}>
      {action.label}
    </a>
  ) : (
    <Link href={action.href} className={cx(buttonSmall, className)}>
      {action.label}
    </Link>
  );
}

/**
 * A course as the gate to it: whether registration is open, the facts a
 * visitor decides on (format, duration, fee, next intake), then two
 * actions - enroll (or join the waitlist) and the full details.
 */
export function CourseCard({ course, platform }: { course: Course; platform: string | null }) {
  const price = formatPrice(course);
  const action = enrollAction(course, platform);
  return (
    <article
      className={cx(
        tone("academy"),
        "flex h-full flex-col gap-4 rounded-2xl border border-line bg-[linear-gradient(145deg,var(--glow),transparent_55%)] p-6 transition-colors duration-150 hover:border-accent",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={chip}>Practical course</span>
        <span className="inline-flex items-center gap-2 font-mono text-xs text-paper-dim">
          <span
            aria-hidden="true"
            className={cx("size-2 rounded-full", action.open ? "bg-accent" : "bg-paper-dim")}
          />
          {action.open ? "Registration open" : "Waitlist open"}
        </span>
      </div>
      <h3 className="text-xl leading-[1.3]">
        <Link href={coursePath(course)} className="no-underline hover:underline">
          {course.title}
        </Link>
      </h3>
      <p className="text-paper-dim">{course.summary || course.audience}</p>
      <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line pt-4 text-sm">
        {course.format ? (
          <div>
            <dt className={label}>Format</dt>
            <dd className="mt-1">{course.format}</dd>
          </div>
        ) : null}
        {course.duration ? (
          <div>
            <dt className={label}>Duration</dt>
            <dd className="mt-1">{course.duration}</dd>
          </div>
        ) : null}
        {price ? (
          <div>
            <dt className={label}>Fee</dt>
            <dd className="mt-1">{price}</dd>
          </div>
        ) : null}
        <div>
          <dt className={label}>Next intake</dt>
          <dd className="mt-1">{nextIntake(course)}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-3">
        <EnrollButton action={action} />
        <Link
          href={coursePath(course)}
          className={buttonSmallSecondary}
          aria-label={`Details: ${course.title}`}
        >
          Details
          <ArrowRight className="ml-2 size-4" />
        </Link>
      </div>
    </article>
  );
}

/**
 * The card after the courses: for a need no course covers yet. A real next
 * step (a conversation with Academy), not a sample course.
 */
export function CourseRequestCard() {
  return (
    <article
      className={cx(
        tone("academy"),
        "flex h-full flex-col justify-center gap-4 rounded-2xl border border-dashed border-line p-6",
      )}
    >
      <Form className="size-6 text-accent" />
      <h3 className="text-xl leading-[1.3]">Need a course we don&rsquo;t run yet?</h3>
      <p className="text-paper-dim">
        Tell us what your team needs to learn. We&rsquo;ll tell you if a course is planned, or point
        you to the right one.
      </p>
      <Link href="/contact?service=academy" className={cx(buttonSmallSecondary, "self-start")}>
        Ask the Academy
      </Link>
    </article>
  );
}
