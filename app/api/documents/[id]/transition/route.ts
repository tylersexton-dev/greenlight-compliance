import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { documents, auditEvents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { transition, canTransition } from "@/lib/state-machine/document-states";
import type { TransitionAction } from "@/lib/state-machine/document-states";
import { computeEventHash, GENESIS_HASH } from "@/lib/audit/chain";

const TransitionSchema = z.object({
  action: z.enum(["submit", "begin_review", "request_changes", "resubmit", "approve", "reject", "archive"]),
  note: z.string().max(1000).optional(),
});

const ROLE_ACTIONS: Record<string, TransitionAction[]> = {
  advisor: ["submit", "resubmit", "archive"],
  principal: ["begin_review", "request_changes", "approve", "reject", "archive"],
};

export async function POST(
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = TransitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { action, note } = parsed.data;

  const allowedActions = ROLE_ACTIONS[user.role] ?? [];
  if (!allowedActions.includes(action)) {
    return NextResponse.json({ error: `Role '${user.role}' cannot perform action '${action}'` }, { status: 403 });
  }

  const currentStatus = doc.status as Parameters<typeof transition>[0];
  if (!canTransition(currentStatus, action)) {
    return NextResponse.json(
      { error: `Cannot perform '${action}' from state '${currentStatus}'` },
      { status: 409 }
    );
  }

  const newStatus = transition(currentStatus, action);
  const now = new Date();

  // Fetch chain tip before entering transaction (read-only, safe outside)
  const [lastEvent] = await db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.documentId, id))
    .orderBy(desc(auditEvents.seq))
    .limit(1);

  const prevHash = lastEvent?.hash ?? GENESIS_HASH;
  const eventPayload = { documentId: id, actor: user.id, action, note, timestamp: now };
  const { payloadHash, hash } = computeEventHash(eventPayload, prevHash);

  // Both writes in one transaction — an unaudited state change must never persist
  db.transaction((tx) => {
    tx.update(documents).set({ status: newStatus, updatedAt: now }).where(eq(documents.id, id)).run();
    tx.insert(auditEvents).values({
      id: crypto.randomUUID(),
      documentId: id,
      actor: user.id,
      action,
      note: note ?? null,
      payloadHash,
      prevHash,
      hash,
      timestamp: now,
    }).run();
  });

  return NextResponse.json({ status: newStatus, action });
}
