"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, ClipboardList, ArrowRight } from "lucide-react";
import { Blueprint } from "@/components/ui/Blueprint";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { TaskRow } from "@/components/tasks/TaskRow";
import { ResubmitButton } from "@/components/tasks/ResubmitButton";
import { profileQueryOptions, myTasksQueryOptions, adminSummaryQueryOptions, taskQueryOptions, usersQueryOptions } from "@/lib/queries";
import { greeting, longDate, formatDateTime, isOverdue } from "@/lib/format";

export function MyTasksClient() {
  // Hydrated from the server page's prefetch on first paint.
  const { data: profile } = useQuery(profileQueryOptions());
  const { data: tasks } = useQuery(myTasksQueryOptions());
  const { data: summary } = useQuery(adminSummaryQueryOptions());

  const rows = tasks?.data ?? [];
  const notStarted = rows.filter((t) => t.work_status === "not_started");
  const inProgress = rows.filter((t) => t.work_status === "in_progress");
  const done = rows.filter((t) => t.work_status === "done");
  const overdue = rows.filter((t) => isOverdue(t));
  const needsChanges = rows.filter((t) => t.approval_status === "needs_changes");
  const needsChangesId = needsChanges[0]?.id;

  // Only fetched (server-prefetched too, see page.tsx) when there's
  // something to show a banner for.
  const { data: sentBackDetail } = useQuery({
    ...taskQueryOptions(needsChangesId ?? ""),
    enabled: Boolean(needsChangesId),
  });
  const { data: users = [] } = useQuery({ ...usersQueryOptions(), enabled: Boolean(needsChangesId) });

  if (!profile || !tasks || !summary) return <Skeleton height={480} />;

  let banner: { title: string; note: string; reviewer: string; when: string } | null = null;
  if (needsChangesId && sentBackDetail) {
    const directory = new Map(users.map((u) => [u.id, u]));
    const sentBack = [...sentBackDetail.history].reverse().find((h) => h.event_type === "sent_back");
    if (sentBack) {
      banner = {
        title: sentBackDetail.task.title,
        note: sentBack.note ?? "",
        reviewer: directory.get(sentBack.actor_id)?.display_name ?? "Admin",
        when: formatDateTime(sentBack.created_at),
      };
    }
  }

  const inProgressApproved = inProgress.filter((t) => t.approval_status === "approved").length;
  const inProgressChanges = inProgress.filter((t) => t.approval_status === "needs_changes").length;
  const notStartedPending = notStarted.filter((t) => t.approval_status === "pending_approval").length;

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{greeting(profile.display_name)}</h3>
          <div style={{ fontSize: 13.5, opacity: 0.6, marginTop: 2 }}>{longDate()}</div>
        </div>
        <Blueprint as={Link} href="/tasks/new" className="btn btn-primary" style={{ minHeight: 40 }}>
          <Plus size={15} strokeWidth={1.5} />
          Create Task
        </Blueprint>
      </div>

      {banner && (
        <Blueprint
          style={{
            padding: "16px 18px",
            borderLeft: "3px solid var(--st-changes)",
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: "1 1 300px", minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 15,
                color: "var(--st-changes)",
              }}
            >
              {needsChanges.length} task{needsChanges.length === 1 ? "" : "s"} sent back for changes
            </div>
            <div style={{ fontSize: 14, marginTop: 5 }}>{banner.title}</div>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4, fontStyle: "italic" }}>
              &ldquo;{banner.note}&rdquo; — {banner.reviewer}, {banner.when}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href={`/tasks/${needsChanges[0].id}`} className="btn btn-secondary">
              Open
            </Link>
            <ResubmitButton taskId={needsChanges[0].id} />
          </div>
        </Blueprint>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <StatCard
          label="Not started"
          value={notStarted.length}
          sub={notStartedPending > 0 ? `${notStartedPending} awaiting approval` : "Nothing queued"}
        />
        <StatCard
          label="In progress"
          value={inProgress.length}
          sub={
            inProgress.length > 0
              ? `${inProgressApproved} approved, ${inProgressChanges} sent back`
              : "Nothing open"
          }
        />
        <StatCard label="Done" value={done.length} sub="Closed this month" />
        <StatCard
          label="Overdue"
          value={overdue.length}
          sub={overdue.length > 0 ? "Past due, not yet done" : "All clear"}
          color={overdue.length > 0 ? "var(--st-over)" : undefined}
        />
      </div>

      {rows.length === 0 ? (
        <Blueprint
          style={{
            padding: "54px 26px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            textAlign: "center",
          }}
        >
          <span
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--color-accent-100)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <ClipboardList size={26} strokeWidth={2} color="var(--color-accent)" />
          </span>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 19 }}>
            No tasks yet
          </div>
          <p style={{ fontSize: 13.5, opacity: 0.65, maxWidth: "40ch", margin: 0 }}>
            Everything you&apos;re working on will live here. Create your first task to get started.
          </p>
          <Link href="/tasks/new" className="btn btn-primary" style={{ minHeight: 40 }}>
            Create your first task
          </Link>
        </Blueprint>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
              My tasks
            </h4>
            <Link href="/tasks" style={{ fontSize: 13, fontWeight: 500 }}>
              Full list →
            </Link>
          </div>
          {rows
            .slice()
            .sort((a, b) => Number(isOverdue(b)) - Number(isOverdue(a)))
            .slice(0, 6)
            .map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
        </div>
      )}

      <Blueprint
        style={{
          padding: "18px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          background: "linear-gradient(120deg, var(--color-accent-100), color-mix(in srgb, var(--color-accent) 6%, var(--color-surface)))",
          border: "1px solid var(--color-accent-200)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: ".03em",
              textTransform: "uppercase",
              color: "var(--color-accent-700)",
            }}
          >
            Admin
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18 }}>
            Company Overview
          </div>
          <div style={{ fontSize: 12.5, opacity: 0.65, marginTop: 1 }}>
            {summary.total_overdue} overdue · {summary.pending_approval} pending approval ·{" "}
            {summary.needs_changes} need changes
          </div>
        </div>
        <Link href="/admin" className="btn btn-primary">
          Open overview <ArrowRight size={14} strokeWidth={2} />
        </Link>
      </Blueprint>
    </>
  );
}
