import Link from "next/link";
import type { SiteSetting } from "@/payload-types";
import { telHref, whatsappHref } from "./ContactChannels";

type Props = { settings: SiteSetting; showPrivacyLink: boolean };

/** Phone and WhatsApp on every page, not just /contact (CR-10). */
export function SiteFooter({ settings, showPrivacyLink }: Props) {
  const whatsapp = settings.whatsapp || settings.phone;
  return (
    <footer className="site-footer">
      <div className="max site-footer__inner">
        <div>
          <p className="site-footer__name">{settings.legalName}</p>
          <p>{settings.motto}</p>
          <address>{settings.address}</address>
        </div>
        <ul className="site-footer__contact" aria-label="Contact">
          <li>
            Phone: <a href={telHref(settings.phone)}>{settings.phone}</a>
          </li>
          <li>
            WhatsApp: <a href={whatsappHref(whatsapp)}>{whatsapp}</a>
          </li>
          <li>
            Email: <a href={`mailto:${settings.email}`}>{settings.email}</a>
          </li>
        </ul>
        <ul className="site-footer__links">
          <li>
            <Link href="/academy/courses">Courses</Link>
          </li>
          <li>
            <Link href="/contact">Contact</Link>
          </li>
          {showPrivacyLink ? (
            <li>
              <Link href="/privacy">Privacy notice</Link>
            </li>
          ) : null}
        </ul>
      </div>
    </footer>
  );
}
