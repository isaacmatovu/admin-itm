import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { serverApi } from "@/lib/api-server";
import type { ProfileResponse } from "@/lib/api-types";

// Wraps every authenticated route (TT-03 through TT-11) in the sidebar +
// main shell, and in the TanStack Query client every page below hydrates
// its server-prefetched data into. proxy.ts has already confirmed a valid
// admin session before any request reaches here, so this just needs the
// profile to render the user block — it doesn't re-check auth itself.
export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await serverApi<ProfileResponse>("/api/v1/profile");

  return (
    <QueryProvider>
      <AppShell
        userName={profile.display_name}
        userRole={profile.role === "admin" ? "Administrator" : "Staff"}
      >
        {children}
      </AppShell>
    </QueryProvider>
  );
}
