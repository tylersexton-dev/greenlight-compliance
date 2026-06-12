import { createHash } from "crypto";

export interface AuditEventPayload {
  documentId: string;
  actor: string;
  action: string;
  note?: string;
  timestamp: Date;
}

export interface AuditEventRecord extends AuditEventPayload {
  id: string;
  payloadHash: string;
  prevHash: string;
  hash: string;
}

export const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Canonical serialization of event data (deterministic JSON key order).
 */
export function canonicalize(event: AuditEventPayload): string {
  // Normalize to second precision because SQLite stores integer timestamps in seconds.
  // This ensures the hash computed before storage matches the hash computed after retrieval.
  const ts = new Date(Math.floor(event.timestamp.getTime() / 1000) * 1000);
  return JSON.stringify({
    documentId: event.documentId,
    actor: event.actor,
    action: event.action,
    note: event.note ?? null,
    timestamp: ts.toISOString(),
  });
}

export function sha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Compute the chain hash for a new event given the previous hash.
 */
export function computeEventHash(
  payload: AuditEventPayload,
  prevHash: string
): { payloadHash: string; hash: string } {
  const canonical = canonicalize(payload);
  const payloadHash = sha256(canonical);
  const hash = sha256(prevHash + canonical);
  return { payloadHash, hash };
}

/**
 * Verify an ordered list of audit events form an unbroken hash chain.
 * Returns true if valid, or throws with the index of the first broken link.
 */
export function verifyChain(events: AuditEventRecord[]): {
  valid: boolean;
  brokenAt?: number;
  message: string;
} {
  if (events.length === 0) return { valid: true, message: "Empty chain — nothing to verify." };

  let prevHash = GENESIS_HASH;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const { payloadHash, hash } = computeEventHash(
      {
        documentId: event.documentId,
        actor: event.actor,
        action: event.action,
        note: event.note,
        timestamp: event.timestamp,
      },
      prevHash
    );

    if (event.prevHash !== prevHash) {
      return {
        valid: false,
        brokenAt: i,
        message: `Chain broken at event ${i} (id: ${event.id}): prevHash mismatch.`,
      };
    }
    if (event.payloadHash !== payloadHash) {
      return {
        valid: false,
        brokenAt: i,
        message: `Chain broken at event ${i} (id: ${event.id}): payloadHash mismatch — event data was tampered.`,
      };
    }
    if (event.hash !== hash) {
      return {
        valid: false,
        brokenAt: i,
        message: `Chain broken at event ${i} (id: ${event.id}): hash mismatch — chain link was tampered.`,
      };
    }

    prevHash = event.hash;
  }

  return { valid: true, message: `Audit chain verified — ${events.length} events intact.` };
}
