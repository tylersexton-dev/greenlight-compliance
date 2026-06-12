type Status =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "CHANGES_REQUESTED"
  | "RESUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

const STATUS_STYLES: Record<Status, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: "#f1f0ef", text: "#5c5b57", label: "Draft" },
  SUBMITTED: { bg: "#eff6ff", text: "#2563eb", label: "Submitted" },
  IN_REVIEW: { bg: "#fef3c7", text: "#d97706", label: "In Review" },
  CHANGES_REQUESTED: { bg: "#fef2f2", text: "#dc2626", label: "Changes Needed" },
  RESUBMITTED: { bg: "#eff6ff", text: "#2563eb", label: "Resubmitted" },
  APPROVED: { bg: "#e8f5ef", text: "#1a7f5a", label: "Approved" },
  REJECTED: { bg: "#fef2f2", text: "#dc2626", label: "Rejected" },
  ARCHIVED: { bg: "#f1f0ef", text: "#9b9a95", label: "Archived" },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status as Status] ?? STATUS_STYLES.DRAFT;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}
