"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { Blueprint } from "@/components/ui/Blueprint";
import { ApprovalBadge } from "@/components/ui/StatusBadge";
import { WorkStatusControl } from "@/components/tasks/WorkStatusControl";
import { ResubmitButton } from "@/components/tasks/ResubmitButton";
import { TaskDetailActions } from "@/components/tasks/TaskDetailActions";
import { HistoryTimeline } from "@/components/tasks/HistoryTimeline";
import { taskQueryOptions, profileQueryOptions, usersQueryOptions } from "@/lib/queries";
import { formatDate, formatDuration, overdueDays, isOverdue } from "@/lib/format";
import { Skeleton } from "@/components/ui/Skeleton";

export function TaskDetailClient({ taskId }: { taskId: string }) {
  // All three are seeded/prefetched by the server page, so this is an
  // instant read on first paint; a status change, approval decision, edit,
  // or reassign elsewhere invalidates the "tasks" family and this refetches.
  const { data: result } = useQuery(taskQueryOptions(taskId));
  const { data: profile } = useQuery(profileQueryOptions());
  const { data: users = [] } = useQuery(usersQueryOptions());

  if (!result || !profile) {
    return <Skeleton height={320} />;
  }

  const { task, history } = result;
  const directory = new Map(users.map((u) => [u.id, u]));
  const overdue = isOverdue(task);
  const noDue = task.approval_status === "pending_approval" || task.approval_status === "needs_changes";
  const isAssignee = task.assignee_id === profile.id;
  const actorNames = new Map(users.map((u) => [u.id, u.display_name]));

  const approvalMeta =
    task.approval_status === "pending_approval"
      ? `Submitted ${formatDate(task.created_at)}`
      : task.approval_status === "needs_changes"
        ? "Sent back — see note below"
        : `Approved ${formatDate(task.approved_at)}${
            task.approved_by ? ` by ${directory.get(task.approved_by)?.display_name ?? "an admin"}` : ""
          }`;

  const sentBack = [...history].reverse().find((h) => h.event_type === "sent_back");

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 22, alignItems: "flex-start" }}>
      <div style={{ flex: "2 1 400px", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
        <Blueprint style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", opacity: 0.5, fontVariantNumeric: "tabular-nums" }}>
                {task.id.slice(0, 8)}
              </div>
              <h3 style={{ margin: "3px 0 0", fontSize: 26 }}>{task.title}</h3>
            </div>
          </div>
          {task.description && (
            <p style={{ margin: 0, fontSize: 14, opacity: 0.8, maxWidth: "68ch" }}>{task.description}</p>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 1,
              background: "var(--color-divider)",
              border: "1px solid var(--color-divider)",
            }}
          >
            <div style={{ background: "var(--color-bg)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", opacity: 0.55, fontFamily: "var(--font-heading)" }}>
                Approval status
              </div>
              <ApprovalBadge status={task.approval_status} />
              <div style={{ fontSize: 11.5, opacity: 0.55 }}>{approvalMeta}</div>
            </div>
            <div style={{ background: "var(--color-bg)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", opacity: 0.55, fontFamily: "var(--font-heading)" }}>
                Work status
              </div>
              <WorkStatusControl taskId={task.id} status={task.work_status} />
              <div style={{ fontSize: 11.5, opacity: 0.55 }}>Editable regardless of approval.</div>
            </div>
            <div style={{ background: "var(--color-bg)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", opacity: 0.55, fontFamily: "var(--font-heading)" }}>
                {noDue ? "Requested duration" : "Due date"}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 19,
                  letterSpacing: ".02em",
                  color: overdue ? "var(--st-over)" : "var(--color-text)",
                }}
              >
                {noDue ? formatDuration(task.duration_value, task.duration_unit) : formatDate(task.due_date)}
              </div>
              <div style={{ fontSize: 11.5, opacity: 0.55 }}>
                {noDue
                  ? "Awaiting approval — no due date exists yet."
                  : overdue
                    ? `Overdue by ${overdueDays(task.overdue_since)} days`
                    : `approved_at + ${formatDuration(task.duration_value, task.duration_unit)}`}
              </div>
            </div>
          </div>

          {overdue && (
            <div
              style={{
                display: "flex",
                gap: 9,
                alignItems: "center",
                padding: "9px 12px",
                border: "1px solid var(--st-over)",
                color: "var(--st-over)",
                fontSize: 13,
              }}
            >
              <Clock size={15} strokeWidth={1.5} style={{ flex: "none" }} />
              <span>
                Overdue by {overdueDays(task.overdue_since)} days. Visible here and on dashboards
                only — a weekly email starts at day 7.
              </span>
            </div>
          )}

          {task.approval_status === "needs_changes" && sentBack && (
            <div
              style={{
                padding: "14px 16px",
                background: "var(--st-changes-bg)",
                borderRadius: 10,
                borderLeft: "3px solid var(--st-changes)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: 13.5,
                  color: "var(--st-changes)",
                }}
              >
                Sent back — note from admin
              </div>
              <div style={{ fontSize: 14 }}>&ldquo;{sentBack.note}&rdquo;</div>
              <div style={{ fontSize: 11.5, opacity: 0.6 }}>
                {actorNames.get(sentBack.actor_id) ?? "Admin"} · {formatDate(sentBack.created_at)}
              </div>
              {isAssignee && (
                <div style={{ marginTop: 4, alignSelf: "flex-start" }}>
                  <ResubmitButton taskId={task.id} />
                </div>
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 9,
              alignItems: "center",
              paddingTop: 4,
              borderTop: "1px solid var(--color-divider)",
            }}
          >
            <span style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", opacity: 0.5, fontFamily: "var(--font-heading)", marginRight: 4 }}>
              Admin actions
            </span>
            <Link
              href={`/admin/approvals?review=${task.id}`}
              className="btn btn-primary"
              aria-disabled={task.approval_status === "approved"}
              style={task.approval_status === "approved" ? { pointerEvents: "none", opacity: 0.45 } : undefined}
            >
              Approve…
            </Link>
            <Link
              href={`/admin/approvals?review=${task.id}`}
              className="btn btn-secondary"
              aria-disabled={task.approval_status === "approved"}
              style={task.approval_status === "approved" ? { pointerEvents: "none", opacity: 0.45 } : undefined}
            >
              Send back…
            </Link>
            <TaskDetailActions task={task} users={users} />
          </div>
        </Blueprint>
      </div>

      <Blueprint style={{ flex: "1 1 270px", minWidth: 0, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>History</h4>
          <span style={{ fontSize: 11, opacity: 0.5 }}>
            Append-only
          </span>
        </div>
        <HistoryTimeline history={history} actorNames={actorNames} />
      </Blueprint>
    </div>
  );
}
