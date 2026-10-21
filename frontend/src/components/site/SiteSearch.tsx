"use client";

import Link from "next/link";
import { useId, useState, useSyncExternalStore } from "react";
import { ArrowRight } from "@/components/ui/icons";
import { arrowLink, button, buttonSecondary, card, cx, label } from "@/components/ui/styles";
import { searchIndex, type SearchEntry, type SearchKind } from "@/lib/search";

type Props = {
  index: SearchEntry[];
  /** Example searches, shown before the visitor types. */
  suggestions: string[];
  whatsapp: string;
};

const GROUPS: { kind: SearchKind; title: string }[] = [
  { kind: "Service", title: "Services" },
  { kind: "Solution", title: "Solutions" },
  { kind: "Course", title: "Courses" },
  { kind: "Insight", title: "Insights" },
  { kind: "Page", title: "Company" },
];

const onPopState = (notify: () => void) => {
  window.addEventListener("popstate", notify);
  return () => window.removeEventListener("popstate", notify);
};
/**
 * The query is read from the address in the browser, never on the server:
 * that keeps /search a cached page (docs/DEVELOPER_GUIDE.md, "Keep pages
 * cached"). Without JavaScript the form still submits, and the page lists
 * everything on the site instead of filtering it.
 */
const queryFromUrl = () => new URLSearchParams(window.location.search).get("q") ?? "";

function Result({ entry }: { entry: SearchEntry }) {
  return (
    <li>
      <Link href={entry.href} className={cx(card, "group grid gap-2 p-5 no-underline")}>
        <span className={label}>{entry.kind}</span>
        <span className="font-display text-lg font-bold group-hover:text-gate-2">
          {entry.title}
        </span>
        {entry.summary ? <span className="text-paper-dim">{entry.summary}</span> : null}
      </Link>
    </li>
  );
}

export function SiteSearch({ index, suggestions, whatsapp }: Props) {
  const id = useId();
  const fromUrl = useSyncExternalStore(onPopState, queryFromUrl, () => "");
  // Null until the visitor types: until then the address decides.
  const [typed, setTyped] = useState<string | null>(null);
  const query = typed ?? fromUrl;
  const trimmed = query.trim();
  const results = searchIndex(index, trimmed);

  const update = (value: string) => {
    setTyped(value);
    const address = value.trim() ? `?q=${encodeURIComponent(value.trim())}` : "";
    window.history.replaceState(null, "", `${window.location.pathname}${address}`);
  };

  return (
    <div className="grid gap-10">
      <form
        role="search"
        action="/search"
        method="get"
        className="grid gap-3"
        onSubmit={(event) => {
          // Results already follow the typing; Enter just closes a phone's keyboard.
          event.preventDefault();
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        }}
      >
        <label htmlFor={`${id}-q`} className="font-display text-xl font-bold">
          What are you looking for?
        </label>
        <div className="flex flex-wrap gap-3">
          <input
            id={`${id}-q`}
            type="search"
            name="q"
            value={query}
            onChange={(event) => update(event.target.value)}
            autoComplete="off"
            enterKeyHint="search"
            placeholder="EBM, VAT returns, a course, dashboards…"
            className="min-h-12 min-w-0 flex-[1_1_16rem] rounded-full border border-paper-dim bg-ink-2 px-5 text-paper placeholder:text-paper-dim focus-visible:border-gate-2"
          />
          <button type="submit" className={button}>
            Search
          </button>
        </div>
        {suggestions.length > 0 ? (
          <p className="flex flex-wrap items-center gap-2 text-sm text-paper-dim">
            <span>Try:</span>
            {suggestions.map((term) => (
              <a
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                onClick={(event) => {
                  event.preventDefault();
                  update(term);
                }}
                className="inline-flex min-h-8 items-center rounded-full border border-line px-3 text-paper no-underline hover:border-gate-2"
              >
                {term}
              </a>
            ))}
          </p>
        ) : null}
      </form>

      {/* Announced as the list changes, so a screen reader hears the count. */}
      <p role="status" className={cx(label, !trimmed && "sr-only")}>
        {trimmed
          ? `${results.length} ${results.length === 1 ? "result" : "results"} for “${trimmed}”`
          : ""}
      </p>

      {trimmed ? (
        results.length > 0 ? (
          <ul className="grid list-none gap-3">
            {results.map((entry) => (
              <Result key={entry.href} entry={entry} />
            ))}
          </ul>
        ) : (
          <div className={cx(card, "grid gap-4 p-6 sm:p-8")}>
            <p className="font-display text-xl font-bold">Nothing on the site matches that yet.</p>
            <p className="max-w-[60ch] text-paper-dim">
              Ask us instead: a person reads every message and points you to the right team.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className={button}>
                Start Now
              </Link>
              <a href={whatsapp} className={buttonSecondary}>
                WhatsApp us
              </a>
            </div>
          </div>
        )
      ) : (
        <div className="grid gap-10 md:grid-cols-2">
          {GROUPS.map(({ kind, title }) => {
            const entries = index.filter((entry) => entry.kind === kind);
            if (entries.length === 0) return null;
            return (
              <section key={kind} aria-labelledby={`${id}-${kind}`}>
                <h2 id={`${id}-${kind}`} className={cx(label, "mb-3")}>
                  {title}
                </h2>
                <ul className="grid list-none gap-1">
                  {entries.map((entry) => (
                    <li key={entry.href}>
                      <Link
                        href={entry.href}
                        className={cx(arrowLink, "group min-h-11 py-1 hover:text-gate-2")}
                      >
                        {entry.title}
                        <ArrowRight className="size-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
