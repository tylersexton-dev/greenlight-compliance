import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ruleOverrides } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { RULE_REGISTRY } from "@/lib/rules/registry";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "principal") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const overrides = await db
    .select()
    .from(ruleOverrides)
    .where(eq(ruleOverrides.firmId, user.firmId));

  const overrideMap = new Map(overrides.map(o => [o.ruleId, o.enabled]));

  const rules = RULE_REGISTRY.map(r => ({
    id: r.id,
    category: r.category,
    severity: r.severity,
    name: r.name,
    description: r.description,
    citation: r.citation,
    enabled: overrideMap.has(r.id) ? overrideMap.get(r.id)! : true,
    overridden: overrideMap.has(r.id),
  }));

  return NextResponse.json({ rules });
}

const ToggleSchema = z.object({
  ruleId: z.string(),
  enabled: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "principal") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = ToggleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { ruleId, enabled } = parsed.data;

  if (!RULE_REGISTRY.find(r => r.id === ruleId)) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }

  const existing = await db
    .select()
    .from(ruleOverrides)
    .where(and(eq(ruleOverrides.ruleId, ruleId), eq(ruleOverrides.firmId, user.firmId)))
    .limit(1);

  const now = new Date();

  if (existing.length > 0) {
    await db
      .update(ruleOverrides)
      .set({ enabled, updatedBy: user.id, updatedAt: now })
      .where(and(eq(ruleOverrides.ruleId, ruleId), eq(ruleOverrides.firmId, user.firmId)));
  } else {
    await db.insert(ruleOverrides).values({
      id: crypto.randomUUID(),
      ruleId,
      firmId: user.firmId,
      enabled,
      updatedBy: user.id,
      updatedAt: now,
    });
  }

  return NextResponse.json({ ruleId, enabled });
}
