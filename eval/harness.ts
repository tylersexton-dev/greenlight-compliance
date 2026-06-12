import { GOLDEN_SET } from "./golden-set";
import { runRulesEngine } from "../lib/rules/engine";
import { computeRiskScore } from "../lib/scoring/risk-score";
import type { RuleCategory, Severity } from "../lib/rules/types";

interface EvalResult {
  id: string;
  label: string;
  truePositives: string[];
  falsePositives: string[];
  falseNegatives: string[];
  riskScore: number;
  pass: boolean;
}

interface CategoryMetrics {
  precision: number;
  recall: number;
  f1: number;
  tp: number;
  fp: number;
  fn: number;
}

function runEval(): void {
  const results: EvalResult[] = [];
  const categoryTp: Record<string, number> = {};
  const categoryFp: Record<string, number> = {};
  const categoryFn: Record<string, number> = {};

  console.log("\n====================================================");
  console.log("  GREENLIGHT EVAL HARNESS — Rules Engine");
  console.log("====================================================\n");

  for (const sample of GOLDEN_SET) {
    const matches = runRulesEngine(sample.content);
    const riskResult = computeRiskScore(matches);

    const expectedKeys = new Set(
      sample.expectedFindings.map((f) => `${f.ruleId}:${f.severity}`)
    );
    const actualKeys = new Set(
      matches.map((m) => `${m.ruleId}:${m.severity}`)
    );

    const truePositives: string[] = [];
    const falsePositives: string[] = [];
    const falseNegatives: string[] = [];

    for (const key of actualKeys) {
      if (expectedKeys.has(key)) {
        truePositives.push(key);
      } else {
        // Allow INFO-level matches for expected WARNINGs/BLOCKERs (negation downgrade)
        const [ruleId] = key.split(":");
        const expectedForRule = sample.expectedFindings.find((f) => f.ruleId === ruleId);
        if (!expectedForRule) {
          falsePositives.push(key);
        }
      }
    }

    for (const expected of sample.expectedFindings) {
      const key = `${expected.ruleId}:${expected.severity}`;
      const ruleFound = matches.some((m) => m.ruleId === expected.ruleId);
      if (!ruleFound) {
        falseNegatives.push(key);
      } else if (!actualKeys.has(key)) {
        // Found but wrong severity — count as partial (not FN)
        truePositives.push(`${key} (severity mismatch, found: ${matches.find((m) => m.ruleId === expected.ruleId)?.severity})`);
      }
    }

    // Accumulate per-category stats
    for (const exp of sample.expectedFindings) {
      const [category] = exp.ruleId.split("-");
      const found = matches.some((m) => m.ruleId === exp.ruleId);
      if (found) {
        categoryTp[category] = (categoryTp[category] ?? 0) + 1;
      } else {
        categoryFn[category] = (categoryFn[category] ?? 0) + 1;
      }
    }
    for (const match of matches) {
      const [category] = match.ruleId.split("-");
      const expected = sample.expectedFindings.some((f) => f.ruleId === match.ruleId);
      if (!expected) {
        categoryFp[category] = (categoryFp[category] ?? 0) + 1;
      }
    }

    const pass = falseNegatives.length === 0;

    results.push({
      id: sample.id,
      label: sample.label,
      truePositives,
      falsePositives,
      falseNegatives,
      riskScore: riskResult.total,
      pass,
    });

    const status = pass ? "✓ PASS" : "✗ FAIL";
    const tpCount = truePositives.length;
    const fpCount = falsePositives.length;
    const fnCount = falseNegatives.length;

    console.log(`${status}  [${sample.id}] ${sample.label}`);
    console.log(`       Risk: ${riskResult.total}/100  TP:${tpCount} FP:${fpCount} FN:${fnCount}`);
    if (falseNegatives.length > 0) {
      console.log(`       MISSED: ${falseNegatives.join(", ")}`);
    }
    if (falsePositives.length > 0) {
      console.log(`       EXTRA:  ${falsePositives.join(", ")}`);
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  const totalTp = results.reduce((s, r) => s + r.truePositives.length, 0);
  const totalFp = results.reduce((s, r) => s + r.falsePositives.length, 0);
  const totalFn = results.reduce((s, r) => s + r.falseNegatives.length, 0);
  const precision = totalTp / (totalTp + totalFp) || 0;
  const recall = totalTp / (totalTp + totalFn) || 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  console.log("\n====================================================");
  console.log("  RESULTS SUMMARY");
  console.log("====================================================");
  console.log(`Samples:   ${total}`);
  console.log(`Passed:    ${passed}/${total} (${Math.round((passed / total) * 100)}%)`);
  console.log(`Precision: ${(precision * 100).toFixed(1)}%`);
  console.log(`Recall:    ${(recall * 100).toFixed(1)}%`);
  console.log(`F1 Score:  ${(f1 * 100).toFixed(1)}%`);

  console.log("\n── Per-Category Breakdown ──────────────────────────");
  const allCategories = new Set([
    ...Object.keys(categoryTp),
    ...Object.keys(categoryFp),
    ...Object.keys(categoryFn),
  ]);
  for (const cat of Array.from(allCategories).sort()) {
    const tp = categoryTp[cat] ?? 0;
    const fp = categoryFp[cat] ?? 0;
    const fn = categoryFn[cat] ?? 0;
    const p = tp / (tp + fp) || 0;
    const r = tp / (tp + fn) || 0;
    const f = p + r > 0 ? (2 * p * r) / (p + r) : 0;
    console.log(`  ${cat.padEnd(8)}  P:${(p * 100).toFixed(0).padStart(3)}%  R:${(r * 100).toFixed(0).padStart(3)}%  F1:${(f * 100).toFixed(0).padStart(3)}%`);
  }

  console.log("\n====================================================\n");

  if (passed < total) {
    process.exit(1);
  }
}

runEval();
