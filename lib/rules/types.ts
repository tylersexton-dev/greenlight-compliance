export type Severity = "BLOCKER" | "WARNING" | "INFO";

export type RuleCategory =
  | "guarantees"
  | "performance_claims"
  | "superlatives"
  | "testimonials"
  | "misleading_comparisons"
  | "urgency_pressure"
  | "missing_disclosures";

export interface RulePattern {
  regex: RegExp;
  negationWindowTokens?: number; // suppress if negator within N tokens
}

export interface Rule {
  id: string;
  category: RuleCategory;
  severity: Severity;
  name: string;
  description: string;
  citation: string;
  patterns: RulePattern[];
  suggestedFixTemplate: string;
}

export interface RuleMatch {
  ruleId: string;
  category: RuleCategory;
  severity: Severity;
  startOffset: number;
  endOffset: number;
  matchedText: string;
  explanation: string;
  citation: string;
  suggestedFix: string;
}
