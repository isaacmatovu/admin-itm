"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/ui/StatCard";
import { Blueprint } from "@/components/ui/Blueprint";
import { Skeleton } from "@/components/ui/Skeleton";
import { adminSummaryQueryOptions, usersQueryOptions } from "@/lib/queries";

const HIGH_OVERDUE_THRESHOLD = 10;

export function CompanyOverviewClient() {
  // Hydrated from the server page's prefetch — the same "admin summary"
  // key TT-03's dashboard card and this page both read, so navigating
  // between them after one has loaded is instant and always in sync.
  const { data: summary } = useQuery(adminSummaryQueryOptions());
  const { data: users = [] } = useQuery(usersQueryOptions());

  if (!summary) return <Skeleton height={400} />;

  const directory = new Map(users.map((u) => [u.id, u]));
  const activeCount = users.filter((u) => u.is_active).length;
  const adminCount = users.filter((u) => u.is_active && u.role === "admin").length;

  const workload = [...summary.workload_per_staff]
    .sort((a, b) => b.active_task_count - a.active_task_count)
    .map((w) => ({ ...w, name: directory.get(w.assignee_id)?.display_name ?? "Unknown" }));
  const max = Math.max(1, ...workload.map((w) => w.active_task_count));
  const zero =
    summary.total_overdue === 0 && summary.pending_approval === 0 && summary.needs_changes === 0;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
        <StatCard
          label="Total overdue"
          value={summary.total_overdue}
          sub={zero ? "Nothing past due" : "Across active tasks"}
          color={summary.total_overdue > 0 ? "var(--st-over)" : undefined}
          size="lg"
        />
        <StatCard
          label="Pending approval"
          value={summary.pending_approval}
          sub={summary.pending_approval > 0 ? "Waiting on your review" : "No tasks pending approval"}
          color={summary.pending_approval > 0 ? "var(--st-pending)" : undefined}
          size="lg"
        />
        <StatCard
          label="Needs changes"
          value={summary.needs_changes}
          sub={summary.needs_changes > 0 ? "Waiting on staff to resubmit" : "Nothing sent back"}
          color={summary.needs_changes > 0 ? "var(--st-changes)" : undefined}
          size="lg"
        />
      </div>

      {summary.total_overdue >= HIGH_OVERDUE_THRESHOLD && (
        <Blueprint
          style={{
            padding: "15px 17px",
            borderLeft: "2px solid var(--st-over)",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: "var(--st-over)" }}>
              {summary.total_overdue} tasks overdue
            </div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              Nothing has been pushed to anyone — this is here when you choose to look.
            </div>
          </div>
          <Link href="/tasks?work_status=not_started" className="btn btn-secondary">
            View overdue →
          </Link>
        </Blueprint>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
        <Blueprint style={{ flex: "2 1 340px", minWidth: 0, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              Open workload per person
            </h4>
            <span style={{ fontSize: 11.5, opacity: 0.5 }}>
              Not started + in progress
            </span>
          </div>
          {workload.length === 0 ? (
            <div style={{ fontSize: 13.5, opacity: 0.6, padding: "22px 0" }}>
              No open tasks anywhere. Nothing to balance.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {workload.map((w) => (
                <div key={w.assignee_id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      flex: "0 0 122px",
                      fontSize: 13,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {w.name}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: 999,
                      background: "color-mix(in srgb, var(--color-text) 8%, transparent)",
                      position: "relative",
                      minWidth: 40,
                      overflow: "hidden",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        inset: "0 auto 0 0",
                        width: `${Math.round((w.active_task_count / max) * 100)}%`,
                        borderRadius: 999,
                        background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-2))",
                      }}
                    />
                  </span>
                  <span
                    style={{
                      flex: "none",
                      fontFamily: "var(--font-heading)",
                      fontWeight: 700,
                      fontSize: 15,
                      width: 26,
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {w.active_task_count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Blueprint>

        <div style={{ flex: "1 1 230px", minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <Blueprint
            as={Link}
            href="/admin/approvals"
            style={{
              textAlign: "left",
              color: "inherit",
              cursor: "pointer",
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".02em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
              Go to
            </span>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18 }}>
              Approval Queue
            </span>
            <span style={{ fontSize: 12.5, opacity: 0.65 }}>
              {zero
                ? "Nothing waiting"
                : `${summary.pending_approval} pending · ${summary.needs_changes} need changes`}
            </span>
          </Blueprint>
          <Blueprint
            as={Link}
            href="/admin/users"
            style={{
              textAlign: "left",
              color: "inherit",
              cursor: "pointer",
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".02em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
              Go to
            </span>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18 }}>
              User Management
            </span>
            <span style={{ fontSize: 12.5, opacity: 0.65 }}>
              {activeCount} active · {adminCount} admins
            </span>
          </Blueprint>
          <div style={{ fontSize: 11.5, opacity: 0.55, padding: "0 2px" }}>
            The only thing that reaches your inbox is the weekly overdue email. Everything else
            lives on this screen.
          </div>
        </div>
      </div>
    </>
  );
}
