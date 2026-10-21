"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
import { GateMark } from "@/components/brand/GateMark";
import {
  ArrowRight,
  ChevronDown,
  Close,
  Globe,
  MenuLines,
  Phone,
  Search,
} from "@/components/ui/icons";
import {
  arrowLink,
  button,
  buttonSmall,
  buttonSmallSecondary,
  chip,
  cx,
  label,
} from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";
import type { DivisionSlug } from "@zgate/cms-contracts";

export type MenuService = {
  slug: DivisionSlug;
  name: string;
  shortName: string;
  subtitle?: string | null;
  pillar?: string | null;
  mission: string;
  included: string[];
};
export type MenuCourse = {
  slug: string;
  title: string;
  detail?: string | null;
  /** The course's enroll action (components/site/CourseCard.tsx, enrollAction). */
  enroll: { label: string; href: string; external: boolean };
};
export type MenuLink = { href: string; label: string; description?: string; external?: boolean };
export type MenuSolution = { slug: string; title: string; summary?: string | null };
/** A need in the visitor's words, from the Solutions page's "What do you need?" block. */
export type MenuNeed = { need: string; href: string; division?: string | null };

export type MegaNavProps = {
  services: MenuService[];
  solutions: MenuSolution[];
  needs: MenuNeed[];
  courses: MenuCourse[];
  company: MenuLink[];
  facts: string[];
  phone: string;
  /** "Log in" to the learning platform, once it is live. */
  login?: string | null;
  /** Course buttons go to the learning platform (true) or a waitlist (false). */
  lmsOpen: boolean;
};

type MenuKey = "services" | "solutions" | "academy" | "company" | "search" | "language" | "account";

/**
 * The globe menu. Only English exists today; the other two show as coming
 * soon rather than linking to pages that don't exist (no machine
 * translation of tax content).
 */
const LANGUAGES = [
  { code: "en", name: "English", current: true },
  { code: "rw", name: "Ikinyarwanda", current: false },
  { code: "fr", name: "Français", current: false },
];

const MENUS: { key: MenuKey; label: string; fallback: string }[] = [
  { key: "services", label: "Services", fallback: "/#services" },
  { key: "solutions", label: "Solutions", fallback: "/solutions" },
  { key: "academy", label: "Academy", fallback: "/academy" },
  { key: "company", label: "Company", fallback: "/about" },
];

/** Starting points in the search panel: our services in a visitor's words. */
const POPULAR_SEARCHES = ["EBM", "VAT", "Bookkeeping", "Courses", "Dashboards"];

const trigger =
  "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-transparent bg-transparent px-2 py-2 font-semibold wide:px-3 text-paper no-underline transition-colors duration-150 hover:bg-paper/8 aria-expanded:bg-paper/8";
const panelLink =
  "group grid gap-1 rounded-xl border border-transparent p-3 no-underline transition-colors duration-150 hover:border-line hover:bg-ink-2";
/** panelLink with a dot in the division's colour before the text. */
const needLink =
  "group grid grid-cols-[auto_1fr] items-baseline gap-x-3 rounded-xl border border-transparent p-3 no-underline transition-colors duration-150 before:size-2 before:-translate-y-px before:rounded-full before:bg-accent before:content-[''] hover:border-line hover:bg-ink-2";
const promo = "grid content-start gap-4 rounded-2xl border border-gate-1/40 bg-ink-2 p-6";
const iconButton =
  "inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-transparent bg-transparent text-paper transition-colors duration-150 hover:bg-paper/8 aria-expanded:bg-paper/8";

/**
 * The site's main navigation (ServiceNow-style mega menu, Z-GATE content).
 *
 * Desktop: four triggers (and the search button) open full-width panels;
 * Escape, a click outside or navigating closes them, and only one is open
 * at a time. Phones: a "Menu" button opens a drawer with the same
 * destinations, and a search link sits beside it. There's no top-level
 * "Contact": the main button, the Company panel and the floating contact
 * buttons already lead there.
 *
 * Without JavaScript nothing is lost: the triggers are plain links to the
 * matching pages (the buttons are `data-needs-js`, the links
 * `data-no-js-only`), and the phone drawer simply stays open (globals.css).
 */
export function MegaNav({
  services,
  solutions,
  needs,
  courses,
  company,
  facts,
  phone,
  login,
  lmsOpen,
}: MegaNavProps) {
  const pathname = usePathname();
  const base = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const root = useRef<HTMLDivElement>(null);
  // Open state remembers the page it was opened on, so navigating closes
  // every menu without an extra effect.
  const [openOn, setOpenOn] = useState<{ menu: MenuKey | "mobile"; path: string } | null>(null);
  const open = openOn && openOn.path === pathname ? openOn.menu : null;
  const [service, setService] = useState<DivisionSlug | null>(null);
  const activeService = services.find((s) => s.slug === service) ?? services[0];

  const toggle = (menu: MenuKey | "mobile") =>
    setOpenOn(open === menu ? null : { menu, path: pathname });

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenOn(null);
    };
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpenOn(null);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    // While a menu is open the page behind it holds still: otherwise the
    // scrollbar moves a page the visitor can't see, while the menu (pinned
    // to the sticky header) doesn't move. A tall menu scrolls inside itself
    // instead. `scrollbar-gutter: stable` (globals.css) stops the page from
    // shifting sideways when its scrollbar is held.
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      html.style.overflow = previous;
    };
  }, [open]);

  const close = () => setOpenOn(null);
  // No Solutions menu until a solution page is published: no empty panels.
  const menus = MENUS.filter((menu) => menu.key !== "solutions" || solutions.length > 0);

  return (
    <div ref={root} className="contents">
      {/* ---------------------------------------------- desktop triggers */}
      <ul className="hidden list-none items-center gap-1 nav:mr-auto nav:flex">
        {menus.map((menu) => (
          <li key={menu.key}>
            <a href={menu.fallback} className={trigger} data-no-js-only>
              {menu.label}
            </a>
            <button
              type="button"
              className={trigger}
              aria-expanded={open === menu.key}
              aria-controls={`${base}-${menu.key}`}
              onClick={() => toggle(menu.key)}
              data-needs-js
            >
              {menu.label}
              <ChevronDown
                className={cx(
                  "size-4 transition-transform duration-150",
                  open === menu.key && "rotate-180",
                )}
              />
            </button>
          </li>
        ))}
      </ul>

      {/* ---------------------------------------------- desktop utilities */}
      <div className="hidden items-center gap-2 nav:flex">
        <Link href="/search" className={iconButton} aria-label="Search" data-no-js-only>
          <Search />
        </Link>
        <button
          type="button"
          className={iconButton}
          aria-label="Search"
          aria-expanded={open === "search"}
          aria-controls={`${base}-search`}
          onClick={() => toggle("search")}
          data-needs-js
        >
          {open === "search" ? <Close /> : <Search />}
        </button>
        {/* From 1080px, beside Sign in; below that, in the phone menu. */}
        <div className="hidden wide:block">
          <button
            type="button"
            className={iconButton}
            aria-label="Language: English"
            aria-expanded={open === "language"}
            aria-controls={`${base}-language`}
            onClick={() => toggle("language")}
            data-needs-js
          >
            <Globe />
          </button>
        </div>
        <button
          type="button"
          className="hidden min-h-11 cursor-pointer items-center rounded-full border border-transparent bg-transparent px-3 py-2 font-semibold text-gate-2 transition-colors duration-150 hover:bg-paper/8 aria-expanded:bg-paper/8 wide:inline-flex"
          aria-expanded={open === "account"}
          aria-controls={`${base}-account`}
          onClick={() => toggle("account")}
          data-needs-js
        >
          Sign in
        </button>
        {/* The site's main action, at every desktop width (ServiceNow's
            "Get Started"); on phones it is in the bottom bar and the menu. */}
        <Link href="/contact" className={buttonSmall}>
          Start Now
        </Link>
      </div>

      {/* ---------------------------------------------- desktop panels */}
      {open && open !== "mobile" ? (
        // Dims the page under an open menu; a click on it closes the menu.
        // Decorative for assistive tech: Escape and the trigger close it too.
        <div
          aria-hidden="true"
          onClick={close}
          className="absolute inset-x-0 top-full z-30 hidden h-dvh bg-ink/70 backdrop-blur-[2px] nav:block"
        />
      ) : null}
      {open === "services" && activeService ? (
        <div id={`${base}-services`} className={panelShell} role="region" aria-label="Services">
          <div className={panelGrid}>
            <div>
              <p className={cx(label, "mb-3")}>Our divisions</p>
              <ul className="grid list-none gap-1" aria-label="Divisions">
                {services.map((s) => (
                  <li key={s.slug} className={tone(s.slug)}>
                    <Link
                      href={`/${s.slug}`}
                      onClick={close}
                      onMouseEnter={() => setService(s.slug)}
                      onFocus={() => setService(s.slug)}
                      className={cx(
                        "flex items-center gap-3 rounded-xl border px-3 py-3 no-underline transition-colors duration-150",
                        s.slug === activeService.slug
                          ? "border-accent/50 bg-glow"
                          : "border-transparent hover:bg-ink-2",
                      )}
                    >
                      <GateMark division={s.slug} className="w-6" />
                      <span className="grid">
                        <span className="font-semibold">{s.name}</span>
                        {s.subtitle ? (
                          <span className="text-sm text-paper-dim">{s.subtitle}</span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className={cx(tone(activeService.slug), "border-line wide:border-x wide:px-8")}>
              {activeService.pillar ? <span className={chip}>{activeService.pillar}</span> : null}
              <p className="mt-4 font-display text-2xl font-bold tracking-[-0.02em]">
                {activeService.name}
              </p>
              <p className="mt-2 max-w-[52ch] text-paper-dim">{activeService.mission}</p>
              {activeService.included.length > 0 ? (
                <ul className="mt-5 grid list-none gap-2">
                  {activeService.included.map((item) => (
                    <li
                      key={item}
                      className="relative pl-6 text-sm before:absolute before:top-[0.55em] before:left-0 before:size-2 before:rounded-sm before:bg-accent before:content-['']"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link
                href={`/${activeService.slug}`}
                onClick={close}
                className={cx(arrowLink, "mt-6 text-accent")}
              >
                Explore {activeService.shortName}
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className={promo}>
              <p className="font-display text-xl font-bold">Not sure which room?</p>
              <p className="text-paper-dim">
                Tell us what&rsquo;s going on. A person reads every message and points you to the
                right team.
              </p>
              <Link href="/contact" onClick={close} className={cx(button, "justify-self-start")}>
                Start Now
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {open === "solutions" ? (
        <div id={`${base}-solutions`} className={panelShell} role="region" aria-label="Solutions">
          <div className={panelGrid}>
            <div>
              <p className={cx(label, "mb-3")}>By kind of business</p>
              <ul className="grid list-none gap-1">
                {solutions.map((solution) => (
                  <li key={solution.slug}>
                    <Link
                      href={`/solutions/${solution.slug}`}
                      onClick={close}
                      className={panelLink}
                    >
                      <span className="font-semibold group-hover:text-gate-2">
                        {solution.title}
                      </span>
                      {solution.summary ? (
                        <span className="text-sm text-paper-dim">{solution.summary}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="wide:border-x wide:border-line wide:px-8">
              <p className={cx(label, "mb-3")}>By need</p>
              {needs.length > 0 ? (
                <ul className="grid list-none gap-1">
                  {needs.map((need) => (
                    <li key={need.need} className={tone(need.division)}>
                      <Link href={need.href} onClick={close} className={needLink}>
                        <span className="font-semibold group-hover:text-accent">{need.need}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link href="/solutions" onClick={close} className={cx(arrowLink, "mt-4 text-gate-2")}>
                All solutions
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className={promo}>
              <p className="font-display text-xl font-bold">Can&rsquo;t see your business?</p>
              <p className="text-paper-dim">
                Tell us what&rsquo;s going on. A person reads every message and points you to the
                right team.
              </p>
              <Link href="/contact" onClick={close} className={cx(button, "justify-self-start")}>
                Start Now
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {open === "language" ? (
        <div id={`${base}-language`} className={panelShell} role="region" aria-label="Language">
          <div className="mx-auto grid w-full max-w-[860px] gap-6 px-6 py-8 nav:grid-cols-[1fr_1.4fr]">
            <div className="grid content-start gap-2">
              <p className="font-display text-xl font-bold">Language</p>
              <p className="text-sm text-paper-dim">
                The website is in English. Kinyarwanda and French versions are coming soon.
              </p>
            </div>
            <ul className="grid list-none gap-2">
              {LANGUAGES.map((language) => (
                <li
                  key={language.code}
                  aria-current={language.current ? "true" : undefined}
                  className={cx(
                    "flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4",
                    language.current ? "border-gate-2/60 bg-ink-2" : "border-line text-paper-dim",
                  )}
                >
                  <span lang={language.code} className="font-semibold">
                    {language.name}
                  </span>
                  <span className="font-mono text-xs">
                    {language.current ? "Current" : "Coming soon"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {open === "account" ? (
        <div
          id={`${base}-account`}
          className={cx(panelShell, tone("academy"))}
          role="region"
          aria-label="Sign in"
        >
          <div className="mx-auto grid w-full max-w-[860px] gap-6 px-6 py-8 nav:grid-cols-2">
            <div className="grid content-start gap-3 rounded-2xl border border-line bg-ink-2 p-6">
              <p className={label}>For learners</p>
              <p className="font-display text-xl font-bold">Z-GATE Academy Online</p>
              <p className="text-sm text-paper-dim">
                {login
                  ? "Your courses, lessons and certificates."
                  : "Opens soon. Join a course's waitlist and we'll tell you when you can sign in."}
              </p>
              {login ? (
                <a href={login} className={cx(buttonSmall, "justify-self-start")}>
                  Sign in
                </a>
              ) : (
                <Link
                  href="/academy/courses"
                  onClick={close}
                  className={cx(buttonSmallSecondary, "justify-self-start")}
                >
                  See the courses
                </Link>
              )}
            </div>
            <div className="grid content-start gap-3 p-6">
              <p className={label}>Clients</p>
              <p className="font-display text-xl font-bold">Already working with us?</p>
              <p className="text-sm text-paper-dim">
                There&rsquo;s no client portal: a person handles your work. Message your Z-GATE
                contact, or reach us directly.
              </p>
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                className={cx(arrowLink, "text-accent")}
              >
                <Phone className="size-4" />
                {phone}
              </a>
            </div>
          </div>
        </div>
      ) : null}

      {open === "search" ? (
        <div id={`${base}-search`} className={panelShell} role="region" aria-label="Search">
          <div className="mx-auto grid w-full max-w-[860px] gap-4 px-6 py-10">
            {/* A plain GET form: the search page reads ?q= and does the rest. */}
            <form role="search" action="/search" method="get" className="flex flex-wrap gap-3">
              <label htmlFor={`${base}-q`} className="sr-only">
                Search the site
              </label>
              <input
                id={`${base}-q`}
                type="search"
                name="q"
                // The visitor just asked to search: put them in the box.
                autoFocus
                autoComplete="off"
                enterKeyHint="search"
                placeholder="Search services, solutions, courses…"
                className="min-h-12 min-w-0 flex-[1_1_16rem] rounded-full border border-paper-dim bg-ink-2 px-5 text-paper placeholder:text-paper-dim focus-visible:border-gate-2"
              />
              <button type="submit" className={button}>
                Search
              </button>
            </form>
            <p className="flex flex-wrap items-center gap-2 text-sm text-paper-dim">
              <span>Popular:</span>
              {POPULAR_SEARCHES.map((term) => (
                <a
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="inline-flex min-h-8 items-center rounded-full border border-line px-3 text-paper no-underline hover:border-gate-2"
                >
                  {term}
                </a>
              ))}
            </p>
          </div>
        </div>
      ) : null}

      {open === "academy" ? (
        <div
          id={`${base}-academy`}
          className={cx(panelShell, tone("academy"))}
          role="region"
          aria-label="Academy"
        >
          {/* Two columns at every desktop width (never a third row of
              content): the Academy and how registration works, then a card
              per course with its enroll action. */}
          <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-6 py-8 nav:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)]">
            <div className="grid content-start gap-4">
              <p className="font-display text-2xl font-bold tracking-[-0.02em]">Z-GATE Academy</p>
              <p className="text-paper-dim">
                Short, practical courses in tax, bookkeeping and EBM, built from real Advisory
                cases.
              </p>
              <p className="flex items-start gap-2 text-sm text-paper-dim">
                <span
                  aria-hidden="true"
                  className={cx(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    lmsOpen ? "bg-accent" : "bg-paper-dim",
                  )}
                />
                {lmsOpen
                  ? "Registration is open on Z-GATE Academy Online."
                  : "Registration opens on Z-GATE Academy Online. Until then, join a course's waitlist and we'll tell you when you can sign up."}
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <Link
                  href="/academy/courses"
                  onClick={close}
                  className={cx(arrowLink, "text-accent")}
                >
                  All courses
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="/academy" onClick={close} className={arrowLink}>
                  About the Academy
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
            <div>
              <p className={cx(label, "mb-3")}>Courses</p>
              {courses.length > 0 ? (
                <ul className="grid list-none gap-3 wide:grid-cols-2">
                  {courses.map((course) => (
                    <li
                      key={course.slug}
                      className="flex h-full flex-col gap-3 rounded-2xl border border-line bg-[linear-gradient(145deg,var(--glow),transparent_60%)] p-5"
                    >
                      <Link
                        href={`/academy/courses/${course.slug}`}
                        onClick={close}
                        className="font-semibold no-underline hover:text-accent hover:underline"
                      >
                        {course.title}
                      </Link>
                      {course.detail ? (
                        <span className="text-sm text-paper-dim">{course.detail}</span>
                      ) : null}
                      <span className="mt-auto flex flex-wrap gap-2 pt-1">
                        {course.enroll.external ? (
                          <a href={course.enroll.href} className={buttonSmall}>
                            {course.enroll.label}
                          </a>
                        ) : (
                          <Link href={course.enroll.href} onClick={close} className={buttonSmall}>
                            {course.enroll.label}
                          </Link>
                        )}
                        <Link
                          href={`/academy/courses/${course.slug}`}
                          onClick={close}
                          className={buttonSmallSecondary}
                          aria-label={`Details: ${course.title}`}
                        >
                          Details
                        </Link>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-paper-dim">New courses are being prepared.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {open === "company" ? (
        <div id={`${base}-company`} className={panelShell} role="region" aria-label="Company">
          <div className={panelGrid}>
            <div className="grid content-start gap-4">
              <p className="font-display text-2xl font-bold tracking-[-0.02em]">Z-GATE LTD</p>
              <p className="text-paper-dim">
                Where Business Meets Technology: one company, four specialist divisions, based in
                Kigali.
              </p>
            </div>
            <ul className="grid list-none content-start gap-1 wide:border-x wide:border-line wide:px-8">
              {company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={close} className={panelLink}>
                    <span className="font-semibold group-hover:text-accent">{link.label}</span>
                    {link.description ? (
                      <span className="text-sm text-paper-dim">{link.description}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
            {facts.length > 0 ? (
              <div className={promo}>
                <p className="font-display text-xl font-bold">Check us before you call</p>
                <ul className="grid list-none gap-2 font-mono text-sm text-paper-dim">
                  {facts.map((fact) => (
                    <li
                      key={fact}
                      className="inline-flex items-center gap-2 before:size-1.5 before:rounded-sm before:bg-gate-2 before:content-['']"
                    >
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ---------------------------------------------- phones */}
      <div className="flex items-center gap-2 nav:hidden">
        <Link
          href="/search"
          onClick={close}
          aria-label="Search"
          className="inline-flex size-11 items-center justify-center rounded-full text-paper"
        >
          <Search className="size-6" />
        </Link>
        <button
          type="button"
          className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-line bg-transparent text-paper"
          aria-label={open === "mobile" ? "Close menu" : "Menu"}
          aria-expanded={open === "mobile"}
          aria-controls={`${base}-mobile`}
          onClick={() => toggle("mobile")}
          data-needs-js
        >
          {open === "mobile" ? <Close className="size-6" /> : <MenuLines className="size-6" />}
        </button>
      </div>
      <div
        id={`${base}-mobile`}
        data-mobile-menu
        hidden={open !== "mobile"}
        className="max-h-[calc(100dvh-4.5rem)] w-full overflow-y-auto overscroll-contain border-t border-line pt-4 pb-6 nav:hidden"
      >
        <MobileGroup title="Services">
          {services.map((s) => (
            <li key={s.slug} className={tone(s.slug)}>
              <Link href={`/${s.slug}`} onClick={close} className={mobileLink}>
                <GateMark division={s.slug} className="w-5" />
                <span className="grid">
                  <span className="font-semibold">{s.shortName}</span>
                  {s.subtitle ? <span className="text-sm text-paper-dim">{s.subtitle}</span> : null}
                </span>
              </Link>
            </li>
          ))}
        </MobileGroup>
        {solutions.length > 0 ? (
          <MobileGroup title="Solutions">
            {solutions.map((solution) => (
              <li key={solution.slug}>
                <Link href={`/solutions/${solution.slug}`} onClick={close} className={mobileLink}>
                  {solution.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/solutions" onClick={close} className={mobileLink}>
                <span className="font-semibold">All solutions</span>
              </Link>
            </li>
          </MobileGroup>
        ) : null}
        <MobileGroup title="Academy">
          <li>
            <Link href="/academy/courses" onClick={close} className={mobileLink}>
              <span className="font-semibold">All courses</span>
            </Link>
          </li>
          {courses.map((course) => (
            <li key={course.slug}>
              <Link href={`/academy/courses/${course.slug}`} onClick={close} className={mobileLink}>
                {course.title}
              </Link>
            </li>
          ))}
        </MobileGroup>
        <MobileGroup title="Company">
          {company.map((link) => (
            <li key={link.href}>
              <Link href={link.href} onClick={close} className={mobileLink}>
                {link.label}
              </Link>
            </li>
          ))}
        </MobileGroup>
        <MobileGroup title="Sign in">
          <li>
            {login ? (
              <a href={login} className={mobileLink}>
                <span className="font-semibold">Z-GATE Academy Online</span>
              </a>
            ) : (
              <span className={cx(mobileLink, "justify-between text-paper-dim")}>
                Z-GATE Academy Online
                <span className="font-mono text-xs">Opens soon</span>
              </span>
            )}
          </li>
        </MobileGroup>
        <MobileGroup title="Language">
          {LANGUAGES.map((language) => (
            <li
              key={language.code}
              aria-current={language.current ? "true" : undefined}
              className={cx(mobileLink, "justify-between", !language.current && "text-paper-dim")}
            >
              <span lang={language.code}>{language.name}</span>
              <span className="font-mono text-xs">
                {language.current ? "Current" : "Coming soon"}
              </span>
            </li>
          ))}
        </MobileGroup>
        <Link href="/contact" onClick={close} className={cx(button, "mt-4 w-full")}>
          Start Now
        </Link>
      </div>
    </div>
  );
}

// Never taller than the screen under the header: a long panel scrolls
// inside itself, and the scroll stops at its edges (overscroll-contain).
const panelShell =
  "absolute inset-x-0 top-full z-40 hidden max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-y border-line bg-ink shadow-[0_32px_80px_-24px_rgb(0_0_0/0.7)] nav:block";
const panelGrid =
  "mx-auto grid w-full max-w-[1200px] gap-8 px-6 py-10 nav:grid-cols-[1fr_1.4fr] wide:grid-cols-[1fr_1.6fr_1fr]";
const mobileLink =
  "flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 no-underline hover:bg-ink-2";

function MobileGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line py-3 last-of-type:border-b-0">
      <p className={cx(label, "mb-2 px-2")}>{title}</p>
      <ul className="grid list-none gap-1">{children}</ul>
    </div>
  );
}
