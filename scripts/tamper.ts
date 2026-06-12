/**
 * Tamper script — deliberately corrupts one audit event to demo chain detection.
 * Run: npm run tamper
 * Then reload the document audit view to see the "Chain Compromised" alert.
 */
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "greenlight.db");
const sqlite = new Database(DB_PATH);

const events = sqlite
  .prepare("SELECT id, document_id, action, actor FROM audit_events ORDER BY timestamp ASC LIMIT 10")
  .all() as Array<{ id: string; document_id: string; action: string; actor: string }>;

if (events.length === 0) {
  console.error("No audit events found. Run: npm run seed");
  process.exit(1);
}

// Pick the first approve or submit event to make the tamper visible
const target = events.find((e) => e.action === "approve") ?? events[0];

const tampered = sqlite
  .prepare("UPDATE audit_events SET action = ? WHERE id = ?")
  .run("TAMPERED_approve_as_reject", target.id);

console.log(`
Tamper complete!

Document: ${target.document_id}
Event ID:  ${target.id}
Original:  action = '${target.action}'
Tampered:  action = 'TAMPERED_approve_as_reject'

Now open the document's audit trail in the UI to see the chain integrity check fail.
The "Audit chain verified ✓" badge will turn red: "Chain compromised — event tampered."
`);

sqlite.close();
