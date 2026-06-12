"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Login failed");
      return;
    }

    const { user } = await res.json();
    if (user.role === "principal") {
      router.push("/principal/queue");
    } else {
      router.push("/advisor");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <span
              className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              GL
            </span>
            <span className="text-lg font-semibold tracking-tight" style={{ color: "var(--color-text)" }}>
              Greenlight
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-2)" }}>
            Compliance copilot for financial advisors
          </p>
        </div>

        {/* Form */}
        <div
          className="rounded-xl border p-6 shadow-sm"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <h1 className="text-base font-medium mb-5" style={{ color: "var(--color-text)" }}>
            Sign in to your account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-2)" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@firm.com"
                className="w-full px-3 py-2 rounded-md border text-sm outline-none transition-colors"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-bg)",
                  color: "var(--color-text)",
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-2)" }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-md border text-sm outline-none"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-bg)",
                  color: "var(--color-text)",
                }}
              />
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-md" style={{ backgroundColor: "var(--color-blocker-light)", color: "var(--color-blocker)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-md text-sm font-medium text-white transition-opacity"
              style={{ backgroundColor: "var(--color-accent)", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div
            className="mt-5 pt-4 border-t text-xs"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-3)" }}
          >
            <p className="font-medium mb-1">Demo credentials</p>
            <p>Advisor: sarah.chen@acmewealth.com</p>
            <p>Principal: compliance@acmewealth.com</p>
            <p>Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
