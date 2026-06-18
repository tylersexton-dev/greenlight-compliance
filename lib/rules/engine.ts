import { RULE_REGISTRY, NEGATORS } from "./registry";
import type { Rule, RuleMatch } from "./types";

/**
 * Tokenize text into word-boundary tokens for negation window analysis.
 * Returns array of {word, startOffset} pairs.
 */
function tokenize(text: string): Array<{ word: string; startOffset: number }> {
  const tokens: Array<{ word: string; startOffset: number }> = [];
  const wordRegex = /\S+/g;
  let match;
  while ((match = wordRegex.exec(text)) !== null) {
    tokens.push({ word: match[0].toLowerCase(), startOffset: match.index });
  }
  return tokens;
}

/**
 * Check whether a negator appears within `windowSize` tokens of the match position.
 */
function hasNegatorNearby(
  tokens: Array<{ word: string; startOffset: number }>,
  matchStart: number,
  matchEnd: number,
  windowSize: number
): boolean {
  // Find token indices that fall within the window around the match
  const windowChars = windowSize * 8; // approximate: avg 8 chars/word
  const windowStart = Math.max(0, matchStart - windowChars);
  const windowEnd = matchEnd + windowChars;

  for (const token of tokens) {
    if (token.startOffset < windowStart || token.startOffset > windowEnd) continue;
    const bare = token.word.replace(/[^a-z']/g, "");
    if (NEGATORS.some((neg) => bare === neg || bare.startsWith(neg))) {
      return true;
    }
  }
  return false;
}

/**
 * Run the deterministic rules engine against a document.
 * Returns matches sorted by startOffset.
 */
export function runRulesEngine(
  content: string,
  enabledRuleIds?: Set<string>
): RuleMatch[] {
  const tokens = tokenize(content);
  const matches: RuleMatch[] = [];
  const seen = new Set<string>(); // deduplicate same rule + same span

  const activeRules = enabledRuleIds
    ? RULE_REGISTRY.filter((r) => enabledRuleIds.has(r.id))
    : RULE_REGISTRY;

  for (const rule of activeRules) {
    // Document-level skip: if the document already contains adequate disclosure language, skip
    if (rule.documentSkipIfContains?.some((p) => { p.lastIndex = 0; return p.test(content); })) {
      continue;
    }

    for (const pattern of rule.patterns) {
      // Reset lastIndex for global regexes
      pattern.regex.lastIndex = 0;

      let regexMatch;
      while ((regexMatch = pattern.regex.exec(content)) !== null) {
        const matchStart = regexMatch.index;
        const matchEnd = matchStart + regexMatch[0].length;
        const matchedText = regexMatch[0];

        // Negation window check
        if (pattern.negationWindowTokens !== undefined) {
          if (hasNegatorNearby(tokens, matchStart, matchEnd, pattern.negationWindowTokens)) {
            // Downgrade to INFO instead of suppressing entirely for BLOCKERs
            if (rule.severity === "BLOCKER") {
              const key = `${rule.id}:${matchStart}:${matchEnd}`;
              if (!seen.has(key)) {
                seen.add(key);
                matches.push({
                  ruleId: rule.id,
                  category: rule.category,
                  severity: "INFO",
                  startOffset: matchStart,
                  endOffset: matchEnd,
                  matchedText,
                  explanation: `[Context suggests negation] ${buildExplanation(rule, matchedText)}`,
                  citation: rule.citation,
                  suggestedFix: rule.suggestedFixTemplate.replace("{match}", matchedText),
                });
              }
            }
            // WARNING/INFO: suppress entirely when negated
            continue;
          }
        }

        const key = `${rule.id}:${matchStart}:${matchEnd}`;
        if (seen.has(key)) continue;
        seen.add(key);

        matches.push({
          ruleId: rule.id,
          category: rule.category,
          severity: rule.severity,
          startOffset: matchStart,
          endOffset: matchEnd,
          matchedText,
          explanation: buildExplanation(rule, matchedText),
          citation: rule.citation,
          suggestedFix: rule.suggestedFixTemplate.replace("{match}", matchedText),
        });
      }

      // Reset lastIndex after use
      pattern.regex.lastIndex = 0;
    }
  }

  return matches.sort((a, b) => a.startOffset - b.startOffset);
}

function buildExplanation(rule: Rule, matchedText: string): string {
  return `"${matchedText}" may violate ${rule.name}: ${rule.description}`;
}
