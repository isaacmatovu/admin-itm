import { QueryClient, isServer } from "@tanstack/react-query";

// Standard Next.js App Router + TanStack Query split: a fresh QueryClient
// per request on the server (so one user's prefetch can never leak into
// another's response), but a single long-lived instance in the browser (so
// navigating between routes reuses the cache instead of refetching).
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // The API is the source of truth and the Go server already computes
        // things like overdue_since — a short staleTime avoids a refetch on
        // every remount (e.g. switching tabs on the approval queue) while
        // still catching up quickly after a mutation invalidates a key.
        staleTime: 15_000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
