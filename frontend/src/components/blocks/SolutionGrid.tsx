import Link from "next/link";
import { SectionHead } from "@/components/site/Section";
import { ArrowRight } from "@/components/ui/icons";
import { arrowLink, cardLink, container, cx, section } from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";
import type { BlockContext, BlockOf } from "./types";

/**
 * Every published solution page as a card: who it's for and the page's
 * summary (its search description). Solutions span divisions, so the cards
 * wear the master gate tone rather than one division's colour.
 */
export function SolutionGrid({
  block,
  context,
}: {
  block: BlockOf<"solutionGrid">;
  context: BlockContext;
}) {
  if (context.solutions.length === 0) return null;
  return (
    <section className={section}>
      <div className={container}>
        <SectionHead eyebrow={block.eyebrow} heading={block.heading} intro={block.intro} />
        <ul className={cx(tone("gate"), "grid list-none gap-4 md:grid-cols-2")}>
          {context.solutions.map((solution, index) => (
            <li key={solution.id}>
              <Link
                href={`/solutions/${solution.slug}`}
                className={cx(
                  cardLink,
                  "min-h-56 gap-3 bg-[linear-gradient(135deg,var(--glow),transparent_62%)] p-6 sm:p-8",
                )}
              >
                <span className="font-mono text-xs text-accent" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-2xl leading-[1.2] font-bold">
                  {solution.title}
                </span>
                {solution.meta?.description ? (
                  <span className="text-paper-dim">{solution.meta.description}</span>
                ) : null}
                <span className={cx(arrowLink, "mt-auto pt-2 text-accent")}>
                  See how we help
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
