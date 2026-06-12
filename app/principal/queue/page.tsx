"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { StatusBadge } from "@/components/status-badge";

interface User { id: string; name: string; email: string; role: string; }
interface Doc {
  id: string; title: string; contentType: string; status: string;
  updatedAt: string; advisorName: string; advisorEmail: string;
}

const TYPE_LABELS: Record<string, string> = {
  linkedin_post: "LinkedIn Post", client_email: "Client Email",
  seminar_flyer: "Seminar Flyer", website_copy: "Website Copy", other: "Other",
};

const STATUS_ORDER = ["SUBMITTED", "RESUBMITTED", "IN_REVIEW", "CHANGES_REQUESTED", "APPROVED", "REJECTED", "DRAFT", "ARCHIVED"];

export default function PrincipalQueue() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) { router.push("/login"); return; }
      const { user } = await meRes.json();
      if (user.role !== "principal") { router.push("/advisor"); return; }
      setUser(user);

      const docsRes = await fetch("/api/documents");
      if (docsRes.ok) {
        const data = await docsRes.json();
        setDocs(data.documents);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  if (!user) return null;

  const filtered = docs.filter(d => {
    if (filter === "active") return ["SUBMITTED", "RESUBMITTED", "IN_REVIEW"].includes(d.status);
    if (filter === "pending") return d.status === "CHANGES_REQUESTED";
    if (filter === "resolved") return ["APPROVED", "REJECTED"].includes(d.status);
    return true;
  }).sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  const activeCounts = {
    active: docs.filter(d => ["SUBMITTED", "RESUBMITTED", "IN_REVIEW"].includes(d.status)).length,
    pending: docs.filter(d => d.status === "CHANGES_REQUESTED").length,
    resolved: docs.filter(d => ["APPROVED", "REJECTED"].includes(d.status)).length,
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>
      <Nav user={user} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>Review Queue</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-2)" }}>
            Compliance submissions requiring your review
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { key: "active", label: "Needs Review", count: activeCounts.active, color: "var(--color-info)" },
            { key: "pending", label: "Changes Requested", count: activeCounts.pending, color: "var(--color-warning)" },
            { key: "resolved", label: "Resolved", count: activeCounts.resolved, color: "var(--color-accent)" },
          ].map(({ key, label, count, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="rounded-xl border p-4 text-left transition-all"
              style={{
                backgroundColor: filter === key ? "var(--color-surface)" : "transparent",
                borderColor: filter === key ? color : "var(--color-border)",
              }}
            >
              <p className="text-2xl font-bold" style={{ color }}>{count}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-2)" }}>{label}</p>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-sm" style={{ color: "var(--color-text-3)" }}>Loading…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-xl border border-dashed flex items-center justify-center py-12"
            style={{ borderColor: "var(--color-border)" }}
          >
            <p className="text-sm" style={{ color: "var(--color-text-3)" }}>No documents in this category</p>
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  {["Title", "Advisor", "Type", "Status", "Updated"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--color-text-3)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc, i) => (
                  <tr
                    key={doc.id}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border)" : undefined }}
                    onClick={() => router.push(`/principal/documents/${doc.id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{doc.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--color-text-2)" }}>{doc.advisorName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--color-text-2)" }}>{TYPE_LABELS[doc.contentType] ?? doc.contentType}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--color-text-3)" }}>
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
