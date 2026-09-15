"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

const WORK_OPTIONS = [
  { value: "", label: "Any work status" },
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];
const APPROVAL_OPTIONS = [
  { value: "", label: "Any approval status" },
  { value: "pending_approval", label: "Pending approval" },
  { value: "needs_changes", label: "Needs changes" },
  { value: "approved", label: "Approved" },
];

/**
 * Filter state lives in the URL query string (search/work_status/
 * approval_status/due_after/due_before), per the design's convention for
 * TT-04 — so a filtered list is shareable and survives reload. Search is
 * debounced; every other control updates immediately.
 */
export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function update(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page"); // any filter change resets to page 1
    router.push(`${pathname}?${params.toString()}`);
  }

  function onSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update({ search: value }), 350);
  }

  const hasFilters =
    searchParams.get("search") ||
    searchParams.get("work_status") ||
    searchParams.get("approval_status") ||
    searchParams.get("due_after") ||
    searchParams.get("due_before");

  return (
    <div className="blueprint" style={{ padding: "14px 16px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
      <div className="field" style={{ flex: "2 1 210px", minWidth: 0 }}>
        <label>Search title</label>
        <input
          className="input"
          placeholder="e.g. payroll"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="field" style={{ flex: "1 1 140px" }}>
        <label>Work status</label>
        <select
          className="input"
          value={searchParams.get("work_status") ?? ""}
          onChange={(e) => update({ work_status: e.target.value })}
        >
          {WORK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field" style={{ flex: "1 1 140px" }}>
        <label>Approval status</label>
        <select
          className="input"
          value={searchParams.get("approval_status") ?? ""}
          onChange={(e) => update({ approval_status: e.target.value })}
        >
          {APPROVAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field" style={{ flex: "1 1 120px" }}>
        <label>Due after</label>
        <input
          type="date"
          className="input"
          value={searchParams.get("due_after")?.slice(0, 10) ?? ""}
          onChange={(e) => update({ due_after: e.target.value ? `${e.target.value}T00:00:00Z` : "" })}
        />
      </div>
      <div className="field" style={{ flex: "1 1 120px" }}>
        <label>Due before</label>
        <input
          type="date"
          className="input"
          value={searchParams.get("due_before")?.slice(0, 10) ?? ""}
          onChange={(e) => update({ due_before: e.target.value ? `${e.target.value}T23:59:59Z` : "" })}
        />
      </div>
      {hasFilters && (
        <button
          type="button"
          className="btn btn-ghost"
          style={{ minHeight: 36 }}
          onClick={() => {
            setSearch("");
            router.push(pathname);
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
