import { RichText } from "./RichText";
import Link from "next/link";
import type { Article } from "@zgate/cms-contracts";
import {
  container,
  cx,
  eyebrow,
  hero,
  heroHeading,
  prose,
  roomHeading,
  section,
  sectionRule,
} from "@/components/ui/styles";

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const articlePath = (article: Pick<Article, "slug">) => `/insights/${article.slug}`;

export function InsightsView({ articles }: { articles: Article[] }) {
  return (
    <>
      <section className={hero}>
        <div className={container}>
          <p className={eyebrow}>Plain-language explainers</p>
          <h1 className={heroHeading}>Insights</h1>
        </div>
      </section>
      <section className={cx(section, sectionRule)}>
        <div className={container}>
          <ul className="grid list-none gap-8">
            {articles.map((article) => (
              <li key={article.id}>
                <article>
                  <h2 className="text-2xl">
                    <Link href={articlePath(article)} className="underline underline-offset-4">
                      {article.title}
                    </Link>
                  </h2>
                  <p className="mt-1 text-paper-dim">
                    <time dateTime={article.publishedOn}>
                      {dayFormat.format(new Date(article.publishedOn))}
                    </time>{" "}
                    · {article.authorName}
                  </p>
                  <p className="mt-2">{article.excerpt}</p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

export function ArticleView({ article }: { article: Article }) {
  return (
    <article className={cx(container, section)}>
      <p className={eyebrow}>
        <Link href="/insights" className="underline underline-offset-2">
          Insights
        </Link>
      </p>
      <h1 className={roomHeading}>{article.title}</h1>
      <p className="mb-8 text-paper-dim">
        <time dateTime={article.publishedOn}>
          {dayFormat.format(new Date(article.publishedOn))}
        </time>{" "}
        · {article.authorName}
      </p>
      <div className={prose}>
        <RichText html={article.body} />
      </div>
    </article>
  );
}
