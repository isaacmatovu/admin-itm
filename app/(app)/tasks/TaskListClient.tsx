"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Blueprint } from "@/components/ui/Blueprint";
import { ApprovalBadge, WorkBadge } from "@/components/ui/StatusBadge";
import { DateChip } from "@/components/ui/DateChip";
import { WorkStatusSelect } from "@/components/tasks/WorkStatusSelect";
import { Pagination } from "@/components/ui/Pagination";
import { parseTaskListParams } from "@/lib/query-keys";
import { taskListQueryOptions } from "@/lib/queries";

export function TaskListClient() {
  const searchParams = useSearchParams();
  const params = parseTaskListParams((key) => searchParams.get(key) ?? undefined);
  const filtered = Boolean(
    params.search || params.work_status || params.approval_status || params.due_after || params.due_before,
  );

  // Hydrated from the server page's prefetch (same params → same key) on
  // first paint; a filter/page change lands on a URL the server hasn't
  // prefetched, so this fetches that one — and every one visited once
  // stays cached for instant back/forward.
  const { data } = useQuery(taskListQueryOptions(params));
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  if (rows.length === 0) {
    return (
      <Blueprint
        style={{
          padding: "48px 26px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 13,
          textAlign: "center",
        }}
      >
        <span style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-accent-100)", display: "grid", placeItems: "center" }}>
          <Search size={26} strokeWidth={2} color="var(--color-accent)" />
        </span>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18 }}>
          No tasks match these filters
        </div>
        <Link href="/tasks" className="btn btn-secondary">
          Clear all filters
        </Link>
      </Blueprint>
    );
  }

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ minWidth: 720 }}>
          <thead>
            <tr>
              <th>Task</th>
              <th>Approval</th>
              <th>Work status</th>
              <th>Due / duration</th>
              <th style={{ textAlign: "right" }}>Quick action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10.5, opacity: 0.5, fontVariantNumeric: "tabular-nums" }}>
                      {t.id.slice(0, 8)}
                    </span>
                    <Link href={`/tasks/${t.id}`} style={{ color: "var(--color-text)" }}>
                      {t.title}
                    </Link>
                  </div>
                </td>
                <td>
                  <ApprovalBadge status={t.approval_status} />
                </td>
                <td>
                  <WorkBadge status={t.work_status} />
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <DateChip due_date={t.due_date} overdue_since={t.overdue_since} work_status={t.work_status} />
                </td>
                <td style={{ textAlign: "right" }}>
                  <WorkStatusSelect taskId={t.id} status={t.work_status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          paddingTop: 14,
          fontSize: 12.5,
        }}
      >
        <span style={{ opacity: 0.6 }}>
          {filtered
            ? `Showing ${rows.length} of ${total} tasks · filters applied`
            : `Showing ${rows.length} of ${total} tasks`}
        </span>
        <Pagination page={params.page} pageSize={params.page_size} total={total} />
      </div>
    </div>
  );
}
