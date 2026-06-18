# Greenlight — Compliance Copilot for Financial Advisors

[![CI](https://github.com/tylersexton-dev/greenlight-compliance/actions/workflows/ci.yml/badge.svg)](https://github.com/tylersexton-dev/greenlight-compliance/actions/workflows/ci.yml)

Financial advisors at broker-dealers cannot publish marketing content without compliance review under **FINRA Rule 2210**. Review queues take days. Greenlight is the pre-flight check — an advisor pastes content, and in seconds gets span-level findings, a risk score, a compliant rewrite, and a submission workflow with a tamper-evident audit trail.

**Why this matters:** A single FINRA violation can cost $10,000–$1M+ in fines. Compliance principals review hundreds of pieces of content manually. Greenlight cuts that loop from days to seconds for clear violations, letting principals focus on edge cases.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Next.js App Router (TypeScript strict, server + client)        │
├─────────────────────────────────────────────────────────────────┤
│  Review Pipeline (Server-Sent Events streaming)                 │
│                                                                 │
│  Layer 0: PII Redaction → [PHONE_1], [SSN_1], [EMAIL_1]        │
│     └─ Reversible mapping, never sends raw PII to LLM           │
│                                                                 │
│  Layer 1: Rules Engine (deterministic, zero-network)            │
│     └─ 15 rules, 7 categories, negation-window detection        │
│     └─ Returns exact char offsets → UI highlights real spans    │
│                                                                 │
│  Layer 2: LLM Semantic Review (pluggable provider interface)    │
│     └─ AnthropicProvider (claude-sonnet-4-6, JSON output)       │
│     └─ FixtureProvider (offline, recorded responses)            │
│     └─ Hallucination guard: quotedSpan must exist in document   │
│                                                                 │
│  Layer 3: Risk Scoring + Compliant Rewrite                      │
│     └─ Weighted, diminishing-returns per category (0-100)       │
├─────────────────────────────────────────────────────────────────┤
│  Document State Machine                                         │
│  DRAFT → SUBMITTED → IN_REVIEW → CHANGES_REQUESTED             │
│                    ↓                    ↓                       │
│                 APPROVED            RESUBMITTED                 │
│                 REJECTED            → IN_REVIEW                 │
│                    ↓                                            │
│                 ARCHIVED                                        │
├─────────────────────────────────────────────────────────────────┤
│  Audit Hash Chain (tamper-evident)                              │
│  hash(n) = SHA256(hash(n-1) + canonicalize(event(n)))           │
│  Verification endpoint returns pass/fail + broken event index   │
├─────────────────────────────────────────────────────────────────┤
│  SQLite + Drizzle ORM (Postgres-portable schema)                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Setup (5 commands)

```bash
git clone <repo> greenlight && cd greenlight
npm install
cp .env.example .env.local   # edit if using REVIEW_PROVIDER=anthropic
npm run seed                  # migrates DB and seeds demo data
npm run dev
# → http://localhost:3000
```

See `.env.example` for all environment variables and their descriptions.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DB_PATH` | `./greenlight.db` | SQLite database path |
| `REVIEW_PROVIDER` | `fixture` | `fixture` (offline) or `anthropic` |
| `ANTHROPIC_API_KEY` | — | Required when `REVIEW_PROVIDER=anthropic` |

---

## Demo Credentials (after `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Advisor | sarah.chen@acmewealth.com | password123 |
| Advisor | james.morrison@acmewealth.com | password123 |
| Principal | compliance@acmewealth.com | password123 |

---

## Test and Eval

```bash
npm test          # 53 unit tests
npm run eval      # 30-sample golden set — precision/recall/F1 per category
```

Eval results (rules engine, offline): 29/30 passing, 97.2% recall, 72.2% F1.
URG, SUPR, TEST categories: 100% precision and recall.

---

## Demo Script (90 seconds)

1. Login as `sarah.chen@acmewealth.com`
2. Click **New Review** and paste:
   ```
   GUARANTEED INCOME IN RETIREMENT
   Our strategy offers risk-free returns of 7% annually.
   Act now — only 3 spots left! This offer expires Friday.
   "#1 Retirement Advisor in San Diego"
   ```
3. Watch pipeline stages stream live (PII → Rules → Semantic)
4. See inline highlights — red for BLOCKERs, amber for WARNINGs
5. Click a finding to see explanation + citation + suggested fix
6. Switch to **Compliant Rewrite** tab — view diff
7. Submit → login as `compliance@acmewealth.com`
8. Open queue → click document → Begin Review → Approve
9. Click **Audit Trail** → see "Audit chain verified — N events intact"
10. In terminal: `npm run tamper` → refresh → see chain compromised alert

---

## Rule Categories

| ID | Category | Severity | Citation |
|---|---|---|---|
| GUAR-001/002 | Guarantees and promises | BLOCKER | FINRA 2210(d)(1)(A)(B) |
| PERF-001/002/003 | Performance claims | BLOCKER/WARNING | FINRA 2210(d)(1)(B) |
| SUPR-001 | Unsubstantiated superlatives | WARNING | FINRA 2210(d)(1)(A) |
| TEST-001 | Testimonials without disclosure | BLOCKER | FINRA 2210(d)(6) |
| COMP-001 | Misleading comparisons | WARNING | FINRA 2210(d)(1)(B) |
| URG-001 | Urgency and pressure language | WARNING | FINRA 2210(d)(1)(A) |
| DISC-001/002 | Missing disclosures | WARNING/INFO | FINRA 2210(d)(1)(B) |

---

## Postgres Migration

Schema is Postgres-portable. Swap `better-sqlite3` for `postgres`, update the Drizzle adapter and dialect in `drizzle.config.ts`. All column types, foreign keys, and relations are compatible.

---

## Disclaimer

The rule set is a credible, well-cited subset of FINRA Rule 2210 intended for demonstration. It does not constitute legal advice, is not comprehensive, and should not be used as a substitute for qualified compliance review.
