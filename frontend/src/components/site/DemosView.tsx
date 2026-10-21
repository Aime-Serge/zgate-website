import Link from "next/link";
import { ArrowRight, Calendar, Message } from "@/components/ui/icons";
import { container, cx, eyebrow, hero, heroHeading, lede, section } from "@/components/ui/styles";
import type { Demo, SiteSetting } from "@zgate/cms-contracts";
import { whatsappGreeting, whatsappHref } from "./ContactChannels";
import { DemoLibrary } from "./DemoLibrary";

/**
 * /demos - the Demo Library (ServiceNow's demo library, Z-GATE's
 * services): a short look at how each service works, then a person to
 * walk you through your own case. Demos come from the CMS (Website >
 * Demos); one without a video is shown as "Coming soon".
 */
export function DemosView({ demos, settings }: { demos: Demo[]; settings: SiteSetting }) {
  const rows = [
    {
      href: "/contact?intent=demo",
      icon: <Calendar className="size-7 text-gate-2" />,
      title: "Book a live walkthrough",
      body: "A person from the right team shows you how it would work for your business.",
      external: false,
    },
    {
      href: whatsappHref(settings.whatsapp || settings.phone, whatsappGreeting()),
      icon: <Message className="size-7 text-gate-2" />,
      title: "Ask on WhatsApp",
      body: "Tell us what you'd like to see. A real person replies, not an automated response.",
      external: true,
    },
  ];
  return (
    <>
      <section className={hero}>
        <div className={container}>
          <p className={eyebrow}>Demo Library</p>
          <h1 className={heroHeading}>
            See how <span className="whitespace-nowrap">Z-GATE</span> works
          </h1>
          <p className={lede}>
            Short walkthroughs of how Advisory, Academy, Tech and Data handle the work you bring us.
            Can&rsquo;t find what you need? Ask for a live walkthrough.
          </p>
        </div>
      </section>

      <section className={cx(section, "border-t border-line")}>
        <div className={container}>
          <DemoLibrary demos={demos} />
        </div>
      </section>

      <section className="pb-16 lg:pb-28">
        <div className={container}>
          <div className="grid gap-8 rounded-2xl border border-line bg-ink-2 bg-[radial-gradient(ellipse_70%_120%_at_0%_100%,rgb(52_224_201/0.14),transparent_60%)] p-6 sm:p-10 nav:grid-cols-[1fr_1.3fr] nav:items-center lg:p-14">
            <h2 className="text-[clamp(2rem,4.2vw,3rem)] leading-[1.08] font-bold tracking-[-0.025em] text-balance">
              See how it would work for your business
            </h2>
            <ul className="grid list-none divide-y divide-line">
              {rows.map((row) => {
                const content = (
                  <>
                    <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-full border border-gate-2/40">
                      {row.icon}
                    </span>
                    <span className="grid flex-1 gap-1">
                      <span className="font-display text-2xl font-bold">{row.title}</span>
                      <span className="text-paper-dim">{row.body}</span>
                    </span>
                    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-gate-2 text-gate-2 transition-transform group-hover:translate-x-1">
                      <ArrowRight className="size-5" />
                    </span>
                  </>
                );
                const rowClass = "group flex items-center gap-5 text-paper no-underline";
                return (
                  <li key={row.title} className="py-6 first:pt-0 last:pb-0">
                    {row.external ? (
                      <a href={row.href} className={rowClass}>
                        {content}
                      </a>
                    ) : (
                      <Link href={row.href} className={rowClass}>
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
    </>
  );
}
