import Link from "next/link";
import { Lockup } from "@/components/brand/GateMark";
import { container, cx, label } from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";
import type { Division, SiteSetting } from "@zgate/cms-contracts";
import { telHref, whatsappHref } from "./ContactChannels";

type Props = { settings: SiteSetting; divisions: Division[]; showPrivacyLink: boolean };

const heading = cx(label, "mb-4 font-medium tracking-[0.14em]");
const list = "grid list-none gap-3";
const inlineLink = "underline underline-offset-2";

/**
 * Phone and WhatsApp on every page, not just /contact (CR-10); the four
 * divisions in their own colours; and the verifiable company facts the
 * marketing strategy says belong on every page.
 */
export function SiteFooter({ settings, divisions, showPrivacyLink }: Props) {
  const whatsapp = settings.whatsapp || settings.phone;
  const facts = settings.companyFacts ?? [];
  return (
    // Bottom padding on phones leaves room for the quick-contact bar.
    <footer className="border-t border-line bg-ink max-sm:pb-[calc(64px+env(safe-area-inset-bottom))]">
      <div
        className={cx(
          container,
          "grid gap-8 pt-16 pb-8 md:grid-cols-2 wide:grid-cols-[2fr_1fr_1.3fr_1fr]",
        )}
      >
        <div>
          <Lockup name="Solution" />
          <p className="mt-4 font-mono text-xs tracking-[0.14em] text-gate-2 uppercase">
            {settings.motto}
          </p>
          {settings.boilerplate ? (
            <p className="mt-3 max-w-[44ch] text-[0.9375rem] text-paper-dim">
              {settings.boilerplate}
            </p>
          ) : null}
        </div>
        <nav aria-label="Divisions">
          <h2 className={heading}>Divisions</h2>
          <ul className={list}>
            {divisions.map((division) => (
              <li key={division.id}>
                <Link
                  href={`/${division.slug}`}
                  className={cx(
                    tone(division.slug),
                    "inline-grid grid-cols-[auto_1fr] items-baseline gap-x-2 no-underline hover:underline",
                    "before:size-2 before:-translate-y-px before:rounded-full before:bg-accent before:content-['']",
                  )}
                >
                  {division.shortName}
                  {division.subtitle ? (
                    <span className="col-start-2 text-[0.8125rem] text-paper-dim">
                      {division.subtitle}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className={heading}>Contact</h2>
          <ul aria-label="Contact" className={list}>
            <li>
              WhatsApp:{" "}
              <a href={whatsappHref(whatsapp)} className={inlineLink}>
                {whatsapp}
              </a>
            </li>
            <li>
              Phone:{" "}
              <a href={telHref(settings.phone)} className={inlineLink}>
                {settings.phone}
              </a>
            </li>
            <li>
              Email:{" "}
              <a href={`mailto:${settings.email}`} className={inlineLink}>
                {settings.email}
              </a>
            </li>
          </ul>
          <address className="mt-4 text-[0.9375rem] text-paper-dim not-italic">
            {settings.address}
          </address>
        </div>
        <nav aria-label="Company">
          <h2 className={heading}>Company</h2>
          <ul className={list}>
            <li>
              <Link href="/about" className={inlineLink}>
                About Z-GATE
              </Link>
            </li>
            <li>
              <Link href="/academy/courses" className={inlineLink}>
                Courses
              </Link>
            </li>
            <li>
              <Link href="/contact" className={inlineLink}>
                Contact
              </Link>
            </li>
            {showPrivacyLink ? (
              <li>
                <Link href="/privacy" className={inlineLink}>
                  Privacy notice
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
      </div>
      <div
        className={cx(container, "border-t border-line pt-6 pb-8 font-mono text-xs text-paper-dim")}
      >
        <p>{[settings.legalName, ...facts.map((entry) => entry.fact)].join(" · ")}</p>
      </div>
    </footer>
  );
}
