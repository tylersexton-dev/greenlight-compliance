import { NextRequest, NextResponse } from "next/server";
import { destroySession, SESSION_COOKIE } from "@/lib/auth/session";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) destroySession(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
