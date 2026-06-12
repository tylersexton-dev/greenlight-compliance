import { describe, it, expect } from "vitest";
import { runRulesEngine } from "@/lib/rules/engine";

describe("Rules Engine", () => {
  describe("GUAR-001 — Guarantee of Returns", () => {
    it("flags 'guaranteed returns'", () => {
      const matches = runRulesEngine("Our strategy offers guaranteed returns of 8% per year.");
      const m = matches.find((m) => m.ruleId === "GUAR-001");
      expect(m).toBeDefined();
      expect(m?.severity).toBe("BLOCKER");
    });

    it("flags 'risk-free'", () => {
      const matches = runRulesEngine("This is a risk-free investment opportunity.");
      expect(matches.some((m) => m.ruleId === "GUAR-001")).toBe(true);
    });

    it("downgrades to INFO when negated — 'no guarantees in investing'", () => {
      const matches = runRulesEngine("There are no guarantees in investing, but our track record speaks for itself.");
      const m = matches.find((m) => m.ruleId === "GUAR-001");
      // Should be downgraded to INFO due to negation window, not BLOCKER
      if (m) {
        expect(m.severity).toBe("INFO");
      }
      // OR it could be suppressed entirely — both are acceptable
    });

    it("flags 'can't lose'", () => {
      const matches = runRulesEngine("With our strategy, you simply can't lose.");
      expect(matches.some((m) => m.ruleId === "GUAR-001")).toBe(true);
    });
  });

  describe("PERF-001 — Specific Return Projection", () => {
    it("flags specific return projection", () => {
      const matches = runRulesEngine("Our portfolio will return 12% annually.");
      expect(matches.some((m) => m.ruleId === "PERF-001")).toBe(true);
    });

    it("flags 'double your money'", () => {
      const matches = runRulesEngine("Investors in our fund have doubled their money in 5 years.");
      const m = matches.find((m) => m.ruleId === "PERF-001");
      expect(m).toBeDefined();
    });

    it("does not flag when negated — 'won't double overnight'", () => {
      const matches = runRulesEngine("Investing won't double your money overnight.");
      const blocker = matches.find((m) => m.ruleId === "PERF-001" && m.severity === "BLOCKER");
      expect(blocker).toBeUndefined();
    });
  });

  describe("SUPR-001 — Unsubstantiated Superlatives", () => {
    it("flags '#1 advisor'", () => {
      const matches = runRulesEngine("I am the #1 advisor in San Diego.");
      expect(matches.some((m) => m.ruleId === "SUPR-001")).toBe(true);
    });

    it("flags 'top-rated'", () => {
      const matches = runRulesEngine("As a top-rated broker, I help clients achieve their goals.");
      expect(matches.some((m) => m.ruleId === "SUPR-001")).toBe(true);
    });
  });

  describe("TEST-001 — Testimonials", () => {
    it("flags client quote without disclosure", () => {
      const content = `"Working with this advisor changed my life." — John S.`;
      const matches = runRulesEngine(content);
      expect(matches.some((m) => m.ruleId === "TEST-001")).toBe(true);
    });
  });

  describe("URG-001 — Urgency/Pressure", () => {
    it("flags 'act now'", () => {
      const matches = runRulesEngine("Act now to lock in this exclusive rate before it expires.");
      expect(matches.some((m) => m.ruleId === "URG-001")).toBe(true);
    });

    it("flags 'limited time'", () => {
      const matches = runRulesEngine("This is a limited time offer for new clients.");
      expect(matches.some((m) => m.ruleId === "URG-001")).toBe(true);
    });

    it("flags 'before it's too late'", () => {
      const matches = runRulesEngine("Schedule your consultation before it's too late.");
      expect(matches.some((m) => m.ruleId === "URG-001")).toBe(true);
    });
  });

  describe("Offset accuracy", () => {
    it("returns correct character offsets", () => {
      const content = "Hello world. This offers guaranteed returns. More text.";
      const matches = runRulesEngine(content);
      for (const m of matches) {
        expect(content.slice(m.startOffset, m.endOffset).toLowerCase()).toContain(
          m.matchedText.toLowerCase()
        );
      }
    });
  });

  describe("Clean content", () => {
    it("returns no matches for clean compliant content", () => {
      const clean = `
        At Acme Wealth Management, we help clients build long-term financial plans
        tailored to their individual goals and risk tolerance. Investing involves risk,
        including the possible loss of principal. Past performance is not indicative of
        future results. We are a registered investment adviser. Please review our Form ADV.
      `;
      const matches = runRulesEngine(clean);
      const blockers = matches.filter((m) => m.severity === "BLOCKER");
      expect(blockers).toHaveLength(0);
    });
  });
});
