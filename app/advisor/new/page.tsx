"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { SeverityBadge } from "@/components/severity-badge";
import { RiskScoreRing } from "@/components/risk-score-ring";

interface User { id: string; name: string; email: string; role: string; }
interface Finding {
  ruleId: string; severity: string; category: string;
  startOffset: number; endOffset: number; matchedText: string;
  explanation: string; citation: string; suggestedFix?: string;
}

type Stage = "idle" | "pii" | "rules" | "semantic" | "complete" | "error";

const CONTENT_TYPES = [
  { value: "linkedin_post", label: "LinkedIn Post" },
  { value: "client_email", label: "Client Email" },
  { value: "seminar_flyer", label: "Seminar Flyer" },
  { value: "website_copy", label: "Website Copy" },
  { value: "other", label: "Other" },
];

export default function NewReviewPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("linkedin_post");
  const [content, setContent] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [ruleFindings, setRuleFindings] = useState<Finding[]>([]);
  const [semanticFindings, setSemanticFindings] = useState<Finding[]>([]);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [rewrite, setRewrite] = useState<string>("");
  const [rewriteDiff, setRewriteDiff] = useState<Array<{type: string; text: string}>>([]);
  const [piiLog, setPiiLog] = useState<Array<{type: string; count: number}>>([]);
  const [activeTab, setActiveTab] = useState<"findings" | "rewrite">("findings");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r => {
      if (!r.ok) { router.push("/login"); return; }
      r.json().then(({ user }) => {
        if (user.role === "principal") router.push("/principal/queue");
        else setUser(user);
      });
    });
  }, [router]);

  async function runReview() {
    if (!content.trim() || !title.trim()) {
      setError("Please enter a title and content.");
      return;
    }
    setError("");
    setStage("pii");
    setRuleFindings([]);
    setSemanticFindings([]);
    setRiskScore(null);
    setRewrite("");
    setRewriteDiff([]);

    // Create document first
    const createRes = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, contentType, content }),
    });

    if (!createRes.ok) {
      setStage("error");
      setError("Failed to create document.");
      return;
    }

    const { documentId: docId } = await createRes.json();
    setDocumentId(docId);

    // Start SSE stream
    const res = await fetch(`/api/documents/${docId}/review`, { method: "POST" });
    if (!res.ok) {
      setStage("error");
      setError("Review failed to start.");
      return;
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.stage === "pii") {
            setStage("pii");
            setPiiLog(event.piiLog ?? []);
          } else if (event.stage === "rules") {
            setStage("rules");
            setRuleFindings(event.ruleFindings ?? []);
          } else if (event.stage === "semantic") {
            setStage("semantic");
            setSemanticFindings(event.semanticFindings ?? []);
          } else if (event.stage === "complete" || event.type === "complete") {
            setStage("complete");
            setRuleFindings(event.ruleFindings ?? []);
            setSemanticFindings(event.semanticFindings ?? []);
            setRiskScore(event.riskScore ?? 0);
            setRewrite(event.rewrite ?? "");
            setRewriteDiff(event.rewriteDiff ?? []);
          } else if (event.type === "error") {
            setStage("error");
            setError(event.error ?? "Review failed");
          }
        } catch {}
      }
    }
  }

  async function submitForReview() {
    if (!documentId) return;
    setSubmitting(true);
    const res = await fetch(`/api/documents/${documentId}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit", note: "Submitted after pre-flight Greenlight review." }),
    });
    setSubmitting(false);
    if (res.ok) router.push(`/advisor/documents/${documentId}`);
  }

  const allFindings = [...ruleFindings, ...semanticFindings];
  const blockerCount = allFindings.filter(f => f.severity === "BLOCKER").length;
  const warningCount = allFindings.filter(f => f.severity === "WARNING").length;

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>
      <Nav user={user} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>New Compliance Review</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-2)" }}>
            Paste your content below for a pre-flight FINRA Rule 2210 check
          </p>
        </div>

        <div className="grid grid-cols-5 gap-6">
          {/* Left — input */}
          <div className="col-span-2 space-y-4">
            <div
              className="rounded-xl border p-5"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-2)" }}>
                    Document Title
                  </label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Q4 Newsletter — Market Update"
                    className="w-full px-3 py-2 rounded-md border text-sm outline-none"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-2)" }}>
                    Content Type
                  </label>
                  <select
                    value={contentType}
                    onChange={e => setContentType(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border text-sm outline-none"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
                  >
                    {CONTENT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-2)" }}>
                    Content
                  </label>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={12}
                    placeholder="Paste your LinkedIn post, email, flyer, or website copy here…"
                    className="w-full px-3 py-2 rounded-md border text-sm outline-none resize-none font-mono leading-relaxed"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)", fontSize: "13px" }}
                  />
                </div>

                {error && (
                  <p className="text-xs px-3 py-2 rounded-md" style={{ backgroundColor: "var(--color-blocker-light)", color: "var(--color-blocker)" }}>
                    {error}
                  </p>
                )}

                <button
                  onClick={runReview}
                  disabled={["pii", "rules", "semantic"].includes(stage)}
                  className="w-full py-2 px-4 rounded-md text-sm font-medium text-white transition-opacity"
                  style={{ backgroundColor: "var(--color-accent)", opacity: ["pii", "rules", "semantic"].includes(stage) ? 0.6 : 1 }}
                >
                  {stage === "idle" ? "Run Compliance Check" :
                   stage === "pii" ? "Scanning for PII…" :
                   stage === "rules" ? "Applying rule engine…" :
                   stage === "semantic" ? "Running semantic analysis…" :
                   stage === "complete" ? "Re-run Check" : "Run Compliance Check"}
                </button>
              </div>
            </div>

            {/* Pipeline status */}
            {stage !== "idle" && (
              <div
                className="rounded-xl border p-4"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <p className="text-xs font-medium mb-3" style={{ color: "var(--color-text-2)" }}>Pipeline</p>
                {[
                  { key: "pii", label: "PII Redaction" },
                  { key: "rules", label: "Rules Engine" },
                  { key: "semantic", label: "Semantic Analysis" },
                  { key: "complete", label: "Scoring" },
                ].map(({ key, label }) => {
                  const stageOrder = ["pii", "rules", "semantic", "complete"];
                  const currentIdx = stageOrder.indexOf(stage);
                  const stepIdx = stageOrder.indexOf(key);
                  const done = stage === "complete" || stepIdx < currentIdx;
                  const active = stepIdx === currentIdx && stage !== "complete";

                  return (
                    <div key={key} className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white flex-shrink-0"
                        style={{
                          backgroundColor: done ? "var(--color-accent)" : active ? "var(--color-warning)" : "var(--color-border)",
                          fontSize: "9px",
                        }}
                      >
                        {done ? "✓" : active ? "…" : ""}
                      </div>
                      <span className="text-xs" style={{ color: done || active ? "var(--color-text)" : "var(--color-text-3)" }}>
                        {label}
                        {key === "pii" && piiLog.length > 0 && (
                          <span style={{ color: "var(--color-text-3)" }}>
                            {" "}— {piiLog.map(l => `${l.count} ${l.type}`).join(", ")} redacted
                          </span>
                        )}
                        {key === "rules" && ruleFindings.length > 0 && (
                          <span style={{ color: "var(--color-text-3)" }}>
                            {" "}— {ruleFindings.length} finding{ruleFindings.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right — results */}
          <div className="col-span-3 space-y-4">
            {stage === "idle" && (
              <div
                className="rounded-xl border border-dashed flex items-center justify-center py-20"
                style={{ borderColor: "var(--color-border)" }}
              >
                <p className="text-sm" style={{ color: "var(--color-text-3)" }}>
                  Results will appear here after review
                </p>
              </div>
            )}

            {(stage === "rules" || stage === "semantic" || stage === "complete") && allFindings.length === 0 && stage !== "complete" && (
              <div
                className="rounded-xl border p-6"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <p className="text-sm animate-pulse" style={{ color: "var(--color-text-3)" }}>Analyzing…</p>
              </div>
            )}

            {(allFindings.length > 0 || stage === "complete") && (
              <>
                {/* Score + summary */}
                <div
                  className="rounded-xl border p-5 flex items-center gap-6"
                  style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                  {riskScore !== null && <RiskScoreRing score={riskScore} />}
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-text)" }}>
                      {stage === "complete"
                        ? blockerCount === 0
                          ? "Content may be ready for submission"
                          : `${blockerCount} blocker${blockerCount !== 1 ? "s" : ""} must be resolved`
                        : "Preliminary results…"}
                    </p>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-text-3)" }}>
                      <span style={{ color: "var(--color-blocker)" }}>{blockerCount} BLOCKER{blockerCount !== 1 ? "S" : ""}</span>
                      <span>·</span>
                      <span style={{ color: "var(--color-warning)" }}>{warningCount} WARNING{warningCount !== 1 ? "S" : ""}</span>
                      <span>·</span>
                      <span>{allFindings.filter(f => f.severity === "INFO").length} INFO</span>
                    </div>

                    {stage === "complete" && documentId && blockerCount === 0 && (
                      <button
                        onClick={submitForReview}
                        disabled={submitting}
                        className="mt-3 px-3 py-1.5 rounded-md text-xs font-medium text-white"
                        style={{ backgroundColor: "var(--color-accent)", opacity: submitting ? 0.6 : 1 }}
                      >
                        {submitting ? "Submitting…" : "Submit for Review →"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div
                  className="rounded-xl border overflow-hidden"
                  style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                  <div className="flex border-b" style={{ borderColor: "var(--color-border)" }}>
                    {(["findings", "rewrite"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="px-4 py-2.5 text-sm font-medium capitalize transition-colors"
                        style={{
                          color: activeTab === tab ? "var(--color-text)" : "var(--color-text-3)",
                          borderBottom: activeTab === tab ? "2px solid var(--color-accent)" : "2px solid transparent",
                        }}
                      >
                        {tab === "findings" ? `Findings (${allFindings.length})` : "Compliant Rewrite"}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 max-h-96 overflow-y-auto">
                    {activeTab === "findings" && (
                      <div className="space-y-3">
                        {allFindings.length === 0 ? (
                          <p className="text-sm text-center py-6" style={{ color: "var(--color-text-3)" }}>
                            No findings — content looks clean!
                          </p>
                        ) : (
                          allFindings.map((f, i) => (
                            <div
                              key={i}
                              className="rounded-lg border p-3 cursor-pointer transition-all"
                              style={{
                                borderColor: selectedFinding === f ? "var(--color-accent)" : "var(--color-border)",
                                backgroundColor: selectedFinding === f ? "var(--color-accent-light)" : "transparent",
                              }}
                              onClick={() => setSelectedFinding(selectedFinding === f ? null : f)}
                            >
                              <div className="flex items-start gap-2">
                                <SeverityBadge severity={f.severity} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium mb-0.5" style={{ color: "var(--color-text)" }}>
                                    {f.ruleId} — {f.category.replace(/_/g, " ")}
                                  </p>
                                  <p className="text-xs italic mb-1" style={{ color: "var(--color-text-2)" }}>
                                    "{f.matchedText}"
                                  </p>
                                  {selectedFinding === f && (
                                    <div className="mt-2 space-y-1.5">
                                      <p className="text-xs" style={{ color: "var(--color-text)" }}>{f.explanation}</p>
                                      <p className="text-xs" style={{ color: "var(--color-text-3)" }}>
                                        Cite: {f.citation}
                                      </p>
                                      {f.suggestedFix && (
                                        <div
                                          className="text-xs p-2 rounded"
                                          style={{ backgroundColor: "var(--color-accent-light)", color: "var(--color-accent)" }}
                                        >
                                          Fix: {f.suggestedFix}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {activeTab === "rewrite" && (
                      <div>
                        {!rewrite ? (
                          <p className="text-sm text-center py-6" style={{ color: "var(--color-text-3)" }}>
                            {stage === "complete" ? "No rewrite generated." : "Generating rewrite…"}
                          </p>
                        ) : (
                          <div className="space-y-1 text-sm leading-relaxed">
                            {rewriteDiff.length > 0 ? (
                              rewriteDiff.map((entry, i) => (
                                <span
                                  key={i}
                                  className="inline"
                                  style={{
                                    backgroundColor:
                                      entry.type === "removed"
                                        ? "var(--color-blocker-light)"
                                        : entry.type === "added"
                                        ? "var(--color-accent-light)"
                                        : "transparent",
                                    color:
                                      entry.type === "removed"
                                        ? "var(--color-blocker)"
                                        : entry.type === "added"
                                        ? "var(--color-accent)"
                                        : "var(--color-text)",
                                    textDecoration: entry.type === "removed" ? "line-through" : undefined,
                                  }}
                                >
                                  {entry.text}
                                </span>
                              ))
                            ) : (
                              <p style={{ color: "var(--color-text)" }}>{rewrite}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Highlighted document */}
            {content && (allFindings.length > 0) && (
              <div
                className="rounded-xl border p-4"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <p className="text-xs font-medium mb-3" style={{ color: "var(--color-text-2)" }}>
                  Document with inline highlights
                </p>
                <HighlightedContent content={content} findings={allFindings} selectedFinding={selectedFinding} onSelect={setSelectedFinding} />
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
  if (findings.length === 0) return <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)", fontFamily: "monospace" }}>{content}</p>;

  // Sort findings by offset and build spans
  const sorted = [...findings].sort((a, b) => a.startOffset - b.startOffset);
  const spans: Array<{ text: string; finding?: Finding }> = [];
  let cursor = 0;

  for (const f of sorted) {
    if (f.startOffset > cursor) {
      spans.push({ text: content.slice(cursor, f.startOffset) });
    }
    if (f.startOffset >= cursor) {
      spans.push({ text: content.slice(f.startOffset, f.endOffset), finding: f });
      cursor = f.endOffset;
    }
  }
  if (cursor < content.length) {
    spans.push({ text: content.slice(cursor) });
  }

  function severityBg(s: string) {
    if (s === "BLOCKER") return "var(--color-blocker-light)";
    if (s === "WARNING") return "var(--color-warning-light)";
    return "var(--color-info-light)";
  }
  function severityUnderline(s: string) {
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
            className="cursor-pointer rounded px-0.5"
            title={`${span.finding.ruleId}: ${span.finding.explanation}`}
            style={{
              backgroundColor: severityBg(span.finding.severity),
              textDecoration: `underline 2px ${severityUnderline(span.finding.severity)}`,
              outline: selectedFinding === span.finding ? `2px solid ${severityUnderline(span.finding.severity)}` : undefined,
            }}
            onClick={() => onSelect(selectedFinding === span.finding ? null : span.finding!)}
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
