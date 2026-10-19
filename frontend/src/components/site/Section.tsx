import Link from "next/link";
import type React from "react";
import type { SiteSetting } from "@zgate/cms-contracts";
import { WhatsAppButton } from "./ContactChannels";

/** The brand guide's eyebrow: mono, uppercase, a leading hairline. */
export function Eyebrow({ children }: { children?: React.ReactNode }) {
  return children ? <p className="eyebrow">{children}</p> : null;
}

export function SectionHead({
  eyebrow,
  heading,
  intro,
}: {
  eyebrow?: string | null;
  heading?: string | null;
  intro?: string | null;
}) {
  if (!eyebrow && !heading && !intro) return null;
  return (
    <div className="section-head">
      <Eyebrow>{eyebrow}</Eyebrow>
      {heading ? <h2>{heading}</h2> : null}
      {intro ? <p className="section-head__intro">{intro}</p> : null}
    </div>
  );
}

export function CtaLink({ label, href }: { label?: string | null; href?: string | null }) {
  if (!label || !href) return null;
  return (
    <Link href={href} className="button">
      {label}
    </Link>
  );
}

/** The page's main action plus WhatsApp, for visitors who'd rather message than fill in a form. */
export function CtaRow({
  settings,
  topic,
  ...cta
}: {
  settings: SiteSetting;
  topic?: string | null;
  label?: string | null;
  href?: string | null;
}) {
  if (!cta.label || !cta.href) return null;
  return (
    <div className="cta-row">
      <CtaLink {...cta} />
      <WhatsAppButton settings={settings} topic={topic} />
    </div>
  );
}

export type Commitment = {
  id?: string | null;
  figure: string;
  label: string;
  division?: string | null;
};

/**
 * Published service commitments as figures - "say the number first". The
 * note (required in the CMS) always says these are commitments, not results.
 */
export function CommitmentGrid({ items, note }: { items: Commitment[]; note: string }) {
  return (
    <>
      <ul className="figures">
        {items.map((item) => (
          <li
            key={item.id ?? item.label}
            className={item.division ? `figure tone--${item.division}` : "figure"}
          >
            <span className="figure__value">{item.figure}</span>
            <span className="figure__label">{item.label}</span>
          </li>
        ))}
      </ul>
      <p className="figures__note">{note}</p>
    </>
  );
}

export type Question = { id?: string | null; question: string; answer: string };

/** Honest answers, open by default - nothing important hidden behind a click. */
export function QuestionList({ items }: { items: Question[] }) {
  return (
    <dl className="questions">
      {items.map((item) => (
        <div key={item.id ?? item.question} className="question">
          <dt>{item.question}</dt>
          <dd>{item.answer}</dd>
        </div>
      ))}
    </dl>
  );
}
