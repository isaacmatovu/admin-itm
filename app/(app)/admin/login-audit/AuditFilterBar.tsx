"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

export function AuditFilterBar() {
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
    params.delete("offset");
    router.push(`${pathname}?${params.toString()}`);
  }

  function onSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update({ search: value }), 350);
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
      <div className="field" style={{ flex: "1 1 190px", minWidth: 0 }}>
        <label>User or email</label>
        <input className="input" value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Any user" />
      </div>
      <div className="field" style={{ flex: "1 1 140px" }}>
        <label>Outcome</label>
        <select className="input" value={searchParams.get("outcome") ?? ""} onChange={(e) => update({ outcome: e.target.value })}>
          <option value="">Any outcome</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </select>
      </div>
      <div className="field" style={{ flex: "1 1 130px" }}>
        <label>After</label>
        <input
          type="date"
          className="input"
          value={searchParams.get("after")?.slice(0, 10) ?? ""}
          onChange={(e) => update({ after: e.target.value ? `${e.target.value}T00:00:00Z` : "" })}
        />
      </div>
      <div className="field" style={{ flex: "1 1 130px" }}>
        <label>Before</label>
        <input
          type="date"
          className="input"
          value={searchParams.get("before")?.slice(0, 10) ?? ""}
          onChange={(e) => update({ before: e.target.value ? `${e.target.value}T23:59:59Z` : "" })}
        />
      </div>
    </div>
  );
}
