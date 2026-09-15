import Link from "next/link";
import { Blueprint } from "@/components/ui/Blueprint";
import { ApprovalBadge, WorkBadge } from "@/components/ui/StatusBadge";
import { DateChip } from "@/components/ui/DateChip";
import { WorkStatusControl } from "./WorkStatusControl";
import { isOverdue } from "@/lib/format";
import type { TaskListRow } from "@/lib/api-types";

/** The task row shared by TT-03 (My Tasks) and echoed in TT-04 (Task
 * List) — the system's core object: id, title, both status badges, the
 * date chip, and an inline work-status control. */
export function TaskRow({ task }: { task: TaskListRow }) {
  const overdue = isOverdue(task);
  return (
    <Blueprint
      style={{
        padding: "13px 15px",
        display: "flex",
        flexWrap: "wrap",
        gap: "12px 16px",
        alignItems: "center",
        justifyContent: "space-between",
        borderLeft: overdue ? "2px solid var(--st-over)" : undefined,
      }}
    >
      <div style={{ flex: "1 1 260px", minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 10.5,
              letterSpacing: ".08em",
              opacity: 0.5,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {task.id.slice(0, 8)}
          </span>
          <Link
            href={`/tasks/${task.id}`}
            style={{ fontSize: 15.5, color: "var(--color-text)" }}
          >
            {task.title}
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <ApprovalBadge status={task.approval_status} />
          <WorkBadge status={task.work_status} />
          <DateChip
            due_date={task.due_date}
            overdue_since={task.overdue_since}
            work_status={task.work_status}
          />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span
          style={{
            fontSize: 10,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            opacity: 0.45,
          }}
        >
          Work status
        </span>
        <WorkStatusControl taskId={task.id} status={task.work_status} size="sm" />
      </div>
    </Blueprint>
  );
}
