/**
 * Site search: a small index of everything published (services, solutions,
 * courses, articles, pages), built on the server from the same cached CMS
 * reads the pages use, and ranked in the browser as the visitor types.
 *
 * Deliberately not an AI chat or a third-party search service: the site
 * promises a real person replies (docs/WEBSITE.md), it ships no
 * third-party scripts, and a few dozen documents don't need either. When
 * nothing matches, the search page offers a person instead.
 */
import type { Article, Course, Division, Page } from "@zgate/cms-contracts";

export type SearchKind = "Service" | "Solution" | "Course" | "Insight" | "Page";

export type SearchEntry = {
  href: string;
  title: string;
  kind: SearchKind;
  summary: string;
  /** Everything searchable, normalised once on the server. */
  text: string;
};

type Sources = {
  pages: Page[];
  divisions: Division[];
  courses: Course[];
  articles: Article[];
};

/** Lowercase, without accents, punctuation as spaces: "Ré-check" -> "re check". */
export function normalise(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, " ")
    .trim();
}

const entry = (
  href: string,
  title: string,
  kind: SearchKind,
  summary: string | null | undefined,
  ...extra: (string | null | undefined)[]
): SearchEntry => ({
  href,
  title,
  kind,
  summary: summary ?? "",
  text: normalise([title, summary, ...extra].filter(Boolean).join(" ")),
});

export function buildSearchIndex({ pages, divisions, courses, articles }: Sources): SearchEntry[] {
  const solutions = pages.filter((page) => page.pageType === "solution");
  const others = pages.filter(
    (page) => page.pageType !== "solution" && page.slug !== "home" && page.slug !== "privacy",
  );
  return [
    ...divisions.map((d) =>
      entry(
        `/${d.slug}`,
        d.name,
        "Service",
        d.subtitle ? `${d.subtitle}. ${d.mission}` : d.mission,
        d.pillar,
        d.audience,
        ...d.included.map((i) => i.item),
        ...(d.commitments ?? []).map((c) => c.label),
        d.objection.question,
        ...(d.faq ?? []).map((q) => q.question),
      ),
    ),
    ...solutions.map((p) =>
      entry(`/solutions/${p.slug}`, p.title, "Solution", p.meta?.description, p.meta?.title),
    ),
    entry(
      "/demos",
      "Demo Library",
      "Page",
      "Short walkthroughs of how each service works, and a live walkthrough on request.",
      "demo video walkthrough see how it works",
    ),
    entry(
      "/academy/courses",
      "All courses",
      "Course",
      "Short, practical courses in tax, bookkeeping and EBM from Z-GATE Academy.",
      "training",
    ),
    ...courses.map((c) =>
      entry(
        `/academy/courses/${c.slug}`,
        c.title,
        "Course",
        c.summary || c.audience,
        c.audience,
        c.format,
        c.duration,
        "course training academy",
        ...(c.outcomes ?? []).map((o) => o.outcome),
      ),
    ),
    ...articles.map((a) =>
      entry(`/insights/${a.slug}`, a.title, "Insight", a.excerpt, a.meta?.description),
    ),
    ...others.map((p) => entry(`/${p.slug}`, p.title, "Page", p.meta?.description)),
  ];
}

const words = (text: string) => text.split(" ");

/**
 * Entries containing every word of the query (as a word or the start of
 * one, so "invoic" finds "invoicing"), best first: matches in the title
 * count most, then the summary, then the rest.
 */
export function searchIndex(index: SearchEntry[], query: string): SearchEntry[] {
  const terms = words(normalise(query)).filter(Boolean);
  if (terms.length === 0) return [];
  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const item of index) {
    const title = words(normalise(item.title));
    const summary = words(normalise(item.summary));
    const text = words(item.text);
    let score = 0;
    for (const term of terms) {
      const hit = (list: string[]) => list.some((word) => word.startsWith(term));
      if (!hit(text)) {
        score = 0;
        break;
      }
      score += hit(title) ? 5 : hit(summary) ? 2 : 1;
    }
    if (score > 0) scored.push({ entry: item, score });
  }
  // Array.prototype.sort is stable: equal scores keep the index's order.
  return scored.sort((a, b) => b.score - a.score).map(({ entry: found }) => found);
}

/** Words that carry no topic in a question ("how much is the EBM course?"). */
const STOPWORDS = new Set(
  "a an and are be can could do does for from get help how i in is it me my of on or our please should the there this to us we what when where which who why will with would you your about any have has need want much many tell know".split(
    " ",
  ),
);

/**
 * For a question in a visitor's own words: entries matching any of its
 * topic words, most matches first (title matches count most). Used by the
 * assistant's guided answers, where a whole sentence rarely matches word
 * for word.
 */
export function searchQuestion(index: SearchEntry[], question: string, limit = 3): SearchEntry[] {
  const terms = words(normalise(question)).filter(
    (term) => term.length > 1 && !STOPWORDS.has(term),
  );
  if (terms.length === 0) return [];
  const scored = index
    .map((item) => {
      const title = words(normalise(item.title));
      const text = words(item.text);
      let score = 0;
      for (const term of terms) {
        if (title.some((word) => word.startsWith(term))) score += 3;
        else if (text.some((word) => word.startsWith(term))) score += 1;
      }
      return { entry: item, score };
    })
    .filter(({ score }) => score > 0);
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry: found }) => found);
}
