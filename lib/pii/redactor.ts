export interface RedactionResult {
  redacted: string;
  mapping: Map<string, string>; // placeholder → original
  log: { type: string; count: number }[];
}

interface PiiPattern {
  type: string;
  regex: RegExp;
}

const PII_PATTERNS: PiiPattern[] = [
  { type: "SSN", regex: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: "ACCOUNT", regex: /\b(?:account\s*#?\s*|acct\.?\s*#?\s*)\d{6,16}\b/gi },
  { type: "ACCOUNT", regex: /\b\d{8,16}\b(?=\s*(?:account|acct))/gi },
  { type: "PHONE", regex: /(?<!\d)(?:\+1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}(?!\d)/g },
  { type: "EMAIL", regex: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g },
  {
    type: "PERSONAL_DOLLAR",
    // Dollar amount tied to a named individual: "John's $50,000" or "$50,000 for Jane"
    regex: /(?:[A-Z][a-z]+(?:'s)?)\s+\$[\d,]+(?:\.\d{2})?|\$[\d,]+(?:\.\d{2})?\s+(?:for|of|from)\s+[A-Z][a-z]+/g,
  },
];

export function redact(text: string): RedactionResult {
  const mapping = new Map<string, string>();
  const counters: Record<string, number> = {};
  let result = text;

  for (const { type, regex } of PII_PATTERNS) {
    regex.lastIndex = 0;
    result = result.replace(regex, (match) => {
      // Check if this exact match was already mapped
      for (const [placeholder, original] of mapping) {
        if (original === match) return placeholder;
      }
      counters[type] = (counters[type] ?? 0) + 1;
      const placeholder = `[${type}_${counters[type]}]`;
      mapping.set(placeholder, match);
      return placeholder;
    });
    regex.lastIndex = 0;
  }

  const log = Object.entries(counters).map(([type, count]) => ({ type, count }));
  return { redacted: result, mapping, log };
}

export function restore(text: string, mapping: Map<string, string>): string {
  let result = text;
  for (const [placeholder, original] of mapping) {
    // Escape placeholder for regex use
    const escaped = placeholder.replace(/[[\]]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "g"), original);
  }
  return result;
}
