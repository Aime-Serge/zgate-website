import { GateVisual } from "@/components/brand/GateVisual";
import { CtaRow, Eyebrow } from "@/components/site/Section";
import {
  container,
  cx,
  hero,
  heroAudience,
  heroHeading,
  label,
  lede,
} from "@/components/ui/styles";
import type { BlockContext, BlockOf } from "./types";

// Each layout's own sizes, written out in full rather than layered on
// heroHeading / lede: two utilities for one property would conflict.
// text-balance evens out the headline's lines (no orphaned last word);
// 1.05 leading keeps Space Grotesk's descenders (the g in "juggling")
// clear of the next line's capitals.
const splitHeading =
  "max-w-[17ch] text-balance text-[clamp(2.5rem,5.4vw,4.5rem)] leading-[1.05] font-bold tracking-[-0.03em]";
const splitLede = "max-w-[36rem] text-pretty text-lg text-paper nav:text-xl";
const centeredHeading =
  "max-w-[18ch] text-balance text-[clamp(2.5rem,6.2vw,4.5rem)] leading-[1.05] font-bold tracking-[-0.03em]";
const centeredLede = "mt-6 max-w-[40rem] text-pretty text-lg text-paper nav:text-xl";

/**
 * The page's opening. Three layouts:
 *  - "centered" (the homepage): one centred column - the headline with its
 *    opening words in the brand gradient, the explanation, the actions. A
 *    brand statement: it fills the width at every screen size, so it suits
 *    a headline of three lines or fewer.
 *  - "split": the headline large on the left, the explanation and the
 *    actions on the right (from 1024px; one column below).
 *  - "stacked": one column, optionally beside the gate drawing.
 */
export function Hero({
  block,
  context,
  isFirst,
}: {
  block: BlockOf<"hero">;
  context: BlockContext;
  isFirst: boolean;
}) {
  const { settings, divisions, audienceLine } = context;
  const Heading = isFirst ? "h1" : "h2";
  const accent =
    block.headlineAccent && block.headline.startsWith(block.headlineAccent)
      ? block.headlineAccent
      : null;
  const headline = accent ? (
    <>
      <span className="bg-[linear-gradient(100deg,var(--color-gate-1),var(--color-gate-2))] bg-clip-text text-transparent">
        {accent}
      </span>
      {block.headline.slice(accent.length)}
    </>
  ) : (
    block.headline
  );

  if (block.layout === "centered") {
    return (
      <section className={hero}>
        <div className={cx(container, "grid justify-items-center text-center")}>
          <Eyebrow>{block.eyebrow}</Eyebrow>
          <Heading className={centeredHeading}>{headline}</Heading>
          {audienceLine ? <p className={cx(heroAudience, "mt-6")}>{audienceLine}</p> : null}
          {block.lede ? <p className={centeredLede}>{block.lede}</p> : null}
          <CtaRow settings={settings} {...block.cta} className="w-full justify-center" />
        </div>
      </section>
    );
  }

  if (block.layout === "split") {
    return (
      <section className={hero}>
        <div className={cx(container, "grid items-end gap-x-16 gap-y-6 lg:grid-cols-[1.25fr_1fr]")}>
          <div>
            <Eyebrow>{block.eyebrow}</Eyebrow>
            <Heading className={splitHeading}>{headline}</Heading>
          </div>
          <div className="lg:pb-2">
            {audienceLine ? <p className={heroAudience}>{audienceLine}</p> : null}
            {block.lede ? <p className={splitLede}>{block.lede}</p> : null}
            <CtaRow settings={settings} {...block.cta} />
          </div>
        </div>
      </section>
    );
  }

  const withVisual = block.visual === "gate" && divisions.length > 0;
  return (
    <section className={hero}>
      <div
        className={cx(
          container,
          "grid items-center gap-12",
          withVisual && "lg:grid-cols-[1.15fr_1fr]",
        )}
      >
        <div>
          <Eyebrow>{block.eyebrow}</Eyebrow>
          <Heading className={heroHeading}>{headline}</Heading>
          {audienceLine ? <p className={heroAudience}>{audienceLine}</p> : null}
          {block.lede ? <p className={lede}>{block.lede}</p> : null}
          <CtaRow settings={settings} {...block.cta} />
        </div>
        {withVisual ? (
          // Decorative: on a phone its labels would be too small to read,
          // and the headline already says it.
          <div className="hidden w-full max-w-[560px] sm:block">
            <figure className="overflow-hidden rounded-2xl border border-line bg-[radial-gradient(ellipse_at_70%_35%,rgb(91_107_250/0.15),transparent_68%)] p-4 shadow-[0_32px_100px_-48px_rgb(52_224_201/0.65)] sm:p-6">
              <div className="mb-2 flex items-center justify-between gap-3 border-b border-line pb-3">
                <span className={label}>One gate. Four rooms.</span>
                <span className="inline-flex items-center gap-2 font-mono text-xs text-paper-dim">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-gate-2 shadow-[0_0_12px_rgb(52_224_201/0.8)]"
                  />
                  Four divisions
                </span>
              </div>
              <GateVisual divisions={divisions} />
              <figcaption className="border-t border-line pt-3 text-sm text-paper-dim">
                Four specialist teams, connected from your first conversation.
              </figcaption>
            </figure>
          </div>
        ) : null}
      </div>
    </section>
  );
}
