"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { StatusBadge } from "@/components/status-badge";

interface Doc {
  id: string;
  title: string;
  contentType: string;
  status: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const TYPE_LABELS: Record<string, string> = {
  linkedin_post: "LinkedIn Post",
  client_email: "Client Email",
  seminar_flyer: "Seminar Flyer",
  website_copy: "Website Copy",
  other: "Other",
};

export default function AdvisorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) { router.push("/login"); return; }
      const { user } = await meRes.json();
      if (user.role === "principal") { router.push("/principal/queue"); return; }
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

  return (
    <div className="min-h-screen flex flex-col">
      <Nav user={user} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>My Documents</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-text-2)" }}>
              Content pending compliance review
            </p>
          </div>
          <button
            onClick={() => router.push("/advisor/new")}
            className="px-4 py-2 rounded-md text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            + New Review
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-sm" style={{ color: "var(--color-text-3)" }}>Loading…</div>
          </div>
        ) : docs.length === 0 ? (
          <div
            className="border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-16 text-center"
            style={{ borderColor: "var(--color-border)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--color-text-2)" }}>No documents yet</p>
            <p className="text-sm mt-1 mb-4" style={{ color: "var(--color-text-3)" }}>
              Submit content for a pre-flight compliance check
            </p>
            <button
              onClick={() => router.push("/advisor/new")}
              className="px-4 py-2 rounded-md text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              Create your first review
            </button>
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  {["Title", "Type", "Status", "Last Updated"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: "var(--color-text-3)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map((doc, i) => (
                  <tr
                    key={doc.id}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ borderBottom: i < docs.length - 1 ? "1px solid var(--color-border)" : undefined }}
                    onClick={() => router.push(`/advisor/documents/${doc.id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                        {doc.title}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "var(--color-text-2)" }}>
                        {TYPE_LABELS[doc.contentType] ?? doc.contentType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status} />
                    </td>
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
