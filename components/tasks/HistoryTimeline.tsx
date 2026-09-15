import { formatDateTime } from "@/lib/format";
import type { HistoryEventType, TaskHistoryEntry } from "@/lib/api-types";

const EVENT_COLOR: Record<HistoryEventType, string> = {
  created: "var(--color-accent)",
  status_change: "var(--st-progress)",
  sent_back: "var(--st-changes)",
  resubmitted: "var(--st-pending)",
  approved: "var(--st-approved)",
  reassigned: "var(--color-accent-700)",
  comment: "var(--st-idle)",
};

const EVENT_LABEL: Record<HistoryEventType, string> = {
  created: "Created",
  status_change: "Status change",
  sent_back: "Sent back",
  resubmitted: "Resubmitted",
  approved: "Approved",
  reassigned: "Reassigned",
  comment: "Comment",
};

/** The append-only history sidebar (TT-06) — a vertical timeline, newest
 * last. Every state change, note and reassignment appends an immutable
 * row; nothing here is ever edited or removed. */
export function HistoryTimeline({
  history,
  actorNames,
}: {
  history: TaskHistoryEntry[];
  actorNames: Map<string, string>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {history.map((h, i) => (
        <div key={h.id} style={{ display: "flex", gap: 12, paddingBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none", width: 12 }}>
            <span
              style={{
                width: 7,
                height: 7,
                background: EVENT_COLOR[h.event_type],
                marginTop: 6,
                flex: "none",
              }}
            />
            {i < history.length - 1 && (
              <span style={{ width: 1, flex: 1, background: "var(--color-divider)", marginTop: 4 }} />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                fontFamily: "var(--font-heading)",
                color: EVENT_COLOR[h.event_type],
              }}
            >
              {EVENT_LABEL[h.event_type]}
            </div>
            {h.note && <div style={{ fontSize: 13, opacity: 0.85 }}>{h.note}</div>}
            <div style={{ fontSize: 11, opacity: 0.5, fontVariantNumeric: "tabular-nums" }}>
              {actorNames.get(h.actor_id) ?? "Someone"} · {formatDateTime(h.created_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
