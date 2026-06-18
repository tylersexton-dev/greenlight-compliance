import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "@/lib/db/schema";
import { computeEventHash, GENESIS_HASH } from "@/lib/audit/chain";
import { verifyChain } from "@/lib/audit/chain";
import { asc } from "drizzle-orm";

function makeTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "./drizzle" });
  return { db, sqlite };
}

async function insertUser(db: ReturnType<typeof makeTestDb>["db"], id: string) {
  await db.insert(schema.users).values({
    id, email: `${id}@test.com`, passwordHash: "x", name: id,
    role: "advisor", firmId: "firm-1", createdAt: new Date(),
  });
}

async function insertDocument(db: ReturnType<typeof makeTestDb>["db"], id: string, advisorId: string) {
  await db.insert(schema.documents).values({
    id, advisorId, title: "test", contentType: "other",
    status: "DRAFT", createdAt: new Date(), updatedAt: new Date(),
  });
}

describe("Audit chain seq ordering", () => {
  it("same-second events maintain correct insertion order via seq", async () => {
    const { db } = makeTestDb();
    await insertUser(db, "u1");
    await insertDocument(db, "doc1", "u1");

    const sameSecond = new Date(Math.floor(Date.now() / 1000) * 1000);

    let prevHash = GENESIS_HASH;
    const actions = ["submit", "begin_review", "approve"];

    for (const action of actions) {
      const payload = { documentId: "doc1", actor: "u1", action, timestamp: sameSecond };
      const { payloadHash, hash } = computeEventHash(payload, prevHash);
      await db.insert(schema.auditEvents).values({
        id: crypto.randomUUID(), documentId: "doc1", actor: "u1",
        action, note: null, payloadHash, prevHash, hash, timestamp: sameSecond,
      });
      prevHash = hash;
    }

    const events = await db
      .select()
      .from(schema.auditEvents)
      .orderBy(asc(schema.auditEvents.seq));

    expect(events.map((e) => e.action)).toEqual(["submit", "begin_review", "approve"]);

    // seq values are strictly increasing
    for (let i = 1; i < events.length; i++) {
      expect(events[i].seq).toBeGreaterThan(events[i - 1].seq);
    }
  });

  it("verifyChain passes when events are ordered by seq", async () => {
    const { db } = makeTestDb();
    await insertUser(db, "u1");
    await insertDocument(db, "doc1", "u1");

    const ts = new Date(Math.floor(Date.now() / 1000) * 1000);
    let prevHash = GENESIS_HASH;

    for (const action of ["submit", "begin_review", "approve"]) {
      const payload = { documentId: "doc1", actor: "u1", action, timestamp: ts };
      const { payloadHash, hash } = computeEventHash(payload, prevHash);
      await db.insert(schema.auditEvents).values({
        id: crypto.randomUUID(), documentId: "doc1", actor: "u1",
        action, note: null, payloadHash, prevHash, hash, timestamp: ts,
      });
      prevHash = hash;
    }

    const events = await db
      .select()
      .from(schema.auditEvents)
      .orderBy(asc(schema.auditEvents.seq));

    const result = verifyChain(events.map((e) => ({ ...e, note: e.note ?? undefined })));
    expect(result.valid).toBe(true);
  });
});

describe("Transaction rollback", () => {
  it("a mid-transaction failure leaves no orphaned document status change", () => {
    const { db, sqlite } = makeTestDb();

    // Sync insert of user and document
    sqlite.prepare(`INSERT INTO users (id, email, password_hash, name, role, firm_id, created_at)
      VALUES ('u1', 'u@test.com', 'x', 'u', 'advisor', 'f1', unixepoch())`).run();
    sqlite.prepare(`INSERT INTO documents (id, advisor_id, title, content_type, status, created_at, updated_at)
      VALUES ('doc1', 'u1', 'T', 'other', 'DRAFT', unixepoch(), unixepoch())`).run();

    const originalStatus = sqlite.prepare("SELECT status FROM documents WHERE id = 'doc1'").get() as { status: string };
    expect(originalStatus.status).toBe("DRAFT");

    // Attempt a transaction that deliberately throws after updating the document
    expect(() => {
      sqlite.transaction(() => {
        sqlite.prepare("UPDATE documents SET status = 'SUBMITTED' WHERE id = 'doc1'").run();
        throw new Error("Simulated audit insert failure");
      })();
    }).toThrow("Simulated audit insert failure");

    // Document must still be DRAFT
    const after = sqlite.prepare("SELECT status FROM documents WHERE id = 'doc1'").get() as { status: string };
    expect(after.status).toBe("DRAFT");
  });
});
