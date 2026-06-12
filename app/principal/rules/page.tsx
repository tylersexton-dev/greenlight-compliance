"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { SeverityBadge } from "@/components/severity-badge";

interface User { id: string; name: string; email: string; role: string; }
interface Rule {
  id: string; category: string; severity: string; name: string;
  description: string; citation: string; enabled: boolean; overridden: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  guarantees: "Guarantees & Promises",
  performance_claims: "Performance Claims",
  superlatives: "Superlatives",
  testimonials: "Testimonials",
  misleading_comparisons: "Misleading Comparisons",
  urgency_pressure: "Urgency & Pressure",
  missing_disclosures: "Missing Disclosures",
};

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      style={{
        width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
        backgroundColor: enabled ? "var(--color-accent)" : "var(--color-border)",
        position: "relative", transition: "background-color 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        width: 14, height: 14, borderRadius: "50%", backgroundColor: "#fff",
        position: "absolute", top: 3,
        left: enabled ? 19 : 3,
        transition: "left 0.2s",
      }} />
    </button>
  );
}

export default function RulesConfigPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) { router.push("/login"); return; }
      const { user } = await meRes.json();
      if (user.role !== "principal") { router.push("/advisor"); return; }
      setUser(user);

      const res = await fetch("/api/rules");
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function toggleRule(ruleId: string, enabled: boolean) {
    setSaving(ruleId);
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled } : r));

    const res = await fetch("/api/rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ruleId, enabled }),
    });

    setSaving(null);
    if (res.ok) {
      setSaved(ruleId);
      setTimeout(() => setSaved(null), 1500);
    } else {
      // Revert on failure
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !enabled } : r));
    }
  }

  if (!user) return null;

  const categories = Array.from(new Set(rules.map(r => r.category)));
  const disabledCount = rules.filter(r => !r.enabled).length;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>
      <Nav user={user} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>Rule Configuration</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-text-2)" }}>
              Toggle rules on or off for your firm. Disabled rules are excluded from all new reviews.
            </p>
          </div>
          {disabledCount > 0 && (
            <div className="px-3 py-1.5 rounded-md text-xs" style={{ backgroundColor: "var(--color-warning-light)", color: "var(--color-warning)" }}>
              {disabledCount} rule{disabledCount !== 1 ? "s" : ""} disabled
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm" style={{ color: "var(--color-text-3)" }}>Loading…</p>
          </div>
        ) : (
          <div className="space-y-5">
            {categories.map(cat => {
              const catRules = rules.filter(r => r.category === cat);
              const allEnabled = catRules.every(r => r.enabled);
              return (
                <div
                  key={cat}
                  className="rounded-xl border overflow-hidden"
                  style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                  <div
                    className="px-4 py-3 flex items-center justify-between border-b"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-2)" }}
                  >
                    <div>
                      <h2 className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                        {CATEGORY_LABELS[cat] ?? cat}
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-3)" }}>
                        {catRules.length} rule{catRules.length !== 1 ? "s" : ""} · {catRules.filter(r => r.enabled).length} active
                      </p>
                    </div>
                  </div>

                  <div>
                    {catRules.map((rule, i) => (
                      <div
                        key={rule.id}
                        className="px-4 py-3.5 flex items-start gap-4 transition-opacity"
                        style={{
                          borderBottom: i < catRules.length - 1 ? "1px solid var(--color-border)" : undefined,
                          opacity: rule.enabled ? 1 : 0.45,
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-mono font-medium" style={{ color: "var(--color-text-3)" }}>{rule.id}</span>
                            <SeverityBadge severity={rule.severity} />
                            {rule.overridden && (
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text-3)" }}>
                                custom
                              </span>
                            )}
                            {saved === rule.id && (
                              <span className="text-xs" style={{ color: "var(--color-accent)" }}>Saved ✓</span>
                            )}
                          </div>
                          <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{rule.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-2)" }}>{rule.description}</p>
                          <p className="text-xs mt-1 font-mono" style={{ color: "var(--color-text-3)" }}>{rule.citation}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {saving === rule.id && (
                            <span className="text-xs" style={{ color: "var(--color-text-3)" }}>Saving…</span>
                          )}
                          <Toggle
                            enabled={rule.enabled}
                            onChange={(v) => toggleRule(rule.id, v)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-6 text-xs" style={{ color: "var(--color-text-3)" }}>
          Changes take effect immediately on new reviews. Existing findings are not retroactively affected.
        </p>
      </main>
    </div>
  );
}
