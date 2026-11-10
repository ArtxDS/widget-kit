import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../../packages/components/dashboard/auth/admin-auth.css";

export const metadata: Metadata = {
  title: {
    default: "Admin — widget-kit",
    template: "%s — widget-kit",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
