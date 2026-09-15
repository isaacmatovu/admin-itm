import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

/** The sidebar + main content shell every authenticated route renders
 * inside (see app/(app)/layout.tsx). Mobile-first: .app-shell/.app-main
 * are the small-viewport layout by default (Sidebar renders its own top
 * bar + off-canvas drawer below 880px); the single media query in
 * globals.css switches both this and Sidebar over to the persistent
 * desktop column layout. */
export function AppShell({
  userName,
  userRole,
  children,
}: {
  userName: string;
  userRole: string;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <Sidebar userName={userName} userRole={userRole} />
      <main className="app-main">{children}</main>
    </div>
  );
}
