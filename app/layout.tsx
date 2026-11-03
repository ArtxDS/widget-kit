import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { tw } from "@/lib/tailwind";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "widget-kit — Component workspace",
  description:
    "Personal library of reusable components, widgets, and utilities.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={tw("app-html")}>
      <body className={tw("app-body")}>
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
