import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { documents, documentVersions, reviews, findings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { runReviewPipeline } from "@/lib/pipeline/review-pipeline";
import type { PipelineProgress } from "@/lib/pipeline/review-pipeline";
import { RULE_REGISTRY } from "@/lib/rules/registry";

// Simple in-memory token bucket rate limiter
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(userId);
  if (!entry || now > entry.resetAt) {
    requestCounts.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  const { id } = await params;

  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role === "advisor" && doc.advisorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [latestVersion] = await db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.documentId, id))
    .orderBy(desc(documentVersions.version))
    .limit(1);

  if (!latestVersion) {
    return NextResponse.json({ error: "No content to review" }, { status: 400 });
  }

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: PipelineProgress & { type: string }) {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      try {
        const result = await runReviewPipeline({
          content: latestVersion.content,
          contentType: doc.contentType,
          enabledRuleIds: RULE_REGISTRY.map((r) => r.id),
          onProgress: (progress) => {
            send({ type: "progress", ...progress });
          },
        });

        // Persist review to DB
        const reviewId = crypto.randomUUID();
        const now = new Date();

        await db.insert(reviews).values({
          id: reviewId,
          documentId: id,
          versionId: latestVersion.id,
          riskScore: result.riskScore,
          riskBreakdown: JSON.stringify(result.riskBreakdown),
          rewrite: result.rewrite,
          rewriteDiff: JSON.stringify(result.rewriteDiff),
          pipelineLog: JSON.stringify({ piiLog: result.piiLog, provider: result.provider }),
          provider: result.provider,
          createdAt: now,
        });

        // Persist findings
        for (const finding of result.allFindings) {
          await db.insert(findings).values({
            id: crypto.randomUUID(),
            reviewId,
            source: "ruleId" in finding && finding.ruleId.startsWith("SEM-") ? "semantic" : "rules",
            ruleId: finding.ruleId,
            category: finding.category,
            severity: finding.severity,
            startOffset: finding.startOffset,
            endOffset: finding.endOffset,
            matchedText: ("matchedText" in finding ? finding.matchedText : undefined) ?? ("quotedSpan" in finding ? (finding as { quotedSpan: string }).quotedSpan : ""),
            explanation: finding.explanation,
            citation: finding.citation,
            suggestedFix: finding.suggestedFix ?? null,
          });
        }

        send({ type: "complete", stage: "complete", ...result });
      } catch (err) {
        send({
          type: "error",
          stage: "complete",
          error: err instanceof Error ? err.message : "Review pipeline failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
