import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { serverApi } from "@/lib/api-server";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import type { UserSummary } from "@/lib/api-types";
import { UserManagementClient } from "./UserManagementClient";

export default async function UserManagementPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.users,
    queryFn: () => serverApi<UserSummary[]>("/api/v1/users"),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserManagementClient />
    </HydrationBoundary>
  );
}
