"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { Blueprint } from "@/components/ui/Blueprint";
import { ApprovalBadge } from "@/components/ui/StatusBadge";
import { ApprovalReviewPanel } from "@/components/tasks/ApprovalReviewPanel";
import { formatDate, formatDuration } from "@/lib/format";
import {
  approvalQueueQueryOptions,
  overdueTasksQueryOptions,
} from "@/lib/queries";

export function ApprovalQueueClient() {
  const [tab, setTab] = useState<"pending" | "changes" | "overdue">("pending");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reviewId = searchParams.get("review");
  // Hydrated from the server page's prefetch on first paint — this only
  // hits the network again once something invalidates the "admin" or
  // "tasks" query families (see ApprovalReviewPanel's approve/send-back).
  const { data: items = [] } = useQuery(approvalQueueQueryOptions());

  // Overdue tasks (GET /admin/tasks/overdue) — returns { data, page, page_size, total }.
  const { data: overdueData } = useQuery(overdueTasksQueryOptions());
  const overdueItems = useMemo(() => overdueData?.data ?? [], [overdueData]);
  const overdueTotal = overdueData?.total ?? 0;

  const pending = items.filter((i) => i.approval_status === "pending_approval");
  const changes = items.filter((i) => i.approval_status === "needs_changes");
  const isOverdueTab = tab === "overdue";
  const rows = tab === "pending" ? pending : changes;
  const isEmpty = isOverdueTab ? overdueItems.length === 0 : rows.length === 0;
  const reviewItem = items.find((i) => i.id === reviewId) ?? null;

  // Group overdue tasks by person; people with the most overdue tasks first.
  const overdueByPerson = useMemo(() => {
    type Task = (typeof overdueItems)[number];
    const map = new Map<string, { id: string; name: string; tasks: Task[] }>();
    for (const t of overdueItems) {
      const g = map.get(t.assignee_id);
      if (g) g.tasks.push(t);
      else
        map.set(t.assignee_id, {
          id: t.assignee_id,
          name: t.assignee_name,
          tasks: [t],
        });
    }
    return [...map.values()].sort((a, b) => b.tasks.length - a.tasks.length);
  }, [overdueItems]);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openReview(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("review", id);
    router.push(`${pathname}?${params.toString()}`);
  }

  function closeReview() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("review");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        {(
          [
            ["pending", "Pending Approval", pending.length],
            ["changes", "Needs Changes", changes.length],
            ["overdue", "Overdue", overdueTotal],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{
              background: "none",
              border: 0,
              borderBottom: `2.5px solid ${tab === key ? "var(--color-accent)" : "transparent"}`,
              color:
                tab === key
                  ? "var(--color-accent)"
                  : "color-mix(in srgb, var(--color-text) 55%, transparent)",
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: 14.5,
              padding: "9px 6px",
              marginBottom: -1,
              cursor: "pointer",
            }}
          >
            {label} {count}
          </button>
        ))}
      </div>

      {isEmpty ? (
        <Blueprint
          style={{
            padding: "52px 26px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            textAlign: "center",
          }}
        >
          <span
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--st-approved-bg)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <CheckCircle size={26} strokeWidth={2} color="var(--st-approved)" />
          </span>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 19,
            }}
          >
            {isOverdueTab
              ? "No overdue tasks"
              : items.length === 0
                ? "Nothing waiting on you right now"
                : `No tasks in ${tab === "pending" ? "Pending Approval" : "Needs Changes"}`}
          </div>
          {isOverdueTab && (
            <div style={{ fontSize: 13, opacity: 0.6 }}>
              Everything is on schedule.
            </div>
          )}
          {!isOverdueTab && items.length === 0 && (
            <div style={{ fontSize: 13, opacity: 0.6 }}>
              Both tabs are clear.
            </div>
          )}
        </Blueprint>
      ) : isOverdueTab ? (
        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th>Person</th>
                <th>Overdue tasks</th>
                <th>Longest overdue</th>
              </tr>
            </thead>
            <tbody>
              {overdueByPerson.map((p) => {
                const isOpen = expanded.has(p.id);
                const longest = Math.max(...p.tasks.map((t) => t.days_overdue));
                return (
                  <Fragment key={p.id}>
                    <tr
                      onClick={() => toggleExpanded(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleExpanded(p.id);
                        }
                      }}
                      tabIndex={0}
                      aria-expanded={isOpen}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {isOpen ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                          <span style={{ fontWeight: 600 }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {p.tasks.length}{" "}
                        {p.tasks.length === 1 ? "task" : "tasks"}
                      </td>
                      <td
                        style={{
                          whiteSpace: "nowrap",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {longest} {longest === 1 ? "day" : "days"}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={3} style={{ paddingLeft: 36 }}>
                          <table className="table" style={{ width: "100%" }}>
                            <thead>
                              <tr>
                                <th>Task</th>
                                <th>Due</th>
                                <th>Overdue since</th>
                                <th>Days overdue</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {p.tasks.map((r) => (
                                <tr key={r.id}>
                                  <td>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: 10.5,
                                          opacity: 0.5,
                                          fontVariantNumeric: "tabular-nums",
                                        }}
                                      >
                                        {r.id.slice(0, 8)}
                                      </span>
                                      <span
                                        style={{ color: "var(--color-text)" }}
                                      >
                                        {r.title}
                                      </span>
                                    </div>
                                  </td>
                                  <td
                                    style={{
                                      whiteSpace: "nowrap",
                                      fontVariantNumeric: "tabular-nums",
                                    }}
                                  >
                                    {formatDate(r.due_date)}
                                  </td>
                                  <td
                                    style={{
                                      whiteSpace: "nowrap",
                                      fontVariantNumeric: "tabular-nums",
                                    }}
                                  >
                                    {formatDate(r.overdue_since)}
                                  </td>
                                  <td
                                    style={{
                                      whiteSpace: "nowrap",
                                      fontVariantNumeric: "tabular-nums",
                                    }}
                                  >
                                    {r.days_overdue}{" "}
                                    {r.days_overdue === 1 ? "day" : "days"}
                                  </td>
                                  <td style={{ whiteSpace: "nowrap" }}>
                                    {r.work_status.replace(/_/g, " ")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th>Task</th>
                <th>Assignee</th>
                <th>Requested</th>
                <th>Submitted</th>
                <th>Approval</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          fontSize: 10.5,
                          opacity: 0.5,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {r.id.slice(0, 8)}
                      </span>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          openReview(r.id);
                        }}
                        style={{ color: "var(--color-text)" }}
                      >
                        {r.title}
                      </a>
                    </div>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{r.assignee_name}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {formatDuration(r.duration_value, r.duration_unit)}
                  </td>
                  <td
                    style={{
                      whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatDate(r.submitted_at)}
                  </td>
                  <td>
                    <ApprovalBadge status={r.approval_status} />
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ minHeight: 30, fontSize: 12 }}
                      onClick={() => openReview(r.id)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ApprovalReviewPanel item={reviewItem} onClose={closeReview} />
    </div>
  );
}