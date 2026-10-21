import Link from "next/link";
import { GateMark } from "@/components/brand/GateMark";
import { SectionHead } from "@/components/site/Section";
import { ArrowRight, Check } from "@/components/ui/icons";
import { Tabs } from "@/components/ui/Tabs";
import {
  arrowLink,
  button,
  card,
  chip,
  container,
  cx,
  label,
  section,
} from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";
import type { Division } from "@zgate/cms-contracts";
import type { BlockContext, BlockOf } from "./types";

/** One division's tab: its "console", listing what's included from its own page. */
function Console({ division }: { division: Division }) {
  return (
    <div className={cx(card, "overflow-hidden")}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-ink px-5 py-4">
        <span className="flex items-center gap-3">
          <GateMark division={division.slug} className="w-7" />
          <span className="grid">
            <span className="font-display text-lg font-bold">{division.name}</span>
            {division.subtitle ? (
              <span className="text-sm text-paper-dim">{division.subtitle}</span>
            ) : null}
          </span>
        </span>
        {division.pillar ? <span className={chip}>{division.pillar}</span> : null}
      </div>
      <div className="p-5 sm:p-6">
        <p className="max-w-[62ch] text-paper-dim">{division.mission}</p>
        <ul className="mt-6 grid list-none gap-3 sm:grid-cols-2">
          {division.included.map((entry) => (
            <li
              key={entry.id ?? entry.item}
              className="flex gap-3 rounded-xl border border-line bg-ink p-4 text-[0.9375rem]"
            >
              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-glow-strong text-accent">
                <Check className="size-4" />
              </span>
              {entry.item}
            </li>
          ))}
        </ul>
        <Link href={`/${division.slug}`} className={cx(arrowLink, "mt-6 text-accent")}>
          Explore {division.shortName}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

/**
 * The services console: a tab per division beside how a request moves.
 * What's included comes from each division's own page, so the two can't
 * drift apart; the steps are a process, never a result.
 */
export function Showcase({
  block,
  context,
}: {
  block: BlockOf<"showcase">;
  context: BlockContext;
}) {
  const { divisions } = context;
  if (divisions.length === 0) return null;
  return (
    <section className={section} id="services">
      <div className={container}>
        <SectionHead eyebrow={block.eyebrow} heading={block.heading} intro={block.intro} />
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
          <Tabs
            label="Divisions"
            items={divisions.map((division) => ({
              label: division.shortName,
              toneClass: tone(division.slug),
              panel: <Console division={division} />,
            }))}
          />
          <aside
            className="grid gap-5 rounded-2xl border border-gate-1/40 bg-ink-2 bg-[radial-gradient(ellipse_120%_80%_at_100%_0%,rgb(91_107_250/0.22),transparent_60%)] p-6 lg:mt-[3.75rem]"
            aria-label={block.stepsHeading}
          >
            <p className={label}>{block.stepsHeading}</p>
            <ol className="grid list-none gap-4">
              {block.steps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-gate-2/50 font-mono text-xs text-gate-2">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-[0.9375rem]">{step}</span>
                </li>
              ))}
            </ol>
            <Link href="/contact" className={cx(button, "w-full")}>
              Start Now
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
