import { RichText } from "@payloadcms/richtext-lexical/react";
import Link from "next/link";
import type { Article } from "@zgate/website-backend/contracts";

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const articlePath = (article: Pick<Article, "slug">) => `/insights/${article.slug}`;

export function InsightsView({ articles }: { articles: Article[] }) {
  return (
    <>
      <section className="max block block--hero">
        <h1>Insights</h1>
      </section>
      <section className="max block">
        <ul className="article-list">
          {articles.map((article) => (
            <li key={article.id}>
              <article>
                <h2>
                  <Link href={articlePath(article)}>{article.title}</Link>
                </h2>
                <p className="muted">
                  <time dateTime={article.publishedOn}>
                    {dayFormat.format(new Date(article.publishedOn))}
                  </time>{" "}
                  · {article.authorName}
                </p>
                <p>{article.excerpt}</p>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export function ArticleView({ article }: { article: Article }) {
  return (
    <article className="max block prose">
      <p className="eyebrow">
        <Link href="/insights">Insights</Link>
      </p>
      <h1>{article.title}</h1>
      <p className="muted">
        <time dateTime={article.publishedOn}>
          {dayFormat.format(new Date(article.publishedOn))}
        </time>{" "}
        · {article.authorName}
      </p>
      <RichText data={article.body} />
    </article>
  );
}
