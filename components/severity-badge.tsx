type Severity = "BLOCKER" | "WARNING" | "INFO";

const SEVERITY_STYLES: Record<Severity, { bg: string; text: string }> = {
  BLOCKER: { bg: "var(--color-blocker-light)", text: "var(--color-blocker)" },
  WARNING: { bg: "var(--color-warning-light)", text: "var(--color-warning)" },
  INFO: { bg: "var(--color-info-light)", text: "var(--color-info)" },
};

export function SeverityBadge({ severity }: { severity: string }) {
  const style = SEVERITY_STYLES[severity as Severity] ?? SEVERITY_STYLES.INFO;
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold tracking-wide"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {severity}
    </span>
  );
}
