import { RichText } from "@payloadcms/richtext-lexical/react";
import Link from "next/link";
import type { Article } from "@zgate/cms-contracts";

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const articlePath = (article: Pick<Article, "slug">) => `/insights/${article.slug}`;

export function InsightsView({ articles }: { articles: Article[] }) {
  return (
    <>
      <section className="hero">
        <div className="max">
          <p className="eyebrow">Plain-language explainers</p>
          <h1>Insights</h1>
        </div>
      </section>
      <section className="block">
        <div className="max">
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
        </div>
      </section>
    </>
  );
}

export function ArticleView({ article }: { article: Article }) {
  return (
    <article className="max block prose article">
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
