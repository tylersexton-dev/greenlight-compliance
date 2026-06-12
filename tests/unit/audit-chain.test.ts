import { describe, it, expect } from "vitest";
import { computeEventHash, verifyChain, GENESIS_HASH, canonicalize } from "@/lib/audit/chain";
import type { AuditEventRecord, AuditEventPayload } from "@/lib/audit/chain";

function makeEvent(
  id: string,
  payload: AuditEventPayload,
  prevHash: string
): AuditEventRecord {
  const { payloadHash, hash } = computeEventHash(payload, prevHash);
  return { id, ...payload, payloadHash, prevHash, hash };
}

describe("Audit Hash Chain", () => {
  const basePayload: AuditEventPayload = {
    documentId: "doc-1",
    actor: "user-1",
    action: "submit",
    timestamp: new Date("2025-01-15T10:00:00Z"),
  };

  it("computes deterministic hash for same payload + prevHash", () => {
    const r1 = computeEventHash(basePayload, GENESIS_HASH);
    const r2 = computeEventHash(basePayload, GENESIS_HASH);
    expect(r1.hash).toBe(r2.hash);
    expect(r1.payloadHash).toBe(r2.payloadHash);
  });

  it("produces different hash when prevHash changes", () => {
    const r1 = computeEventHash(basePayload, GENESIS_HASH);
    const r2 = computeEventHash(basePayload, "aaaa" + GENESIS_HASH.slice(4));
    expect(r1.hash).not.toBe(r2.hash);
  });

  it("verifies a valid 3-event chain", () => {
    const p1 = { documentId: "doc-1", actor: "user-1", action: "submit", timestamp: new Date("2025-01-15T10:00:00Z") };
    const p2 = { documentId: "doc-1", actor: "user-2", action: "begin_review", timestamp: new Date("2025-01-15T11:00:00Z") };
    const p3 = { documentId: "doc-1", actor: "user-2", action: "approve", timestamp: new Date("2025-01-15T12:00:00Z") };

    const e1 = makeEvent("e1", p1, GENESIS_HASH);
    const e2 = makeEvent("e2", p2, e1.hash);
    const e3 = makeEvent("e3", p3, e2.hash);

    const result = verifyChain([e1, e2, e3]);
    expect(result.valid).toBe(true);
    expect(result.brokenAt).toBeUndefined();
  });

  it("detects tampered payload", () => {
    const p1 = { documentId: "doc-1", actor: "user-1", action: "submit", timestamp: new Date("2025-01-15T10:00:00Z") };
    const e1 = makeEvent("e1", p1, GENESIS_HASH);

    // Tamper: change the action after the event was signed
    const tampered: AuditEventRecord = { ...e1, action: "approve" };

    const result = verifyChain([tampered]);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(0);
    expect(result.message).toMatch(/tampered/);
  });

  it("detects broken chain link", () => {
    const p1 = { documentId: "doc-1", actor: "user-1", action: "submit", timestamp: new Date() };
    const p2 = { documentId: "doc-1", actor: "user-2", action: "begin_review", timestamp: new Date() };
    const e1 = makeEvent("e1", p1, GENESIS_HASH);
    const e2 = makeEvent("e2", p2, e1.hash);

    // Tamper: insert a fake prevHash in e2
    const tampered: AuditEventRecord = { ...e2, prevHash: GENESIS_HASH };

    const result = verifyChain([e1, tampered]);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it("returns valid for empty chain", () => {
    const result = verifyChain([]);
    expect(result.valid).toBe(true);
  });

  it("verifies single-event chain", () => {
    const p = { documentId: "doc-1", actor: "user-1", action: "submit", timestamp: new Date() };
    const e = makeEvent("e1", p, GENESIS_HASH);
    expect(verifyChain([e]).valid).toBe(true);
  });
});
