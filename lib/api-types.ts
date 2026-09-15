// TS mirrors of the Go response DTOs (task-tracker/internal/models/models.go).
// Field names match the JSON tags exactly, since these are decoded straight
// from API responses in lib/api-core.ts.

export type WorkStatus = "not_started" | "in_progress" | "done";
export type ApprovalStatus = "pending_approval" | "needs_changes" | "approved";
export type DurationUnit = "days" | "weeks";
export type Role = "staff" | "admin";
export type HistoryEventType =
  | "created"
  | "resubmitted"
  | "sent_back"
  | "approved"
  | "status_change"
  | "reassigned"
  | "comment";

export interface ProfileResponse {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: Role;
  totp_enabled: boolean;
}

export interface UserSummary {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  avatar_url: string | null;
  is_active: boolean;
  totp_enabled: boolean;
}

// One row of GET /tasks (generated.ListTasksForUserRow — the list-shape
// projection, not the full detail record).
export interface TaskListRow {
  id: string;
  title: string;
  description: string | null;
  work_status: WorkStatus;
  approval_status: ApprovalStatus;
  due_date: string | null;
  overdue_since: string | null;
  created_at: string;
}

export interface PaginatedTasks {
  data: TaskListRow[];
  page: number;
  page_size: number;
  total: number;
}

export interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  assignee_id: string;
  duration_value: number;
  duration_unit: DurationUnit;
  work_status: WorkStatus;
  approval_status: ApprovalStatus;
  approval_note: string | null;
  due_date: string | null;
  approved_at: string | null;
  approved_by: string | null;
  overdue_since: string | null;
  last_overdue_alert_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskHistoryEntry {
  id: string;
  task_id: string;
  event_type: HistoryEventType;
  actor_id: string;
  note: string | null;
  created_at: string;
}

export interface TaskDetailResult {
  task: TaskDetail;
  history: TaskHistoryEntry[];
}

export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  created_by: string;
  assignee_id: string;
  duration_value: number;
  duration_unit: DurationUnit;
  work_status: WorkStatus;
  approval_status: ApprovalStatus;
  due_date?: string;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
}

export interface StaffWorkload {
  assignee_id: string;
  active_task_count: number;
}

export interface AdminSummaryResult {
  total_overdue: number;
  pending_approval: number;
  needs_changes: number;
  workload_per_staff: StaffWorkload[];
}

export interface ApprovalQueueItem {
  id: string;
  title: string;
  description: string | null;
  work_status: WorkStatus;
  approval_status: ApprovalStatus;
  assignee_id: string;
  assignee_name: string;
  duration_value: number;
  duration_unit: DurationUnit;
  submitted_at: string;
}

export interface AuditLogEntry {
  ID: string;
  UserID: string | null;
  EmailAttempted: string | null;
  IPAddress: string | null;
  UserAgent: string | null;
  FingerprintHash: string | null;
  Success: boolean;
  MFAPassed: boolean;
  CreatedAt: string;
}

export interface AuditLogPage {
  data: AuditLogEntry[];
  pagination: { limit: number; offset: number; total: number };
}
