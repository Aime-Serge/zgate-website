import { GateMark } from "@/components/brand/GateMark";
import { Eyebrow } from "@/components/site/Section";
import { band, container, cx, section, sectionHeading } from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";
import type { BlockOf } from "./types";

/** The positioning statement, centred, over one column per pillar. */
export function Pillars({ block }: { block: BlockOf<"pillars"> }) {
  return (
    <section className={cx(section, band)}>
      <div className={container}>
        <div className="mx-auto mb-14 max-w-[52rem] text-center">
          <Eyebrow className="justify-center">{block.eyebrow}</Eyebrow>
          <h2 className={sectionHeading}>{block.heading}</h2>
          {block.intro ? <p className="mt-5 text-lg text-paper-dim">{block.intro}</p> : null}
        </div>
        <ul className="grid list-none gap-10 sm:grid-cols-2 wide:grid-cols-4">
          {block.items.map((item) => (
            <li
              key={item.id ?? item.title}
              className={cx(tone(item.division), "grid content-start gap-3")}
            >
              <span
                aria-hidden="true"
                className="mb-2 inline-flex size-14 items-center justify-center rounded-2xl border border-accent/40 bg-glow"
              >
                <GateMark division={item.division ?? undefined} className="w-8" />
              </span>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-paper-dim">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
