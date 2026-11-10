"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardShell } from "./dashboard-shell";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminRoute) return <>{children}</>;

  return <DashboardShell>{children}</DashboardShell>;
}
