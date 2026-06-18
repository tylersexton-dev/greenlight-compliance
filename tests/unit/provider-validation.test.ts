import { describe, it, expect } from "vitest";
import { LLMResponseSchema, LLMValidationError } from "@/lib/providers/llm-schema";

describe("LLM response schema validation", () => {
  it("accepts a well-formed response", () => {
    const raw = {
      findings: [
        {
          ruleId: "SEM-001",
          category: "guarantees",
          severity: "BLOCKER",
          quotedSpan: "guaranteed returns",
          explanation: "Promises a guaranteed return.",
          citation: "FINRA Rule 2210(d)(1)(B)",
          suggestedFix: "Remove the guarantee claim.",
        },
      ],
      rewrite: "Seek potential growth with no guarantees.",
    };
    const result = LLMResponseSchema.safeParse(raw);
    expect(result.success).toBe(true);
  });

  it("rejects a response with an invalid severity", () => {
    const raw = {
      findings: [{ ruleId: "X", category: "guarantees", severity: "CRITICAL", quotedSpan: "x", explanation: "x", citation: "x" }],
      rewrite: "",
    };
    const result = LLMResponseSchema.safeParse(raw);
    expect(result.success).toBe(false);
  });

  it("rejects a response with an invalid category", () => {
    const raw = {
      findings: [{ ruleId: "X", category: "made_up_category", severity: "BLOCKER", quotedSpan: "x", explanation: "x", citation: "x" }],
      rewrite: "",
    };
    expect(LLMResponseSchema.safeParse(raw).success).toBe(false);
  });

  it("rejects a response missing the rewrite field", () => {
    const raw = { findings: [] };
    expect(LLMResponseSchema.safeParse(raw).success).toBe(false);
  });

  it("accepts an empty findings array", () => {
    const raw = { findings: [], rewrite: "No changes needed." };
    expect(LLMResponseSchema.safeParse(raw).success).toBe(true);
  });

  it("LLMValidationError carries zod issues", () => {
    const raw = { findings: [{ ruleId: "" }], rewrite: "" };
    const result = LLMResponseSchema.safeParse(raw);
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = new LLMValidationError("test", result.error.issues);
      expect(err.issues.length).toBeGreaterThan(0);
      expect(err.name).toBe("LLMValidationError");
    }
  });
});

describe("Prompt template injection safety", () => {
  it("content containing $& survives replace() without corruption", () => {
    // Verify the replacer-function pattern prevents JS special replacement patterns
    const template = "BEFORE {{CONTENT}} AFTER";
    const content = "price $& value $' end $`";
    // Using replacer function (the fix)
    const result = template.replace("{{CONTENT}}", () => content);
    expect(result).toBe(`BEFORE ${content} AFTER`);
  });

  it("content containing {{RULES_CONTEXT}} is not template-expanded", () => {
    const template = "RULES: {{RULES_CONTEXT}} CONTENT: {{CONTENT}}";
    const rulesContext = "rule-1";
    const content = "Text with {{RULES_CONTEXT}} literal inside";

    // Substitute RULES_CONTEXT first, then CONTENT last with replacer
    const result = template
      .replace("{{RULES_CONTEXT}}", () => rulesContext)
      .replace("{{CONTENT}}", () => content);

    expect(result).toContain("Text with {{RULES_CONTEXT}} literal inside");
    expect(result).toContain("RULES: rule-1");
  });
});
