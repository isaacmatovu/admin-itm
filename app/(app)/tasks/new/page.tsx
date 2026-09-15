import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { PageHeader } from "@/components/shell/PageHeader";
import { serverApi } from "@/lib/api-server";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import type { UserSummary } from "@/lib/api-types";
import { CreateTaskForm } from "./CreateTaskForm";

export default async function CreateTaskPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.users,
    queryFn: () => serverApi<UserSummary[]>("/api/v1/users"),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageHeader kicker="My work" title="Create Task" />
      <CreateTaskForm />
    </HydrationBoundary>
  );
}
