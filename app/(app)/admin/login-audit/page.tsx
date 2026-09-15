import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { serverApi } from "@/lib/api-server";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys, parseAuditLogParams, auditLogQueryString } from "@/lib/query-keys";
import type { AuditLogPage } from "@/lib/api-types";
import { AuditFilterBar } from "./AuditFilterBar";
import { AuditLogClient } from "./AuditLogClient";

export default async function LoginAuditPage({
  searchParams,
}: PageProps<"/admin/login-audit">) {
  const sp = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? undefined;
  const params = parseAuditLogParams((key) => first(sp[key]));

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.auditLog(params),
    queryFn: () => serverApi<AuditLogPage>(`/api/v1/admin/audit?${auditLogQueryString(params)}`),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AuditFilterBar />
      <AuditLogClient />
    </HydrationBoundary>
  );
}
