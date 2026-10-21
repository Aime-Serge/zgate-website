import type { SiteSetting } from "@zgate/cms-contracts";
import { buttonSecondary, channelButton, channelButtonSecondary } from "@/components/ui/styles";

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

const detail = "font-mono text-sm font-normal [overflow-wrap:anywhere]";

/**
 * Secondary action beside "Start Now": WhatsApp is the primary
 * channel for the core persona (docs/CONTENT_GUIDE.md), so it
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
      className={buttonSecondary}
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
    <div>
      {heading ? <h3 className="mb-3 text-lg">{heading}</h3> : null}
      <ul className="grid max-w-[28rem] gap-3">
        <li>
          <a className={channelButton} href={whatsappHref(whatsapp, whatsappGreeting(topic))}>
            WhatsApp <span className={detail}>{whatsapp}</span>
          </a>
        </li>
        <li>
          <a className={channelButtonSecondary} href={telHref(settings.phone)}>
            Call <span className={detail}>{settings.phone}</span>
          </a>
        </li>
        <li>
          <a className={channelButtonSecondary} href={`mailto:${settings.email}`}>
            Email <span className={detail}>{settings.email}</span>
          </a>
        </li>
      </ul>
    </div>
  );
}
