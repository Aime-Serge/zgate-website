import Link from "next/link";
import type React from "react";
import { telHref, whatsappGreeting, whatsappHref } from "@/components/site/ContactChannels";
import { Eyebrow } from "@/components/site/Section";
import { ArrowRight, Form, Message, Phone } from "@/components/ui/icons";
import { container, section } from "@/components/ui/styles";
import type { BlockContext, BlockOf } from "./types";

type Action = {
  href: string;
  title: string;
  detail: string;
  icon: React.ReactNode;
  external?: boolean;
};

/**
 * The closing invitation: the promise on the left, three ways to act on
 * the right - the page's own button, WhatsApp and a call - each a full
 * row, so the visitor picks the channel they already use.
 */
export function ClosingCta({
  block,
  context,
}: {
  block: BlockOf<"callToAction">;
  context: BlockContext;
}) {
  const { settings } = context;
  const whatsapp = settings.whatsapp || settings.phone;
  const actions: Action[] = [
    {
      href: block.href,
      title: block.label,
      detail: "Tell us what you need in a few lines. A person replies.",
      icon: <Form className="size-6" />,
    },
    {
      href: whatsappHref(whatsapp, whatsappGreeting()),
      title: "Chat on WhatsApp",
      detail: `Message us directly on ${whatsapp}.`,
      icon: <Message className="size-6" />,
      external: true,
    },
    {
      href: telHref(settings.phone),
      title: `Call ${settings.phone}`,
      detail: "Talk it through with the team during business hours.",
      icon: <Phone className="size-6" />,
      external: true,
    },
  ];
  const row = "group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-6 no-underline sm:gap-6";

  return (
    <section className={section}>
      <div className={container}>
        <div className="grid gap-10 rounded-2xl border border-gate-1/35 bg-ink-2 bg-[radial-gradient(ellipse_70%_120%_at_0%_100%,rgb(52_224_201/0.18),transparent_60%),radial-gradient(ellipse_70%_120%_at_100%_0%,rgb(91_107_250/0.24),transparent_60%)] p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:p-14">
          <div className="self-center">
            <Eyebrow>{block.eyebrow}</Eyebrow>
            <h2 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.03em]">
              {block.heading}
            </h2>
            {block.body ? <p className="mt-4 text-lg text-paper-dim">{block.body}</p> : null}
          </div>
          <ul className="list-none">
            {actions.map((action) => {
              const content = (
                <>
                  <span className="inline-flex size-14 items-center justify-center rounded-full border border-gate-2/50 text-gate-2">
                    {action.icon}
                  </span>
                  <span className="grid gap-1">
                    <span className="font-display text-xl font-bold sm:text-2xl">
                      {action.title}
                    </span>
                    <span className="text-paper-dim">{action.detail}</span>
                  </span>
                  <span className="inline-flex size-12 items-center justify-center rounded-full border border-gate-2 text-gate-2 transition-colors duration-150 group-hover:bg-gate-2 group-hover:text-ink">
                    <ArrowRight />
                  </span>
                </>
              );
              return (
                <li key={action.title} className="border-t border-line first:border-t-0">
                  {action.external ? (
                    <a href={action.href} className={row}>
                      {content}
                    </a>
                  ) : (
                    <Link href={action.href} className={row}>
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
