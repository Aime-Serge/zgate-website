import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CmsError, getDivisionBySlug, getPageBySlug, toQueryString } from "@/lib/cms";

describe("toQueryString", () => {
  it("encodes nested where clauses the way Payload's REST API reads them", () => {
    const query = toQueryString({ where: { slug: { equals: "home" } }, limit: 1, draft: false });
    expect(decodeURIComponent(query)).toBe("where[slug][equals]=home&limit=1&draft=false");
  });

  it("skips undefined values and escapes the rest", () => {
    expect(toQueryString({ a: undefined, b: "x&y" })).toBe("b=x%26y");
  });
});

describe("CMS reads", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env["SITE_URL"] = "http://localhost:3002";
    process.env["CMS_URL"] = "http://cms.internal:3004";
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("asks for published content only, anonymously", async () => {
    fetchMock.mockResolvedValue(Response.json({ docs: [{ id: 1, slug: "about" }] }));
    expect(await getPageBySlug("about")).toEqual({ id: 1, slug: "about" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("http://cms.internal:3004/api/pages");
    expect(parsed.searchParams.get("draft")).toBe("false");
    expect(parsed.searchParams.get("where[slug][equals]")).toBe("about");
    expect(new Headers(init.headers).has("authorization")).toBe(false);
  });

  it("returns null when nothing matches", async () => {
    fetchMock.mockResolvedValue(Response.json({ docs: [] }));
    expect(await getPageBySlug("missing")).toBeNull();
  });

  it("never queries the division enum with an unknown slug", async () => {
    expect(await getDivisionBySlug("hacking")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails loudly when the CMS errors, so a broken page is never cached", async () => {
    fetchMock.mockResolvedValue(new Response("down", { status: 503 }));
    await expect(getPageBySlug("about-x")).rejects.toBeInstanceOf(CmsError);
  });
});
