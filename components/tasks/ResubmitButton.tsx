"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api-client";

/** Resubmits a needs-changes task without leaving the page (TT-03's banner)
 * or from the task detail itself (TT-06) — both call the same endpoint.
 * Invalidating every "tasks"-prefixed query is what makes both callers'
 * useQuery-backed views pick the change up, replacing the old
 * router.refresh() (which re-ran the whole Server Component tree). */
export function ResubmitButton({
  taskId,
  primary = true,
}: {
  taskId: string;
  primary?: boolean;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => clientApi(`/api/v1/tasks/${taskId}/resubmit`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  return (
    <button
      type="button"
      className={primary ? "btn btn-primary" : "btn btn-secondary"}
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? "Resubmitting…" : "Resubmit"}
    </button>
  );
}
