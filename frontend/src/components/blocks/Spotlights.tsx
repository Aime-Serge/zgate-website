import Link from "next/link";
import { GateMark } from "@/components/brand/GateMark";
import { ArrowRight } from "@/components/ui/icons";
import { arrowLink, cardLink, container, cx } from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";
import type { BlockOf } from "./types";

/**
 * Two or three cards worth a click right now - a course, a written
 * commitment. Each card is one link: a tone-coloured panel with the
 * division's mark, then the eyebrow, title, line of detail and the action.
 */
export function Spotlights({ block }: { block: BlockOf<"spotlights"> }) {
  return (
    <section className="py-12 lg:py-16">
      <div className={cx(container, "grid gap-4 md:grid-cols-2")}>
        {block.items.map((item) => {
          // "bundle" (all four) wears the master mark.
          const division = item.division && item.division !== "bundle" ? item.division : undefined;
          return (
            <Link
              key={item.id ?? item.title}
              href={item.href}
              className={cx(tone(item.division), cardLink, "overflow-hidden sm:flex-row")}
            >
              <span
                aria-hidden="true"
                className="flex min-h-28 items-center justify-center bg-[linear-gradient(135deg,var(--glow-strong),var(--glow))] sm:w-[34%] sm:shrink-0"
              >
                <GateMark division={division} className="w-16" />
              </span>
              <span className="flex flex-1 flex-col gap-3 p-6">
                {item.eyebrow ? (
                  <span className="font-mono text-xs tracking-[0.14em] text-accent uppercase">
                    {item.eyebrow}
                  </span>
                ) : null}
                <span className="font-display text-xl leading-[1.25] font-bold">{item.title}</span>
                {item.body ? <span className="text-sm/6 text-paper-dim">{item.body}</span> : null}
                <span className={cx(arrowLink, "mt-auto pt-2")}>
                  {item.label}
                  <ArrowRight className="size-4" />
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
