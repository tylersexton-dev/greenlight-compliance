import type { Severity, RuleCategory } from "../rules/types";

export interface SemanticFinding {
  ruleId: string;
  category: RuleCategory;
  severity: Severity;
  quotedSpan: string; // exact text from document — used to locate offset
  explanation: string;
  citation: string;
  suggestedFix?: string;
}

export interface SemanticReviewRequest {
  content: string; // may be PII-redacted
  enabledRuleIds: string[];
  contentType: string;
}

export interface SemanticReviewResponse {
  findings: SemanticFinding[];
  rewrite: string;
  providerMeta: Record<string, unknown>;
}

export interface ReviewProvider {
  name: string;
  review(request: SemanticReviewRequest): Promise<SemanticReviewResponse>;
}
