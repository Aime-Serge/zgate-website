import { describe, expect, it } from "vitest";
import type { Article, Course, Division, Page } from "@zgate/cms-contracts";
import { buildSearchIndex, normalise, searchIndex, searchQuestion } from "./search";

const division = {
  id: 1,
  slug: "advisory",
  order: 1,
  name: "Z-GATE Advisory",
  shortName: "Advisory",
  subtitle: "Tax & Business Consulting",
  mission: "Keep a business compliant.",
  about: "",
  included: [{ item: "EBM (Electronic Billing Machine) setup" }],
  proof: "",
  commitments: [{ figure: "2 days", label: "VAT returns filed early" }],
  objection: { question: "Can I afford ongoing help?", answer: "" },
  cta: { label: "Request a consultation", href: "/contact" },
} satisfies Division;

const course = {
  id: 2,
  title: "EBM & Digital Invoicing Mastery",
  slug: "ebm-digital-invoicing",
  summary: "Leave able to issue a correct EBM receipt.",
  audience: "SME owners and staff",
} satisfies Course;

const page = (slug: string, pageType: Page["pageType"], description?: string): Page => ({
  id: slug.length,
  title: slug,
  slug,
  pageType,
  layout: [],
  meta: { description },
});

const article = {
  id: 3,
  title: "Five VAT mistakes",
  slug: "vat-mistakes",
  publishedOn: "2026-10-01",
  authorName: "Z-GATE",
  excerpt: "Common errors.",
  body: "",
} satisfies Article;

const index = buildSearchIndex({
  pages: [
    page("home", "marketing"),
    page("privacy", "legal"),
    page("about", "marketing", "Why one company"),
    page("traders-and-shops", "solution", "EBM and VAT for traders"),
  ],
  divisions: [division],
  courses: [course],
  articles: [article],
});

describe("buildSearchIndex", () => {
  it("gives each kind of content its own address", () => {
    expect(index.map((e) => [e.kind, e.href])).toEqual([
      ["Service", "/advisory"],
      ["Solution", "/solutions/traders-and-shops"],
      ["Page", "/demos"],
      ["Course", "/academy/courses"],
      ["Course", "/academy/courses/ebm-digital-invoicing"],
      ["Insight", "/insights/vat-mistakes"],
      ["Page", "/about"],
    ]);
  });
});

describe("searchIndex", () => {
  it("finds a word anywhere in what an entry covers", () => {
    expect(searchIndex(index, "afford").map((e) => e.href)).toEqual(["/advisory"]);
  });

  it("puts title matches first", () => {
    expect(searchIndex(index, "EBM")[0]?.href).toBe("/academy/courses/ebm-digital-invoicing");
  });

  it("matches the start of a word, ignoring case and accents", () => {
    expect(searchIndex(index, "INVOÏC").map((e) => e.href)).toEqual([
      "/academy/courses/ebm-digital-invoicing",
    ]);
  });

  it("needs every word of the query", () => {
    expect(searchIndex(index, "vat traders").map((e) => e.href)).toEqual([
      "/solutions/traders-and-shops",
    ]);
  });

  it("returns nothing for an empty or unmatched query", () => {
    expect(searchIndex(index, "  ")).toEqual([]);
    expect(searchIndex(index, "payroll")).toEqual([]);
  });
});

describe("searchQuestion", () => {
  it("answers a whole sentence by its topic words", () => {
    const hrefs = searchQuestion(index, "How much is the EBM course?").map((e) => e.href);
    expect(hrefs.slice(0, 2)).toContain("/academy/courses/ebm-digital-invoicing");
    expect(hrefs).not.toContain("/about");
  });

  it("finds nothing in a sentence with no topic", () => {
    expect(searchQuestion(index, "hi, can you help me?")).toEqual([]);
  });

  it("returns at most the limit", () => {
    expect(searchQuestion(index, "ebm vat traders", 2)).toHaveLength(2);
  });
});

describe("normalise", () => {
  it("drops accents and punctuation", () => {
    expect(normalise("Ré-check: VAT!")).toBe("re check vat");
  });
});
