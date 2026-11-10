import {
  AdminLoginFallback,
  AdminLoginPage,
} from "@/components/dashboard/auth/admin-login-page";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Login administrativo",
};

export default function AdminLoginRoute({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string | string[];
    next?: string | string[];
    status?: string | string[];
  }>;
}) {
  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AdminLoginPage searchParams={searchParams} />
    </Suspense>
  );
}
