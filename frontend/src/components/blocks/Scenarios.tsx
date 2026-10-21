import { FigureNote, SectionHead } from "@/components/site/Section";
import { Marquee } from "@/components/ui/Marquee";
import { card, chip, container, cx, section } from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";
import type { BlockContext, BlockOf } from "./types";

/**
 * Situations we handle, as a slowly moving row of cards (a marquee that
 * visitors can pause): the situation in the client's words, what we do,
 * and the written commitment that applies. Not case studies - no client
 * names, no results - and the note under the row says so. The row runs
 * edge to edge; the heading and the note keep to the page column.
 */
export function Scenarios({
  block,
  context,
}: {
  block: BlockOf<"scenarios">;
  context: BlockContext;
}) {
  const names = new Map(context.divisions.map((d) => [d.slug, d.shortName]));
  return (
    <section className={section}>
      <div className={container}>
        <SectionHead eyebrow={block.eyebrow} heading={block.heading} intro={block.intro} />
      </div>
      <Marquee
        label={block.heading}
        items={block.items.map((item) => ({
          key: item.id ?? item.situation,
          className: tone(item.division),
          content: (
            <article
              className={cx(
                card,
                "flex h-full flex-col gap-4 bg-[linear-gradient(160deg,var(--glow-strong),transparent_55%)] p-6",
              )}
            >
              {item.division && names.get(item.division) ? (
                <span className={cx(chip, "self-start")}>{names.get(item.division)}</span>
              ) : null}
              <h3 className="text-xl leading-[1.25] font-bold">{item.situation}</h3>
              <p className="text-paper-dim">{item.response}</p>
              {item.figure && item.figureLabel ? (
                <p className="mt-auto border-t border-line pt-4">
                  <span className="block font-display text-4xl leading-none font-bold tracking-[-0.02em] text-accent">
                    {item.figure}
                  </span>
                  <span className="mt-2 block text-sm text-paper-dim">{item.figureLabel}</span>
                </p>
              ) : null}
            </article>
          ),
        }))}
      />
      <div className={container}>
        <FigureNote>{block.note}</FigureNote>
      </div>
    </section>
  );
}
