"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ backgroundColor: "#0d0d0c", color: "#f0efe9", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: "1px solid #222" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: "#1a7f5a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>GL</span>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.02em" }}>Greenlight</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a href="#how-it-works" style={{ color: "#888", fontSize: 13, textDecoration: "none" }}>How it works</a>
          <a href="#rules" style={{ color: "#888", fontSize: 13, textDecoration: "none" }}>Rule coverage</a>
          <button onClick={() => router.push("/login")} style={{ padding: "8px 18px", borderRadius: 6, backgroundColor: "#1a7f5a", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Sign in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 820, margin: "0 auto", padding: "96px 48px 80px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, border: "1px solid #2a2a28", marginBottom: 32, fontSize: 12, color: "#888" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#1a7f5a", display: "inline-block" }} />
          FINRA Rule 2210 compliance · Instant results
        </div>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.04em", marginBottom: 24, color: "#f0efe9" }}>
          Pre-flight compliance review<br />
          <span style={{ color: "#1a7f5a" }}>in seconds, not days.</span>
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: "#888", maxWidth: 560, margin: "0 auto 40px" }}>
          Financial advisors paste content. Greenlight flags violations, scores risk, rewrites compliantly, and logs every action in a tamper-evident audit trail.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <button onClick={() => router.push("/login")} style={{ padding: "12px 28px", borderRadius: 8, backgroundColor: "#1a7f5a", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Try the demo →
          </button>
          <a href="#how-it-works" style={{ padding: "12px 20px", fontSize: 14, color: "#888", textDecoration: "none" }}>See how it works</a>
        </div>
      </section>

      {/* Demo visual */}
      <section style={{ maxWidth: 960, margin: "0 auto 100px", padding: "0 48px" }}>
        <div style={{ borderRadius: 14, border: "1px solid #222", overflow: "hidden", backgroundColor: "#111110" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #222", display: "flex", alignItems: "center", gap: 6 }}>
            {["#ff5f57", "#ffbd2e", "#28c840"].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: c }} />
            ))}
            <div style={{ flex: 1, textAlign: "center" }}>
              <span style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>greenlight.app/advisor/new</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr" }}>
            <div style={{ padding: 24, borderRight: "1px solid #1a1a18" }}>
              <p style={{ fontSize: 11, color: "#555", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Content to review</p>
              <div style={{ backgroundColor: "#161614", borderRadius: 8, padding: 16, fontSize: 12, color: "#888", lineHeight: 1.7, fontFamily: "monospace", minHeight: 180 }}>
                <span style={{ backgroundColor: "#3d1515", color: "#f87171", padding: "0 3px", borderRadius: 3 }}>GUARANTEED INCOME</span>
                {" "}in retirement is here. Our strategy offers{" "}
                <span style={{ backgroundColor: "#3d1515", color: "#f87171", padding: "0 3px", borderRadius: 3 }}>risk-free returns of 7% annually</span>.{" "}
                <span style={{ backgroundColor: "#3a2e0f", color: "#fbbf24", padding: "0 3px", borderRadius: 3 }}>Act now — only 3 spots left!</span>
              </div>
              <div style={{ marginTop: 20 }}>
                {[
                  { label: "PII Redaction", note: "" },
                  { label: "Rules Engine", note: "4 findings" },
                  { label: "Semantic Analysis", note: "" },
                  { label: "Scoring", note: "" },
                ].map(({ label, note }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: "#1a7f5a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", flexShrink: 0 }}>✓</div>
                    <span style={{ fontSize: 12, color: "#aaa" }}>{label}{note ? <span style={{ color: "#555" }}> — {note}</span> : null}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, padding: 16, borderRadius: 10, backgroundColor: "#161614", border: "1px solid #222" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", border: "4px solid #dc2626", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#dc2626", lineHeight: 1 }}>82</span>
                  <span style={{ fontSize: 9, color: "#555" }}>/100</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#f0efe9", marginBottom: 3 }}>2 blockers must be resolved</p>
                  <p style={{ fontSize: 11, color: "#555" }}>2 BLOCKERs · 1 WARNING · 1 INFO</p>
                </div>
              </div>
              {[
                { id: "GUAR-001", sev: "BLOCKER", text: '"guaranteed income"' },
                { id: "PERF-001", sev: "BLOCKER", text: '"risk-free returns of 7% annually"' },
                { id: "URG-001", sev: "WARNING", text: '"Act now — only 3 spots left"' },
              ].map(({ id, sev, text }) => (
                <div key={id} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #222", marginBottom: 8, backgroundColor: "#111110" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, backgroundColor: sev === "BLOCKER" ? "#3d1515" : "#3a2e0f", color: sev === "BLOCKER" ? "#f87171" : "#fbbf24" }}>{sev}</span>
                    <span style={{ fontSize: 11, color: "#666", fontFamily: "monospace" }}>{id}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#888", fontStyle: "italic" }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ maxWidth: 960, margin: "0 auto 100px", padding: "0 48px" }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 12, textAlign: "center" }}>Three layers of review</h2>
        <p style={{ fontSize: 15, color: "#888", textAlign: "center", marginBottom: 56 }}>Every piece of content passes through the full pipeline before it reaches your compliance queue.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          {[
            { num: "01", title: "PII Redaction", color: "#2563eb", desc: "SSNs, phone numbers, emails, and account numbers are replaced with typed placeholders before any text touches an external API. The mapping is local and reversible.", items: ["SSN → [SSN_1]", "Phone → [PHONE_1]", "Email → [EMAIL_1]"] },
            { num: "02", title: "Rules Engine", color: "#d97706", desc: "15 deterministic rules covering every major FINRA 2210 category. Zero network calls. Returns exact character offsets so highlights are pixel-accurate.", items: ["Guarantees & promises", "Performance projections", "Urgency & pressure"] },
            { num: "03", title: "Semantic Analysis", color: "#1a7f5a", desc: "Claude catches implied promises, misleading framing, and tone issues that regex cannot. A hallucination guard verifies every quoted span exists in the document.", items: ["Implied promises", "Omitted risk context", "Compliant rewrite"] },
          ].map(({ num, title, desc, color, items }) => (
            <div key={num} style={{ padding: 28, borderRadius: 12, border: "1px solid #1e1e1c", backgroundColor: "#111110" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "monospace", marginBottom: 12 }}>{num}</div>
              <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, letterSpacing: "-0.02em" }}>{title}</h3>
              <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 16 }}>{desc}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {items.map(item => (
                  <li key={item} style={{ fontSize: 12, color: "#666", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color }}>→</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Rule coverage */}
      <section id="rules" style={{ maxWidth: 960, margin: "0 auto 100px", padding: "0 48px" }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 12, textAlign: "center" }}>Rule coverage</h2>
        <p style={{ fontSize: 15, color: "#888", textAlign: "center", marginBottom: 48 }}>15 rules across 7 FINRA 2210 violation categories, with citations.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { cat: "Guarantees & Promises", rules: ["GUAR-001: Guarantee of Returns", "GUAR-002: Promise of Specific Outcome"], sev: "BLOCKER", citation: "FINRA 2210(d)(1)(A)(B)" },
            { cat: "Performance Claims", rules: ["PERF-001: Specific Return Projection", "PERF-002: Cherry-Picked Performance", "PERF-003: Missing Disclosure"], sev: "BLOCKER/WARNING", citation: "FINRA 2210(d)(1)(B)" },
            { cat: "Superlatives", rules: ["SUPR-001: Unsubstantiated Superlative"], sev: "WARNING", citation: "FINRA 2210(d)(1)(A)" },
            { cat: "Testimonials", rules: ["TEST-001: Testimonial Without Disclosure"], sev: "BLOCKER", citation: "FINRA 2210(d)(6)" },
            { cat: "Misleading Comparisons", rules: ["COMP-001: Undisclosed Comparison Basis"], sev: "WARNING", citation: "FINRA 2210(d)(1)(B)" },
            { cat: "Urgency & Pressure", rules: ["URG-001: High-Pressure Sales Language"], sev: "WARNING", citation: "FINRA 2210(d)(1)(A)" },
            { cat: "Missing Disclosures", rules: ["DISC-001: Security Without Risk Disclosure", "DISC-002: ADV Disclosure Reminder"], sev: "WARNING/INFO", citation: "FINRA 2210(d)(1)(B)(3)" },
          ].map(({ cat, rules, sev, citation }) => (
            <div key={cat} style={{ padding: "18px 20px", borderRadius: 10, border: "1px solid #1e1e1c", backgroundColor: "#111110" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#e0dfd9" }}>{cat}</h3>
                <span style={{ fontSize: 10, color: "#555", fontFamily: "monospace", flexShrink: 0, marginLeft: 8 }}>{sev}</span>
              </div>
              {rules.map(r => <p key={r} style={{ fontSize: 11, color: "#666", marginBottom: 4, fontFamily: "monospace" }}>{r}</p>)}
              <p style={{ fontSize: 10, color: "#444", marginTop: 8, fontFamily: "monospace" }}>{citation}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Audit chain */}
      <section style={{ maxWidth: 960, margin: "0 auto 100px", padding: "0 48px" }}>
        <div style={{ borderRadius: 16, border: "1px solid #1e3a2e", backgroundColor: "#0d1f18", padding: "48px 56px", display: "flex", alignItems: "center", gap: 48 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#1a7f5a", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" }}>Tamper-evident audit trail</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 12, color: "#f0efe9" }}>Every action is cryptographically chained.</h2>
            <p style={{ fontSize: 14, color: "#6b8f7e", lineHeight: 1.7 }}>Each workflow event is hashed using SHA-256 with the previous event's hash. Tamper any row and the chain breaks immediately.</p>
          </div>
          <div style={{ flexShrink: 0, fontFamily: "monospace", fontSize: 11, color: "#4a9e78", lineHeight: 2 }}>
            <div>hash(0) = sha256(GENESIS + event₀)</div>
            <div style={{ color: "#3a7a5e" }}>hash(1) = sha256(hash(0) + event₁)</div>
            <div style={{ color: "#2d6049" }}>hash(2) = sha256(hash(1) + event₂)</div>
            <div style={{ color: "#1f4535", marginTop: 12 }}>verify() → ✓ 3 events intact</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 600, margin: "0 auto 120px", padding: "0 48px", textAlign: "center" }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>Ready to see it?</h2>
        <p style={{ fontSize: 15, color: "#888", marginBottom: 32 }}>Login with the demo credentials and paste any advisor marketing content. Results in under 3 seconds.</p>
        <button onClick={() => router.push("/login")} style={{ padding: "14px 36px", borderRadius: 8, backgroundColor: "#1a7f5a", color: "#fff", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          Open demo →
        </button>
      </section>

      <footer style={{ borderTop: "1px solid #1a1a18", padding: "24px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: "#1a7f5a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>GL</span>
          <span style={{ fontSize: 12, color: "#555" }}>Greenlight</span>
        </div>
        <p style={{ fontSize: 11, color: "#444" }}>Demonstration only. Not legal or compliance advice.</p>
      </footer>
    </div>
  );
}
