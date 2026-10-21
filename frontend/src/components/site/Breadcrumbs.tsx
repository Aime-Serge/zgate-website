import Link from "next/link";
import { container, cx } from "@/components/ui/styles";
import type { Crumb } from "@/lib/structuredData";

/**
 * Where this page sits (Home / Solutions / Traders and shops). The last
 * crumb is the current page and isn't a link.
 */
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className={cx(container, "pt-6")}>
      <ol className="flex list-none flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs tracking-[0.06em] text-paper-dim">
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={crumb.href} className="inline-flex items-center gap-2">
              {last ? (
                <span aria-current="page" className="text-paper">
                  {crumb.label}
                </span>
              ) : (
                <>
                  <Link
                    href={crumb.href}
                    className="inline-flex min-h-6 items-center text-paper-dim underline-offset-4 hover:text-paper hover:underline"
                  >
                    {crumb.label}
                  </Link>
                  <span aria-hidden="true">/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
