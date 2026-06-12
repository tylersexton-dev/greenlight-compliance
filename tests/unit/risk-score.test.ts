import { describe, it, expect } from "vitest";
import { computeRiskScore } from "@/lib/scoring/risk-score";
import type { RuleMatch } from "@/lib/rules/types";

function match(overrides: Partial<RuleMatch> = {}): RuleMatch {
  return {
    ruleId: "GUAR-001",
    category: "guarantees",
    severity: "BLOCKER",
    startOffset: 0,
    endOffset: 10,
    matchedText: "guaranteed",
    explanation: "test",
    citation: "FINRA Rule 2210(d)(1)(B)",
    suggestedFix: "remove it",
    ...overrides,
  };
}

describe("Risk Scoring", () => {
  it("returns 0 for no findings", () => {
    const result = computeRiskScore([]);
    expect(result.total).toBe(0);
    expect(result.blockerCount).toBe(0);
  });

  it("single BLOCKER produces score >= 15", () => {
    const result = computeRiskScore([match()]);
    expect(result.total).toBeGreaterThanOrEqual(15);
    expect(result.blockerCount).toBe(1);
  });

  it("score is higher for multiple BLOCKERs in different categories", () => {
    const single = computeRiskScore([match()]);
    const multi = computeRiskScore([
      match({ category: "guarantees", ruleId: "GUAR-001" }),
      match({ category: "performance_claims", ruleId: "PERF-001" }),
      match({ category: "urgency_pressure", ruleId: "URG-001", severity: "WARNING" }),
    ]);
    expect(multi.total).toBeGreaterThan(single.total);
  });

  it("diminishing returns: 5 BLOCKERs in same category < 5x single", () => {
    const single = computeRiskScore([match()]).total;
    const five = computeRiskScore(Array(5).fill(null).map(() => match())).total;
    expect(five).toBeLessThan(single * 5);
    expect(five).toBeLessThanOrEqual(100);
  });

  it("total never exceeds 100", () => {
    const manyFindings = Array(20).fill(null).map((_, i) =>
      match({ ruleId: `GUAR-${i}`, startOffset: i * 10 })
    );
    const result = computeRiskScore(manyFindings);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it("breakdown categories sum coherently", () => {
    const result = computeRiskScore([
      match({ category: "guarantees", severity: "BLOCKER" }),
      match({ category: "superlatives", ruleId: "SUPR-001", severity: "WARNING" }),
    ]);
    expect(result.breakdown.guarantees).toBeGreaterThan(result.breakdown.superlatives);
  });

  it("counts severities correctly", () => {
    const result = computeRiskScore([
      match({ severity: "BLOCKER" }),
      match({ severity: "WARNING", ruleId: "PERF-002" }),
      match({ severity: "INFO", ruleId: "DISC-002" }),
    ]);
    expect(result.blockerCount).toBe(1);
    expect(result.warningCount).toBe(1);
    expect(result.infoCount).toBe(1);
  });
});
