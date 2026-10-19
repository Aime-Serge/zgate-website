"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { buttonSmall, cx } from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";

/** A nav link: underlined in its division's colour on hover and on its own page. */
const navLink =
  "inline-block border-b-2 border-transparent py-2 no-underline hover:border-accent aria-[current=page]:border-accent";

export type NavLink = { href: string; label: string; external?: boolean; tone?: string };

/**
 * Collapses into a menu button on small screens. Without JavaScript the
 * list simply stays visible (the `js` class is only set once hydrated), so
 * navigation never depends on a script loading over a weak connection.
 */
const noopSubscribe = () => () => {};

export function HeaderNav({ links, cta }: { links: NavLink[]; cta?: NavLink }) {
  const pathname = usePathname();
  // true in the browser, false during server render - without an effect.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  // The menu is open only for the page it was opened on, so navigating
  // closes it with no extra effect.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenOn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Below 900px the list collapses behind the button - but only once
  // hydrated: without JavaScript the list simply stays visible.
  const collapsible = hydrated;
  return (
    <nav aria-label="Main" className={cx(collapsible && "max-nav:contents")}>
      <button
        type="button"
        className={cx(
          "hidden min-h-11 cursor-pointer rounded-md border border-line bg-transparent px-4 py-2 text-paper",
          collapsible && "max-nav:inline-block",
        )}
        aria-expanded={open}
        aria-controls="site-nav-list"
        onClick={() => setOpen(!open)}
      >
        {open ? "Close menu" : "Menu"}
      </button>
      <ul
        id="site-nav-list"
        className={cx(
          "flex list-none flex-wrap items-center gap-x-6 gap-y-2",
          collapsible && !open && "max-nav:hidden",
          collapsible && open && "max-nav:w-full max-nav:flex-col max-nav:items-start max-nav:py-4",
        )}
        data-open={open}
      >
        {links.map((link) => {
          const current =
            !link.external && (pathname === link.href || pathname.startsWith(`${link.href}/`));
          return (
            <li key={link.href}>
              {link.external ? (
                <a href={link.href} className={navLink}>
                  {link.label}
                </a>
              ) : (
                <Link
                  href={link.href}
                  aria-current={current ? "page" : undefined}
                  className={cx(navLink, link.tone && tone(link.tone))}
                >
                  {link.label}
                </Link>
              )}
            </li>
          );
        })}
        {cta ? (
          <li>
            <Link
              href={cta.href}
              className={cx(buttonSmall, "aria-[current=page]:bg-action-hover")}
              aria-current={pathname === cta.href ? "page" : undefined}
            >
              {cta.label}
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
