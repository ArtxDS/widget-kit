import "server-only";

import type { User } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getConfiguredAdminId,
  isAuthorizedAdminId,
} from "./admin-policy";
import { getSupabasePublicConfig, SupabaseConfigError } from "./config";
import { ADMIN_LOGIN_PATH } from "./paths";

export type AdminAccess =
  | { status: "authorized"; user: User }
  | { status: "unauthorized"; user: User }
  | { status: "unauthenticated" }
  | { status: "misconfigured" };

export async function createServerSupabaseClient() {
  const config = getSupabasePublicConfig();
  if (!config) throw new SupabaseConfigError();

  const cookieStore = await cookies();

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. The proxy refreshes sessions
          // before the request reaches the component tree.
        }
      },
    },
  });
}

export async function getAdminAccess(): Promise<AdminAccess> {
  if (!getConfiguredAdminId()) return { status: "misconfigured" };

  const supabase = await createServerSupabaseClient().catch((error) => {
    if (error instanceof SupabaseConfigError) return null;
    throw error;
  });

  if (!supabase) return { status: "misconfigured" };

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { status: "unauthenticated" };

  if (!isAuthorizedAdminId(data.user.id)) {
    return { status: "unauthorized", user: data.user };
  }

  return { status: "authorized", user: data.user };
}

export async function getAuthorizedAdmin(): Promise<User | null> {
  const access = await getAdminAccess();
  return access.status === "authorized" ? access.user : null;
}

export async function requireAdmin(): Promise<User> {
  const access = await getAdminAccess();

  if (access.status === "authorized") return access.user;
  if (access.status === "unauthorized") {
    redirect(`${ADMIN_LOGIN_PATH}?error=unauthorized`);
  }
  if (access.status === "misconfigured") {
    redirect(`${ADMIN_LOGIN_PATH}?error=config`);
  }

  redirect(ADMIN_LOGIN_PATH);
}
