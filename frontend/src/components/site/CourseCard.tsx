import Link from "next/link";
import type { Course } from "@zgate/cms-contracts";
import { cx, goLink, label } from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";

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
    // The whole card is the one link - the title's ::after covers it - so
    // keyboard users meet a single focus stop, ringed via focus-within.
    <article
      className={cx(
        tone("academy"),
        "relative flex flex-col gap-3 rounded-lg border border-l-[3px] border-line border-l-accent p-6 transition-colors duration-150 hover:bg-ink-2",
        "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gate-2",
      )}
    >
      <h3 className="text-xl leading-[1.3]">
        <Link
          href={coursePath(course)}
          className="no-underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
        >
          {course.title}
        </Link>
      </h3>
      <p className="text-paper-dim">{course.summary || course.audience}</p>
      <dl className="flex flex-wrap gap-x-8 gap-y-2 text-[0.9375rem]">
        {course.duration ? (
          <div>
            <dt className={label}>Duration</dt>
            <dd>{course.duration}</dd>
          </div>
        ) : null}
        {price ? (
          <div>
            <dt className={label}>Fee</dt>
            <dd>{price}</dd>
          </div>
        ) : null}
      </dl>
      <span className={goLink} aria-hidden="true">
        View course →
      </span>
    </article>
  );
}
