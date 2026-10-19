import Link from "next/link";
import type { Course } from "@zgate/cms-contracts";

// "RWF 40,000" - Intl's en-RW currency style prints the symbol "RF", which
// readers here don't use on prices.
const amount = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

export function formatPrice(
  course: Pick<Course, "priceAmount" | "priceNote" | "currency">,
): string | null {
  if (typeof course.priceAmount !== "number") return null;
  return [`${course.currency ?? "RWF"} ${amount.format(course.priceAmount)}`, course.priceNote]
    .filter(Boolean)
    .join(" ");
}

export const coursePath = (course: Pick<Course, "slug">) => `/academy/courses/${course.slug}`;

export function CourseCard({ course }: { course: Course }) {
  const price = formatPrice(course);
  return (
    <article className="course-card tone--academy">
      <h3>
        <Link href={coursePath(course)} className="course-card__link">
          {course.title}
        </Link>
      </h3>
      <p>{course.summary || course.audience}</p>
      <dl className="course-card__facts">
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
      </dl>
      <span className="course-card__go" aria-hidden="true">
        View course →
      </span>
    </article>
  );
}
