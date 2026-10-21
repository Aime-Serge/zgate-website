import type { RichTextHtml } from "@zgate/cms-contracts";

/**
 * Rich text from the CMS. It arrives as HTML the CMS has already cleaned
 * with an allowlist (backend/content/serializers.py: p, br, h2, h3,
 * strong, em, ul, ol, li, a[href] with http(s)/mailto/tel only), so it is
 * rendered as is. Styling comes from the `prose` wrapper around it.
 */
export function RichText({ html }: { html: RichTextHtml }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
