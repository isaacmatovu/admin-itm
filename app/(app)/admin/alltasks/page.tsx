"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListChecks } from "lucide-react";
import { Blueprint } from "@/components/ui/Blueprint";
import { ApprovalBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatDuration } from "@/lib/format";
import { allCompanyUsersTasksQueryOptions } from "@/lib/queries";

const WORK_STATUSES = [
  ["", "All statuses"],
  ["not_started", "Not started"],
  ["in_progress", "In progress"],
  ["done", "Done"],
] as const;

export default function AllTasksClient() {
  const [page, setPage] = useState(1);
  const [workStatus, setWorkStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { data, isFetching } = useQuery(
    allCompanyUsersTasksQueryOptions({ page, workStatus, search }),
  );
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.page_size ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(searchInput.trim());
        }}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        <input
          className="input"
          placeholder="Search task or member…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ minWidth: 240 }}
        />
        <select
          className="input"
          value={workStatus}
          onChange={(e) => {
            setPage(1);
            setWorkStatus(e.target.value);
          }}
        >
          {WORK_STATUSES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="btn btn-secondary"
          style={{ minHeight: 34 }}
        >
          Search
        </button>
        <span style={{ marginLeft: "auto", fontSize: 13, opacity: 0.6 }}>
          {total} {total === 1 ? "task" : "tasks"}
        </span>
      </form>

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
            <ListChecks size={26} strokeWidth={2} color="var(--st-approved)" />
          </span>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 19,
            }}
          >
            {isFetching ? "Loading tasks…" : "No tasks found"}
          </div>
        </Blueprint>
      ) : (
        <div style={{ overflowX: "auto", opacity: isFetching ? 0.7 : 1 }}>
          <table className="table" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th>Task</th>
                <th>Member</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Due</th>
                <th>Approval</th>
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
                      <span style={{ color: "var(--color-text)" }}>
                        {r.title}
                      </span>
                    </div>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{r.assignee_name}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {r.work_status.replace(/_/g, " ")}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {formatDuration(r.duration_value, r.duration_unit)}
                  </td>
                  <td
                    style={{
                      whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {r.due_date ? formatDate(r.due_date) : "—"}
                 
                  </td>
                  <td>
                    <ApprovalBadge status={r.approval_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > pageSize && (
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            style={{ minHeight: 30, fontSize: 12 }}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ minHeight: 30, fontSize: 12 }}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
