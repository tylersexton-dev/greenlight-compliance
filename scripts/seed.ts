import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import bcrypt from "bcryptjs";
import path from "path";
import * as schema from "../lib/db/schema";
import { computeEventHash, GENESIS_HASH } from "../lib/audit/chain";
import { runRulesEngine } from "../lib/rules/engine";
import { computeRiskScore } from "../lib/scoring/risk-score";
import { RULE_REGISTRY } from "../lib/rules/registry";

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "greenlight.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

migrate(db, { migrationsFolder: "./drizzle" });
console.log("Seeding database...");

const advisor1Id = "user-advisor-1";
const advisor2Id = "user-advisor-2";
const principalId = "user-principal-1";

const DOCUMENTS = [
  {
    id: "doc-1",
    advisorId: advisor1Id,
    title: "LinkedIn Post — Retirement Planning",
    contentType: "linkedin_post" as const,
    status: "APPROVED" as const,
    content: `Ready to take control of your retirement? At Acme Wealth Management, we help clients build personalized retirement strategies aligned with their long-term goals and risk tolerance.

Our team has over 20 years of combined experience helping families navigate complex financial decisions. We believe in transparent, fiduciary-standard advice—putting your interests first, always.

Interested in a complimentary consultation? DM me or visit our website.

Investing involves risk, including the possible loss of principal. Past performance is not indicative of future results. Acme Wealth Management is a registered investment adviser.`,
    actions: [
      { action: "submit", actor: advisor1Id, note: undefined },
      { action: "begin_review", actor: principalId, note: undefined },
      { action: "approve", actor: principalId, note: "Clean and compliant. Well-written." },
    ],
  },
  {
    id: "doc-2",
    advisorId: advisor1Id,
    title: "Client Email — Q4 Market Update",
    contentType: "client_email" as const,
    status: "SUBMITTED" as const,
    content: `Dear Valued Client,

I hope this message finds you well. I wanted to reach out with a brief update on market conditions and your portfolio.

Despite recent volatility, our strategy continues to deliver strong results. Our clients who joined in 2020 are very happy with where they are now, and I'm confident you will be too.

I'm hosting a seminar next month on tax-loss harvesting strategies. Only 10 spots available—act now to reserve your seat.

Best regards,
Sarah Chen, CFP`,
    actions: [
      { action: "submit", actor: advisor1Id, note: undefined },
    ],
  },
  {
    id: "doc-3",
    advisorId: advisor1Id,
    title: "Seminar Flyer — Guaranteed Income Workshop",
    contentType: "seminar_flyer" as const,
    status: "CHANGES_REQUESTED" as const,
    content: `GUARANTEED INCOME IN RETIREMENT — Is It Possible?

Join us for a free workshop where we'll show you how to generate guaranteed income streams you can't outlive. Our top-rated advisors will walk you through annuity strategies that provide risk-free income no matter what the market does.

"This workshop changed my life—I now have complete peace of mind about retirement." — Margaret T., Client

Space is limited! Act now—this offer won't last. Call 619-555-0100 today.

Acme Wealth Management | #1 Retirement Planning Firm in San Diego`,
    actions: [
      { action: "submit", actor: advisor1Id, note: undefined },
      { action: "begin_review", actor: principalId, note: undefined },
      { action: "request_changes", actor: principalId, note: "Multiple violations: 'guaranteed', 'risk-free', unsubstantiated '#1' claim, testimonial without disclosure, urgency language. Please run Greenlight and apply the suggested rewrites before resubmitting." },
    ],
  },
  {
    id: "doc-4",
    advisorId: advisor2Id,
    title: "Website Copy — About Our Firm",
    contentType: "website_copy" as const,
    status: "APPROVED" as const,
    content: `At Acme Wealth Management, we believe everyone deserves access to professional financial guidance.

Founded in 2002, our firm has grown to serve over 500 families across San Diego County. Our advisors hold CFP® and CFA® designations and operate as fiduciaries, meaning your interests always come first.

We offer comprehensive financial planning, investment management, and retirement income strategies tailored to your unique situation.

Acme Wealth Management is a SEC-registered investment adviser. Please review our Form ADV Part 2 for full disclosure of our services, fees, and potential conflicts of interest. Investing involves risk, including the possible loss of principal.`,
    actions: [
      { action: "submit", actor: advisor2Id, note: undefined },
      { action: "begin_review", actor: principalId, note: undefined },
      { action: "approve", actor: principalId, note: "Excellent — all required disclosures present." },
    ],
  },
  {
    id: "doc-5",
    advisorId: advisor2Id,
    title: "LinkedIn Post — Market Timing Warning",
    contentType: "linkedin_post" as const,
    status: "DRAFT" as const,
    content: `Many investors try to time the market—few succeed consistently. Here's what the data shows:

Missing just the 10 best trading days of the last 20 years would have cut your returns roughly in half. This is why we advocate for a disciplined, long-term approach regardless of short-term headlines.

If you're feeling anxious about recent volatility and wondering whether to make changes to your portfolio, let's talk. A 30-minute conversation can help bring clarity.

Investing involves risk, including the possible loss of principal. Individual results will vary.`,
    actions: [],
  },
];

async function addAuditEvent(
  documentId: string,
  actor: string,
  action: string,
  note: string | undefined,
  prevHash: string,
  timestamp: Date
): Promise<string> {
  const payload = { documentId, actor, action, note, timestamp };
  const { payloadHash, hash } = computeEventHash(payload, prevHash);
  await db.insert(schema.auditEvents).values({
    id: crypto.randomUUID(),
    documentId,
    actor,
    action,
    note: note ?? null,
    payloadHash,
    prevHash,
    hash,
    timestamp,
  });
  return hash;
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const now = new Date();

  // Clear existing data
  await db.delete(schema.auditEvents);
  await db.delete(schema.findings);
  await db.delete(schema.reviews);
  await db.delete(schema.documentVersions);
  await db.delete(schema.documents);
  await db.delete(schema.ruleOverrides);
  await db.delete(schema.rules);
  await db.delete(schema.users);

  // Users
  await db.insert(schema.users).values([
    { id: advisor1Id, email: "sarah.chen@acmewealth.com", passwordHash, name: "Sarah Chen", role: "advisor", firmId: "firm-acme", createdAt: now },
    { id: advisor2Id, email: "james.morrison@acmewealth.com", passwordHash, name: "James Morrison", role: "advisor", firmId: "firm-acme", createdAt: now },
    { id: principalId, email: "compliance@acmewealth.com", passwordHash, name: "Linda Park", role: "principal", firmId: "firm-acme", createdAt: now },
  ]);

  // Rules
  for (const rule of RULE_REGISTRY) {
    await db.insert(schema.rules).values({
      id: rule.id, version: 1, category: rule.category, severity: rule.severity,
      name: rule.name, description: rule.description, citation: rule.citation,
      enabled: true, createdAt: now,
    });
  }

  // Documents
  for (const doc of DOCUMENTS) {
    const docNow = new Date();
    await db.insert(schema.documents).values({
      id: doc.id, advisorId: doc.advisorId, title: doc.title,
      contentType: doc.contentType, status: doc.status,
      createdAt: docNow, updatedAt: docNow,
    });

    const versionId = crypto.randomUUID();
    await db.insert(schema.documentVersions).values({
      id: versionId, documentId: doc.id, version: 1,
      content: doc.content, createdAt: docNow, createdBy: doc.advisorId,
    });

    if (doc.status !== "DRAFT") {
      const ruleFindings = runRulesEngine(doc.content);
      const riskResult = computeRiskScore(ruleFindings);
      const reviewId = crypto.randomUUID();

      await db.insert(schema.reviews).values({
        id: reviewId, documentId: doc.id, versionId,
        riskScore: riskResult.total,
        riskBreakdown: JSON.stringify(riskResult.breakdown),
        rewrite: null, rewriteDiff: null,
        pipelineLog: JSON.stringify({ provider: "rules-only", seed: true }),
        provider: "rules", createdAt: docNow,
      });

      for (const finding of ruleFindings) {
        await db.insert(schema.findings).values({
          id: crypto.randomUUID(), reviewId, source: "rules",
          ruleId: finding.ruleId, category: finding.category, severity: finding.severity,
          startOffset: finding.startOffset, endOffset: finding.endOffset,
          matchedText: finding.matchedText, explanation: finding.explanation,
          citation: finding.citation, suggestedFix: finding.suggestedFix ?? null,
        });
      }
    }

    // Audit chain
    let prevHash = GENESIS_HASH;
    let t = new Date(docNow.getTime() - doc.actions.length * 3_600_000);
    for (const evt of doc.actions) {
      t = new Date(t.getTime() + 3_600_000);
      prevHash = await addAuditEvent(doc.id, evt.actor, evt.action, evt.note, prevHash, t);
    }
  }

  console.log(`
Seed complete!

Users:
  Advisor 1: sarah.chen@acmewealth.com / password123
  Advisor 2: james.morrison@acmewealth.com / password123
  Principal: compliance@acmewealth.com / password123

Documents seeded: ${DOCUMENTS.length}
  - 2 APPROVED (clean)
  - 1 SUBMITTED (implied promise + urgency)
  - 1 CHANGES_REQUESTED (flagrant violations)
  - 1 DRAFT (clean)

Run: npm run dev
`);

  sqlite.close();
}

main().catch(err => { console.error(err); process.exit(1); });
