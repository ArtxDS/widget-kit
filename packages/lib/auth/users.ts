import "server-only";

import { getDb } from "@/lib/db";
import { createServerSupabaseClient } from "@/lib/auth/server";
import { isAuthorizedAdminId } from "@/lib/auth/admin-policy";

export async function getAuthenticatedUser() {
  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const user = data.user;
  const db = getDb();
  const role = isAuthorizedAdminId(user.id) ? "ADMIN" : "USER";

  const profile = await db.user.upsert({
    where: { supabaseUserId: user.id },
    update: {
      email: user.email ?? undefined,
      name:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : typeof user.user_metadata?.name === "string"
            ? user.user_metadata.name
            : undefined,
      avatarUrl:
        typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : typeof user.user_metadata?.picture === "string"
            ? user.user_metadata.picture
            : undefined,
      role,
    },
    create: {
      supabaseUserId: user.id,
      email: user.email ?? null,
      name:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : typeof user.user_metadata?.name === "string"
            ? user.user_metadata.name
            : null,
      avatarUrl:
        typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : typeof user.user_metadata?.picture === "string"
            ? user.user_metadata.picture
            : null,
      role,
    },
  });

  return profile;
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  return user;
}
