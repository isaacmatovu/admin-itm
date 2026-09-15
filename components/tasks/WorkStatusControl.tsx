"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { clientApi } from "@/lib/api-client";
import type { WorkStatus } from "@/lib/api-types";

const OPTIONS: { value: WorkStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

/**
 * The work-status segmented control writes immediately on change —
 * optimistically, no save button, no confirmation, and independent of
 * approval status (per README's task-row spec). Reverts and surfaces a
 * non-blocking inline error on failure. The optimistic flip stays local
 * component state (this control can appear several times on one page, one
 * per row, so there's nothing shared to patch); on success every cached
 * "tasks"-prefixed query is invalidated so other mounted views (the
 * dashboard, the full list, this task's detail page) pick up the change
 * next time they're visited instead of showing stale data.
 */
export function WorkStatusControl({
  taskId,
  status,
  onChanged,
  size = "md",
  disabled = false,
}: {
  taskId: string;
  status: WorkStatus;
  onChanged?: (next: WorkStatus) => void;
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (next: WorkStatus) =>
      clientApi(`/api/v1/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ work_status: next }),
      }),
  });

  function handle(next: WorkStatus) {
    const prev = value;
    setValue(next);
    setError(null);
    mutation.mutate(next, {
      onSuccess: () => {
        onChanged?.(next);
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      },
      onError: () => {
        setValue(prev);
        setError("Couldn't save — try again.");
      },
    });
  }

  return (
    <div>
      <SegmentedControl
        name={`work-${taskId}`}
        options={OPTIONS}
        value={value}
        onChange={handle}
        size={size}
        disabled={disabled}
      />
      {error && (
        <div style={{ fontSize: 11, color: "var(--st-changes)", marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
}
