import { signRevalidation } from "@zgate/website-backend/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

const secret = "r".repeat(32);
const body = JSON.stringify({ event: "content-changed", source: "pages" });
const post = (headers: Record<string, string>) =>
  new Request("http://localhost:3002/api/revalidate", { method: "POST", body, headers });

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidatePath.mockReset();
    process.env["SITE_URL"] = "http://localhost:3002";
    process.env["REVALIDATE_SECRET"] = secret;
  });

  it("clears every cached page for a correctly signed request", async () => {
    const { POST } = await import("./route");
    const response = await POST(post({ "x-zgate-signature": signRevalidation(body, secret) }));
    expect(response.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("refuses unsigned or wrongly signed requests", async () => {
    const { POST } = await import("./route");
    expect((await POST(post({}))).status).toBe(401);
    const forged = signRevalidation(body, "x".repeat(32));
    expect((await POST(post({ "x-zgate-signature": forged }))).status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("is closed until a secret is configured", async () => {
    delete process.env["REVALIDATE_SECRET"];
    const { POST } = await import("./route");
    expect((await POST(post({ "x-zgate-signature": signRevalidation(body, secret) }))).status).toBe(
      503,
    );
  });
});
