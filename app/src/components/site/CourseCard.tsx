import Link from "next/link";
import type { Course } from "@/payload-types";

const rwf = new Intl.NumberFormat("en-RW", {
  style: "currency",
  currency: "RWF",
  maximumFractionDigits: 0,
});

export function formatPrice(course: Pick<Course, "priceAmount" | "priceNote">): string | null {
  if (typeof course.priceAmount !== "number") return null;
  return [rwf.format(course.priceAmount), course.priceNote].filter(Boolean).join(" ");
}

export const coursePath = (course: Pick<Course, "slug">) => `/academy/courses/${course.slug}`;

export function CourseCard({ course }: { course: Course }) {
  const price = formatPrice(course);
  return (
    <article className="card">
      <h3>
        <Link href={coursePath(course)}>{course.title}</Link>
      </h3>
      <p>{course.audience}</p>
      {course.duration ? <p className="muted">{course.duration}</p> : null}
      {price ? <p className="muted">{price}</p> : null}
    </article>
  );
}
