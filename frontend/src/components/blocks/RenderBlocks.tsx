import Link from "next/link";
import { GateMark } from "@/components/brand/GateMark";
import { LeadForm } from "@/components/forms/LeadForm";
import { ContactChannels } from "@/components/site/ContactChannels";
import { CourseCard, learningPlatform } from "@/components/site/CourseCard";
import { RichText } from "@/components/site/RichText";
import {
  CommitmentGrid,
  Eyebrow,
  Figure,
  QuestionList,
  SectionHead,
} from "@/components/site/Section";
import { ArrowRight } from "@/components/ui/icons";
import {
  arrowLink,
  band,
  card,
  cardLink,
  container,
  courseGrid,
  cx,
  formSplit,
  hairlineGrid,
  label,
  prose,
  section,
  sectionHeading,
} from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";
import type { SiteSetting } from "@zgate/cms-contracts";
import { Audiences } from "./Audiences";
import { ClosingCta } from "./ClosingCta";
import { Hero } from "./Hero";
import { Latest } from "./Latest";
import { Pillars } from "./Pillars";
import { Scenarios } from "./Scenarios";
import { SolutionGrid } from "./SolutionGrid";
import { Showcase } from "./Showcase";
import { Spotlights } from "./Spotlights";
import { Trust } from "./Trust";
import type { Block, BlockContext } from "./types";

export type { BlockContext } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

/** A feature: hairline on top, mono number, title, body. */
const numberedItem = "border-t border-line pt-4 [&_h3]:mb-2 [&_h3]:text-lg [&_p]:text-paper-dim";
const itemNumber = "mb-3 block font-mono text-xs text-accent";

/**
 * The company's verifiable facts (registration, licence) as a trust
 * bar - where a larger company would show client logos. From Site settings.
 */
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
    <section
      className="border-y border-line bg-ink-2/60 py-6"
      aria-label={heading || "Company facts"}
    >
      <div className={container}>
        {heading ? <h2 className="mb-4 text-center text-base">{heading}</h2> : null}
        <ul className="flex list-none flex-wrap items-center justify-center gap-x-10 gap-y-3 font-mono text-[0.8125rem] tracking-[0.04em] text-paper-dim">
          {facts.map((entry) => (
            <li
              key={entry.id ?? entry.fact}
              className="inline-flex items-center gap-2.5 before:size-1.5 before:rounded-sm before:bg-gate-2 before:content-['']"
            >
              {entry.fact}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function renderBlock(block: Block, context: BlockContext, isFirst: boolean) {
  const { settings, divisions, courses, privacyLive, contextualService } = context;
  switch (block.blockType) {
    case "hero":
      return <Hero block={block} context={context} isFirst={isFirst} />;
    case "showcase":
      return <Showcase block={block} context={context} />;
    case "spotlights":
      return <Spotlights block={block} />;
    case "pillars":
      return <Pillars block={block} />;
    case "audiences":
      return <Audiences block={block} />;
    case "scenarios":
      return <Scenarios block={block} context={context} />;
    case "trust":
      return <Trust block={block} />;
    case "latest":
      return <Latest block={block} context={context} />;
    case "solutionGrid":
      return <SolutionGrid block={block} context={context} />;
    case "callToAction":
      return <ClosingCta block={block} context={context} />;
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
                    className={cx(
                      cardLink,
                      "min-h-60 gap-4 bg-[linear-gradient(135deg,var(--glow),transparent_62%)] p-6",
                    )}
                  >
                    <span className="font-display text-xl leading-[1.3] font-bold">
                      {door.need}
                    </span>
                    {door.answer ? (
                      <span className="text-[0.9375rem] text-paper-dim">{door.answer}</span>
                    ) : null}
                    <span className={cx(arrowLink, "mt-auto text-accent")}>
                      {door.label}
                      <ArrowRight className="size-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
    case "marketFacts":
      // A spotlight card: the cited problem, large, with its source beneath.
      return (
        <section className={section}>
          <div className={container}>
            <div className="grid gap-10 rounded-2xl border border-gate-1/35 bg-ink-2 bg-[radial-gradient(ellipse_60%_120%_at_0%_0%,rgb(91_107_250/0.22),transparent_60%)] p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:p-14">
              <div>
                <Eyebrow>{block.eyebrow}</Eyebrow>
                <h2 className={sectionHeading}>{block.heading}</h2>
                {block.intro ? <p className="mt-4 text-lg text-paper-dim">{block.intro}</p> : null}
              </div>
              <div>
                <ul className="grid list-none gap-4 sm:grid-cols-2">
                  {block.items.map((item) => (
                    <Figure
                      key={item.id ?? item.statement}
                      value={item.figure}
                      label={item.statement}
                      large
                    />
                  ))}
                </ul>
                {/* The figures' source is kept in the CMS (required there, as
                    the record behind them) but not printed on the card. */}
              </div>
            </div>
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
                    <span className="mb-4 text-[0.9375rem] text-paper-dim">{division.mission}</span>
                    <span className={cx(arrowLink, "mt-auto text-accent")}>
                      Explore {division.shortName}
                      <ArrowRight className="size-4" />
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
        <section className={cx(section, band)}>
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
            <ol className="grid list-none gap-4 md:grid-cols-2 wide:auto-cols-fr wide:grid-flow-col">
              {block.items.map((step, index) => (
                <li
                  key={step.id ?? step.title}
                  className={cx(card, "grid content-start gap-3 p-6")}
                >
                  <span
                    className="inline-flex size-10 items-center justify-center rounded-full border border-gate-2/50 font-mono text-sm text-gate-2"
                    aria-hidden="true"
                  >
                    {pad(index + 1)}
                  </span>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  {step.body ? <p className="text-paper-dim">{step.body}</p> : null}
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
              <RichText html={block.content} />
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
      const chosen = (block.courses ?? []).filter(
        (c): c is (typeof courses)[number] => typeof c === "object",
      );
      const list = chosen.length > 0 ? chosen : courses;
      return (
        <section className={section}>
          <div className={container}>
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} />
            <div className={courseGrid}>
              {list.map((course) => (
                <CourseCard key={course.id} course={course} platform={learningPlatform(settings)} />
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
                responseTimeCommitment={settings.responseTimeCommitment}
                contextualService={contextualService}
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
      // Compile time: every known block type is handled above. Run time: a
      // type this release doesn't know yet (the CMS was released first,
      // docs/DEPLOYMENT.md §4) is skipped instead of breaking the page.
      const unhandled: never = block;
      void unhandled;
      return null;
    }
  }
}

/**
 * Blocks in order. Sections on the plain surface are separated by a
 * hairline; bands, the trust bar and spotlight cards carry their own edges.
 * Two bands in a row read as one: the second loses its top padding.
 */
const OWN_EDGE = new Set<Block["blockType"]>(["factStrip", "commitments", "pillars", "spotlights"]);
const BANDS = new Set<Block["blockType"]>(["commitments", "pillars"]);

export function RenderBlocks({ blocks, ...context }: { blocks: Block[] } & BlockContext) {
  return (
    <>
      {blocks.map((block, index) => {
        const previous = blocks[index - 1];
        const rule =
          index > 0 &&
          !OWN_EDGE.has(block.blockType) &&
          previous &&
          !OWN_EDGE.has(previous.blockType);
        const joined = previous && BANDS.has(previous.blockType) && BANDS.has(block.blockType);
        return (
          <div
            key={block.id ?? index}
            className={rule ? "border-t border-line" : joined ? "[&>section]:pt-0" : undefined}
          >
            {renderBlock(block, context, index === 0)}
          </div>
        );
      })}
    </>
  );
}
