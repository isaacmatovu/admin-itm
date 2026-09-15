import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { serverApi, ApiError } from "@/lib/api-server";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import type { TaskDetailResult, ProfileResponse, UserSummary } from "@/lib/api-types";
import { TaskDetailClient } from "./TaskDetailClient";

export default async function TaskDetailPage({ params }: PageProps<"/tasks/[id]">) {
  const { id } = await params;
  const queryClient = getQueryClient();

  // Fetched directly (not via prefetchQuery) because a 404 here needs to
  // produce a real Next.js not-found response before anything renders —
  // then seeded into the query cache with the result already in hand, so
  // TaskDetailClient's useQuery hydrates from it instead of refetching.
  let result: TaskDetailResult;
  try {
    result = await serverApi<TaskDetailResult>(`/api/v1/tasks/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  queryClient.setQueryData(queryKeys.task(id), result);

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.profile,
      queryFn: () => serverApi<ProfileResponse>("/api/v1/profile"),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.users,
      queryFn: () => serverApi<UserSummary[]>("/api/v1/users"),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TaskDetailClient taskId={id} />
    </HydrationBoundary>
  );
}
