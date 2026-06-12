import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { documents, documentVersions, reviews, findings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Advisors can only see their own documents
  if (user.role === "advisor" && doc.advisorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const versions = await db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.documentId, id))
    .orderBy(desc(documentVersions.version));

  const latestReview = await db
    .select()
    .from(reviews)
    .where(eq(reviews.documentId, id))
    .orderBy(desc(reviews.createdAt))
    .limit(1);

  let reviewFindings: typeof findings.$inferSelect[] = [];
  if (latestReview[0]) {
    reviewFindings = await db
      .select()
      .from(findings)
      .where(eq(findings.reviewId, latestReview[0].id));
  }

  return NextResponse.json({
    document: doc,
    versions,
    latestReview: latestReview[0] ?? null,
    findings: reviewFindings,
  });
}

const UpdateDocSchema = z.object({
  content: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.advisorId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!["DRAFT", "CHANGES_REQUESTED"].includes(doc.status)) {
    return NextResponse.json({ error: "Cannot edit document in current status" }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateDocSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const existingVersions = await db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.documentId, id))
    .orderBy(desc(documentVersions.version))
    .limit(1);

  const nextVersion = (existingVersions[0]?.version ?? 0) + 1;
  const now = new Date();
  const versionId = crypto.randomUUID();

  await db.insert(documentVersions).values({
    id: versionId,
    documentId: id,
    version: nextVersion,
    content: parsed.data.content,
    createdAt: now,
    createdBy: user.id,
  });

  if (parsed.data.title) {
    await db.update(documents).set({ title: parsed.data.title, updatedAt: now }).where(eq(documents.id, id));
  } else {
    await db.update(documents).set({ updatedAt: now }).where(eq(documents.id, id));
  }

  return NextResponse.json({ versionId, version: nextVersion });
}
