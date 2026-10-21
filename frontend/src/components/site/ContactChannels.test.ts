import { describe, expect, it } from "vitest";
import { telHref, whatsappGreeting, whatsappHref } from "./ContactChannels";

describe("contact links", () => {
  it("builds a wa.me link from a formatted number", () => {
    expect(whatsappHref("+250 792 957 513")).toBe("https://wa.me/250792957513");
  });

  it("pre-fills the message, encoded so it can't break out of the query", () => {
    const href = whatsappHref("+250 792 957 513", "Hi & hello? #1");
    expect(href).toBe("https://wa.me/250792957513?text=Hi%20%26%20hello%3F%20%231");
    expect(new URL(href).searchParams.get("text")).toBe("Hi & hello? #1");
  });

  it("names the topic the visitor was reading", () => {
    expect(whatsappGreeting("Advisory")).toBe(
      "Hello Z-GATE, I'd like to talk about Advisory. (Sent from your website.)",
    );
    expect(whatsappGreeting(null)).toMatch(/^Hello Z-GATE.*\(Sent from your website\.\)$/);
  });

  it("keeps the leading + on tel: links", () => {
    expect(telHref("+250 792 957 513")).toBe("tel:+250792957513");
  });
});
