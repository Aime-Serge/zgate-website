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
  QuestionList,
  SectionHead,
} from "@/components/site/Section";
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
    <section className="block block--tight fact-strip" aria-label={heading || "Company facts"}>
      <div className="max">
        {heading ? <h2 className="fact-strip__heading">{heading}</h2> : null}
        <ul className="fact-strip__list">
          {facts.map((entry) => (
            <li key={entry.id ?? entry.fact}>{entry.fact}</li>
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
        <section className={withVisual ? "hero hero--gate" : "hero"}>
          <div className="max hero__inner">
            <div className="hero__text">
              <Eyebrow>{block.eyebrow}</Eyebrow>
              {isFirst ? <h1>{block.headline}</h1> : <h2>{block.headline}</h2>}
              {audienceLine ? <p className="hero__audience">{audienceLine}</p> : null}
              {block.lede ? <p className="lede">{block.lede}</p> : null}
              <CtaRow settings={settings} {...block.cta} />
            </div>
            {withVisual ? (
              <div className="hero__visual">
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
        <section className="block">
          <div className="max">
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} />
            <ul className="doors">
              {block.items.map((door) => (
                <li
                  key={door.id ?? door.need}
                  className={`door tone--${door.division ?? "bundle"}`}
                >
                  <Link href={door.href} className="door__link">
                    <span className="door__need">{door.need}</span>
                    {door.answer ? <span className="door__answer">{door.answer}</span> : null}
                    <span className="door__go">
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
        <section className="block block--band">
          <div className="max">
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} intro={block.intro} />
            <ul className="figures figures--large">
              {block.items.map((item) => (
                <li key={item.id ?? item.statement} className="figure">
                  <span className="figure__value">{item.figure}</span>
                  <span className="figure__label">{item.statement}</span>
                </li>
              ))}
            </ul>
            <p className="figures__note">Source: {block.source}</p>
          </div>
        </section>
      );
    case "divisionGrid":
      return (
        <section className="block">
          <div className="max">
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} intro={block.intro} />
            <ul className="rooms">
              {divisions.map((division) => (
                <li key={division.id} className={`room tone--${division.slug}`}>
                  <Link href={`/${division.slug}`} className="room__link">
                    {division.pillar ? (
                      <span className="room__pillar">{division.pillar}</span>
                    ) : null}
                    <span className="room__lockup">
                      <GateMark division={division.slug} className="gate-mark room__mark" />
                      <span className="room__name">{division.name}</span>
                    </span>
                    {division.subtitle ? (
                      <span className="room__subtitle">{division.subtitle}</span>
                    ) : null}
                    <span className="room__mission">{division.mission}</span>
                    <span className="room__go">
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
        <section className="block">
          <div className="max">
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} intro={block.intro} />
            <CommitmentGrid items={block.items} note={block.note} />
          </div>
        </section>
      );
    case "steps":
      return (
        <section className="block">
          <div className="max">
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} intro={block.intro} />
            <ol className="steps">
              {block.items.map((step, index) => (
                <li key={step.id ?? step.title} className="step">
                  <span className="step__n" aria-hidden="true">
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
        <section className="block">
          <div className="max prose">
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} />
            <RichText data={block.content} />
          </div>
        </section>
      );
    case "featureList":
      return (
        <section className="block">
          <div className="max">
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} />
            <ul className={block.numbered ? "features features--numbered" : "features"}>
              {block.items.map((item, index) => (
                <li key={item.id ?? item.title} className="feature">
                  {block.numbered ? (
                    <span className="feature__n" aria-hidden="true">
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
        <section className="block">
          <div className="max">
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} />
            <div className="course-grid">
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
        <section className="block">
          <div className="max">
            <SectionHead eyebrow={block.eyebrow} heading={block.heading} />
            <QuestionList items={block.items} />
          </div>
        </section>
      );
    case "callToAction":
      return (
        <section className="block">
          <div className="max">
            <div className="cta-band">
              <Eyebrow>{block.eyebrow}</Eyebrow>
              <h2>{block.heading}</h2>
              {block.body ? <p>{block.body}</p> : null}
              <CtaRow settings={settings} label={block.label} href={block.href} />
            </div>
          </div>
        </section>
      );
    case "leadForm":
      // The form only appears once a privacy notice is published - no
      // personal data is collected without one. The direct channels are
      // always shown, so nobody is ever left without a way to reach us.
      return (
        <section className="block">
          <div className="max form-section">
            {privacyLive ? (
              <LeadForm
                variant={block.variant}
                heading={block.heading}
                intro={block.intro}
                courses={courses.map((course) => ({ id: course.id, title: course.title }))}
              />
            ) : null}
            <div className="contact-aside">
              <ContactChannels
                settings={settings}
                heading={privacyLive ? "Prefer to talk?" : "Message, call or email us"}
              />
              <div className="office">
                <p className="office__label">Registered office</p>
                <address>{settings.address}</address>
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

export function RenderBlocks({ blocks, ...context }: { blocks: Block[] } & Context) {
  return (
    <>
      {blocks.map((block, index) => (
        <div key={block.id ?? index}>{renderBlock(block, context, index === 0)}</div>
      ))}
    </>
  );
}
