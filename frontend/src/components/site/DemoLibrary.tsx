"use client";

import Link from "next/link";
import type React from "react";
import { useId, useMemo, useState, useSyncExternalStore } from "react";
import { GateMark } from "@/components/brand/GateMark";
import { ArrowLeft, ArrowRight, ChevronDown, Search } from "@/components/ui/icons";
import { buttonSmall, buttonSmallSecondary, cx } from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";
import type { Demo } from "@zgate/cms-contracts";

const PAGE_SIZE = 6;
const SAVED_KEY = "zgate-saved-demos";
/** Options shown per filter group before "Load more". */
const SHOWN_OPTIONS = 5;

const DIVISION_NAMES: Record<Demo["division"], string> = {
  advisory: "Advisory",
  academy: "Academy",
  tech: "Tech",
  data: "Data",
  bundle: "All four teams",
};
const FORMAT_NAMES: Record<Demo["format"], string> = {
  video: "Video walkthrough",
  tour: "Guided tour",
  live: "Live walkthrough",
};

const DIVISION_ORDER = ["advisory", "academy", "tech", "data", "bundle"];
const FORMAT_ORDER = ["video", "tour", "live"];

/**
 * Wide enough for the sidebar beside the results (the `nav` breakpoint).
 * On phones the filter groups start closed, so the demos come first.
 */
const WIDE = "(min-width: 56.25rem)";
function subscribeWide(notify: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}
const isWide = () => window.matchMedia(WIDE).matches;

type Option = { value: string; label: string };
type Filters = { divisions: string[]; audiences: string[]; formats: string[]; saved: boolean };
const NO_FILTERS: Filters = { divisions: [], audiences: [], formats: [], saved: false };

/**
 * Saved demos: this browser only (a per-visitor convenience, never
 * required). A tiny store read with useSyncExternalStore: it follows other
 * tabs ("storage" events), and when storage is blocked (private window) it
 * keeps the list in memory for this visit.
 */
let savedFallback = "[]";
const savedListeners = new Set<() => void>();
function subscribeSaved(notify: () => void) {
  savedListeners.add(notify);
  window.addEventListener("storage", notify);
  return () => {
    savedListeners.delete(notify);
    window.removeEventListener("storage", notify);
  };
}
function savedSnapshot(): string {
  try {
    return window.localStorage.getItem(SAVED_KEY) ?? savedFallback;
  } catch {
    return savedFallback;
  }
}
function writeSaved(slugs: string[]) {
  savedFallback = JSON.stringify(slugs);
  try {
    window.localStorage.setItem(SAVED_KEY, savedFallback);
  } catch {
    // Blocked storage: the in-memory copy above is used instead.
  }
  for (const notify of savedListeners) notify();
}
function parseSaved(raw: string): string[] {
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/**
 * The Demo Library (ServiceNow's pattern, Z-GATE's services): search, filter
 * by service, kind of business and format, sort, save and page through the
 * demos. A demo without a video is a placeholder: "Coming soon", with a
 * live walkthrough to ask for instead.
 *
 * Without JavaScript the filters are hidden (they need it) and every card
 * shows, unpaged (globals.css, [data-page-hidden]).
 */
export function DemoLibrary({ demos }: { demos: Demo[] }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [sort, setSort] = useState<"newest" | "az">("newest");
  const [page, setPage] = useState(1);
  const savedRaw = useSyncExternalStore(subscribeSaved, savedSnapshot, () => "[]");
  const saved = useMemo(() => parseSaved(savedRaw), [savedRaw]);

  const toggleSaved = (slug: string) =>
    writeSaved(saved.includes(slug) ? saved.filter((s) => s !== slug) : [...saved, slug]);

  const groups = useMemo(() => {
    const unique = (options: Option[]) =>
      options.filter((o, i) => options.findIndex((x) => x.value === o.value) === i);
    return {
      // Fixed orders, so the filters read the same however demos are sorted.
      divisions: unique(
        demos.map((d) => ({ value: d.division, label: DIVISION_NAMES[d.division] })),
      ).sort((a, b) => DIVISION_ORDER.indexOf(a.value) - DIVISION_ORDER.indexOf(b.value)),
      audiences: unique(
        demos.flatMap((d) => d.audiences.map((a) => ({ value: a.slug, label: a.title }))),
      ),
      formats: unique(demos.map((d) => ({ value: d.format, label: FORMAT_NAMES[d.format] }))).sort(
        (a, b) => FORMAT_ORDER.indexOf(a.value) - FORMAT_ORDER.indexOf(b.value),
      ),
    };
  }, [demos]);

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const found = demos.filter((d) => {
      const text = `${d.title} ${d.summary} ${DIVISION_NAMES[d.division]} ${d.audiences
        .map((a) => a.title)
        .join(" ")}`.toLowerCase();
      return (
        words.every((w) => text.includes(w)) &&
        (filters.divisions.length === 0 || filters.divisions.includes(d.division)) &&
        (filters.audiences.length === 0 ||
          d.audiences.some((a) => filters.audiences.includes(a.slug))) &&
        (filters.formats.length === 0 || filters.formats.includes(d.format)) &&
        (!filters.saved || saved.includes(d.slug))
      );
    });
    return sort === "az" ? [...found].sort((a, b) => a.title.localeCompare(b.title)) : found;
  }, [demos, query, filters, sort, saved]);

  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const active =
    query.trim() !== "" ||
    filters.saved ||
    filters.divisions.length + filters.audiences.length + filters.formats.length > 0;

  const toggle = (group: keyof Omit<Filters, "saved">, value: string) => {
    setFilters((f) => ({
      ...f,
      [group]: f[group].includes(value)
        ? f[group].filter((v) => v !== value)
        : [...f[group], value],
    }));
    setPage(1);
  };

  return (
    <div className="grid gap-10 nav:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] nav:gap-12">
      {/* ------------------------------------------------ search and filters */}
      <aside
        aria-label="Search and filter demos"
        className="grid content-start gap-6"
        data-needs-js
      >
        <form role="search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor={`${id}-q`} className="sr-only">
            Search demos
          </label>
          <div className="relative">
            <input
              id={`${id}-q`}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by keyword or service"
              className="min-h-14 w-full rounded-full border border-paper-dim bg-paper px-6 pr-12 text-ink placeholder:text-ink/60 focus-visible:border-gate-2"
            />
            <Search className="pointer-events-none absolute top-1/2 right-5 size-5 -translate-y-1/2 text-ink" />
          </div>
        </form>
        <FilterGroup
          title="Services"
          options={groups.divisions}
          chosen={filters.divisions}
          onToggle={(v) => toggle("divisions", v)}
        />
        <FilterGroup
          title="Kind of business"
          options={groups.audiences}
          chosen={filters.audiences}
          onToggle={(v) => toggle("audiences", v)}
        />
        <FilterGroup
          title="Format"
          options={groups.formats}
          chosen={filters.formats}
          onToggle={(v) => toggle("formats", v)}
        />
        <label className="flex min-h-11 cursor-pointer items-center gap-3 border-t border-line pt-6 text-lg">
          <input
            type="checkbox"
            checked={filters.saved}
            onChange={() => {
              setFilters((f) => ({ ...f, saved: !f.saved }));
              setPage(1);
            }}
            className="size-6 accent-gate-1"
          />
          Saved demos ({saved.length})
        </label>
      </aside>

      {/* ------------------------------------------------------- results */}
      <div className="grid content-start gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4" data-needs-js>
          <p role="status" className="font-display text-2xl font-bold">
            Showing {results.length} {results.length === 1 ? "result" : "results"}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {active ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilters(NO_FILTERS);
                  setPage(1);
                }}
                className="min-h-11 cursor-pointer rounded-full px-3 font-semibold text-gate-2 underline underline-offset-4"
              >
                Clear all
              </button>
            ) : null}
            <label htmlFor={`${id}-sort`} className="sr-only">
              Sort by
            </label>
            <select
              id={`${id}-sort`}
              value={sort}
              onChange={(e) => setSort(e.target.value as "newest" | "az")}
              className="min-h-12 rounded-full border border-paper-dim bg-paper px-5 text-ink"
            >
              <option value="newest">Sort by: Newest</option>
              <option value="az">Sort by: A–Z</option>
            </select>
          </div>
        </div>

        {results.length > 0 ? (
          <ul className="grid list-none gap-6 md:grid-cols-2">
            {results.map((demo, index) => (
              <li
                key={demo.slug}
                // Off this page: hidden with JavaScript; without it every card shows.
                data-page-hidden={
                  index < (current - 1) * PAGE_SIZE || index >= current * PAGE_SIZE ? "" : undefined
                }
              >
                <DemoCard
                  demo={demo}
                  saved={saved.includes(demo.slug)}
                  onSave={() => toggleSaved(demo.slug)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid justify-items-start gap-3 rounded-2xl border border-line bg-ink-2 p-8">
            <p className="font-display text-xl font-bold">No demos match that yet.</p>
            <p className="text-paper-dim">
              Tell us what you&rsquo;d like to see, and a person will walk you through it.
            </p>
            <Link href="/contact?intent=demo" className={buttonSmall}>
              Ask for a walkthrough
            </Link>
          </div>
        )}

        {pages > 1 ? (
          <nav
            aria-label="Demo pages"
            className="flex items-center justify-center gap-2"
            data-needs-js
          >
            <button
              type="button"
              aria-label="Previous page"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
              className={pageButton}
            >
              <ArrowLeft className="size-5" />
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`Page ${n}`}
                aria-current={n === current ? "page" : undefined}
                onClick={() => setPage(n)}
                className={cx(pageButton, n === current && "bg-paper font-bold text-ink")}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next page"
              disabled={current === pages}
              onClick={() => setPage(current + 1)}
              className={pageButton}
            >
              <ArrowRight className="size-5" />
            </button>
          </nav>
        ) : null}
      </div>
    </div>
  );
}

const pageButton =
  "inline-flex size-12 cursor-pointer items-center justify-center rounded-full border border-transparent bg-transparent font-semibold text-paper transition-colors hover:border-line disabled:cursor-default disabled:opacity-40";

function FilterGroup({
  title,
  options,
  chosen,
  onToggle,
}: {
  title: string;
  options: Option[];
  chosen: string[];
  onToggle: (value: string) => void;
}) {
  const id = useId();
  const wide = useSyncExternalStore(subscribeWide, isWide, () => true);
  // null until the visitor opens or closes it: then their choice wins.
  const [chosenOpen, setOpen] = useState<boolean | null>(null);
  const open = chosenOpen ?? wide;
  const [all, setAll] = useState(false);
  if (options.length === 0) return null;
  const shown = all ? options : options.slice(0, SHOWN_OPTIONS);
  return (
    <div className="border-t border-line pt-6">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        onClick={() => setOpen(!open)}
        className="flex min-h-11 w-full cursor-pointer items-center justify-between bg-transparent font-display text-2xl font-bold text-paper"
      >
        {title}
        <ChevronDown className={cx("size-6 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div id={`${id}-options`} className="mt-3">
          <ul className="grid list-none gap-1">
            {shown.map((option) => (
              <li key={option.value}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-lg">
                  <input
                    type="checkbox"
                    checked={chosen.includes(option.value)}
                    onChange={() => onToggle(option.value)}
                    className="size-6 shrink-0 accent-gate-1"
                  />
                  {option.label}
                </label>
              </li>
            ))}
          </ul>
          {options.length > SHOWN_OPTIONS ? (
            <button
              type="button"
              onClick={() => setAll(!all)}
              className="mt-2 min-h-11 cursor-pointer bg-transparent text-lg font-semibold text-gate-2"
            >
              {all ? "Show less" : "Load more"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * One demo: a screen-like thumbnail in the division's colour, then what it
 * shows and the next step. A recorded demo plays (opens its video); a
 * placeholder says "Coming soon" and offers a live walkthrough instead.
 */
function DemoCard({ demo, saved, onSave }: { demo: Demo; saved: boolean; onSave: () => void }) {
  const division = demo.division === "bundle" ? undefined : demo.division;
  const walkthrough = `/contact?intent=demo&topic=${encodeURIComponent(demo.title)}`;
  return (
    <article
      className={cx(
        tone(demo.division),
        "flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-ink-2",
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-[linear-gradient(135deg,var(--glow-strong),var(--color-ink-2)_70%)]">
        <Thumbnail division={division} />
        <button
          type="button"
          onClick={onSave}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${demo.title} from saved demos` : `Save ${demo.title}`}
          className={cx(
            "absolute top-3 right-3 inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-0 transition-colors",
            saved ? "bg-paper text-ink" : "bg-ink/85 text-paper hover:bg-ink",
          )}
          data-needs-js
        >
          <Bookmark filled={saved} />
        </button>
        {demo.videoUrl ? (
          <>
            <a
              href={demo.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch ${demo.title} (opens in a new tab)`}
              className="absolute inset-0 m-auto inline-flex size-16 items-center justify-center rounded-full bg-ink text-paper shadow-lg transition-transform hover:scale-105"
            >
              <PlayIcon />
            </a>
            {demo.duration ? (
              <span className="absolute right-3 bottom-3 rounded-lg bg-ink px-3 py-1.5 font-mono text-xs font-semibold tracking-[0.06em] text-paper uppercase">
                {demo.duration}
              </span>
            ) : null}
          </>
        ) : (
          <span className="absolute right-3 bottom-3 rounded-lg bg-ink px-3 py-1.5 font-mono text-xs font-semibold tracking-[0.06em] text-paper uppercase">
            Coming soon
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <p className="font-mono text-xs tracking-[0.12em] text-accent uppercase">
          {DIVISION_NAMES[demo.division]} · {FORMAT_NAMES[demo.format]}
        </p>
        <h3 className="text-xl leading-[1.25] font-bold">{demo.title}</h3>
        <p className="text-paper-dim">{demo.summary}</p>
        <div className="mt-auto flex flex-wrap gap-3 pt-2">
          {demo.videoUrl ? (
            <a
              href={demo.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonSmall}
            >
              Watch
            </a>
          ) : null}
          <Link
            href={walkthrough}
            className={demo.videoUrl ? buttonSmallSecondary : buttonSmall}
            aria-label={`Request a live walkthrough: ${demo.title}`}
          >
            Request a live walkthrough
          </Link>
        </div>
      </div>
    </article>
  );
}

/** A stylised screen in the division's colour: the demo's poster until a real one exists. */
function Thumbnail({ division }: { division?: Exclude<Demo["division"], "bundle"> }) {
  const bar = "h-2 rounded-full bg-paper/15";
  return (
    <div aria-hidden="true" className="absolute inset-0 p-5">
      <div className="flex h-full flex-col gap-3 rounded-xl border border-paper/10 bg-ink/50 p-4">
        <div className="flex items-center gap-2">
          <GateMark division={division} className="w-5" />
          <span className={cx(bar, "w-24")} />
        </div>
        <div className="grid flex-1 grid-cols-3 gap-2">
          <span className="rounded-lg bg-[var(--glow-strong)]" />
          <span className="rounded-lg bg-paper/8" />
          <span className="rounded-lg bg-paper/8" />
        </div>
        <div className="grid gap-1.5">
          <span className={cx(bar, "w-3/4")} />
          <span className={cx(bar, "w-1/2")} />
        </div>
      </div>
    </div>
  );
}

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="ml-1 size-7 fill-current">
    <path d="M7 4.5v15l12.5-7.5z" />
  </svg>
);

const Bookmark = ({ filled }: { filled: boolean }): React.JSX.Element => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="size-5"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinejoin="round"
  >
    <path d="M6.5 4h11v16l-5.5-4-5.5 4z" />
  </svg>
);
