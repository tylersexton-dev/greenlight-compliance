"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { SeverityBadge } from "@/components/severity-badge";
import { RULE_REGISTRY } from "@/lib/rules/registry";

interface User { id: string; name: string; email: string; role: string; }

export default function RulesConfigPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => {
      if (!r.ok) { router.push("/login"); return; }
      r.json().then(({ user }) => {
        if (user.role !== "principal") router.push("/advisor");
        else setUser(user);
      });
    });
  }, [router]);

  if (!user) return null;

  const categories = Array.from(new Set(RULE_REGISTRY.map(r => r.category)));

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>
      <Nav user={user} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>Rule Configuration</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-2)" }}>
            Active FINRA Rule 2210 compliance rules for your firm
          </p>
        </div>

        <div className="space-y-6">
          {categories.map(cat => {
            const rules = RULE_REGISTRY.filter(r => r.category === cat);
            return (
              <div
                key={cat}
                className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-2)" }}>
                  <h2 className="text-sm font-medium capitalize" style={{ color: "var(--color-text)" }}>
                    {cat.replace(/_/g, " ")}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-3)" }}>
                    {rules.length} rule{rules.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  {rules.map((rule, i) => (
                    <div
                      key={rule.id}
                      className="px-4 py-3 flex items-start gap-4"
                      style={{ borderBottom: i < rules.length - 1 ? "1px solid var(--color-border)" : undefined }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono font-medium" style={{ color: "var(--color-text-3)" }}>
                            {rule.id}
                          </span>
                          <SeverityBadge severity={rule.severity} />
                        </div>
                        <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{rule.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-2)" }}>{rule.description}</p>
                        <p className="text-xs mt-1 font-mono" style={{ color: "var(--color-text-3)" }}>{rule.citation}</p>
                      </div>
                      <div
                        className="flex-shrink-0 w-8 h-4 rounded-full mt-1 flex items-center px-0.5"
                        style={{ backgroundColor: "var(--color-accent)" }}
                      >
                        <div className="w-3 h-3 rounded-full bg-white ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-xs" style={{ color: "var(--color-text-3)" }}>
          Rule overrides per firm are stored in the database. Contact your compliance officer to modify rule configurations.
        </p>
      </main>
    </div>
  );
}
