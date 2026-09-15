import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { serverApi } from "@/lib/api-server";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys, parseTaskListParams, taskListQueryString } from "@/lib/query-keys";
import type { PaginatedTasks } from "@/lib/api-types";
import { PageHeader } from "@/components/shell/PageHeader";
import { FilterBar } from "./FilterBar";
import { TaskListClient } from "./TaskListClient";

export default async function TaskListPage({
  searchParams,
}: PageProps<"/tasks">) {
  const sp = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? undefined;
  const params = parseTaskListParams((key) => first(sp[key]));

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.taskList(params),
    queryFn: () => serverApi<PaginatedTasks>(`/api/v1/tasks?${taskListQueryString(params)}`),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageHeader kicker="My work" title="Task List" />
      <FilterBar />
      <TaskListClient />
    </HydrationBoundary>
  );
}
