import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json({ user });
}
