import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { serverApi } from "@/lib/api-server";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import type {
  PaginatedTasks,
  ProfileResponse,
  TaskDetailResult,
  AdminSummaryResult,
  UserSummary,
} from "@/lib/api-types";
import { MyTasksClient } from "./MyTasksClient";

export default async function MyTasksPage() {
  const queryClient = getQueryClient();

  // fetchQuery (not prefetchQuery) so the result is in hand here to decide
  // whether the "sent back" banner needs a further prefetch below.
  const [, tasks] = await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.profile,
      queryFn: () => serverApi<ProfileResponse>("/api/v1/profile"),
    }),
    queryClient.fetchQuery({
      queryKey: queryKeys.myTasks,
      // No dedicated "my task stats" aggregate exists — this fetches up to
      // 100 of the caller's own tasks; MyTasksClient computes the counts
      // client-side from the same cached list.
      queryFn: () => serverApi<PaginatedTasks>("/api/v1/tasks?page_size=100"),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.adminSummary,
      queryFn: () => serverApi<AdminSummaryResult>("/api/v1/admin/summary"),
    }),
  ]);

  const needsChangesId = tasks.data.find((t) => t.approval_status === "needs_changes")?.id;
  if (needsChangesId) {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.task(needsChangesId),
        queryFn: () => serverApi<TaskDetailResult>(`/api/v1/tasks/${needsChangesId}`),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.users,
        queryFn: () => serverApi<UserSummary[]>("/api/v1/users"),
      }),
    ]);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MyTasksClient />
    </HydrationBoundary>
  );
}
