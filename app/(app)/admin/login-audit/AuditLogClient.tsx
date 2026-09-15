"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Blueprint } from "@/components/ui/Blueprint";
import { MetaChip } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/format";
import { parseAuditLogParams } from "@/lib/query-keys";
import { auditLogQueryOptions } from "@/lib/queries";

export function AuditLogClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = parseAuditLogParams((key) => searchParams.get(key) ?? undefined);
  const page = Math.floor(params.offset / params.limit) + 1;

  // Hydrated from the server page's prefetch (same params → same key) on
  // first paint; a page/filter change lands on a URL the server hasn't
  // prefetched, so this refetches for that one.
  const { data } = useQuery(auditLogQueryOptions(params));
  const rows = data?.data ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / params.limit));

  function pageHref(p: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(p));
    return `${pathname}?${next.toString()}`;
  }

  if (rows.length === 0) {
    return (
      <Blueprint
        style={{
          padding: "48px 26px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18 }}>
          No login attempts recorded yet
        </div>
      </Blueprint>
    );
  }

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ minWidth: 820, fontSize: 13 }}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Account attempted</th>
              <th>IP address</th>
              <th>Result</th>
              <th>MFA</th>
              <th>Fingerprint</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ID}>
                <td style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                  {formatDateTime(r.CreatedAt)}
                </td>
                <td>{r.EmailAttempted ?? "—"}</td>
                <td style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", opacity: 0.75 }}>
                  {r.IPAddress ?? "—"}
                </td>
                <td>
                  <MetaChip
                    label={r.Success ? "Success" : "Failure"}
                    fg={r.Success ? "var(--st-approved)" : "var(--st-changes)"}
                  />
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {r.MFAPassed ? (
                    <span style={{ fontSize: 12.5, opacity: 0.7 }}>Passed</span>
                  ) : (
                    <MetaChip label="Failed" fg="var(--st-changes)" />
                  )}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {/* task-tracker records a raw fingerprint hash per
                      attempt but not a computed match/mismatch verdict
                      (that check runs live at login time and isn't
                      persisted per-row) — "Recorded"/"—" reflects what
                      we can honestly show. */}
                  <span style={{ fontSize: 12.5, opacity: 0.7 }}>
                    {r.FingerprintHash ? "Recorded" : "—"}
                  </span>
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
        <span style={{ opacity: 0.6 }}>Read-only. Retained for security review.</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href={pageHref(page - 1)}
            className="btn btn-secondary"
            style={page <= 1 ? { minHeight: 32, pointerEvents: "none", opacity: 0.45 } : { minHeight: 32 }}
          >
            ←
          </Link>
          <span>
            {page} / {totalPages}
          </span>
          <Link
            href={pageHref(page + 1)}
            className="btn btn-secondary"
            style={page >= totalPages ? { minHeight: 32, pointerEvents: "none", opacity: 0.45 } : { minHeight: 32 }}
          >
            →
          </Link>
        </div>
      </div>
    </div>
  );
}
