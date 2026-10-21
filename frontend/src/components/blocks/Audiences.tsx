import Link from "next/link";
import { GateMark } from "@/components/brand/GateMark";
import { SectionHead } from "@/components/site/Section";
import { Check } from "@/components/ui/icons";
import { Tabs } from "@/components/ui/Tabs";
import { button, container, cx, label, section } from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";
import type { BlockOf } from "./types";

type Audience = BlockOf<"audiences">["items"][number];

/** One visitor type: the promise and next step, beside what we take off their plate. */
function AudiencePanel({ item }: { item: Audience }) {
  const division = item.division && item.division !== "bundle" ? item.division : undefined;
  return (
    <div className="grid items-center gap-10 rounded-2xl border border-line bg-[radial-gradient(ellipse_70%_90%_at_0%_0%,var(--glow-strong),transparent_65%)] p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <h3 className="text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.1] font-bold tracking-[-0.025em]">
          {item.headline}
        </h3>
        <p className="mt-4 max-w-[52ch] text-lg text-paper-dim">{item.body}</p>
        <Link href={item.href} className={cx(button, "mt-8")}>
          {item.label}
        </Link>
      </div>
      <div className="rounded-2xl border border-line bg-ink p-6 shadow-[0_32px_80px_-40px_var(--glow-strong)]">
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-line pb-4">
          <p className={label}>What we take off your plate</p>
          <GateMark division={division} className="w-6" />
        </div>
        <ul className="grid list-none gap-4">
          {item.points.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-glow-strong text-accent">
                <Check className="size-4" />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** "Find yourself here": a tab per kind of visitor, in their words. */
export function Audiences({ block }: { block: BlockOf<"audiences"> }) {
  return (
    <section className={section}>
      <div className={container}>
        <SectionHead eyebrow={block.eyebrow} heading={block.heading} intro={block.intro} />
        <Tabs
          label="Who we work with"
          items={block.items.map((item) => ({
            label: item.tab,
            toneClass: tone(item.division),
            panel: <AudiencePanel item={item} />,
          }))}
        />
      </div>
    </section>
  );
}
