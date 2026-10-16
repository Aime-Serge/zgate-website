import type { SiteSetting } from "@zgate/cms-contracts";

export const telHref = (number: string) => `tel:${number.replace(/[^\d+]/g, "")}`;
export const whatsappHref = (number: string) => `https://wa.me/${number.replace(/\D/g, "")}`;

/** Direct channels - shown beside every form and whenever a form can't be. */
export function ContactChannels({
  settings,
  heading,
}: {
  settings: SiteSetting;
  heading?: string;
}) {
  const whatsapp = settings.whatsapp || settings.phone;
  return (
    <div className="contact-channels">
      {heading ? <h3>{heading}</h3> : null}
      <ul className="contact-list">
        <li>
          WhatsApp: <a href={whatsappHref(whatsapp)}>{whatsapp}</a>
        </li>
        <li>
          Phone: <a href={telHref(settings.phone)}>{settings.phone}</a>
        </li>
        <li>
          Email: <a href={`mailto:${settings.email}`}>{settings.email}</a>
        </li>
      </ul>
    </div>
  );
}
