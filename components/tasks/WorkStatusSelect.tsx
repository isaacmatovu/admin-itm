"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api-client";
import type { WorkStatus } from "@/lib/api-types";

const OPTIONS: { value: WorkStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

/** The dense-table quick-action variant of the work-status control (TT-04),
 * a plain select instead of the segmented control used in card/detail
 * layouts — same optimistic-write behavior as WorkStatusControl. */
export function WorkStatusSelect({ taskId, status }: { taskId: string; status: WorkStatus }) {
  const [value, setValue] = useState(status);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (next: WorkStatus) =>
      clientApi(`/api/v1/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ work_status: next }),
      }),
  });

  function onChange(next: WorkStatus) {
    const prev = value;
    setValue(next);
    mutation.mutate(next, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
      onError: () => setValue(prev),
    });
  }

  return (
    <select
      className="input"
      style={{ width: "auto", minWidth: 128, fontSize: 12.5 }}
      value={value}
      disabled={mutation.isPending}
      onChange={(e) => onChange(e.target.value as WorkStatus)}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
