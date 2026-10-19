import type { SiteSetting } from "@zgate/cms-contracts";

export const telHref = (number: string) => `tel:${number.replace(/[^\d+]/g, "")}`;

/** wa.me link; `text` pre-fills the visitor's first message (they can edit it before sending). */
export const whatsappHref = (number: string, text?: string) =>
  `https://wa.me/${number.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/**
 * The visitor's opening line, naming what they were reading - so the team
 * answering WhatsApp starts with context instead of "how can we help?" -
 * and marked as coming from the website, so the chat can be logged with
 * the right channel (marketing review, "should fix" #2).
 */
export const whatsappGreeting = (topic?: string | null) =>
  `${
    topic
      ? `Hello Z-GATE, I'd like to talk about ${topic}.`
      : "Hello Z-GATE, I'd like to talk to someone about my business."
  } (Sent from your website.)`;

const whatsappNumber = (settings: SiteSetting) => settings.whatsapp || settings.phone;

/**
 * Secondary action beside "Start a conversation": WhatsApp is the primary
 * channel for the core persona (docs/marketing/CONVERSION_FUNNEL.md), so it
 * gets a button where the decision is made, not just a footer link.
 */
export function WhatsAppButton({
  settings,
  topic,
}: {
  settings: SiteSetting;
  topic?: string | null;
}) {
  return (
    <a
      className="button button--secondary"
      href={whatsappHref(whatsappNumber(settings), whatsappGreeting(topic))}
    >
      Chat on WhatsApp
    </a>
  );
}

/**
 * Direct channels - shown beside every form and whenever a form can't be.
 * Buttons, WhatsApp first, at the same weight as the form's own submit
 * button (CONVERSION_FUNNEL.md: "equal visual weight"). Each shows its
 * number or address, so it can be copied as well as tapped.
 */
export function ContactChannels({
  settings,
  heading,
  topic,
}: {
  settings: SiteSetting;
  heading?: string;
  topic?: string | null;
}) {
  const whatsapp = whatsappNumber(settings);
  return (
    <div className="contact-channels">
      {heading ? <h3>{heading}</h3> : null}
      <ul className="contact-actions">
        <li>
          <a className="button" href={whatsappHref(whatsapp, whatsappGreeting(topic))}>
            WhatsApp <span className="contact-actions__detail">{whatsapp}</span>
          </a>
        </li>
        <li>
          <a className="button button--secondary" href={telHref(settings.phone)}>
            Call <span className="contact-actions__detail">{settings.phone}</span>
          </a>
        </li>
        <li>
          <a className="button button--secondary" href={`mailto:${settings.email}`}>
            Email <span className="contact-actions__detail">{settings.email}</span>
          </a>
        </li>
      </ul>
    </div>
  );
}
