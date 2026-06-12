import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { documents, reviews, findings, auditEvents, users } from "@/lib/db/schema";
import { eq, desc, asc, count, avg, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "principal") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Document status breakdown
  const statusCounts = await db
    .select({ status: documents.status, count: count() })
    .from(documents)
    .groupBy(documents.status);

  // Total documents
  const totalDocs = statusCounts.reduce((s, r) => s + r.count, 0);
  const approvedCount = statusCounts.find(r => r.status === "APPROVED")?.count ?? 0;
  const complianceRate = totalDocs > 0 ? Math.round((approvedCount / totalDocs) * 100) : 0;

  // Average risk score across all reviews
  const avgScoreResult = await db
    .select({ avg: avg(reviews.riskScore) })
    .from(reviews);
  const avgRiskScore = Math.round(Number(avgScoreResult[0]?.avg ?? 0));

  // Finding counts by category
  const findingsByCategory = await db
    .select({ category: findings.category, count: count(), severity: findings.severity })
    .from(findings)
    .groupBy(findings.category, findings.severity);

  // Finding counts by severity
  const findingsBySeverity = await db
    .select({ severity: findings.severity, count: count() })
    .from(findings)
    .groupBy(findings.severity);

  // Recent documents (last 10) with risk scores
  const recentDocs = await db
    .select({
      id: documents.id,
      title: documents.title,
      status: documents.status,
      contentType: documents.contentType,
      updatedAt: documents.updatedAt,
      advisorName: users.name,
      riskScore: reviews.riskScore,
    })
    .from(documents)
    .innerJoin(users, eq(documents.advisorId, users.id))
    .leftJoin(reviews, eq(reviews.documentId, documents.id))
    .orderBy(desc(documents.updatedAt))
    .limit(10);

  // Top violation categories (by finding count)
  const categoryTotals: Record<string, number> = {};
  for (const row of findingsByCategory) {
    categoryTotals[row.category] = (categoryTotals[row.category] ?? 0) + row.count;
  }
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));

  // Review turnaround: avg hours between submit and first review action
  const submitEvents = await db
    .select({ documentId: auditEvents.documentId, timestamp: auditEvents.timestamp })
    .from(auditEvents)
    .where(eq(auditEvents.action, "submit"))
    .orderBy(asc(auditEvents.timestamp));

  const reviewEvents = await db
    .select({ documentId: auditEvents.documentId, timestamp: auditEvents.timestamp })
    .from(auditEvents)
    .where(eq(auditEvents.action, "begin_review"))
    .orderBy(asc(auditEvents.timestamp));

  const turnaroundHours: number[] = [];
  for (const submit of submitEvents) {
    const review = reviewEvents.find(r => r.documentId === submit.documentId);
    if (review) {
      const diffMs = review.timestamp.getTime() - submit.timestamp.getTime();
      turnaroundHours.push(diffMs / (1000 * 60 * 60));
    }
  }
  const avgTurnaroundHours =
    turnaroundHours.length > 0
      ? Math.round((turnaroundHours.reduce((a, b) => a + b, 0) / turnaroundHours.length) * 10) / 10
      : 0;

  return NextResponse.json({
    summary: {
      totalDocuments: totalDocs,
      complianceRate,
      avgRiskScore,
      avgTurnaroundHours,
      pendingReview: (statusCounts.find(r => r.status === "SUBMITTED")?.count ?? 0) +
        (statusCounts.find(r => r.status === "RESUBMITTED")?.count ?? 0),
    },
    statusBreakdown: statusCounts,
    findingsBySeverity,
    topCategories,
    recentDocuments: recentDocs,
  });
}
