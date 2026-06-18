"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Nav } from "@/components/nav";
import { StatusBadge } from "@/components/status-badge";
import { SeverityBadge } from "@/components/severity-badge";
import { RiskScoreRing } from "@/components/risk-score-ring";

interface User { id: string; name: string; email: string; role: string; }
interface DocRecord { id: string; title: string; contentType: string; status: string; advisorId: string; updatedAt: string; }
interface VersionRecord { content: string; version: number; }
interface ReviewRecord { riskScore: number; riskBreakdown: string; }
interface Finding {
  id: string; ruleId: string; severity: string; category: string;
  startOffset: number; endOffset: number; matchedText: string;
  explanation: string; citation: string; suggestedFix?: string; source: string;
}
interface AuditEvent {
  id: string; action: string; actorName: string; note?: string; timestamp: string;
}

export default function DocumentDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [doc, setDoc] = useState<DocRecord | null>(null);
  const [latestVersion, setLatestVersion] = useState<VersionRecord | null>(null);
  const [review, setReview] = useState<ReviewRecord | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [chainVerification, setChainVerification] = useState<{ valid: boolean; message: string } | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [activeTab, setActiveTab] = useState<"findings" | "audit">("findings");
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  async function loadData() {
    const [meRes, docRes, auditRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch(`/api/documents/${id}`),
      fetch(`/api/documents/${id}/audit`),
    ]);

    if (!meRes.ok) { router.push("/login"); return; }
    const { user } = await meRes.json();
    setUser(user);

    if (docRes.ok) {
      const data = await docRes.json();
      setDoc(data.document);
      setLatestVersion(data.versions[0] ?? null);
      setReview(data.latestReview);
      setFindings(data.findings ?? []);
    }

    if (auditRes.ok) {
      const data = await auditRes.json();
      setAuditEvents(data.events ?? []);
      setChainVerification(data.verification ?? null);
    }

    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [id]);

  async function doTransition(action: string, note?: string) {
    setTransitioning(true);
    const res = await fetch(`/api/documents/${id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    setTransitioning(false);
    if (res.ok) loadData();
  }

  if (loading || !user) return null;
  if (!doc) return <div className="p-8 text-sm" style={{ color: "var(--color-text-2)" }}>Document not found</div>;

  const content = latestVersion?.content ?? "";
  const riskScore = review ? JSON.parse(typeof review.riskBreakdown === "string" ? '{}' : '{}') : null;
  const parsedScore = review?.riskScore ?? null;

  const blockerCount = findings.filter(f => f.severity === "BLOCKER").length;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>
      <Nav user={user} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => router.back()} className="text-xs" style={{ color: "var(--color-text-3)" }}>
                ← Back
              </button>
            </div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>{doc.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={doc.status} />
              <span className="text-xs" style={{ color: "var(--color-text-3)" }}>
                Updated {new Date(doc.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {doc.status === "DRAFT" && user.role === "advisor" && (
              <button
                onClick={() => doTransition("submit")}
                disabled={transitioning || blockerCount > 0}
                className="px-4 py-2 rounded-md text-sm font-medium text-white"
                style={{ backgroundColor: "var(--color-accent)", opacity: transitioning || blockerCount > 0 ? 0.5 : 1 }}
                title={blockerCount > 0 ? "Resolve BLOCKERs before submitting" : undefined}
              >
                Submit for Review
              </button>
            )}
            {doc.status === "CHANGES_REQUESTED" && user.role === "advisor" && (
              <button
                onClick={() => doTransition("resubmit", "Addressed requested changes.")}
                disabled={transitioning}
                className="px-4 py-2 rounded-md text-sm font-medium text-white"
                style={{ backgroundColor: "var(--color-accent)", opacity: transitioning ? 0.5 : 1 }}
              >
                Resubmit
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-6">
          {/* Document content */}
          <div className="col-span-3 space-y-4">
            {/* Content with highlights */}
            <div
              className="rounded-xl border p-5"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              <p className="text-xs font-medium mb-3" style={{ color: "var(--color-text-2)" }}>Content</p>
              <HighlightedContent
                content={content}
                findings={findings}
                selectedFinding={selectedFinding}
                onSelect={setSelectedFinding}
              />
            </div>

            {/* Tabs */}
            <div
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              <div className="flex border-b" style={{ borderColor: "var(--color-border)" }}>
                <button
                  onClick={() => setActiveTab("findings")}
                  className="px-4 py-2.5 text-sm font-medium"
                  style={{
                    color: activeTab === "findings" ? "var(--color-text)" : "var(--color-text-3)",
                    borderBottom: activeTab === "findings" ? "2px solid var(--color-accent)" : "2px solid transparent",
                  }}
                >
                  Findings ({findings.length})
                </button>
                <button
                  onClick={() => setActiveTab("audit")}
                  className="px-4 py-2.5 text-sm font-medium flex items-center gap-1.5"
                  style={{
                    color: activeTab === "audit" ? "var(--color-text)" : "var(--color-text-3)",
                    borderBottom: activeTab === "audit" ? "2px solid var(--color-accent)" : "2px solid transparent",
                  }}
                >
                  Audit Trail
                  {chainVerification && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: chainVerification.valid ? "var(--color-accent-light)" : "var(--color-blocker-light)",
                        color: chainVerification.valid ? "var(--color-accent)" : "var(--color-blocker)",
                      }}
                    >
                      {chainVerification.valid ? "✓" : "!"}
                    </span>
                  )}
                </button>
              </div>

              <div className="p-4 max-h-80 overflow-y-auto">
                {activeTab === "findings" && (
                  <div className="space-y-2">
                    {findings.length === 0 ? (
                      <p className="text-sm text-center py-4" style={{ color: "var(--color-text-3)" }}>No findings recorded</p>
                    ) : (
                      findings.map(f => (
                        <div
                          key={f.id}
                          className="rounded-lg border p-3 cursor-pointer"
                          style={{
                            borderColor: selectedFinding?.id === f.id ? "var(--color-accent)" : "var(--color-border)",
                            backgroundColor: selectedFinding?.id === f.id ? "var(--color-accent-light)" : "transparent",
                          }}
                          onClick={() => setSelectedFinding(selectedFinding?.id === f.id ? null : f)}
                        >
                          <div className="flex items-start gap-2">
                            <SeverityBadge severity={f.severity} />
                            <div className="flex-1">
                              <p className="text-xs font-medium" style={{ color: "var(--color-text)" }}>
                                {f.ruleId} · {f.category.replace(/_/g, " ")}
                              </p>
                              <p className="text-xs italic mt-0.5" style={{ color: "var(--color-text-2)" }}>&quot;{f.matchedText}&quot;</p>
                              {selectedFinding?.id === f.id && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs" style={{ color: "var(--color-text)" }}>{f.explanation}</p>
                                  <p className="text-xs" style={{ color: "var(--color-text-3)" }}>{f.citation}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "audit" && (
                  <div>
                    {chainVerification && (
                      <div
                        className="mb-3 px-3 py-2 rounded-md text-xs"
                        style={{
                          backgroundColor: chainVerification.valid ? "var(--color-accent-light)" : "var(--color-blocker-light)",
                          color: chainVerification.valid ? "var(--color-accent)" : "var(--color-blocker)",
                        }}
                      >
                        {chainVerification.valid ? "✓ Audit chain verified" : "⚠ " + chainVerification.message}
                      </div>
                    )}
                    <div className="space-y-2">
                      {auditEvents.map((evt, i) => (
                        <div key={evt.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                              style={{ backgroundColor: "var(--color-accent)" }}
                            />
                            {i < auditEvents.length - 1 && (
                              <div className="w-px flex-1 mt-1" style={{ backgroundColor: "var(--color-border)" }} />
                            )}
                          </div>
                          <div className="pb-3">
                            <p className="text-xs font-medium" style={{ color: "var(--color-text)" }}>
                              {evt.action.replace(/_/g, " ")}
                            </p>
                            <p className="text-xs" style={{ color: "var(--color-text-3)" }}>
                              {evt.actorName} · {new Date(evt.timestamp).toLocaleString()}
                            </p>
                            {evt.note && (
                              <p className="text-xs mt-0.5 italic" style={{ color: "var(--color-text-2)" }}>{evt.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="col-span-2 space-y-4">
            {parsedScore !== null && (
              <div
                className="rounded-xl border p-5 flex flex-col items-center gap-3"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <RiskScoreRing score={parsedScore} size={96} />
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                    {parsedScore < 30 ? "Low Risk" : parsedScore < 60 ? "Moderate Risk" : "High Risk"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-3)" }}>
                    {blockerCount} blocker{blockerCount !== 1 ? "s" : ""} · {findings.filter(f => f.severity === "WARNING").length} warnings
                  </p>
                </div>
              </div>
            )}

            {/* Principal notes */}
            {doc.status === "CHANGES_REQUESTED" && (
              <div
                className="rounded-xl border p-4"
                style={{ backgroundColor: "var(--color-warning-light)", borderColor: "var(--color-warning)" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-warning)" }}>Changes Requested</p>
                {auditEvents.filter(e => e.action === "request_changes").map(e => (
                  <p key={e.id} className="text-xs" style={{ color: "var(--color-text)" }}>{e.note}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function HighlightedContent({ content, findings, selectedFinding, onSelect }: {
  content: string;
  findings: Finding[];
  selectedFinding: Finding | null;
  onSelect: (f: Finding | null) => void;
}) {
  if (!content) return null;
  if (findings.length === 0) {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-text)", fontFamily: "monospace", fontSize: "13px" }}>{content}</p>;
  }

  const sorted = [...findings].sort((a, b) => a.startOffset - b.startOffset);
  const spans: Array<{ text: string; finding?: Finding }> = [];
  let cursor = 0;

  for (const f of sorted) {
    if (f.startOffset > cursor) spans.push({ text: content.slice(cursor, f.startOffset) });
    if (f.startOffset >= cursor) {
      spans.push({ text: content.slice(f.startOffset, f.endOffset), finding: f });
      cursor = f.endOffset;
    }
  }
  if (cursor < content.length) spans.push({ text: content.slice(cursor) });

  function bg(s: string) {
    if (s === "BLOCKER") return "var(--color-blocker-light)";
    if (s === "WARNING") return "var(--color-warning-light)";
    return "var(--color-info-light)";
  }
  function ul(s: string) {
    if (s === "BLOCKER") return "var(--color-blocker)";
    if (s === "WARNING") return "var(--color-warning)";
    return "var(--color-info)";
  }

  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-text)", fontFamily: "monospace", fontSize: "13px" }}>
      {spans.map((span, i) =>
        span.finding ? (
          <mark
            key={i}
            className="cursor-pointer rounded"
            style={{
              backgroundColor: bg(span.finding.severity),
              textDecoration: `underline 2px ${ul(span.finding.severity)}`,
              outline: selectedFinding?.id === span.finding.id ? `2px solid ${ul(span.finding.severity)}` : undefined,
              padding: "0 2px",
            }}
            onClick={() => onSelect(selectedFinding?.id === span.finding?.id ? null : span.finding!)}
          >
            {span.text}
          </mark>
        ) : (
          <span key={i}>{span.text}</span>
        )
      )}
    </div>
  );
}
