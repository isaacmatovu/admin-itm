import type { ApprovalStatus, WorkStatus } from "@/lib/api-types";
import type { CSSProperties } from "react";

// One component, six status-badge variants, plus a lighter "metadata" form
// for exceptions worth noticing (overdue, roles, 2FA, audit results) — see
// README's "Cross-cutting behaviour" section. Colors come from the --st-*
// tokens in app/globals.css.

const APPROVAL_MAP: Record<ApprovalStatus, { label: string; fg: string; bg: string }> = {
  pending_approval: { label: "Pending approval", fg: "var(--st-pending)", bg: "var(--st-pending-bg)" },
  needs_changes: { label: "Needs changes", fg: "var(--st-changes)", bg: "var(--st-changes-bg)" },
  approved: { label: "Approved", fg: "var(--st-approved)", bg: "var(--st-approved-bg)" },
};

const WORK_MAP: Record<WorkStatus, { label: string; fg: string; bg: string }> = {
  not_started: { label: "Not started", fg: "var(--st-idle)", bg: "var(--st-idle-bg)" },
  in_progress: { label: "In progress", fg: "var(--st-progress)", bg: "var(--st-progress-bg)" },
  done: { label: "Done", fg: "var(--st-approved)", bg: "var(--st-approved-bg)" },
};

const baseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "3px 10px",
  fontSize: 12.5,
  fontWeight: 500,
  borderRadius: 999,
  whiteSpace: "nowrap",
};

function Dot({ fg }: { fg: string }) {
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: fg,
        flex: "none",
      }}
    />
  );
}

function Badge({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <span style={{ ...baseStyle, background: bg, color: fg }}>
      <Dot fg={fg} />
      {label}
    </span>
  );
}

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const v = APPROVAL_MAP[status];
  return <Badge label={v.label} fg={v.fg} bg={v.bg} />;
}

export function WorkBadge({ status }: { status: WorkStatus }) {
  const v = WORK_MAP[status];
  return <Badge label={v.label} fg={v.fg} bg={v.bg} />;
}

/** The lighter, tinted-background form used for overdue flags, role chips,
 * 2FA status, and audit outcomes — no dot, just a soft pill. */
export function MetaChip({
  label,
  fg,
  className = "",
}: {
  label: string;
  fg: string;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{
        ...baseStyle,
        color: fg,
        background: `color-mix(in srgb, ${fg} 14%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}
