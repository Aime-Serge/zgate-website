import { RichText } from "@payloadcms/richtext-lexical/react";
import Link from "next/link";
import { LeadForm } from "@/components/forms/LeadForm";
import { ContactChannels, WhatsAppButton } from "@/components/site/ContactChannels";
import { CourseCard } from "@/components/site/CourseCard";
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

function CtaLink({ label, href }: { label?: string | null; href?: string | null }) {
  if (!label || !href) return null;
  return (
    <Link href={href} className="button">
      {label}
    </Link>
  );
}

/** The page's main action plus WhatsApp, for visitors who'd rather message than fill in a form. */
function CtaRow({
  settings,
  ...cta
}: {
  settings: SiteSetting;
  label?: string | null;
  href?: string | null;
}) {
  if (!cta.label || !cta.href) return null;
  return (
    <div className="cta-row">
      <CtaLink {...cta} />
      <WhatsAppButton settings={settings} />
    </div>
  );
}

function renderBlock(
  block: Block,
  { settings, divisions, courses, privacyLive, audienceLine }: Context,
) {
  switch (block.blockType) {
    case "hero":
      return (
        <section className="max block block--hero">
          {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
          <h1>{block.headline}</h1>
          {audienceLine ? <p className="muted">{audienceLine}</p> : null}
          {block.lede ? <p className="lede">{block.lede}</p> : null}
          <CtaRow settings={settings} {...block.cta} />
        </section>
      );
    case "richText":
      return (
        <section className="max block prose">
          {block.heading ? <h2>{block.heading}</h2> : null}
          <RichText data={block.content} />
        </section>
      );
    case "featureList":
      return (
        <section className="max block">
          {block.heading ? <h2>{block.heading}</h2> : null}
          <div className="grid">
            {block.items.map((item) => (
              <div key={item.id ?? item.title} className="card">
                <h3>{item.title}</h3>
                {item.body ? <p>{item.body}</p> : null}
              </div>
            ))}
          </div>
        </section>
      );
    case "divisionGrid":
      return (
        <section className="max block">
          {block.heading ? <h2>{block.heading}</h2> : null}
          <div className="grid">
            {divisions.map((division) => (
              <Link
                key={division.id}
                href={`/${division.slug}`}
                className={`card card--link accent--${division.slug}`}
              >
                <h3>{division.shortName}</h3>
                <p>{division.mission}</p>
              </Link>
            ))}
          </div>
        </section>
      );
    case "courseList": {
      const chosen = (block.courses ?? []).filter((c): c is Course => typeof c === "object");
      const list = chosen.length > 0 ? chosen : courses;
      return (
        <section className="max block">
          {block.heading ? <h2>{block.heading}</h2> : null}
          <div className="grid">
            {list.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      );
    }
    case "faq":
      return (
        <section className="max block">
          {block.heading ? <h2>{block.heading}</h2> : null}
          {block.items.map((item) => (
            <details key={item.id ?? item.question} className="faq">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </section>
      );
    case "callToAction":
      return (
        <section className="max block block--cta">
          <h2>{block.heading}</h2>
          {block.body ? <p>{block.body}</p> : null}
          <CtaRow settings={settings} label={block.label} href={block.href} />
        </section>
      );
    case "leadForm":
      // The form only appears once a privacy notice is published - no
      // personal data is collected without one. The direct channels are
      // always shown, so nobody is ever left without a way to reach us.
      return (
        <section className="max block form-section">
          {privacyLive ? (
            <LeadForm
              variant={block.variant}
              heading={block.heading}
              intro={block.intro}
              courses={courses.map((course) => ({ id: course.id, title: course.title }))}
            />
          ) : (
            <>
              {block.heading ? <h2>{block.heading}</h2> : null}
              {block.intro ? <p>{block.intro}</p> : null}
            </>
          )}
          <ContactChannels
            settings={settings}
            heading={privacyLive ? "Prefer to talk?" : undefined}
          />
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
        <div key={block.id ?? index}>{renderBlock(block, context)}</div>
      ))}
    </>
  );
}
