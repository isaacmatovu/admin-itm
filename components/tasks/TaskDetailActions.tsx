"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { clientApi, ApiError } from "@/lib/api-client";
import type { DurationUnit, TaskDetail, UserSummary } from "@/lib/api-types";

/** Edit / Reassign / Delete for TT-06 — Approve/Send back are handled by
 * linking to the TT-09 overlay on /admin/approvals (see page.tsx), matching
 * the design's routing table (that overlay lives only on the queue page). */
export function TaskDetailActions({
  task,
  users,
}: {
  task: TaskDetail;
  users: UserSummary[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<"edit" | "reassign" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [durationValue, setDurationValue] = useState(String(task.duration_value));
  const [durationUnit, setDurationUnit] = useState<DurationUnit>(task.duration_unit);
  const [assigneeId, setAssigneeId] = useState(task.assignee_id);

  function close() {
    setModal(null);
    setError(null);
  }

  async function saveEdit() {
    setBusy(true);
    setError(null);
    try {
      await clientApi(`/api/v1/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          description: description || null,
          duration_value: Number(durationValue),
          duration_unit: durationUnit,
        }),
      });
      close();
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save changes.");
    } finally {
      setBusy(false);
    }
  }

  async function saveReassign() {
    setBusy(true);
    setError(null);
    try {
      await clientApi(`/api/v1/tasks/${task.id}/reassign`, {
        method: "PATCH",
        body: JSON.stringify({ assignee_id: assigneeId }),
      });
      close();
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reassign this task.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    setError(null);
    try {
      await clientApi(`/api/v1/tasks/${task.id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      router.push("/tasks");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete this task.");
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-secondary" onClick={() => setModal("edit")}>
        <Pencil size={14} strokeWidth={1.5} />
        Edit
      </button>
      <button type="button" className="btn btn-secondary" onClick={() => setModal("reassign")}>
        Reassign
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        style={{ marginLeft: "auto", color: "var(--st-changes)" }}
        onClick={() => setModal("delete")}
      >
        Delete task
      </button>

      <Modal open={modal === "edit"} onClose={close} labelledBy="edit-task-title">
        <h4 id="edit-task-title" style={{ margin: 0, fontSize: 20 }}>
          Edit task
        </h4>
        {error && <div style={{ fontSize: 12.5, color: "var(--st-changes)" }}>{error}</div>}
        <div className="field">
          <label>Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            className="input"
            style={{ minHeight: 90 }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Duration</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              style={{ width: 78 }}
              value={durationValue}
              onChange={(e) => setDurationValue(e.target.value.replace(/\D/g, ""))}
            />
            <SegmentedControl
              name="edit-duration-unit"
              options={[
                { value: "days" as DurationUnit, label: "Days" },
                { value: "weeks" as DurationUnit, label: "Weeks" },
              ]}
              value={durationUnit}
              onChange={setDurationUnit}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={close}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={saveEdit}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </Modal>

      <Modal open={modal === "reassign"} onClose={close} labelledBy="reassign-task-title">
        <h4 id="reassign-task-title" style={{ margin: 0, fontSize: 20 }}>
          Reassign task
        </h4>
        {error && <div style={{ fontSize: 12.5, color: "var(--st-changes)" }}>{error}</div>}
        <div className="field">
          <label>New assignee</label>
          <select className="input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            {users
              .filter((u) => u.is_active)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name} — {u.email}
                </option>
              ))}
          </select>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={close}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={saveReassign}>
            {busy ? "Reassigning…" : "Reassign"}
          </button>
        </div>
      </Modal>

      <Modal open={modal === "delete"} onClose={close} labelledBy="delete-task-title">
        <h4 id="delete-task-title" style={{ margin: 0, fontSize: 20, color: "var(--st-changes)" }}>
          Delete this task?
        </h4>
        {error && <div style={{ fontSize: 12.5, color: "var(--st-changes)" }}>{error}</div>}
        <p style={{ fontSize: 13.5, opacity: 0.8, margin: 0 }}>
          This can&apos;t be undone. The task&apos;s history is kept for records, but it will no
          longer appear anywhere in the app.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={close}>
            Keep task
          </button>
          <button type="button" className="btn btn-ghost" style={{ color: "var(--st-changes)" }} disabled={busy} onClick={confirmDelete}>
            {busy ? "Deleting…" : "Delete task"}
          </button>
        </div>
      </Modal>
    </>
  );
}
