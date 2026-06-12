import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { documents, auditEvents, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { verifyChain } from "@/lib/audit/chain";
import type { AuditEventRecord } from "@/lib/audit/chain";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "advisor" && doc.advisorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const events = await db
    .select({
      id: auditEvents.id,
      documentId: auditEvents.documentId,
      actor: auditEvents.actor,
      actorName: users.name,
      action: auditEvents.action,
      note: auditEvents.note,
      payloadHash: auditEvents.payloadHash,
      prevHash: auditEvents.prevHash,
      hash: auditEvents.hash,
      timestamp: auditEvents.timestamp,
    })
    .from(auditEvents)
    .innerJoin(users, eq(auditEvents.actor, users.id))
    .where(eq(auditEvents.documentId, id))
    .orderBy(asc(auditEvents.timestamp));

  // Verify chain integrity
  const chainRecords: AuditEventRecord[] = events.map((e) => ({
    id: e.id,
    documentId: e.documentId,
    actor: e.actor,
    action: e.action,
    note: e.note ?? undefined,
    payloadHash: e.payloadHash,
    prevHash: e.prevHash,
    hash: e.hash,
    timestamp: e.timestamp,
  }));

  const verification = verifyChain(chainRecords);

  return NextResponse.json({
    events,
    verification,
  });
}
