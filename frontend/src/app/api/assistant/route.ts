/**
 * The website assistant (components/site/Assistant.tsx): POST a short
 * conversation, get a reply and the site pages it points to.
 *
 * Two modes:
 *  - "ai": Claude answers from the website's own content (lib/assistant).
 *    Only when ANTHROPIC_API_KEY is set: visitors' questions then leave
 *    this server for the AI provider, which the privacy notice must cover
 *    first (docs/SECURITY.md).
 *  - "guided": no AI. The question is matched against the site's pages and
 *    the best ones are offered, with a person as the next step. Also the
 *    fallback whenever the AI is unavailable.
 *
 * Nothing a visitor types is stored or logged.
 */
import { z } from "zod";
import { askClaude } from "@/lib/assistant/claude";
import { buildKnowledge } from "@/lib/assistant/knowledge";
import type { AssistantReply } from "@/lib/assistant/types";
import {
  getSiteSettings,
  listArticles,
  listCourses,
  listDivisions,
  listPages,
  listSolutions,
} from "@/lib/cms";
import { learningPlatform } from "@/lib/courses";
import { env } from "@/lib/env";
import { clientIp } from "@/lib/leads/clientIp";
import { RateLimiter } from "@/lib/leads/rateLimit";
import { buildSearchIndex, type SearchEntry, searchQuestion } from "@/lib/search";

export const dynamic = "force-dynamic";

// A conversation, not a crawler: 20 messages per visitor per 10 minutes,
// and a site-wide ceiling that caps what the AI can cost in an hour.
const perVisitor = new RateLimiter(20, 10 * 60 * 1000);
const siteWide = new RateLimiter(600, 60 * 60 * 1000);

const turn = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(1000),
});
const body = z.object({
  // The last 12 turns are plenty of context for site questions.
  messages: z
    .array(turn)
    .min(1)
    .max(12)
    .refine((list) => list.at(-1)?.role === "user", "The last message must be the visitor's"),
});

const json = (data: AssistantReply | { error: string }, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

/** Site pages a reply mentions by address (e.g. "/advisory"), in order, at most three. */
function linksIn(reply: string, index: SearchEntry[]): AssistantReply["links"] {
  const byHref = new Map(index.map((entry) => [entry.href, entry.title]));
  const found: AssistantReply["links"] = [];
  for (const [path] of reply.matchAll(/\/[a-z0-9][a-z0-9/-]*/g)) {
    const href = path.replace(/\/$/, "");
    const title = byHref.get(href);
    if (title && !found.some((link) => link.href === href)) found.push({ title, href });
    if (found.length === 3) break;
  }
  return found;
}

function guided(question: string, index: SearchEntry[]): AssistantReply {
  const matches = searchQuestion(index, question);
  return matches.length > 0
    ? {
        reply: "Here's what I found on our website. A person can also answer directly.",
        links: matches.map((entry) => ({ title: entry.title, href: entry.href })),
        mode: "guided",
      }
    : {
        reply:
          "I couldn't find that on our website. Try a topic like EBM, VAT, bookkeeping, courses or dashboards, or ask a person: they reply on the contact form and WhatsApp.",
        links: [],
        mode: "guided",
      };
}

export async function POST(request: Request) {
  const config = env();
  // Only the website's own pages may call this (no cross-site use of the AI).
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(config.SITE_URL).origin) {
    return json({ error: "forbidden" }, 403);
  }

  const ip = clientIp(request.headers.get("x-forwarded-for"), config.TRUSTED_PROXIES);
  if (!perVisitor.attempt(ip) || !siteWide.attempt("all")) {
    return json({ error: "Too many questions at once. Please try again in a few minutes." }, 429);
  }

  let parsed: z.infer<typeof body>;
  try {
    parsed = body.parse(await request.json());
  } catch {
    return json({ error: "That message couldn't be read." }, 400);
  }

  const [settings, divisions, solutions, courses, articles, pages] = await Promise.all([
    getSiteSettings(),
    listDivisions(),
    listSolutions(),
    listCourses(),
    listArticles(),
    listPages(),
  ]);
  const index = buildSearchIndex({ pages, divisions, courses, articles });
  const question = parsed.messages.at(-1)?.content ?? "";

  if (config.ANTHROPIC_API_KEY) {
    const knowledge = buildKnowledge({
      settings,
      divisions,
      solutions,
      courses,
      articles,
      enrollmentOpen: learningPlatform(settings) !== null,
    });
    const reply = await askClaude({
      apiKey: config.ANTHROPIC_API_KEY,
      model: config.ASSISTANT_MODEL,
      knowledge,
      conversation: parsed.messages,
    });
    if (reply) return json({ reply, links: linksIn(reply, index), mode: "ai" });
  }
  return json(guided(question, index));
}
