import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["advisor", "principal"] }).notNull(),
  firmId: text("firm_id").notNull().default("default"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  advisorId: text("advisor_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  contentType: text("content_type", {
    enum: ["linkedin_post", "client_email", "seminar_flyer", "website_copy", "other"],
  }).notNull(),
  status: text("status", {
    enum: [
      "DRAFT",
      "SUBMITTED",
      "IN_REVIEW",
      "CHANGES_REQUESTED",
      "RESUBMITTED",
      "APPROVED",
      "REJECTED",
      "ARCHIVED",
    ],
  })
    .notNull()
    .default("DRAFT"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const documentVersions = sqliteTable("document_versions", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id),
  version: integer("version").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
});

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id),
  versionId: text("version_id")
    .notNull()
    .references(() => documentVersions.id),
  riskScore: real("risk_score").notNull(),
  riskBreakdown: text("risk_breakdown").notNull(), // JSON
  rewrite: text("rewrite"),
  rewriteDiff: text("rewrite_diff"), // JSON
  pipelineLog: text("pipeline_log").notNull(), // JSON
  provider: text("provider").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const findings = sqliteTable("findings", {
  id: text("id").primaryKey(),
  reviewId: text("review_id")
    .notNull()
    .references(() => reviews.id),
  source: text("source", { enum: ["rules", "semantic"] }).notNull(),
  ruleId: text("rule_id").notNull(),
  category: text("category").notNull(),
  severity: text("severity", { enum: ["BLOCKER", "WARNING", "INFO"] }).notNull(),
  startOffset: integer("start_offset").notNull(),
  endOffset: integer("end_offset").notNull(),
  matchedText: text("matched_text").notNull(),
  explanation: text("explanation").notNull(),
  citation: text("citation").notNull(),
  suggestedFix: text("suggested_fix"),
});

export const auditEvents = sqliteTable("audit_events", {
  seq: integer("seq").primaryKey({ autoIncrement: true }),
  id: text("id").notNull().unique(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id),
  actor: text("actor").notNull().references(() => users.id),
  action: text("action").notNull(),
  note: text("note"),
  payloadHash: text("payload_hash").notNull(),
  prevHash: text("prev_hash").notNull(),
  hash: text("hash").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
});

export const rules = sqliteTable("rules", {
  id: text("id").primaryKey(),
  version: integer("version").notNull().default(1),
  category: text("category").notNull(),
  severity: text("severity", { enum: ["BLOCKER", "WARNING", "INFO"] }).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  citation: text("citation").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const ruleOverrides = sqliteTable("rule_overrides", {
  id: text("id").primaryKey(),
  ruleId: text("rule_id").notNull().references(() => rules.id),
  firmId: text("firm_id").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull(),
  updatedBy: text("updated_by").notNull().references(() => users.id),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  documentVersions: many(documentVersions),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  advisor: one(users, { fields: [documents.advisorId], references: [users.id] }),
  versions: many(documentVersions),
  reviews: many(reviews),
  auditEvents: many(auditEvents),
}));

export const documentVersionsRelations = relations(documentVersions, ({ one, many }) => ({
  document: one(documents, { fields: [documentVersions.documentId], references: [documents.id] }),
  createdByUser: one(users, { fields: [documentVersions.createdBy], references: [users.id] }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  document: one(documents, { fields: [reviews.documentId], references: [documents.id] }),
  version: one(documentVersions, { fields: [reviews.versionId], references: [documentVersions.id] }),
  findings: many(findings),
}));

export const findingsRelations = relations(findings, ({ one }) => ({
  review: one(reviews, { fields: [findings.reviewId], references: [reviews.id] }),
}));

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  document: one(documents, { fields: [auditEvents.documentId], references: [documents.id] }),
  actorUser: one(users, { fields: [auditEvents.actor], references: [users.id] }),
}));
