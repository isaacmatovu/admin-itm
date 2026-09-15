"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { clientApi, ApiError } from "@/lib/api-client";
import { addDuration, formatDate, formatDuration } from "@/lib/format";
import type { ApprovalQueueItem, DurationUnit } from "@/lib/api-types";

type Decision = null | "approved" | "sentback";

/** TT-09 — the decision moment. Duration and the due-date preview recompute
 * live on every change, before anything is committed, so an admin never
 * approves "blind". */
export function ApprovalReviewPanel({
  item,
  onClose,
  onDecided,
}: {
  item: ApprovalQueueItem | null;
  onClose: () => void;
  /** Optional — the queue/detail/summary caches are already invalidated
   *  internally on a successful decision; this is only for a caller that
   *  wants to react further (e.g. a toast). */
  onDecided?: () => void;
}) {
  return (
    <Modal open={item !== null} onClose={onClose} labelledBy="review-panel-title">
      {item && (
        // Keyed by item.id so switching to a different row remounts this
        // with fresh state initialized straight from props — no
        // reset-on-prop-change effect needed.
        <ReviewPanelBody key={item.id} item={item} onClose={onClose} onDecided={onDecided} />
      )}
    </Modal>
  );
}

function ReviewPanelBody({
  item,
  onClose,
  onDecided,
}: {
  item: ApprovalQueueItem;
  onClose: () => void;
  onDecided?: () => void;
}) {
  const [durationValue, setDurationValue] = useState(item.duration_value);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>(item.duration_unit);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState(false);
  const [decision, setDecision] = useState<Decision>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const duePreview = formatDate(addDuration(new Date(), durationValue, durationUnit).toISOString());

  // Both decisions move the task out of the queue and change its approval
  // status, so every "tasks"- and "admin"-prefixed cache (the queue itself,
  // My Tasks, the full list, this task's own detail page, the company
  // summary counts) needs to be treated as stale once one lands.
  function invalidateAffected() {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  }

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      await clientApi(`/api/v1/tasks/${item.id}/approve`, {
        method: "POST",
        body: JSON.stringify({ duration_value: durationValue, duration_unit: durationUnit }),
      });
      invalidateAffected();
      setDecision("approved");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't approve this task.");
    } finally {
      setBusy(false);
    }
  }

  async function sendBack() {
    if (!note.trim()) {
      setNoteError(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await clientApi(`/api/v1/tasks/${item.id}/send-back`, {
        method: "POST",
        body: JSON.stringify({ note: note.trim() }),
      });
      invalidateAffected();
      setDecision("sentback");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send this task back.");
    } finally {
      setBusy(false);
    }
  }

  function close() {
    if (decision) onDecided?.();
    onClose();
  }

  if (decision) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center", padding: "26px 0" }}>
        <span
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: decision === "sentback" ? "var(--st-changes-bg)" : "var(--st-approved-bg)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <CheckCircle2
            size={30}
            strokeWidth={2}
            color={decision === "sentback" ? "var(--st-changes)" : "var(--st-approved)"}
          />
        </span>
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: 21,
            color: decision === "sentback" ? "var(--st-changes)" : "var(--st-approved)",
          }}
        >
          {decision === "sentback" ? "Sent back" : "Approved"}
        </div>
        <div style={{ fontSize: 13.5, opacity: 0.75, maxWidth: "42ch" }}>
          {decision === "sentback"
            ? `${item.assignee_name} will see your note on their dashboard with a one-tap resubmit. Nothing was emailed.`
            : `Due ${duePreview}. The task is now Approved and off your queue — work status stays wherever ${item.assignee_name} left it.`}
        </div>
        <button type="button" className="btn btn-secondary" onClick={close}>
          Back to queue
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div
            id="review-panel-title"
            style={{
              fontSize: 10,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "var(--color-accent-700)",
              fontFamily: "var(--font-heading)",
            }}
          >
            Review · {item.id.slice(0, 8)}
          </div>
          <h4 style={{ margin: "3px 0 0", fontSize: 21 }}>{item.title}</h4>
        </div>
        <button type="button" className="btn btn-ghost btn-icon" onClick={close} aria-label="Close">
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      {item.description && <p style={{ margin: 0, fontSize: 13.5, opacity: 0.8 }}>{item.description}</p>}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 18,
          fontSize: 13,
          padding: "11px 0",
          borderTop: "1px solid var(--color-divider)",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <div>
          <span style={{ opacity: 0.55 }}>Assignee</span>
          <br />
          <span style={{ fontSize: 14 }}>{item.assignee_name}</span>
        </div>
        <div>
          <span style={{ opacity: 0.55 }}>Requested</span>
          <br />
          <span style={{ fontSize: 14 }}>{formatDuration(item.duration_value, item.duration_unit)}</span>
        </div>
        <div>
          <span style={{ opacity: 0.55 }}>Submitted</span>
          <br />
          <span style={{ fontSize: 14 }}>{formatDate(item.submitted_at)}</span>
        </div>
      </div>

      {item.work_status !== "not_started" && (
        <div
          style={{
            display: "flex",
            gap: 9,
            alignItems: "flex-start",
            padding: "10px 12px",
            background: "var(--st-idle-bg)",
            color: "var(--st-idle)",
            fontSize: 12.5,
          }}
        >
          <span>
            {item.assignee_name} already marked this{" "}
            {item.work_status === "done" ? "Done" : "In Progress"}. That&apos;s expected — work
            status runs independently of approval.
          </span>
        </div>
      )}

      <div className="field">
        <label>Duration — adjust if needed</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <input
            className="input"
            style={{ width: 78 }}
            value={durationValue}
            onChange={(e) => setDurationValue(Number(e.target.value.replace(/\D/g, "")) || 0)}
          />
          <SegmentedControl
            name="review-duration-unit"
            options={[
              { value: "days" as DurationUnit, label: "Days" },
              { value: "weeks" as DurationUnit, label: "Weeks" },
            ]}
            value={durationUnit}
            onChange={setDurationUnit}
          />
        </div>
        <div
          style={{
            marginTop: 10,
            padding: "11px 13px",
            border: "1px solid var(--color-accent)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "var(--color-accent-700)",
              fontFamily: "var(--font-heading)",
            }}
          >
            Due date if approved now
          </span>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 21, letterSpacing: ".02em" }}>
            {duePreview}
          </span>
          <span style={{ fontSize: 11.5, opacity: 0.55 }}>
            approved_at + {formatDuration(durationValue, durationUnit)}
          </span>
        </div>
      </div>

      <div className="field">
        <label>Send-back note (required to send back)</label>
        <textarea
          className="input"
          style={{ minHeight: 78, borderColor: noteError ? "var(--st-changes)" : undefined }}
          placeholder="What needs fixing before this can be approved?"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (e.target.value.trim()) setNoteError(false);
          }}
        />
        {noteError && (
          <div style={{ fontSize: 12, color: "var(--st-changes)", marginTop: 5 }}>
            A note is required before a task can be sent back.
          </div>
        )}
      </div>

      {error && <div style={{ fontSize: 12.5, color: "var(--st-changes)" }}>{error}</div>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 9, alignItems: "center" }}>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={approve}>
          Approve · due {duePreview}
        </button>
        <button type="button" className="btn btn-secondary" disabled={busy} onClick={sendBack}>
          Send back
        </button>
        <button type="button" className="btn btn-ghost" style={{ marginLeft: "auto" }} onClick={close}>
          Cancel
        </button>
      </div>
    </div>
  );
}
