"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function Pagination({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function go(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ opacity: 0.6 }}>Per page</span>
      <select
        className="input"
        style={{ width: "auto", fontSize: 12.5 }}
        value={pageSize}
        onChange={(e) => go({ page_size: e.target.value, page: "1" })}
      >
        <option value={25}>25</option>
        <option value={50}>50</option>
      </select>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ minHeight: 32 }}
        disabled={page <= 1}
        onClick={() => go({ page: String(page - 1) })}
      >
        ←
      </button>
      <span style={{ padding: "0 4px" }}>
        {page} / {totalPages}
      </span>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ minHeight: 32 }}
        disabled={page >= totalPages}
        onClick={() => go({ page: String(page + 1) })}
      >
        →
      </button>
    </div>
  );
}
