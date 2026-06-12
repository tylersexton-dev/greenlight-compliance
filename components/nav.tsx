"use client";

import { useRouter } from "next/navigation";

interface NavProps {
  user: { name: string; role: string; email: string };
}

export function Nav({ user }: NavProps) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <nav
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            GL
          </span>
          <span className="font-semibold text-sm tracking-tight">Greenlight</span>
        </div>

        {user.role === "principal" ? (
          <div className="flex items-center gap-4">
            <a href="/principal/queue" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--color-text-2)" }}>
              Review Queue
            </a>
            <a href="/principal/rules" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--color-text-2)" }}>
              Rule Config
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <a href="/advisor" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--color-text-2)" }}>
              My Documents
            </a>
            <a href="/advisor/new" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--color-text-2)" }}>
              New Review
            </a>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs font-medium" style={{ color: "var(--color-text)" }}>{user.name}</p>
          <p className="text-xs capitalize" style={{ color: "var(--color-text-3)" }}>{user.role}</p>
        </div>
        <button
          onClick={logout}
          className="text-xs px-2.5 py-1 rounded border transition-colors hover:opacity-70"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-2)" }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
