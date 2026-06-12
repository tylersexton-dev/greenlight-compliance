"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { StatusBadge } from "@/components/status-badge";
import { RiskScoreRing } from "@/components/risk-score-ring";

interface User { id: string; name: string; email: string; role: string; }
interface Analytics {
  summary: { totalDocuments: number; complianceRate: number; avgRiskScore: number; avgTurnaroundHours: number; pendingReview: number };
  statusBreakdown: { status: string; count: number }[];
  findingsBySeverity: { severity: string; count: number }[];
  topCategories: { category: string; count: number }[];
  recentDocuments: { id: string; title: string; status: string; contentType: string; updatedAt: string; advisorName: string; riskScore: number | null }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  guarantees: "Guarantees", performance_claims: "Performance Claims",
  superlatives: "Superlatives", testimonials: "Testimonials",
  misleading_comparisons: "Comparisons", urgency_pressure: "Urgency/Pressure",
  missing_disclosures: "Missing Disclosures",
};

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "var(--color-border)", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, backgroundColor: color, transition: "width 0.6s ease" }} />
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <p className="text-xs mb-2" style={{ color: "var(--color-text-3)" }}>{label}</p>
      <p className="text-3xl font-bold tracking-tight" style={{ color: color ?? "var(--color-text)", lineHeight: 1 }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "var(--color-text-3)" }}>{sub}</p>}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) { router.push("/login"); return; }
      const { user } = await meRes.json();
      if (user.role !== "principal") { router.push("/advisor"); return; }
      setUser(user);

      const res = await fetch("/api/analytics");
      if (res.ok) setData(await res.json());
      setLoading(false);
    }
    load();
  }, [router]);

  if (!user) return null;

  const maxCategoryCount = data ? Math.max(...data.topCategories.map(c => c.count), 1) : 1;
  const totalFindings = data?.findingsBySeverity.reduce((s, r) => s + r.count, 0) ?? 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>
      <Nav user={user} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-2)" }}>Firm-wide compliance health</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm" style={{ color: "var(--color-text-3)" }}>Loading…</p>
          </div>
        ) : !data ? null : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Documents" value={data.summary.totalDocuments} />
              <StatCard
                label="Compliance Rate"
                value={`${data.summary.complianceRate}%`}
                sub="Documents approved"
                color={data.summary.complianceRate >= 70 ? "var(--color-accent)" : "var(--color-warning)"}
              />
              <StatCard
                label="Avg Risk Score"
                value={data.summary.avgRiskScore}
                sub="Across all reviews"
                color={data.summary.avgRiskScore < 30 ? "var(--color-accent)" : data.summary.avgRiskScore < 60 ? "var(--color-warning)" : "var(--color-blocker)"}
              />
              <StatCard
                label="Pending Review"
                value={data.summary.pendingReview}
                sub="Needs your attention"
                color={data.summary.pendingReview > 0 ? "var(--color-warning)" : "var(--color-accent)"}
              />
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              {/* Top violation categories */}
              <div
                className="col-span-2 rounded-xl border p-5"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <p className="text-sm font-medium mb-4" style={{ color: "var(--color-text)" }}>Top Violation Categories</p>
                {data.topCategories.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--color-text-3)" }}>No findings recorded yet</p>
                ) : (
                  <div className="space-y-3">
                    {data.topCategories.map(({ category, count }) => (
                      <div key={category} className="flex items-center gap-3">
                        <span className="text-xs w-40 flex-shrink-0" style={{ color: "var(--color-text-2)" }}>
                          {CATEGORY_LABELS[category] ?? category}
                        </span>
                        <Bar value={count} max={maxCategoryCount} color="var(--color-warning)" />
                        <span className="text-xs w-6 text-right font-medium flex-shrink-0" style={{ color: "var(--color-text)" }}>{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Severity breakdown */}
              <div
                className="rounded-xl border p-5"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <p className="text-sm font-medium mb-4" style={{ color: "var(--color-text)" }}>Findings by Severity</p>
                {totalFindings === 0 ? (
                  <p className="text-sm" style={{ color: "var(--color-text-3)" }}>No findings yet</p>
                ) : (
                  <div className="space-y-4">
                    {[
                      { key: "BLOCKER", color: "var(--color-blocker)" },
                      { key: "WARNING", color: "var(--color-warning)" },
                      { key: "INFO", color: "var(--color-info)" },
                    ].map(({ key, color }) => {
                      const row = data.findingsBySeverity.find(r => r.severity === key);
                      const n = row?.count ?? 0;
                      const pct = totalFindings > 0 ? Math.round((n / totalFindings) * 100) : 0;
                      return (
                        <div key={key}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-medium" style={{ color }}>{key}</span>
                            <span className="text-xs" style={{ color: "var(--color-text-3)" }}>{n} ({pct}%)</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, backgroundColor: "var(--color-border)", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, backgroundColor: color, transition: "width 0.6s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
                      <p className="text-xs" style={{ color: "var(--color-text-3)" }}>{totalFindings} total findings</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status breakdown */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div
                className="rounded-xl border p-5"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <p className="text-sm font-medium mb-4" style={{ color: "var(--color-text)" }}>Document Status Breakdown</p>
                <div className="space-y-2">
                  {data.statusBreakdown
                    .sort((a, b) => b.count - a.count)
                    .map(({ status, count }) => (
                      <div key={status} className="flex items-center justify-between py-1">
                        <StatusBadge status={status} />
                        <div className="flex items-center gap-3">
                          <Bar value={count} max={data.summary.totalDocuments} color="var(--color-accent)" />
                          <span className="text-xs font-medium w-4 text-right" style={{ color: "var(--color-text)" }}>{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Turnaround time */}
              <div
                className="rounded-xl border p-5 flex flex-col justify-between"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <p className="text-sm font-medium mb-4" style={{ color: "var(--color-text)" }}>Review Turnaround</p>
                <div className="text-center py-4">
                  <p className="text-5xl font-bold tracking-tight" style={{ color: "var(--color-accent)", lineHeight: 1 }}>
                    {data.summary.avgTurnaroundHours}h
                  </p>
                  <p className="text-sm mt-2" style={{ color: "var(--color-text-3)" }}>avg submit → review start</p>
                </div>
                <div className="pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                  <p className="text-xs" style={{ color: "var(--color-text-3)" }}>
                    Based on {data.statusBreakdown.filter(s => !["DRAFT"].includes(s.status)).reduce((a, b) => a + b.count, 0)} submitted documents
                  </p>
                </div>
              </div>
            </div>

            {/* Recent documents */}
            <div
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Recent Documents</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {["Title", "Advisor", "Status", "Risk Score", "Updated"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: "var(--color-text-3)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recentDocuments.map((doc, i) => (
                    <tr
                      key={doc.id}
                      className="cursor-pointer hover:opacity-75"
                      style={{ borderBottom: i < data.recentDocuments.length - 1 ? "1px solid var(--color-border)" : undefined }}
                      onClick={() => router.push(`/principal/documents/${doc.id}`)}
                    >
                      <td className="px-4 py-2.5">
                        <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{doc.title}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs" style={{ color: "var(--color-text-2)" }}>{doc.advisorName}</span>
                      </td>
                      <td className="px-4 py-2.5"><StatusBadge status={doc.status} /></td>
                      <td className="px-4 py-2.5">
                        {doc.riskScore != null ? (
                          <span className="text-sm font-semibold" style={{
                            color: doc.riskScore < 30 ? "var(--color-accent)" : doc.riskScore < 60 ? "var(--color-warning)" : "var(--color-blocker)"
                          }}>{doc.riskScore}</span>
                        ) : <span className="text-xs" style={{ color: "var(--color-text-3)" }}>—</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs" style={{ color: "var(--color-text-3)" }}>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
