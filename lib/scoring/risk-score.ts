import type { RuleMatch } from "../rules/types";
import type { RuleCategory, Severity } from "../rules/types";

export interface RiskBreakdown {
  guarantees: number;
  performance_claims: number;
  superlatives: number;
  testimonials: number;
  misleading_comparisons: number;
  urgency_pressure: number;
  missing_disclosures: number;
}

export interface RiskScoreResult {
  total: number; // 0–100
  breakdown: RiskBreakdown;
  blockerCount: number;
  warningCount: number;
  infoCount: number;
}

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  BLOCKER: 25,
  WARNING: 8,
  INFO: 2,
};

const CATEGORY_WEIGHT: Record<RuleCategory, number> = {
  guarantees: 1.5,
  performance_claims: 1.3,
  superlatives: 0.8,
  testimonials: 1.2,
  misleading_comparisons: 1.0,
  urgency_pressure: 0.9,
  missing_disclosures: 0.7,
};

// Diminishing returns: nth finding in same category adds less
function diminishingReturns(baseScore: number, count: number): number {
  if (count <= 1) return baseScore;
  return baseScore * (1 + Math.log(count) * 0.4);
}

export function computeRiskScore(findings: RuleMatch[]): RiskScoreResult {
  const categories = Object.keys(CATEGORY_WEIGHT) as RuleCategory[];
  const breakdown = Object.fromEntries(categories.map((c) => [c, 0])) as unknown as RiskBreakdown;
  const categoryCounts: Partial<Record<RuleCategory, number>> = {};

  let blockerCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const finding of findings) {
    const base = SEVERITY_WEIGHTS[finding.severity] * CATEGORY_WEIGHT[finding.category];
    const count = (categoryCounts[finding.category] ?? 0) + 1;
    categoryCounts[finding.category] = count;

    const score = base / count; // diminishing returns per finding in category
    breakdown[finding.category] = Math.min(100, (breakdown[finding.category] ?? 0) + score);

    if (finding.severity === "BLOCKER") blockerCount++;
    else if (finding.severity === "WARNING") warningCount++;
    else infoCount++;
  }

  // Total = weighted average of category scores, capped at 100
  const categoryScores = categories.map((c) => breakdown[c]);
  const rawTotal = categoryScores.reduce((sum, s) => sum + s, 0) / categories.length;

  // BLOCKERs add a floor with diminishing returns (log curve, not linear)
  const blockerFloor = blockerCount > 0 ? Math.min(100, Math.log(blockerCount + 1) * 22) : 0;
  const total = Math.min(100, Math.max(blockerFloor, rawTotal));

  // Round breakdown values
  for (const cat of categories) {
    breakdown[cat] = Math.round(breakdown[cat] * 10) / 10;
  }

  return {
    total: Math.round(total),
    breakdown,
    blockerCount,
    warningCount,
    infoCount,
  };
}
