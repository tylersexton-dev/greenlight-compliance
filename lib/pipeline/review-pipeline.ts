import { redact, restore } from "../pii/redactor";
import { runRulesEngine } from "../rules/engine";
import { computeRiskScore } from "../scoring/risk-score";
import { getReviewProvider } from "../providers";
import type { RuleMatch } from "../rules/types";
import type { SemanticFinding } from "../providers/types";
import { RULE_REGISTRY } from "../rules/registry";

export type PipelineStage = "pii" | "rules" | "semantic" | "scoring" | "complete";

export interface PipelineProgress {
  stage: PipelineStage;
  ruleFindings?: RuleMatch[];
  semanticFindings?: SemanticFinding[];
  riskScore?: number;
  riskBreakdown?: Record<string, number>;
  rewrite?: string;
  rewriteDiff?: DiffEntry[];
  piiLog?: { type: string; count: number }[];
  error?: string;
}

export interface DiffEntry {
  type: "unchanged" | "removed" | "added";
  text: string;
  findingId?: string;
}

export type ProgressCallback = (progress: PipelineProgress) => void;

export interface ReviewPipelineOptions {
  content: string;
  contentType: string;
  enabledRuleIds?: string[];
  onProgress?: ProgressCallback;
}

export interface ReviewPipelineResult {
  ruleFindings: RuleMatch[];
  semanticFindings: SemanticFinding[];
  allFindings: Array<RuleMatch | (SemanticFinding & { startOffset: number; endOffset: number })>;
  riskScore: number;
  riskBreakdown: Record<string, number>;
  rewrite: string;
  rewriteDiff: DiffEntry[];
  piiLog: { type: string; count: number }[];
  provider: string;
}

/**
 * Locate the start offset of a quoted span in the original (un-redacted) content.
 */
function locateSpan(content: string, quotedSpan: string): { startOffset: number; endOffset: number } | null {
  const idx = content.indexOf(quotedSpan);
  if (idx === -1) return null;
  return { startOffset: idx, endOffset: idx + quotedSpan.length };
}

/**
 * Generate a simple diff between original and rewrite for display.
 */
function generateDiff(original: string, rewrite: string): DiffEntry[] {
  if (!rewrite || rewrite === original) {
    return [{ type: "unchanged", text: original }];
  }

  // Split into sentences for a meaningful diff
  const origSentences = original.match(/[^.!?]+[.!?]+\s*/g) ?? [original];
  const rewSentences = rewrite.match(/[^.!?]+[.!?]+\s*/g) ?? [rewrite];

  const diff: DiffEntry[] = [];
  const maxLen = Math.max(origSentences.length, rewSentences.length);

  for (let i = 0; i < maxLen; i++) {
    const orig = origSentences[i];
    const rew = rewSentences[i];

    if (orig === rew) {
      diff.push({ type: "unchanged", text: orig ?? "" });
    } else {
      if (orig) diff.push({ type: "removed", text: orig });
      if (rew) diff.push({ type: "added", text: rew });
    }
  }

  return diff;
}

export async function runReviewPipeline(
  options: ReviewPipelineOptions
): Promise<ReviewPipelineResult> {
  const { content, contentType, onProgress } = options;
  const enabledRuleIds = options.enabledRuleIds ?? RULE_REGISTRY.map((r) => r.id);
  const provider = getReviewProvider();

  // ── Layer 0: PII Redaction ────────────────────────────────────────────────
  const { redacted, mapping, log: piiLog } = redact(content);
  onProgress?.({ stage: "pii", piiLog });

  // ── Layer 1: Deterministic Rules Engine ───────────────────────────────────
  const ruleFindings = runRulesEngine(content, new Set(enabledRuleIds));
  onProgress?.({ stage: "rules", ruleFindings, piiLog });

  // ── Layer 2: LLM Semantic Review ──────────────────────────────────────────
  let semanticFindings: SemanticFinding[] = [];
  let rewrite = "";

  try {
    const semanticResponse = await provider.review({
      content: redacted,
      enabledRuleIds,
      contentType,
    });

    // Restore PII in semantic findings and rewrite
    const restoredFindings: SemanticFinding[] = semanticResponse.findings.map((f) => ({
      ...f,
      quotedSpan: restore(f.quotedSpan, mapping),
      explanation: restore(f.explanation, mapping),
      suggestedFix: restore(f.suggestedFix, mapping),
    }));

    rewrite = restore(semanticResponse.rewrite, mapping);

    // Hallucination guard: ensure quotedSpan exists in original content
    semanticFindings = restoredFindings.filter((f) => content.includes(f.quotedSpan));

    onProgress?.({ stage: "semantic", semanticFindings, ruleFindings, piiLog });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    onProgress?.({ stage: "semantic", semanticFindings: [], ruleFindings, piiLog, error });
  }

  // ── Layer 3: Scoring ──────────────────────────────────────────────────────
  const allRuleMatches: RuleMatch[] = [
    ...ruleFindings,
    ...semanticFindings.map((f) => {
      const pos = locateSpan(content, f.quotedSpan);
      return {
        ruleId: f.ruleId,
        category: f.category,
        severity: f.severity,
        startOffset: pos?.startOffset ?? 0,
        endOffset: pos?.endOffset ?? 0,
        matchedText: f.quotedSpan,
        explanation: f.explanation,
        citation: f.citation,
        suggestedFix: f.suggestedFix,
      } satisfies RuleMatch;
    }),
  ];

  const scoreResult = computeRiskScore(allRuleMatches);
  const rewriteDiff = generateDiff(content, rewrite);

  // Resolve offsets for semantic findings
  const semanticWithOffsets = semanticFindings.map((f) => {
    const pos = locateSpan(content, f.quotedSpan);
    return { ...f, startOffset: pos?.startOffset ?? 0, endOffset: pos?.endOffset ?? 0 };
  });

  onProgress?.({
    stage: "complete",
    ruleFindings,
    semanticFindings,
    riskScore: scoreResult.total,
    riskBreakdown: scoreResult.breakdown as unknown as Record<string, number>,
    rewrite,
    rewriteDiff,
    piiLog,
  });

  return {
    ruleFindings,
    semanticFindings,
    allFindings: [...ruleFindings, ...semanticWithOffsets],
    riskScore: scoreResult.total,
    riskBreakdown: scoreResult.breakdown as unknown as Record<string, number>,
    rewrite,
    rewriteDiff,
    piiLog,
    provider: provider.name,
  };
}
