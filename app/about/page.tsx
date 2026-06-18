"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ backgroundColor: "#0d0d0c", color: "#f0efe9", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: "1px solid #222" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: "#1a7f5a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>GL</span>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.02em" }}>Greenlight</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a href="#how-it-works" style={{ color: "#888", fontSize: 13, textDecoration: "none" }}>How it works</a>
          <button onClick={() => router.push("/login")} style={{ padding: "8px 18px", borderRadius: 6, backgroundColor: "#1a7f5a", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Sign in
          </button>
        </div>
      </nav>

      <section style={{ maxWidth: 820, margin: "0 auto", padding: "96px 48px 80px", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.04em", marginBottom: 24 }}>
          Pre-flight compliance review
          <br />
          <span style={{ color: "#1a7f5a" }}>in seconds, not days.</span>
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: "#888", maxWidth: 560, margin: "0 auto 40px" }}>
          Financial advisors paste content. Greenlight flags violations, scores risk, and logs every action in a tamper-evident audit trail.
        </p>
        <button onClick={() => router.push("/login")} style={{ padding: "12px 28px", borderRadius: 8, backgroundColor: "#1a7f5a", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Try the demo
        </button>
      </section>

      <section id="how-it-works" style={{ maxWidth: 960, margin: "0 auto 100px", padding: "0 48px" }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 48, textAlign: "center" }}>Three layers of review</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          {[
            { num: "01", title: "PII Redaction", color: "#2563eb", desc: "SSNs, phones, and emails are replaced with typed placeholders before any text touches an external API." },
            { num: "02", title: "Rules Engine", color: "#d97706", desc: "15 deterministic FINRA 2210 rules. Zero network calls. Exact character offsets for pixel-accurate highlights." },
            { num: "03", title: "Semantic Analysis", color: "#1a7f5a", desc: "Claude catches implied promises and misleading framing. A hallucination guard verifies every quoted span." },
          ].map(({ num, title, desc, color }) => (
            <div key={num} style={{ padding: 28, borderRadius: 12, border: "1px solid #1e1e1c", backgroundColor: "#111110" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "monospace", marginBottom: 12 }}>{num}</div>
              <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>{title}</h3>
              <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 600, margin: "0 auto 120px", padding: "0 48px", textAlign: "center" }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>Ready to see it?</h2>
        <p style={{ fontSize: 15, color: "#888", marginBottom: 32 }}>Login with demo credentials and paste any advisor marketing content. Results in under 3 seconds.</p>
        <button onClick={() => router.push("/login")} style={{ padding: "14px 36px", borderRadius: 8, backgroundColor: "#1a7f5a", color: "#fff", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          Open demo
        </button>
      </section>

      <footer style={{ borderTop: "1px solid #1a1a18", padding: "24px 48px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "#444" }}>Demonstration only. Not legal or compliance advice. Rule set is a credible subset of FINRA Rule 2210.</p>
      </footer>
    </div>
  );
}
