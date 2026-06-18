import { readFileSync } from "fs";
import path from "path";
import type Anthropic from "@anthropic-ai/sdk";
import type { ReviewProvider, SemanticReviewRequest, SemanticReviewResponse } from "./types";
import { RULE_REGISTRY } from "../rules/registry";
import { LLMResponseSchema, LLMValidationError } from "./llm-schema";

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

  // Substitute RULES_CONTEXT and CONTENT_TYPE first, CONTENT last.
  // This prevents user content that contains "{{RULES_CONTEXT}}" from being template-expanded.
  // Use replacer functions to avoid JS special replacement patterns ($&, $', $`).
  return PROMPT_TEMPLATE
    .replace("{{CONTENT_TYPE}}", () => request.contentType)
    .replace("{{RULES_CONTEXT}}", () => rulesContext)
    .replace("{{CONTENT}}", () => request.content);
}

export class AnthropicProvider implements ReviewProvider {
  name = "anthropic";

  // Lazy client — constructed on first review() call so importing this module
  // in fixture mode never touches the SDK or requires the API key.
  private client: Anthropic | null = null;

  private async getClient(): Promise<Anthropic> {
    if (!this.client) {
      const { default: AnthropicSDK } = await import("@anthropic-ai/sdk");
      this.client = new AnthropicSDK({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return this.client;
  }

  async review(request: SemanticReviewRequest): Promise<SemanticReviewResponse> {
    const prompt = buildPrompt(request);
    const client = await this.getClient();

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = (message.content as Array<{ type: string; text?: string }>)
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");

    // Extract JSON — strip any markdown fences
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new LLMValidationError("AnthropicProvider: No JSON found in response", []);
    }

    let raw: unknown;
    try {
      raw = JSON.parse(jsonMatch[0]);
    } catch {
      throw new LLMValidationError("AnthropicProvider: Response is not valid JSON", []);
    }

    const parsed = LLMResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new LLMValidationError("AnthropicProvider: LLM response failed schema validation", parsed.error.issues);
    }

    // Hallucination guard: discard findings whose quotedSpan doesn't exist in the document
    const safeFindings = parsed.data.findings.filter((f) => {
      if (!request.content.includes(f.quotedSpan)) {
        console.warn(`[AnthropicProvider] Discarding finding ${f.ruleId}: quotedSpan not found in document.`);
        return false;
      }
      return true;
    });

    return {
      findings: safeFindings,
      rewrite: parsed.data.rewrite,
      providerMeta: {
        model: "claude-sonnet-4-6",
        inputTokens: (message.usage as { input_tokens: number }).input_tokens,
        outputTokens: (message.usage as { output_tokens: number }).output_tokens,
      },
    };
  }
}
