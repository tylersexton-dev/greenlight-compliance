import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { documents, documentVersions, users } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";

const CreateDocSchema = z.object({
  title: z.string().min(1).max(200),
  contentType: z.enum(["linkedin_post", "client_email", "seminar_flyer", "website_copy", "other"]),
  content: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let docs;
  if (user.role === "principal") {
    // Principals see all documents from their firm
    docs = await db
      .select({
        id: documents.id,
        title: documents.title,
        contentType: documents.contentType,
        status: documents.status,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        advisorId: documents.advisorId,
        advisorName: users.name,
        advisorEmail: users.email,
      })
      .from(documents)
      .innerJoin(users, eq(documents.advisorId, users.id))
      .where(eq(users.firmId, user.firmId))
      .orderBy(desc(documents.updatedAt));
  } else {
    // Advisors see only their own documents
    docs = await db
      .select({
        id: documents.id,
        title: documents.title,
        contentType: documents.contentType,
        status: documents.status,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        advisorId: documents.advisorId,
        advisorName: users.name,
        advisorEmail: users.email,
      })
      .from(documents)
      .innerJoin(users, eq(documents.advisorId, users.id))
      .where(eq(documents.advisorId, user.id))
      .orderBy(desc(documents.updatedAt));
  }

  return NextResponse.json({ documents: docs });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "advisor") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateDocSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { title, contentType, content } = parsed.data;
  const now = new Date();
  const docId = crypto.randomUUID();
  const versionId = crypto.randomUUID();

  await db.insert(documents).values({
    id: docId,
    advisorId: user.id,
    title,
    contentType,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(documentVersions).values({
    id: versionId,
    documentId: docId,
    version: 1,
    content,
    createdAt: now,
    createdBy: user.id,
  });

  return NextResponse.json({ documentId: docId, versionId }, { status: 201 });
}
