// Central query-key factory, imported by both server pages (to prefetch +
// dehydrate) and client components (to useQuery) — the two sides must build
// identical keys for hydration to hand off without a refetch flash.
// TanStack Query hashes object keys with sorted properties, so field order
// inside a params object doesn't matter, only which fields are present.

export type TaskListParams = {
  page: number;
  page_size: number;
  search?: string;
  work_status?: string;
  approval_status?: string;
  due_after?: string;
  due_before?: string;
};

export type AuditLogParams = {
  limit: number;
  offset: number;
  search?: string;
  outcome?: string;
  after?: string;
  before?: string;
};

/** Builds the querystring for a TaskListParams object — shared by the
 * server page's prefetch fetch and the client query's queryFn so both ever
 * hit the exact same URL for the exact same key. */
export function taskListQueryString(params: TaskListParams): string {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page));
  qs.set("page_size", String(params.page_size));
  for (const key of ["search", "work_status", "approval_status", "due_after", "due_before"] as const) {
    const v = params[key];
    if (v) qs.set(key, v);
  }
  return qs.toString();
}

/** Reads a TaskListParams object out of any string->string getter — a URL
 * searchParams object on the server (already reduced to single values) or
 * useSearchParams().get on the client — so both sides derive the exact
 * same params, and therefore the exact same query key, from the exact same
 * URL. */
export function parseTaskListParams(get: (key: string) => string | undefined): TaskListParams {
  const params: TaskListParams = {
    page: Number(get("page")) || 1,
    page_size: Number(get("page_size")) || 25,
  };
  for (const key of ["search", "work_status", "approval_status", "due_after", "due_before"] as const) {
    const v = get(key);
    if (v) params[key] = v;
  }
  return params;
}

export function parseAuditLogParams(get: (key: string) => string | undefined): AuditLogParams {
  const limit = 50;
  const page = Number(get("page")) || 1;
  const params: AuditLogParams = { limit, offset: (page - 1) * limit };
  for (const key of ["search", "outcome", "after", "before"] as const) {
    const v = get(key);
    if (v) params[key] = v;
  }
  return params;
}

export function auditLogQueryString(params: AuditLogParams): string {
  const qs = new URLSearchParams();
  qs.set("limit", String(params.limit));
  qs.set("offset", String(params.offset));
  for (const key of ["search", "outcome", "after", "before"] as const) {
    const v = params[key];
    if (v) qs.set(key, v);
  }
  return qs.toString();
}

export const queryKeys = {
  profile: ["profile"] as const,
  users: ["users"] as const,
  myTasks: ["tasks", "mine"] as const,
  taskList: (params: TaskListParams) => ["tasks", "list", params] as const,
  task: (id: string) => ["tasks", "detail", id] as const,
  adminSummary: ["admin", "summary"] as const,
  approvalQueue: ["admin", "approvals"] as const,
  auditLog: (params: AuditLogParams) => ["admin", "audit", params] as const,
};
