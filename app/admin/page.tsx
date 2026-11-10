import {
  AdminHome,
  AdminHomeFallback,
} from "@/components/dashboard/auth/admin-home";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Área administrativa",
};

export default function AdminRoute() {
  return (
    <Suspense fallback={<AdminHomeFallback />}>
      <AdminHome />
    </Suspense>
  );
}
