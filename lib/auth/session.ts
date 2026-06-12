import { cookies } from "next/headers";
import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "advisor" | "principal";
  firmId: string;
}

const SESSION_COOKIE = "gl_session";

// Sessions stored in memory for simplicity (swap to DB/Redis for production)
const sessions = new Map<string, SessionUser>();

export function createSession(user: SessionUser): string {
  const token = crypto.randomUUID();
  sessions.set(token, user);
  return token;
}

export function getSession(token: string): SessionUser | null {
  return sessions.get(token) ?? null;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getSession(token);
}

export { SESSION_COOKIE };
