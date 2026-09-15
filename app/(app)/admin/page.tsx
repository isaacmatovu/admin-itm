import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { serverApi } from "@/lib/api-server";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import type { AdminSummaryResult, UserSummary } from "@/lib/api-types";
import { CompanyOverviewClient } from "./CompanyOverviewClient";

export default async function CompanyOverviewPage() {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.adminSummary,
      queryFn: () => serverApi<AdminSummaryResult>("/api/v1/admin/summary"),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.users,
      queryFn: () => serverApi<UserSummary[]>("/api/v1/users"),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CompanyOverviewClient />
    </HydrationBoundary>
  );
}
