import type { ReviewProvider } from "./types";
import { FixtureProvider } from "./fixture-provider";
import { AnthropicProvider } from "./anthropic-provider";

export function getReviewProvider(): ReviewProvider {
  const providerName = process.env.REVIEW_PROVIDER ?? "fixture";
  switch (providerName) {
    case "anthropic":
      return new AnthropicProvider();
    case "fixture":
    default:
      return new FixtureProvider();
  }
}

export type { ReviewProvider, SemanticFinding, SemanticReviewRequest, SemanticReviewResponse } from "./types";
