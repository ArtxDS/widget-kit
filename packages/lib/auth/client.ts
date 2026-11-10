import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig, SupabaseConfigError } from "./config";
import {
  ADMIN_HOME_PATH,
  buildAuthCallbackUrl,
  buildUserAuthCallbackUrl,
  safeAdminNextPath,
  safeUserNextPath,
  USER_HOME_PATH,
} from "./paths";

let browserClient: SupabaseClient | undefined;

export function createSupabaseBrowserClient(): SupabaseClient {
  const config = getSupabasePublicConfig();
  if (!config) throw new SupabaseConfigError();

  browserClient ??= createBrowserClient(config.url, config.key);
  return browserClient;
}

export type GoogleSignInResult =
  | { ok: true }
  | { ok: false; error: "config" | "oauth" };

async function startGoogleSignIn(
  nextPath: string | null | undefined,
  sanitize: (value: string | null | undefined) => string,
  buildCallbackUrl: (origin: string, nextPath: string) => string,
): Promise<GoogleSignInResult> {
  const safeNextPath = sanitize(nextPath);

  try {
    const supabase = createSupabaseBrowserClient();
    const redirectTo = buildCallbackUrl(window.location.origin, safeNextPath);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) return { ok: false, error: "oauth" };
    return { ok: true };
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return { ok: false, error: "config" };
    }
    return { ok: false, error: "oauth" };
  }
}

export function signInWithGoogle(
  nextPath = ADMIN_HOME_PATH,
): Promise<GoogleSignInResult> {
  return startGoogleSignIn(nextPath, safeAdminNextPath, buildAuthCallbackUrl);
}

export function signInUserWithGoogle(
  nextPath = USER_HOME_PATH,
): Promise<GoogleSignInResult> {
  return startGoogleSignIn(nextPath, safeUserNextPath, buildUserAuthCallbackUrl);
}