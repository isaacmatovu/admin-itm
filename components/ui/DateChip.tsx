import { dateChip } from "@/lib/format";
import { MetaChip } from "./StatusBadge";
import type { WorkStatus } from "@/lib/api-types";

/**
 * The three-way due-date rendering shared by TT-03/TT-04/TT-06: overdue (a
 * bordered chip), approved-with-a-due-date (plain text), or still awaiting
 * approval (plain text, no due date exists yet).
 */
export function DateChip({
  due_date,
  overdue_since,
  work_status,
  requestedDuration,
}: {
  due_date: string | null;
  overdue_since: string | null;
  work_status: WorkStatus;
  requestedDuration?: string;
}) {
  const chip = dateChip({ due_date, overdue_since, work_status }, requestedDuration);
  if (chip.overdue) {
    return <MetaChip label={chip.label} fg="var(--st-over)" />;
  }
  return (
    <span style={{ fontSize: 12, opacity: 0.6, whiteSpace: "nowrap" }}>
      {chip.label}
    </span>
  );
}
