/**
 * What the website assistant knows: the site's own published content,
 * written out as plain text with each page's address. Built from the same
 * cached CMS reads the pages use, so the assistant can never know (or
 * claim) anything the website itself doesn't say.
 */
import type { Article, Course, Division, Page, SiteSetting } from "@zgate/cms-contracts";
import { coursePath, formatPrice, nextIntake } from "@/lib/courses";

type Sources = {
  settings: SiteSetting;
  divisions: Division[];
  solutions: Page[];
  courses: Course[];
  articles: Article[];
  enrollmentOpen: boolean;
};

const lines = (...items: (string | null | undefined | false)[]) => items.filter(Boolean).join("\n");

export function buildKnowledge({
  settings,
  divisions,
  solutions,
  courses,
  articles,
  enrollmentOpen,
}: Sources): string {
  const company = lines(
    `# ${settings.tradingName} (${settings.legalName})`,
    `Motto: ${settings.motto}`,
    settings.boilerplate || settings.elevatorPitch,
    ...(settings.companyFacts ?? []).map((entry) => `- ${entry.fact}`),
    `Address: ${settings.address}`,
    `Phone: ${settings.phone}. WhatsApp: ${settings.whatsapp || settings.phone}. Email: ${settings.email}.`,
    settings.responseTimeCommitment ? `Reply time: ${settings.responseTimeCommitment}` : null,
    "Contact form: /contact (a person replies). Search: /search. About: /about.",
  );

  const services = divisions.map((d) =>
    lines(
      `## ${d.name}: ${d.subtitle ?? ""} (page: /${d.slug})`,
      d.mission,
      d.audience ? `For: ${d.audience}` : null,
      "Included:",
      ...d.included.map((i) => `- ${i.item}`),
      (d.commitments ?? []).length > 0 ? "Written commitments (targets, not past results):" : null,
      ...(d.commitments ?? []).map((c) => `- ${c.figure}: ${c.label}`),
      `Q: ${d.objection.question} A: ${d.objection.answer}`,
      ...(d.faq ?? []).map((q) => `Q: ${q.question} A: ${q.answer}`),
    ),
  );

  const solutionLines = solutions.map(
    (p) => `- ${p.title} (page: /solutions/${p.slug}): ${p.meta?.description ?? ""}`,
  );

  const courseLines = courses.map((c) =>
    lines(
      `## Course: ${c.title} (page: ${coursePath(c)})`,
      c.summary,
      `For: ${c.audience}`,
      c.format ? `Format: ${c.format}` : null,
      c.duration ? `Duration: ${c.duration}` : null,
      formatPrice(c) ? `Fee: ${formatPrice(c)}` : null,
      `Next intake: ${nextIntake(c)}`,
      ...(c.outcomes ?? []).map((o) => `- Outcome: ${o.outcome}`),
    ),
  );

  const articleLines = articles.map(
    (a) => `- ${a.title} (page: /insights/${a.slug}): ${a.excerpt}`,
  );

  return lines(
    company,
    "",
    "# Services (four divisions)",
    ...services,
    "",
    solutionLines.length > 0 ? "# Solutions by kind of business" : null,
    ...solutionLines,
    "",
    "# Z-GATE Academy courses",
    enrollmentOpen
      ? "Registration is open on Z-GATE Academy Online: each course page links to enrollment."
      : "Registration is not open yet. Visitors join a course's waitlist on its page (the #enroll section) and are told when they can sign up.",
    ...courseLines,
    "",
    articleLines.length > 0 ? "# Insights articles" : null,
    ...articleLines,
  );
}
