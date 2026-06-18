import type { ReviewProvider, SemanticReviewRequest, SemanticReviewResponse } from "./types";
import { LLMResponseSchema, LLMValidationError } from "./llm-schema";

// Keyed by SHA256(content.slice(0, 200)) for quick matching
const FIXTURES: Record<string, SemanticReviewResponse> = {
  // Fixture 1: Clean LinkedIn post — no findings
  clean_post: {
    findings: [],
    rewrite: "", // no changes needed
    providerMeta: { fixture: "clean_post" },
  },

  // Fixture 2: Implied promise
  implied_promise: {
    findings: [
      {
        ruleId: "SEM-001",
        category: "guarantees",
        severity: "BLOCKER",
        quotedSpan: "clients who joined in 2020 are very happy with where they are now",
        explanation:
          "This phrase implies a guaranteed positive outcome for clients, which constitutes an implied promise of investment success under FINRA Rule 2210(d)(1)(B). Readers will infer that joining leads to happiness with results, which is a performance promise.",
        citation: "FINRA Rule 2210(d)(1)(B)",
        suggestedFix:
          "Replace with: 'We work closely with our clients to develop strategies aligned with their long-term goals.' Add: 'Results vary and past client experiences are not indicative of future performance.'",
      },
    ],
    rewrite:
      "Are you looking for a financial advisor who puts your goals first? Our team works closely with each client to develop personalized strategies aligned with their long-term financial objectives. We believe in transparent communication and disciplined investing. Investing involves risk, including the possible loss of principal. Past client experiences are not indicative of future results. Schedule a complimentary consultation to see if we're the right fit for you.",
    providerMeta: { fixture: "implied_promise" },
  },

  // Fixture 3: Missing risk context
  missing_risk: {
    findings: [
      {
        ruleId: "SEM-002",
        category: "missing_disclosures",
        severity: "WARNING",
        quotedSpan: "Our clients have seen their portfolios grow significantly",
        explanation:
          "This statement discusses portfolio growth with no mention of risk or the possibility of loss. FINRA requires that promotional material present a balanced picture of risk and reward.",
        citation: "FINRA Rule 2210(d)(1)(B)",
        suggestedFix:
          "Add after this statement: 'Investing involves risk, including the possible loss of principal. Individual results will vary.'",
      },
    ],
    rewrite:
      "At our firm, we focus on disciplined, long-term investment strategies tailored to each client's risk tolerance and financial goals. While we strive to grow our clients' portfolios over time, investing involves risk, including the possible loss of principal. Individual results will vary based on market conditions, time horizon, and investment objectives. We invite you to schedule a consultation to discuss your specific situation.",
    providerMeta: { fixture: "missing_risk" },
  },

  // Default fixture for unknown content
  default: {
    findings: [
      {
        ruleId: "SEM-003",
        category: "performance_claims",
        severity: "WARNING",
        quotedSpan: "results",
        explanation:
          "Generic fixture finding: the document may contain promotional claims. Please review with the full LLM provider for accurate analysis.",
        citation: "FINRA Rule 2210(d)(1)(A)",
        suggestedFix: "Review with a live compliance provider for accurate assessment.",
      },
    ],
    rewrite:
      "Thank you for submitting this content for review. This is a fixture response. Enable the Anthropic provider for a real compliance rewrite.",
    providerMeta: { fixture: "default" },
  },
};

function selectFixture(content: string): SemanticReviewResponse {
  const lower = content.toLowerCase();

  if (
    lower.includes("clients who joined in 2020") ||
    lower.includes("very happy with where they are")
  ) {
    return FIXTURES.implied_promise;
  }

  if (
    lower.includes("clients have seen their portfolios grow") ||
    (lower.includes("grow") && !lower.includes("risk"))
  ) {
    return FIXTURES.missing_risk;
  }

  if (
    !lower.includes("guaranteed") &&
    !lower.includes("risk-free") &&
    !lower.includes("will return") &&
    !lower.includes("guarantee")
  ) {
    return FIXTURES.clean_post;
  }

  return FIXTURES.default;
}

export class FixtureProvider implements ReviewProvider {
  name = "fixture";

  async review(request: SemanticReviewRequest): Promise<SemanticReviewResponse> {
    await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));
    const raw = selectFixture(request.content);

    // Validate fixture responses against the same schema as live LLM output
    const parsed = LLMResponseSchema.safeParse({ findings: raw.findings, rewrite: raw.rewrite ?? "" });
    if (!parsed.success) {
      throw new LLMValidationError("FixtureProvider: fixture data failed schema validation", parsed.error.issues);
    }

    return { ...raw, findings: parsed.data.findings, rewrite: parsed.data.rewrite };
  }
}
