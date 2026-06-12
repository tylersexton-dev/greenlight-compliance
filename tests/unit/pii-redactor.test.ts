import { describe, it, expect } from "vitest";
import { redact, restore } from "@/lib/pii/redactor";

describe("PII Redactor", () => {
  it("redacts SSNs", () => {
    const { redacted } = redact("My SSN is 123-45-6789.");
    expect(redacted).not.toContain("123-45-6789");
    expect(redacted).toContain("[SSN_1]");
  });

  it("redacts phone numbers", () => {
    const { redacted } = redact("Call me at (619) 555-1234 anytime.");
    expect(redacted).not.toContain("619");
    expect(redacted).toContain("[PHONE_1]");
  });

  it("redacts emails", () => {
    const { redacted } = redact("Contact advisor@wealth.com for details.");
    expect(redacted).not.toContain("advisor@wealth.com");
    expect(redacted).toContain("[EMAIL_1]");
  });

  it("round-trips: restore returns original text", () => {
    const original = "Call (619) 555-1234 or email client@example.com. SSN: 123-45-6789.";
    const { redacted, mapping } = redact(original);
    const restored = restore(redacted, mapping);
    expect(restored).toBe(original);
  });

  it("handles multiple instances of same type", () => {
    const { redacted, log } = redact(
      "Phone 555-123-4567 and also 555-987-6543."
    );
    expect(redacted).toContain("[PHONE_1]");
    expect(redacted).toContain("[PHONE_2]");
    const phoneLog = log.find((l) => l.type === "PHONE");
    expect(phoneLog?.count).toBe(2);
  });

  it("does not redact non-PII numbers", () => {
    const text = "We have 42 clients and manage $5 million in assets.";
    const { redacted } = redact(text);
    expect(redacted).toContain("42");
    expect(redacted).toContain("$5 million");
  });

  it("logs types and counts, never values", () => {
    const { log } = redact("SSN: 123-45-6789. Phone: (619) 555-1234.");
    expect(log.some((l) => l.type === "SSN" && l.count === 1)).toBe(true);
    expect(log.some((l) => l.type === "PHONE" && l.count === 1)).toBe(true);
    // No values in log
    const logStr = JSON.stringify(log);
    expect(logStr).not.toContain("123-45-6789");
    expect(logStr).not.toContain("555-1234");
  });
});
