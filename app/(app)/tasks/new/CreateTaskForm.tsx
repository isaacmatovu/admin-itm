"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Blueprint } from "@/components/ui/Blueprint";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { clientApi, ApiError } from "@/lib/api-client";
import { usersQueryOptions } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import type { DurationUnit, TaskResponse } from "@/lib/api-types";

type Phase = "idle" | "invalid" | "submitting" | "success";

export function CreateTaskForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: users = [] } = useQuery(usersQueryOptions());
  const activeUsers = users.filter((u) => u.is_active);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState(activeUsers[0]?.id ?? "");
  const [durationValue, setDurationValue] = useState("2");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("days");
  const [phase, setPhase] = useState<Phase>("idle");
  const [showDiscard, setShowDiscard] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const dirty = title !== "" || description !== "";

  useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (dirty && phase !== "success") {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty, phase]);

  const titleInvalid = phase === "invalid" && title.trim().length < 5;
  const durationInvalid = phase === "invalid" && (!durationValue || Number(durationValue) <= 0);

  async function submit() {
    setServerError(null);
    if (title.trim().length < 5 || !durationValue || Number(durationValue) <= 0 || !assigneeId) {
      setPhase("invalid");
      return;
    }
    setPhase("submitting");
    try {
      const task = await clientApi<TaskResponse>("/api/v1/tasks/create", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          assignee_id: assigneeId,
          duration_value: Number(durationValue),
          duration_unit: durationUnit,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setSuccessMsg(
        `Task created and approved automatically.${
          task.due_date ? ` Due ${formatDate(task.due_date)}.` : ""
        } Opening the task…`,
      );
      setPhase("success");
      setTimeout(() => router.push(`/tasks/${task.id}`), 900);
    } catch (err) {
      setPhase("idle");
      setServerError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  function cancel() {
    if (dirty) setShowDiscard(true);
    else router.push("/");
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 22, alignItems: "flex-start" }}>
      <Blueprint style={{ flex: "2 1 380px", minWidth: 0, padding: "22px 22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {phase === "success" && (
          <div
            style={{
              display: "flex",
              gap: 9,
              alignItems: "flex-start",
              padding: "11px 13px",
              background: "var(--st-approved-bg)",
              color: "var(--st-approved)",
              borderLeft: "2px solid var(--st-approved)",
              fontSize: 13,
            }}
          >
            <span>{successMsg}</span>
          </div>
        )}
        {serverError && (
          <div
            style={{
              display: "flex",
              gap: 9,
              alignItems: "flex-start",
              padding: "11px 13px",
              background: "var(--st-changes-bg)",
              color: "var(--st-changes)",
              borderLeft: "2px solid var(--st-changes)",
              fontSize: 13,
            }}
          >
            <span>{serverError}</span>
          </div>
        )}

        <div className="field">
          <label>Task title *</label>
          <input
            className="input"
            style={titleInvalid ? { borderColor: "var(--st-changes)" } : undefined}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short, specific — what needs doing"
            disabled={phase === "submitting" || phase === "success"}
          />
          {titleInvalid && (
            <div style={{ fontSize: 12, color: "var(--st-changes)", marginTop: 5 }}>
              A title is required (at least 5 characters).
            </div>
          )}
        </div>

        <div className="field">
          <label>Description (optional)</label>
          <textarea
            className="input"
            style={{ minHeight: 96 }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Plain text. Context, links, anything the reviewer needs."
            disabled={phase === "submitting" || phase === "success"}
          />
        </div>

        <div className="field">
          <label>Assignee</label>
          <select
            className="input"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            disabled={phase === "submitting" || phase === "success"}
          >
            {activeUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.display_name} — {u.email}
              </option>
            ))}
          </select>
          <div
            style={{
              display: "flex",
              gap: 9,
              alignItems: "flex-start",
              marginTop: 9,
              padding: "10px 12px",
              background: "var(--st-progress-bg)",
              color: "var(--st-progress)",
              borderLeft: "2px solid var(--color-accent)",
              fontSize: 12.5,
            }}
          >
            <span>
              Assigned tasks you create are approved automatically — the assignee will never see a
              pending state, and the due date is set the moment you save.
            </span>
          </div>
        </div>

        <div className="field">
          <label>Requested duration *</label>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <input
              className="input"
              style={{ width: 78, borderColor: durationInvalid ? "var(--st-changes)" : undefined }}
              value={durationValue}
              onChange={(e) => setDurationValue(e.target.value.replace(/\D/g, ""))}
              placeholder="2"
              disabled={phase === "submitting" || phase === "success"}
            />
            <SegmentedControl
              name="duration-unit"
              options={[
                { value: "days" as DurationUnit, label: "Days" },
                { value: "weeks" as DurationUnit, label: "Weeks" },
              ]}
              value={durationUnit}
              onChange={setDurationUnit}
              disabled={phase === "submitting" || phase === "success"}
            />
          </div>
          {durationInvalid && (
            <div style={{ fontSize: 12, color: "var(--st-changes)", marginTop: 5 }}>
              Enter a duration.
            </div>
          )}
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
            An estimate, not a fixed date — the due date is set once this is approved.
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, alignItems: "center", paddingTop: 4 }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ minHeight: 42 }}
            disabled={phase === "submitting" || phase === "success"}
            onClick={submit}
          >
            {phase === "submitting" ? "Submitting…" : "Create Task"}
          </button>
          <button type="button" className="btn btn-secondary" style={{ minHeight: 42 }} onClick={cancel}>
            Cancel
          </button>
        </div>
      </Blueprint>

      <div style={{ flex: "1 1 250px", minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        <Blueprint style={{ padding: 16, display: "flex", flexDirection: "column", gap: 9 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "var(--color-accent-700)",
              fontFamily: "var(--font-heading)",
            }}
          >
            What happens next
          </div>
          <div style={{ fontSize: 13, opacity: 0.78 }}>
            Tasks you assign skip approval entirely. The due date is computed the moment you save
            (today + duration) and the assignee sees it as Approved.
          </div>
        </Blueprint>

        {showDiscard && (
          <Blueprint style={{ padding: 16, display: "flex", flexDirection: "column", gap: 11, borderLeft: "3px solid var(--st-pending)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15 }}>
              Discard changes?
            </div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              You&apos;ve started this task but haven&apos;t submitted it. Leaving now discards it.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowDiscard(false)}>
                Keep editing
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => router.push("/")}>
                Discard
              </button>
            </div>
          </Blueprint>
        )}
      </div>
    </div>
  );
}
