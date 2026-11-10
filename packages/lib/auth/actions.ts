"use server";

import { redirect } from "next/navigation";
import { ADMIN_LOGIN_PATH } from "./paths";
import { createServerSupabaseClient } from "./server";

export async function signOutAdminAction() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // The user is still sent back to the public login flow if the network fails.
  }

  redirect(`${ADMIN_LOGIN_PATH}?status=signed-out`);
}
