import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { serverApi } from "@/lib/api-server";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import type { ApprovalQueueItem } from "@/lib/api-types";
import { ApprovalQueueClient } from "./ApprovalQueueClient";

export default async function ApprovalQueuePage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.approvalQueue,
    queryFn: () => serverApi<ApprovalQueueItem[]>("/api/v1/admin/tasks/pending"),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ApprovalQueueClient />
    </HydrationBoundary>
  );
}
