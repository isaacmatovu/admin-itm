"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Blueprint } from "@/components/ui/Blueprint";
import { MetaChip } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { clientApi, ApiError } from "@/lib/api-client";
import { usersQueryOptions } from "@/lib/queries";
import type { Role, UserSummary } from "@/lib/api-types";

type PendingAction =
  | { kind: "role"; user: UserSummary; nextRole: Role }
  | { kind: "deactivate"; user: UserSummary }
  | { kind: "reactivate"; user: UserSummary };

export function UserManagementClient() {
  const queryClient = useQueryClient();
  const { data: users = [] } = useQuery(usersQueryOptions());
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"" | Role>("");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [deactivated, setDeactivated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesQuery =
        !query ||
        u.display_name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase());
      const matchesRole = !role || u.role === role;
      return matchesQuery && matchesRole;
    });
  }, [users, query, role]);

  const activeCount = users.filter((u) => u.is_active).length;
  const adminCount = users.filter((u) => u.is_active && u.role === "admin").length;
  const filtering = query || role;

  async function confirmAction() {
    if (!pending) return;
    setBusy(true);
    setBlocked(null);
    try {
      if (pending.kind === "role") {
        await clientApi(`/api/v1/users/${pending.user.id}/role`, {
          method: "PATCH",
          body: JSON.stringify({ role: pending.nextRole }),
        });
      } else if (pending.kind === "deactivate") {
        await clientApi(`/api/v1/users/${pending.user.id}/deactivate`, { method: "PATCH" });
        setDeactivated(pending.user.display_name);
      } else {
        await clientApi(`/api/v1/users/${pending.user.id}/reactivate`, { method: "PATCH" });
      }
      setPending(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setBlocked(pending.user.display_name);
        setPending(null);
      } else {
        setBlocked(null);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
        <div className="field" style={{ flex: "2 1 220px", minWidth: 0 }}>
          <label>Search name or email</label>
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Chiamaka" />
        </div>
        <div className="field" style={{ flex: "1 1 140px" }}>
          <label>Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as "" | Role)}>
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        <span style={{ fontSize: 12.5, opacity: 0.6, paddingBottom: 9 }}>
          {filtering ? `${filtered.length} of ${users.length} accounts` : `${users.length} accounts · ${activeCount} active · ${adminCount} admins`}
        </span>
      </div>

      {blocked && (
        <Blueprint style={{ padding: "16px 18px", borderLeft: "3px solid var(--st-changes)", display: "flex", gap: 11, alignItems: "flex-start" }}>
          <AlertCircle size={17} strokeWidth={2} color="var(--st-changes)" style={{ flex: "none", marginTop: 2 }} />
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--st-changes)" }}>
              Can&apos;t demote the last Admin
            </div>
            <div style={{ fontSize: 13.5, opacity: 0.8, maxWidth: "62ch" }}>
              {blocked} is the only active Admin. Promote someone else to Admin first, then demote
              or deactivate this account — the system will never leave zero active Admins.
            </div>
          </div>
        </Blueprint>
      )}

      {deactivated && (
        <div
          style={{
            display: "flex",
            gap: 9,
            alignItems: "center",
            padding: "10px 13px",
            background: "var(--st-approved-bg)",
            color: "var(--st-approved)",
            borderLeft: "2px solid var(--st-approved)",
            fontSize: 13,
          }}
        >
          <CheckCircle2 size={15} strokeWidth={1.5} style={{ flex: "none" }} />
          <span>
            {deactivated} deactivated. Their account stays visible below, greyed out, with their
            task history intact.
          </span>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ minWidth: 780 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>2FA</th>
              <th>Account</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.45 }}>
                <td style={{ whiteSpace: "nowrap" }}>{u.display_name}</td>
                <td style={{ opacity: 0.7 }}>{u.email}</td>
                <td>
                  <MetaChip label={u.role === "admin" ? "Admin" : "Staff"} fg={u.role === "admin" ? "var(--color-accent-700)" : "var(--st-idle)"} />
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {u.totp_enabled ? (
                    <span style={{ fontSize: 12.5, opacity: 0.75 }}>Enrolled</span>
                  ) : (
                    <MetaChip label="Not enrolled" fg="var(--st-pending)" />
                  )}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {u.is_active ? (
                    <span style={{ fontSize: 12.5, opacity: 0.75 }}>Active</span>
                  ) : (
                    <MetaChip label="Inactive" fg="var(--st-idle)" />
                  )}
                </td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <div style={{ display: "inline-flex", gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ minHeight: 30, fontSize: 12 }}
                      onClick={() =>
                        setPending({ kind: "role", user: u, nextRole: u.role === "admin" ? "staff" : "admin" })
                      }
                    >
                      {u.role === "admin" ? "Demote to Staff" : "Promote to Admin"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: 12 }}
                      onClick={() =>
                        setPending(u.is_active ? { kind: "deactivate", user: u } : { kind: "reactivate", user: u })
                      }
                    >
                      {u.is_active ? "Deactivate" : "Reactivate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11.5, opacity: 0.55 }}>
        Every role change and deactivation is confirmed in a dialog first. The initial Admin is
        set in environment configuration, not here.
      </div>

      <Modal open={pending !== null} onClose={() => setPending(null)} labelledBy="user-action-title">
        {pending && (
          <>
            <h4 id="user-action-title" style={{ margin: 0, fontSize: 20 }}>
              {pending.kind === "role"
                ? `${pending.nextRole === "admin" ? "Promote" : "Demote"} ${pending.user.display_name}?`
                : pending.kind === "deactivate"
                  ? `Deactivate ${pending.user.display_name}?`
                  : `Reactivate ${pending.user.display_name}?`}
            </h4>
            <p style={{ fontSize: 13.5, opacity: 0.8, margin: 0 }}>
              {pending.kind === "role"
                ? pending.nextRole === "admin"
                  ? "They'll gain access to the Administration section — Approval Queue, User Management, and the Login Audit Log."
                  : "They'll lose access to the Administration section immediately."
                : pending.kind === "deactivate"
                  ? "Their account stays visible, greyed out, with their task history intact — nothing is deleted."
                  : "Their account becomes active again and they can sign in as normal."}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setPending(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={confirmAction}>
                {busy ? "Working…" : "Confirm"}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
