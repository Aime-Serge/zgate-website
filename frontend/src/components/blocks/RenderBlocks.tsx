import { RichText } from "@payloadcms/richtext-lexical/react";
import Link from "next/link";
import { GateMark } from "@/components/brand/GateMark";
import { GateVisual } from "@/components/brand/GateVisual";
import { LeadForm } from "@/components/forms/LeadForm";
import { ContactChannels } from "@/components/site/ContactChannels";
import { CourseCard } from "@/components/site/CourseCard";
import {
  CommitmentGrid,
  CtaRow,
  Eyebrow,
  Figure,
  FigureNote,
  figureGrid,
  QuestionList,
  SectionHead,
} from "@/components/site/Section";
import {
  container,
  courseGrid,
  ctaBand,
  cx,
  formSplit,
  goLink,
  hairlineGrid,
  hero,
  heroAudience,
  heroHeading,
  label,
  lede,
  prose,
  section,
  sectionHeading,
} from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";
import type { Course, Division, Page, SiteSetting } from "@zgate/cms-contracts";

type Block = Page["layout"][number];

type Context = {
  settings: SiteSetting;
  divisions: Division[];
  courses: Course[];
  privacyLive: boolean;
  /** Who the site is for - shown under the hero headline (home page only). */
  audienceLine?: string | null;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** A step or feature: hairline on top, mono number, title, body. */
const numberedItem = "border-t border-line pt-4 [&_h3]:mb-2 [&_h3]:text-lg [&_p]:text-paper-dim";
const itemNumber = "mb-3 block font-mono text-xs text-accent";

export function FactStrip({
  settings,
  heading,
}: {
  settings: SiteSetting;
  heading?: string | null;
}) {
  const facts = settings.companyFacts ?? [];
  if (facts.length === 0) return null;
  return (
    <section className="py-6" aria-label={heading || "Company facts"}>
      <div className={container}>
        {heading ? <h2 className="mb-3 text-base">{heading}</h2> : null}
        <ul className="flex list-none flex-wrap gap-x-8 gap-y-2 font-mono text-[0.8125rem] text-paper-dim">
          {facts.map((entry) => (
            <li
              key={entry.id ?? entry.fact}
              className="inline-flex items-center gap-2 before:size-1.5 before:rounded-sm before:bg-gate-2 before:content-['']"
            >
              {entry.fact}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function renderBlock(block: Block, context: Context, isFirst: boolean) {
  const { settings, divisions, courses, privacyLive, audienceLine } = context;
  switch (block.blockType) {
    case "hero": {
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
              {isFirst ? (
                <h1 className={heroHeading}>{block.headline}</h1>
              ) : (
                <h2 className={heroHeading}>{block.headline}</h2>
              )}
              {audienceLine ? <p className={heroAudience}>{audienceLine}</p> : null}
              {block.lede ? <p className={lede}>{block.lede}</p> : null}
              <CtaRow settings={settings} {...block.cta} />
            </div>
            {withVisual ? (
              // Decorative: on a phone its labels would be too small to
              // read, and the headline already says it.
              <div className="hidden w-full max-w-[560px] sm:block">
                <GateVisual divisions={divisions} />
              </div>
            ) : null}
          </div>
        </section>
      );
    }
    case "factStrip":
      return <FactStrip settings={settings} heading={block.heading} />;
    case "doors":
      return (
        <section className={section}>
          <div className={container}>
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} />
            <ul className="grid list-none gap-4 md:grid-cols-2">
              {block.items.map((door) => (
                <li key={door.id ?? door.need} className={tone(door.division ?? "bundle")}>
                  <Link
                    href={door.href}
                    className="flex h-full flex-col gap-3 rounded-lg border border-l-[3px] border-line border-l-accent bg-[linear-gradient(90deg,var(--glow),transparent_55%)] p-6 no-underline transition-colors duration-150 hover:bg-ink-2"
                  >
                    <span className="font-display text-xl leading-[1.3] font-semibold">
                      {door.need}
                    </span>
                    {door.answer ? <span className="text-paper-dim">{door.answer}</span> : null}
                    <span className={goLink}>
                      {door.label} <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
    case "marketFacts":
      return (
        <section className={cx(section, "bg-ink-2")}>
          <div className={container}>
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} intro={block.intro} />
            <ul className={figureGrid}>
              {block.items.map((item) => (
                <Figure
                  key={item.id ?? item.statement}
                  value={item.figure}
                  label={item.statement}
                  large
                  surface="ink-2"
                />
              ))}
            </ul>
            <FigureNote>Source: {block.source}</FigureNote>
          </div>
        </section>
      );
    case "divisionGrid":
      return (
        <section className={section}>
          <div className={container}>
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} intro={block.intro} />
            <ul className={cx(hairlineGrid, "list-none md:grid-cols-2 wide:grid-cols-4")}>
              {divisions.map((division) => (
                <li key={division.id} className={cx(tone(division.slug), "bg-ink")}>
                  <Link
                    href={`/${division.slug}`}
                    className="flex h-full flex-col gap-3 border-t-2 border-transparent px-6 py-8 no-underline transition-colors duration-150 hover:border-accent hover:bg-ink-2"
                  >
                    {division.pillar ? (
                      <span className="font-mono text-xs tracking-[0.12em] text-accent uppercase">
                        {division.pillar}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-2.5">
                      <GateMark division={division.slug} className="w-6" />
                      <span className="font-display text-xl font-semibold">{division.name}</span>
                    </span>
                    {division.subtitle ? (
                      <span className="font-mono text-[0.6875rem] tracking-[0.1em] text-paper-dim uppercase">
                        {division.subtitle}
                      </span>
                    ) : null}
                    <span className="mb-4 text-[0.9375rem] text-paper-dim">{division.mission}</span>
                    <span className={goLink}>
                      Explore {division.shortName} <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
    case "commitments":
      return (
        <section className={section}>
          <div className={container}>
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} intro={block.intro} />
            <CommitmentGrid items={block.items} note={block.note} />
          </div>
        </section>
      );
    case "steps":
      return (
        <section className={section}>
          <div className={container}>
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} intro={block.intro} />
            <ol className="grid list-none gap-8 md:grid-cols-2 wide:auto-cols-fr wide:grid-flow-col">
              {block.items.map((step, index) => (
                <li key={step.id ?? step.title} className={numberedItem}>
                  <span className={itemNumber} aria-hidden="true">
                    {pad(index + 1)}
                  </span>
                  <h3>{step.title}</h3>
                  {step.body ? <p>{step.body}</p> : null}
                </li>
              ))}
            </ol>
          </div>
        </section>
      );
    case "richText":
      return (
        <section className={section}>
          <div className={container}>
            {/* Outside the prose wrapper, so its p styles don't reach the eyebrow. */}
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} />
            <div className={prose}>
              <RichText data={block.content} />
            </div>
          </div>
        </section>
      );
    case "featureList":
      return (
        <section className={section}>
          <div className={container}>
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} />
            <ul className="grid list-none gap-8 nav:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
              {block.items.map((item, index) => (
                <li key={item.id ?? item.title} className={numberedItem}>
                  {block.numbered ? (
                    <span className={itemNumber} aria-hidden="true">
                      {pad(index + 1)}
                    </span>
                  ) : null}
                  <h3>{item.title}</h3>
                  {item.body ? <p>{item.body}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
    case "courseList": {
      const chosen = (block.courses ?? []).filter((c): c is Course => typeof c === "object");
      const list = chosen.length > 0 ? chosen : courses;
      return (
        <section className={section}>
          <div className={container}>
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} />
            <div className={courseGrid}>
              {list.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      );
    }
    case "faq":
      return (
        <section className={section}>
          <div className={container}>
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} />
            <QuestionList items={block.items} />
          </div>
        </section>
      );
    case "callToAction":
      return (
        <section className={section}>
          <div className={container}>
            <div className={ctaBand}>
              <Eyebrow className="justify-center">{block.eyebrow}</Eyebrow>
              <h2 className={sectionHeading}>{block.heading}</h2>
              {block.body ? <p className="mt-3 text-paper-dim">{block.body}</p> : null}
              <CtaRow
                settings={settings}
                label={block.label}
                href={block.href}
                className="justify-center"
              />
            </div>
          </div>
        </section>
      );
    case "leadForm":
      // The form only appears once a privacy notice is published - no
      // personal data is collected without one. The direct channels are
      // always shown, so nobody is ever left without a way to reach us.
      return (
        <section className={section}>
          <div className={cx(container, formSplit)}>
            {privacyLive ? (
              <LeadForm
                variant={block.variant}
                heading={block.heading}
                intro={block.intro}
                courses={courses.map((course) => ({ id: course.id, title: course.title }))}
              />
            ) : null}
            {/* No form yet: channels and office side by side across the full width. */}
            <div
              className={cx(
                "grid content-start gap-8",
                !privacyLive && "nav:col-span-full nav:grid-cols-[3fr_2fr] nav:gap-x-12",
              )}
            >
              <ContactChannels
                settings={settings}
                heading={privacyLive ? "Prefer to talk?" : "Message, call or email us"}
              />
              <div>
                <p className={label}>Registered office</p>
                <address className="mt-2 text-paper-dim not-italic">{settings.address}</address>
              </div>
            </div>
          </div>
        </section>
      );
    default: {
      const unhandled: never = block;
      return unhandled;
    }
  }
}

/** Blocks in order, with the brand guide's hairline between consecutive sections. */
export function RenderBlocks({ blocks, ...context }: { blocks: Block[] } & Context) {
  return (
    <>
      {blocks.map((block, index) => (
        <div key={block.id ?? index} className={index > 0 ? "border-t border-line" : undefined}>
          {renderBlock(block, context, index === 0)}
        </div>
      ))}
    </>
  );
}
