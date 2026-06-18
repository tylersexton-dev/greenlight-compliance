# Greenlight — CLAUDE.md

## Project Overview

Greenlight is a FINRA Rule 2210 compliance review copilot for financial advisors. Advisors submit marketing content; the system returns span-level findings, a risk score (0–100), a compliant rewrite, and a submission/approval workflow backed by a tamper-evident audit log.

Two roles: **Advisor** (creates and submits content) and **Principal** (reviews, approves, configures firm rules).

## Architecture Map

```
lib/
  pii/redactor.ts          — Layer 0: PII redaction before any LLM call
  rules/
    registry.ts            — 15-rule FINRA 2210 rule definitions
    engine.ts              — Deterministic regex engine, returns char offsets
    types.ts               — Rule, RuleMatch, Severity, RuleCategory types
  providers/
    types.ts               — ReviewProvider interface + SemanticFinding type
    fixture-provider.ts    — Offline fixture responses (default, no API key)
    anthropic-provider.ts  — Live Claude API (REVIEW_PROVIDER=anthropic)
    index.ts               — Provider factory (reads REVIEW_PROVIDER env var)
  pipeline/
    review-pipeline.ts     — Orchestrates all 3 layers, emits SSE progress events
  scoring/risk-score.ts    — Weighted risk score (0–100) with diminishing returns
  state-machine/
    document-states.ts     — Explicit transition table, IllegalTransitionError
  audit/chain.ts           — SHA-256 hash chain: compute, canonicalize, verify
  db/
    schema.ts              — Drizzle schema (users, documents, reviews, findings,
                             audit_events, rules, rule_overrides)
    client.ts              — better-sqlite3 + Drizzle client singleton

app/api/
  auth/                    — login, logout, me
  documents/               — CRUD + SSE review stream + transition + audit
  rules/                   — Principal rule toggle (GET/PATCH)
  analytics/               — Firm-wide metrics for principal dashboard

prompts/
  semantic-review.v1.md    — Versioned LLM prompt (treat like code, changelog at top)
```

## Commands

```bash
npm run dev          # Start Next.js dev server
npm test             # Run Vitest unit + integration tests
npm run eval         # Run 30-sample golden-set eval harness (set REVIEW_PROVIDER=fixture)
npm run seed         # Migrate DB and seed 5 demo documents with audit chains
npm run tamper       # Corrupt one audit event to demo chain detection
npm run build        # Production build (must pass before any PR)
npm run lint         # ESLint
npm run db:generate  # Regenerate Drizzle migrations after schema changes
npm run db:migrate   # Apply pending migrations
```

## Conventions

- **Conventional commits** — `feat:`, `fix:`, `ci:`, `chore:`, `test:`, `docs:` prefixes required.
- **Zod at all API boundaries** — every route handler validates its request body with a Zod schema before touching the DB.
- **Transactions for multi-write operations** — any route that writes to more than one table must wrap both writes in `db.transaction()`. An unaudited state change is the cardinal sin in this product.
- **No features without tests** — new rules go in `tests/unit/rules-engine.test.ts`; new API routes go in `tests/integration/workflow.test.ts`.
- **Provider interface** — all LLM calls go through `ReviewProvider`. Adding a new model = new class implementing the interface; no changes to the pipeline.
- **Rules engine findings are never downgraded by semantic results** — the deterministic layer is the injection-proof floor.
