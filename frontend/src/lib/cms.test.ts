import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CmsError, findRedirect, getDivisionBySlug, getPageBySlug, listCourses } from "@/lib/cms";

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

  it("reads a page by slug, with no credentials when no API token is set", async () => {
    fetchMock.mockResolvedValue(Response.json({ id: 1, slug: "about" }));
    expect(await getPageBySlug("about")).toEqual({ id: 1, slug: "about" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://cms.internal:3004/api/pages/about");
    expect(new Headers(init.headers).has("authorization")).toBe(false);
  });

  it("presents the API token when one is set", async () => {
    const token = "a".repeat(32);
    process.env["CMS_API_TOKEN"] = token;
    vi.resetModules(); // env() is read once per process
    try {
      const cms = await import("@/lib/cms");
      fetchMock.mockResolvedValue(Response.json({ id: 1, slug: "about" }));
      await cms.getPageBySlug("about");
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(new Headers(init.headers).get("authorization")).toBe(`Bearer ${token}`);
    } finally {
      delete process.env["CMS_API_TOKEN"];
    }
  });

  it("returns null when the CMS has no published document", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: "not found" }, { status: 404 }));
    expect(await getPageBySlug("missing")).toBeNull();
  });

  it("unwraps lists", async () => {
    fetchMock.mockResolvedValue(Response.json({ docs: [{ id: 1, slug: "a1" }] }));
    expect(await listCourses()).toEqual([{ id: 1, slug: "a1" }]);
  });

  it("escapes what it puts in a URL", async () => {
    fetchMock.mockResolvedValue(Response.json({}, { status: 404 }));
    await getPageBySlug("../admin");
    await findRedirect("/old page?x=1");
    const urls = fetchMock.mock.calls.map((call) => call[0] as string);
    expect(urls[0]).toBe("http://cms.internal:3004/api/pages/..%2Fadmin");
    expect(urls[1]).toBe("http://cms.internal:3004/api/redirects?from=%2Fold%20page%3Fx%3D1");
  });

  it("never asks for an unknown division", async () => {
    expect(await getDivisionBySlug("hacking")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails loudly when the CMS errors, so a broken page is never cached", async () => {
    fetchMock.mockResolvedValue(new Response("down", { status: 503 }));
    await expect(getPageBySlug("about-x")).rejects.toBeInstanceOf(CmsError);
  });
});
