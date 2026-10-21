import Link from "next/link";
import { Eyebrow } from "@/components/site/Section";
import { ArrowRight, Building, Document, Lock, Shield } from "@/components/ui/icons";
import { arrowLink, card, container, cx, section, sectionHeading } from "@/components/ui/styles";
import type { BlockOf } from "./types";

// Icons in reading order: registration, licence, data, commitments.
const ICONS = [Building, Shield, Lock, Document];

/**
 * Facts a visitor can check before they call - in place of the awards and
 * analyst badges a larger company would show. Verifiable facts only.
 */
export function Trust({ block }: { block: BlockOf<"trust"> }) {
  return (
    <section className={section}>
      <div className={container}>
        <div className="mx-auto mb-12 max-w-[46rem] text-center">
          <Eyebrow className="justify-center">{block.eyebrow}</Eyebrow>
          <h2 className={sectionHeading}>{block.heading}</h2>
        </div>
        <ul className="grid list-none gap-4 sm:grid-cols-2 wide:grid-cols-4">
          {block.items.map((item, index) => {
            const Icon = ICONS[index % ICONS.length] ?? Building;
            return (
              <li
                key={item.id ?? item.title}
                className={cx(card, "grid content-start gap-4 p-6 text-center")}
              >
                <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full border border-gate-2/40 text-gate-2">
                  <Icon className="size-6" />
                </span>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="text-[0.9375rem] text-paper-dim">{item.body}</p>
              </li>
            );
          })}
        </ul>
        {block.link?.label && block.link.href ? (
          <p className="mt-8 text-center">
            <Link href={block.link.href} className={cx(arrowLink, "text-gate-2")}>
              {block.link.label}
              <ArrowRight className="size-4" />
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
