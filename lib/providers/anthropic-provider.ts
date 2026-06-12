import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import path from "path";
import type { ReviewProvider, SemanticReviewRequest, SemanticReviewResponse, SemanticFinding } from "./types";
import { RULE_REGISTRY } from "../rules/registry";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPT_TEMPLATE = readFileSync(
  path.join(process.cwd(), "prompts/semantic-review.v1.md"),
  "utf8"
);

function buildPrompt(request: SemanticReviewRequest): string {
  const rulesContext = RULE_REGISTRY.filter((r) =>
    request.enabledRuleIds.includes(r.id)
  )
    .map((r) => `- ${r.id} (${r.category}): ${r.name} — ${r.citation}`)
    .join("\n");

  return PROMPT_TEMPLATE.replace("{{CONTENT_TYPE}}", request.contentType)
    .replace("{{CONTENT}}", request.content)
    .replace("{{RULES_CONTEXT}}", rulesContext);
}

function guardHallucinations(
  findings: SemanticFinding[],
  content: string
): SemanticFinding[] {
  return findings.filter((f) => {
    if (!content.includes(f.quotedSpan)) {
      console.warn(
        `[AnthropicProvider] Discarding finding ${f.ruleId}: quotedSpan not found in document.`
      );
      return false;
    }
    return true;
  });
}

export class AnthropicProvider implements ReviewProvider {
  name = "anthropic";

  async review(request: SemanticReviewRequest): Promise<SemanticReviewResponse> {
    const prompt = buildPrompt(request);

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    // Extract JSON from response (strip any markdown fences)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AnthropicProvider: No JSON found in response");
    }

    let parsed: { findings: SemanticFinding[]; rewrite: string };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("AnthropicProvider: Invalid JSON in response");
    }

    const safeFindings = guardHallucinations(parsed.findings ?? [], request.content);

    return {
      findings: safeFindings,
      rewrite: parsed.rewrite ?? "",
      providerMeta: {
        model: "claude-sonnet-4-6",
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  }
}
