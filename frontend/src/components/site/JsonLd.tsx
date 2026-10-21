/**
 * schema.org markup for search engines. Not executed by the browser, so
 * the CSP doesn't apply; the JSON is escaped for "<" so CMS text can never
 * close the script tag.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
