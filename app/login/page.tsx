import {
  UserLoginFallback,
  UserLoginPage,
} from "@/components/dashboard/auth/user-login-page";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Login",
};

export default function UserLoginRoute({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string | string[];
    next?: string | string[];
    status?: string | string[];
  }>;
}) {
  return (
    <Suspense fallback={<UserLoginFallback />}>
      <UserLoginPage searchParams={searchParams} />
    </Suspense>
  );
}