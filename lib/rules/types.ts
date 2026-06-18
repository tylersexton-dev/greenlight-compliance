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

// If any of these match anywhere in the document, skip the entire rule.
// Used to suppress disclosure rules when the document already has adequate disclosure language.
export type DocumentSkipPattern = RegExp;

export interface Rule {
  id: string;
  category: RuleCategory;
  severity: Severity;
  name: string;
  description: string;
  citation: string;
  patterns: RulePattern[];
  suggestedFixTemplate: string;
  // If any of these match anywhere in the full document, skip this rule entirely
  documentSkipIfContains?: DocumentSkipPattern[];
}

export interface RuleMatch {
  ruleId: string;
  category: RuleCategory;
  severity: Severity;
  source: "rules" | "semantic";
  startOffset: number;
  endOffset: number;
  matchedText: string;
  explanation: string;
  citation: string;
  suggestedFix?: string;
}
