"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getQueryClient } from "@/lib/query-client";

/** Wraps every authenticated route (see app/(app)/layout.tsx). Each server
 * page below prefetches into its own request-scoped QueryClient and hands
 * the dehydrated cache down via <HydrationBoundary> — this provider is just
 * the browser-side client those hydrate into. */
export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
