import type { DurationUnit, TaskListRow } from "./api-types";

/** "3 Sep 2026" — the date format used throughout the design. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "3 Sep 2026, 14:02" — used in history timelines and audit rows. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const date = formatDate(iso);
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date}, ${time}`;
}

/** "3 days" / "1 week" (singular when value is 1). */
export function formatDuration(value: number, unit: DurationUnit): string {
  const label = unit === "weeks" ? "week" : "day";
  return `${value} ${label}${value === 1 ? "" : "s"}`;
}

/**
 * A task is overdue exactly when the worker's own detection query says so
 * (MarkTasksOverdue / CountTotalOverdue in task-tracker) — overdue_since is
 * non-null and work isn't done. Never re-derive "past due" from today's
 * date client-side; that's what overdue_since already encodes.
 */
export function isOverdue(t: {
  overdue_since: string | null;
  work_status: string;
}): boolean {
  return Boolean(t.overdue_since) && t.work_status !== "done";
}

/** Days between overdue_since and now, for "Overdue by N days" copy. */
export function overdueDays(overdueSince: string | null): number {
  if (!overdueSince) return 0;
  const ms = Date.now() - new Date(overdueSince).getTime();
  return Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)));
}

/** Time-of-day aware greeting for TT-03's "Good morning, {firstName}". */
export function greeting(displayName: string): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const firstName = displayName.split(" ")[0] ?? displayName;
  return `Good ${part}, ${firstName}`;
}

/** "Today, 4 September 2026" style long date for the TT-03 greeting row. */
export function longDate(d: Date = new Date()): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Mirrors task-tracker's addDuration (internal/services/tasks.go) so the
 * TT-09 due-date preview matches exactly what ApproveTask will compute. */
export function addDuration(base: Date, value: number, unit: DurationUnit): Date {
  const days = unit === "weeks" ? value * 7 : value;
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * The three-way date chip rule shared by TT-03/TT-04's task rows: overdue,
 * approved-with-a-due-date, or still awaiting approval (no due date yet).
 */
export function dateChip(
  t: Pick<TaskListRow, "due_date" | "overdue_since" | "work_status">,
  requestedDuration?: string,
): { label: string; overdue: boolean; pending: boolean } {
  const overdue = isOverdue(t);
  if (overdue) {
    return { label: `Overdue · due ${formatDate(t.due_date)}`, overdue: true, pending: false };
  }
  if (t.due_date) {
    return { label: `Due ${formatDate(t.due_date)}`, overdue: false, pending: false };
  }
  return {
    label: `Awaiting approval${requestedDuration ? ` · ${requestedDuration} requested` : ""}`,
    overdue: false,
    pending: true,
  };
}
