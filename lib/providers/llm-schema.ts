import { z } from "zod";
import type { ZodIssue } from "zod";

export const SemanticFindingSchema = z.object({
  ruleId: z.string().min(1),
  category: z.enum([
    "guarantees",
    "performance_claims",
    "superlatives",
    "testimonials",
    "misleading_comparisons",
    "urgency_pressure",
    "missing_disclosures",
  ]),
  severity: z.enum(["BLOCKER", "WARNING", "INFO"]),
  quotedSpan: z.string().min(1),
  explanation: z.string().min(1),
  citation: z.string().min(1),
  suggestedFix: z.string().optional(),
});

export const LLMResponseSchema = z.object({
  findings: z.array(SemanticFindingSchema),
  rewrite: z.string(),
});

export type ValidatedLLMResponse = z.infer<typeof LLMResponseSchema>;

export class LLMValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: ZodIssue[]
  ) {
    super(message);
    this.name = "LLMValidationError";
  }
}
