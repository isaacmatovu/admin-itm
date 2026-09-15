"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { Blueprint } from "@/components/ui/Blueprint";
import { ApprovalBadge } from "@/components/ui/StatusBadge";
import { ApprovalReviewPanel } from "@/components/tasks/ApprovalReviewPanel";
import { formatDate, formatDuration } from "@/lib/format";
import { approvalQueueQueryOptions } from "@/lib/queries";

export function ApprovalQueueClient() {
  const [tab, setTab] = useState<"pending" | "changes">("pending");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reviewId = searchParams.get("review");
  // Hydrated from the server page's prefetch on first paint — this only
  // hits the network again once something invalidates the "admin" or
  // "tasks" query families (see ApprovalReviewPanel's approve/send-back).
  const { data: items = [] } = useQuery(approvalQueueQueryOptions());

  const pending = items.filter((i) => i.approval_status === "pending_approval");
  const changes = items.filter((i) => i.approval_status === "needs_changes");
  const rows = tab === "pending" ? pending : changes;
  const reviewItem = items.find((i) => i.id === reviewId) ?? null;

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
              color: tab === key ? "var(--color-accent)" : "color-mix(in srgb, var(--color-text) 55%, transparent)",
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

      {rows.length === 0 ? (
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
          <span style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--st-approved-bg)", display: "grid", placeItems: "center" }}>
            <CheckCircle size={26} strokeWidth={2} color="var(--st-approved)" />
          </span>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 19 }}>
            {items.length === 0 ? "Nothing waiting on you right now" : `No tasks in ${tab === "pending" ? "Pending Approval" : "Needs Changes"}`}
          </div>
          {items.length === 0 && <div style={{ fontSize: 13, opacity: 0.6 }}>Both tabs are clear.</div>}
        </Blueprint>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10.5, opacity: 0.5, fontVariantNumeric: "tabular-nums" }}>
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
                  <td style={{ whiteSpace: "nowrap" }}>{formatDuration(r.duration_value, r.duration_unit)}</td>
                  <td style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{formatDate(r.submitted_at)}</td>
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
