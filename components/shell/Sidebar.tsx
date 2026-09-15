"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, ClipboardList, LayoutGrid, CheckSquare, Users, ShieldCheck, LogOut, Menu, X } from "lucide-react";
import { clientApi } from "@/lib/api-client";
import { initials } from "@/lib/format";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const NAV_GROUPS = [
  {
    label: "My work",
    items: [
      { href: "/", label: "My Tasks", icon: LayoutGrid },
      { href: "/tasks", label: "Task List", icon: ClipboardList },
      { href: "/tasks/new", label: "Create Task", icon: Plus },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/admin", label: "Company Overview", icon: LayoutGrid },
      { href: "/admin/approvals", label: "Approval Queue", icon: CheckSquare },
      { href: "/admin/users", label: "User Management", icon: Users },
      { href: "/admin/login-audit", label: "Login Audit Log", icon: ShieldCheck },
    ],
  },
] as const;

/**
 * Mobile-first: below 880px this renders as a sticky top bar + an
 * off-canvas drawer (.app-topbar/.app-sidebar/.app-backdrop in
 * globals.css); at 880px+ the same <nav> becomes the persistent desktop
 * column and the top bar/backdrop disappear — see the single media query
 * at the bottom of globals.css's "App shell" section.
 */
export function Sidebar({
  userName,
  userRole,
}: {
  userName: string;
  userRole: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  // Escape-to-close for the mobile drawer — window-level listener, only
  // attached while open, so this never fires (or costs anything) on
  // desktop where the drawer is always visually "open" anyway.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function signOut() {
    try {
      await clientApi("/api/v1/auth/logout", { method: "POST" });
    } finally {
      // A full reload rather than router.push: guarantees every cached RSC
      // payload and client component state from the authenticated session
      // is gone, not just the visible route.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
  }

  return (
    <>
      <header className="app-topbar">
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          aria-label="Open navigation menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Menu size={20} strokeWidth={2} />
        </button>
        <span
          style={{
            width: 26,
            height: 26,
            flex: "none",
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          IT
        </span>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14.5, letterSpacing: "-0.01em" }}>
          Task Tracking
        </span>
      </header>

      <div
        className="app-backdrop"
        data-open={open}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      <nav
        ref={panelRef}
        id="app-nav"
        className="app-sidebar"
        data-open={open}
        aria-label="Main navigation"
        style={{
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-divider)",
          padding: "16px 12px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div style={{ padding: "0 8px", display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 32,
              height: 32,
              flex: "none",
              borderRadius: 9,
              background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 13,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            IT
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              flex: 1,
            }}
          >
            Task Tracking
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-icon app-sidebar-close"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
            style={{ width: 32, height: 32 }}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div
              style={{
                padding: "0 10px 6px",
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: ".03em",
                textTransform: "uppercase",
                color: "color-mix(in srgb, var(--color-text) 42%, transparent)",
              }}
            >
              {group.label}
            </div>
            {group.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    background: active ? "var(--color-accent-100)" : "transparent",
                    borderRadius: 8,
                    color: active ? "var(--color-accent-800)" : "var(--color-text)",
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    padding: "10px 10px",
                    minHeight: 42,
                    textDecoration: "none",
                    transition: "background-color .12s ease",
                  }}
                >
                  <Icon size={16} strokeWidth={2} color={active ? "var(--color-accent)" : undefined} style={{ opacity: active ? 1 : 0.65, flex: "none" }} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}

        <div
          style={{
            marginTop: "auto",
            padding: "14px 10px 0",
            borderTop: "1px solid var(--color-divider)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 32,
                height: 32,
                flex: "none",
                borderRadius: "50%",
                background: "var(--color-accent-100)",
                color: "var(--color-accent-800)",
                display: "grid",
                placeItems: "center",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: ".01em",
              }}
            >
              {initials(userName)}
            </span>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: 1.25,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userName}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
                }}
              >
                {userRole}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={signOut}
              style={{ fontSize: 12.5, paddingInline: 8 }}
            >
              <LogOut size={14} strokeWidth={2} />
              Sign out
            </button>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </>
  );
}
