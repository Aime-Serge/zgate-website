// The CMS host is never something crawlers should index.
export const dynamic = "force-static";

export function GET() {
  return new Response("User-agent: *\nDisallow: /\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
