// TanStack Query option builders for client components — the queryFn side
// of every key in lib/query-keys.ts, using clientApi (browser fetch,
// credentials: 'include'). Server pages prefetch the same keys with
// serverApi directly (see each page.tsx) since a server-side queryFn would
// need the request's cookies threaded through, which prefetchQuery/
// fetchQuery don't have a hook for — duplicating the two or three lines of
// fetch call per key is simpler than building that plumbing.
import { clientApi } from "./api-client";
import {
  queryKeys,
  taskListQueryString,
  auditLogQueryString,
  type TaskListParams,
  type AuditLogParams,
} from "./query-keys";
import type {
  ProfileResponse,
  UserSummary,
  PaginatedTasks,
  TaskDetailResult,
  AdminSummaryResult,
  ApprovalQueueItem,
  AuditLogPage,
} from "./api-types";

export function profileQueryOptions() {
  return {
    queryKey: queryKeys.profile,
    queryFn: () => clientApi<ProfileResponse>("/api/v1/profile"),
  };
}

export function usersQueryOptions() {
  return {
    queryKey: queryKeys.users,
    queryFn: () => clientApi<UserSummary[]>("/api/v1/users"),
  };
}

export function myTasksQueryOptions() {
  return {
    queryKey: queryKeys.myTasks,
    queryFn: () => clientApi<PaginatedTasks>("/api/v1/tasks?page_size=100"),
  };
}

export function taskListQueryOptions(params: TaskListParams) {
  return {
    queryKey: queryKeys.taskList(params),
    queryFn: () => clientApi<PaginatedTasks>(`/api/v1/tasks?${taskListQueryString(params)}`),
  };
}

export function taskQueryOptions(id: string) {
  return {
    queryKey: queryKeys.task(id),
    queryFn: () => clientApi<TaskDetailResult>(`/api/v1/tasks/${id}`),
  };
}

export function adminSummaryQueryOptions() {
  return {
    queryKey: queryKeys.adminSummary,
    queryFn: () => clientApi<AdminSummaryResult>("/api/v1/admin/summary"),
  };
}

export function approvalQueueQueryOptions() {
  return {
    queryKey: queryKeys.approvalQueue,
    queryFn: () => clientApi<ApprovalQueueItem[]>("/api/v1/admin/tasks/pending"),
  };
}

export function auditLogQueryOptions(params: AuditLogParams) {
  return {
    queryKey: queryKeys.auditLog(params),
    queryFn: () => clientApi<AuditLogPage>(`/api/v1/admin/audit?${auditLogQueryString(params)}`),
  };
}
