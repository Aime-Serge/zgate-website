"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

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

  return (
    <nav aria-label="Main" className={hydrated ? "site-nav-wrap js" : "site-nav-wrap"}>
      <button
        type="button"
        className="site-nav__toggle"
        aria-expanded={open}
        aria-controls="site-nav-list"
        onClick={() => setOpen(!open)}
      >
        {open ? "Close menu" : "Menu"}
      </button>
      <ul id="site-nav-list" className="site-nav" data-open={open}>
        {links.map((link) => {
          const current =
            !link.external && (pathname === link.href || pathname.startsWith(`${link.href}/`));
          return (
            <li key={link.href}>
              {link.external ? (
                <a href={link.href}>{link.label}</a>
              ) : (
                <Link
                  href={link.href}
                  aria-current={current ? "page" : undefined}
                  className={link.tone ? `site-nav__link tone--${link.tone}` : "site-nav__link"}
                >
                  {link.label}
                </Link>
              )}
            </li>
          );
        })}
        {cta ? (
          <li className="site-nav__cta">
            <Link
              href={cta.href}
              className="button button--small"
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
