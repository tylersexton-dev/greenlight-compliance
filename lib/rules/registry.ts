import type { Rule } from "./types";

// Negators that, when appearing within the negation window, suppress or downgrade a match
export const NEGATORS = [
  "no", "not", "never", "without", "cannot", "can't", "doesn't", "don't",
  "won't", "isn't", "aren't", "wasn't", "weren't", "neither", "nor",
  "unlike", "avoid", "avoiding", "past performance", "does not",
];

export const RULE_REGISTRY: Rule[] = [
  // ── GUARANTEES ─────────────────────────────────────────────────────────────
  {
    id: "GUAR-001",
    category: "guarantees",
    severity: "BLOCKER",
    name: "Guarantee of Returns",
    description: "Explicitly guarantees investment returns or absence of loss.",
    citation: "FINRA Rule 2210(d)(1)(B)",
    patterns: [
      { regex: /\bguarantee[ds]?\b/gi, negationWindowTokens: 8 },
      { regex: /\bguaranteed\s+(return|profit|income|gain|yield)/gi },
      { regex: /\brisk[-\s]?free\b/gi, negationWindowTokens: 6 },
      { regex: /\bno\s+risk\b/gi },
      { regex: /\bcan'?t\s+lose\b/gi },
      { regex: /\bassured?\s+(return|profit|result)/gi },
      { regex: /\bno\s+downside\b/gi },
      { regex: /\bprotected?\s+principal\b/gi, negationWindowTokens: 6 },
      { regex: /\b100\s*%\s+safe\b/gi },
      { regex: /\bzero[-\s]risk\b/gi },
    ],
    suggestedFixTemplate:
      "Remove or replace '{match}' with language that accurately reflects investment risk, e.g., 'seeks to preserve capital' or 'historically low volatility.'",
  },
  {
    id: "GUAR-002",
    category: "guarantees",
    severity: "BLOCKER",
    name: "Promise of Specific Outcome",
    description: "Promises a specific financial outcome to the client.",
    citation: "FINRA Rule 2210(d)(1)(A)",
    patterns: [
      { regex: /\byou\s+will\s+(earn|make|receive|get)\b/gi },
      { regex: /\bwe\s+promise\b/gi },
      { regex: /\bI\s+promise\b/gi },
      { regex: /\bassur(e|ed|ance)\s+you\b/gi, negationWindowTokens: 6 },
    ],
    suggestedFixTemplate:
      "Replace '{match}' with objective language about potential outcomes, e.g., 'historically, investors in similar strategies have...'",
  },

  // ── PERFORMANCE CLAIMS ─────────────────────────────────────────────────────
  {
    id: "PERF-001",
    category: "performance_claims",
    severity: "BLOCKER",
    name: "Specific Return Projection",
    description: "Projects or predicts specific future returns.",
    citation: "FINRA Rule 2210(d)(1)(B)",
    patterns: [
      { regex: /\bwill\s+(return|yield|earn|produce|generate)\s+\d+\s*%/gi },
      { regex: /\bexpect\s+\d+\s*%\s+(return|growth|gain)/gi },
      // Negative lookahead excludes product caps/floors (e.g. "10% annual cap")
      { regex: /\b\d+\s*%\s+(?:annual(?:ly)?|yearly|monthly)\b(?!\s+(?:cap|floor|ceiling|limit|maximum))/gi },
      { regex: /\b(guaranteed|assured)\s+returns?\s+of\s+\d+/gi },
      { regex: /\baveraging?\s+\d+\s*%\s+(return|annual|yield)/gi },
      { regex: /\bdoubled?\s+(your|their|my|our)\s+(money|investment|portfolio)\b/gi, negationWindowTokens: 6 },
      { regex: /\btripled?\s+(your|their|my|our)\s+(money|investment|portfolio)\b/gi, negationWindowTokens: 6 },
      { regex: /\b(10x|5x|3x)\s+your\b/gi },
    ],
    suggestedFixTemplate:
      "Remove the specific projection '{match}'. If referencing historical performance, add the required disclosure: 'Past performance is not indicative of future results.'",
  },
  {
    id: "PERF-002",
    category: "performance_claims",
    severity: "WARNING",
    name: "Cherry-Picked Performance",
    description: "References a specific high-return period without broader context or required disclosure.",
    citation: "FINRA Rule 2210(d)(1)(B); FINRA Notice 20-21",
    patterns: [
      // Allow commas and words between year and verb (e.g. "In 2021, our portfolio returned")
      { regex: /\b(?:in|during)\s+(20\d{2}|19\d{2})[,\s]+(?:\w+\s+){0,4}(?:returned|gained|grew|earned|averaged)\b/gi },
      { regex: /\bbest\s+(performing|performing year|quarter|month)\b/gi },
      { regex: /\brecord\s+(performance|returns|year)\b/gi, negationWindowTokens: 5 },
      { regex: /\baveraged?\s+\d+\s*%\s+(annual(?:ly)?|return|over)/gi },
      { regex: /\b(?:returned|gained|earned|grew)\s+\d+\s*%/gi },
    ],
    suggestedFixTemplate:
      "Add the required disclosure immediately after '{match}': 'Past performance is not indicative of future results. Performance data covers a selected period and may not reflect overall results.'",
  },
  {
    id: "PERF-003",
    category: "performance_claims",
    severity: "WARNING",
    name: "Missing Past Performance Disclosure",
    description: "References past performance without the required FINRA disclosure.",
    citation: "FINRA Rule 2210(d)(1)(B)",
    patterns: [
      { regex: /\bpast\s+performance\b/gi },
      { regex: /\bhistorical\s+(return|performance|result)/gi },
      { regex: /\bour\s+(?:\w+\s+){0,3}(portfolio|fund|strategy|clients)\s+(?:have?\s+)?(returned|gained|grew|earned|averaged|outperformed)\b/gi },
      { regex: /\bover\s+the\s+past\s+\d+\s+years?\b/gi },
      { regex: /\boutperformed?\s+(?:the\s+)?(?:S&P|market|benchmark|index)/gi },
    ],
    suggestedFixTemplate:
      "Ensure the phrase 'Past performance is not indicative of future results' appears in the same communication near '{match}'.",
  },

  // ── SUPERLATIVES ───────────────────────────────────────────────────────────
  {
    id: "SUPR-001",
    category: "superlatives",
    severity: "WARNING",
    name: "Unsubstantiated Superlative",
    description: "Uses superlative claims (#1, best, top-rated) without supporting documentation.",
    citation: "FINRA Rule 2210(d)(1)(A)",
    patterns: [
      { regex: /#\s*1\s+(advisor|firm|ranked|rated|broker)\b/gi },
      { regex: /\btop[-\s]?(rated|ranked|performing)\b/gi },
      { regex: /\bbest\s+(advisor|broker|firm|in the industry|in the country|in the state)\b/gi },
      { regex: /\bunmatched\b/gi, negationWindowTokens: 5 },
      { regex: /\b(second\s+to\s+none|none\s+better|unsurpassed|unrivaled)\b/gi },
      { regex: /\bmost\s+(successful|experienced|trusted|reliable)\s+(advisor|broker|firm)\b/gi },
    ],
    suggestedFixTemplate:
      "Either remove '{match}' or substantiate the claim with a specific, independently verified source and date (e.g., 'Ranked #1 by [Source], [Year], based on [Criteria]').",
  },

  // ── TESTIMONIALS ───────────────────────────────────────────────────────────
  {
    id: "TEST-001",
    category: "testimonials",
    severity: "BLOCKER",
    name: "Testimonial Without Required Disclosure",
    description: "Contains what appears to be a client quote or endorsement without FINRA-required disclosure.",
    citation: "FINRA Rule 2210(d)(6); SEC Marketing Rule",
    patterns: [
      { regex: /["""]([^"""]{20,600})["""]\s*[-—]\s*[A-Z][a-z]+/g },
      { regex: /\bclient\s+testimonial\b/gi },
      { regex: /\bhere'?s\s+what\s+(my\s+)?clients\s+say\b/gi },
      { regex: /\bdon'?t\s+take\s+my\s+word\b/gi },
    ],
    suggestedFixTemplate:
      "Add immediately after '{match}': 'This testimonial may not be representative of the experience of other clients and is no guarantee of future performance or success.' Also confirm the client was not compensated.",
  },

  // ── MISLEADING COMPARISONS ─────────────────────────────────────────────────
  {
    id: "COMP-001",
    category: "misleading_comparisons",
    severity: "WARNING",
    name: "Undisclosed Comparison Basis",
    description: "Compares products or strategies without disclosing material differences.",
    citation: "FINRA Rule 2210(d)(1)(B)",
    patterns: [
      { regex: /\bbetter\s+than\s+(the market|S&P|index|mutual fund|your bank|CDs?|bonds?)\b/gi },
      { regex: /\boutperform(s|ed|ing)?\s+(the market|S&P|benchmark|index|inflation)\b/gi, negationWindowTokens: 6 },
      { regex: /\bbeat(s|ing)?\s+(the market|S&P|benchmark)\b/gi, negationWindowTokens: 6 },
      { regex: /\bunlike\s+(mutual funds?|ETFs?|index funds?|traditional investing)\b/gi },
      { regex: /\bmarket[-.](beating|outperform)/gi },
      { regex: /\bmarket\s+beating\b/gi },
    ],
    suggestedFixTemplate:
      "After '{match}', disclose the basis of comparison, time period, and material differences: 'Compared to [Benchmark] over [Period]. [Material differences disclosed].'",
  },

  // ── URGENCY / PRESSURE ─────────────────────────────────────────────────────
  {
    id: "URG-001",
    category: "urgency_pressure",
    severity: "WARNING",
    name: "High-Pressure Sales Language",
    description: "Uses urgency or scarcity tactics in an investment context.",
    citation: "FINRA Rule 2210(d)(1)(A)",
    patterns: [
      { regex: /\bact\s+now\b/gi },
      { regex: /\blimited\s+(time|spots?|availability|offer)\b/gi },
      { regex: /\bdon'?t\s+(miss|wait|delay)\b/gi },
      { regex: /\bbefore\s+it'?s\s+too\s+late\b/gi },
      { regex: /\bopportunity\s+(won'?t|doesn'?t)\s+last\b/gi },
      { regex: /\bonly\s+\d+\s+(spots?|openings?|slots?)\s+(left|available|remaining)\b/gi },
      { regex: /\bwindow\s+(is\s+)?closing\b/gi },
      { regex: /\bnow\s+or\s+never\b/gi },
    ],
    suggestedFixTemplate:
      "Remove the pressure language '{match}'. Investment decisions should be made deliberately. Replace with factual information about the offering timeline if applicable.",
  },

  // ── MISSING DISCLOSURES ────────────────────────────────────────────────────
  {
    id: "DISC-001",
    category: "missing_disclosures",
    severity: "WARNING",
    name: "Security Referenced Without Risk Disclosure",
    description: "A specific security or strategy is mentioned without any risk disclosure language anywhere in the document.",
    citation: "FINRA Rule 2210(d)(1)(B)",
    patterns: [
      // Only fire on explicit named investment products — not generic "investing"
      { regex: /\b(annuity|REIT|alternative investment|hedge fund|structured note|fixed indexed annuity)\b/gi, negationWindowTokens: 3 },
      { regex: /\binvest(?:ing|ment|ments)?\s+in\s+(?:an?\s+)?(?:annuit|REIT|alternative)/gi },
    ],
    // Skip entirely if the document already contains standard risk disclosure language
    documentSkipIfContains: [
      /investing involves risk/i,
      /loss of principal/i,
      /past performance is not indicative/i,
      /there (?:is|are) (?:no )?guarantee/i,
    ],
    suggestedFixTemplate:
      "After mentioning '{match}', add disclosure language such as: 'Investing involves risk, including the possible loss of principal.'",
  },
  {
    id: "DISC-002",
    category: "missing_disclosures",
    severity: "INFO",
    name: "ADV Disclosure Reminder",
    description: "Content promotes investment advisory services without mentioning Form ADV or SEC/state registration status.",
    citation: "FINRA Rule 2210(d)(3)",
    patterns: [
      // Fire when the document is actively advertising/selling advisory services
      { regex: /\bour\s+(?:wealth\s+management|financial\s+planning|investment\s+advisory|portfolio\s+management)\s+services?\b/gi },
      { regex: /\bhire\s+(?:us|me)\s+(?:as\s+)?(?:your\s+)?(?:financial\s+)?advis(?:or|er)\b/gi },
      { regex: /\b(?:complimentary|free)\s+consultation\b/gi },
      { regex: /\bwho\s+manages?\s+your\s+money\b/gi },
    ],
    // Skip if the document already contains registration/ADV disclosure language
    documentSkipIfContains: [
      /registered\s+investment\s+advis(?:er|or)/i,
      /Form\s+ADV/i,
      /SEC[-\s]registered/i,
      /state[-\s]registered/i,
      /investment\s+advis(?:er|or)\s+with\s+the/i,
    ],
    suggestedFixTemplate:
      "Consider adding: '[Firm] is a registered investment adviser. Please review our Form ADV for information about our services, fees, and conflicts of interest.'",
  },
];
