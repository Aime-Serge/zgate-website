import Link from "next/link";
import type React from "react";
import type { SiteSetting } from "@zgate/cms-contracts";
import { button, ctaRow, cx, eyebrow, sectionHeading } from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";
import { WhatsAppButton } from "./ContactChannels";

/** The brand guide's eyebrow: mono, uppercase, a leading hairline. */
export function Eyebrow({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return children ? <p className={cx(eyebrow, className)}>{children}</p> : null;
}

/**
 * Keeps "Z-GATE" on one line: browsers may break a line at its hyphen,
 * which leaves "Z-" at a line end on phones.
 */
export function KeepBrand({ text }: { text: string }) {
  const parts = text.split("Z-GATE");
  return (
    <>
      {parts.map((part, index) => (
        <span key={index}>
          {index > 0 ? <span className="whitespace-nowrap">Z-GATE</span> : null}
          {part}
        </span>
      ))}
    </>
  );
}

export function SectionHead({
  eyebrow: eyebrowText,
  heading,
  intro,
}: {
  eyebrow?: string | null;
  heading?: string | null;
  intro?: string | null;
}) {
  if (!eyebrowText && !heading && !intro) return null;
  return (
    <div className="mb-8 max-w-[46rem]">
      <Eyebrow>{eyebrowText}</Eyebrow>
      {heading ? (
        <h2 className={sectionHeading}>
          <KeepBrand text={heading} />
        </h2>
      ) : null}
      {intro ? <p className="mt-4 text-[1.0625rem] text-paper-dim">{intro}</p> : null}
    </div>
  );
}

export function CtaLink({ label, href }: { label?: string | null; href?: string | null }) {
  if (!label || !href) return null;
  return (
    <Link href={href} className={button}>
      {label}
    </Link>
  );
}

/** The page's main action plus WhatsApp, for visitors who'd rather message than fill in a form. */
export function CtaRow({
  settings,
  topic,
  className,
  ...cta
}: {
  settings: SiteSetting;
  topic?: string | null;
  className?: string;
  label?: string | null;
  href?: string | null;
}) {
  if (!cta.label || !cta.href) return null;
  return (
    <div className={cx(ctaRow, className)}>
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

/** One figure as a card: a large number in the tone's accent over a plain label. */
export function Figure({
  value,
  label,
  large = false,
  className,
}: {
  value: string;
  label: string;
  large?: boolean;
  className?: string;
}) {
  return (
    <li
      className={cx(
        "flex flex-col gap-3 rounded-2xl border border-line bg-ink-2 bg-[linear-gradient(160deg,var(--glow),transparent_60%)] p-6 sm:p-8",
        className,
      )}
    >
      <span
        className={cx(
          "font-display leading-none font-bold tracking-[-0.03em] whitespace-nowrap text-accent",
          large ? "text-[clamp(3.5rem,9vw,5.5rem)]" : "text-[clamp(2.75rem,5vw,3.5rem)]",
        )}
      >
        {value}
      </span>
      <span className="text-[1.0625rem] text-paper">{label}</span>
    </li>
  );
}

/** The grid that holds figure cards. */
export const figureGrid = "grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3";

/** Small mono line under a figure grid (source or "not past results"). */
export function FigureNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 max-w-[70ch] font-mono text-xs text-paper-dim">{children}</p>;
}

/**
 * Published service commitments as figures - "say the number first". The
 * note (required in the CMS) always says these are commitments, not results.
 */
export function CommitmentGrid({ items, note }: { items: Commitment[]; note: string }) {
  return (
    <>
      <ul className={figureGrid}>
        {items.map((item) => (
          <Figure
            key={item.id ?? item.label}
            value={item.figure}
            label={item.label}
            className={item.division ? tone(item.division) : undefined}
          />
        ))}
      </ul>
      <FigureNote>{note}</FigureNote>
    </>
  );
}

export type Question = { id?: string | null; question: string; answer: string };

/** Honest answers, open by default - nothing important hidden behind a click. */
export function QuestionList({ items }: { items: Question[] }) {
  return (
    <dl className="grid gap-8 nav:grid-cols-2 nav:gap-x-12">
      {items.map((item) => (
        <div key={item.id ?? item.question} className="border-t border-line pt-4">
          <dt className="mb-2 font-display text-lg font-semibold">{item.question}</dt>
          <dd className="text-paper-dim">{item.answer}</dd>
        </div>
      ))}
    </dl>
  );
}
