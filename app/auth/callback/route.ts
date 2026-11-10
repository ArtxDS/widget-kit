import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getConfiguredAdminId,
  isAuthorizedAdminId,
} from "@/lib/auth/admin-policy";
import { getSupabasePublicConfig } from "@/lib/auth/config";
import {
  ADMIN_LOGIN_PATH,
  safeUserNextPath,
  USER_LOGIN_PATH,
} from "@/lib/auth/paths";

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

function applyCookiesAndHeaders(
  target: NextResponse,
  cookies: PendingCookie[],
  headers: Record<string, string>,
): NextResponse {
  cookies.forEach(({ name, value, options }) => {
    target.cookies.set(name, value, options);
  });

  for (const [name, value] of Object.entries(headers)) {
    target.headers.set(name, value);
  }

  return target;
}

function loginRedirect(
  origin: string,
  error: string,
  cookies: PendingCookie[],
  headers: Record<string, string>,
  loginPath = ADMIN_LOGIN_PATH,
): NextResponse {
  const url = new URL(loginPath, origin);
  url.searchParams.set("error", error);
  return applyCookiesAndHeaders(NextResponse.redirect(url), cookies, headers);
}

export async function GET(request: NextRequest) {
  const config = getSupabasePublicConfig();
  const origin = request.nextUrl.origin;
  const requestedNext = safeUserNextPath(
    request.nextUrl.searchParams.get("next"),
  );
  const isAdminTarget = requestedNext.startsWith("/admin");
  const loginPath = isAdminTarget ? ADMIN_LOGIN_PATH : USER_LOGIN_PATH;

  if (!config) {
    return loginRedirect(origin, "config", [], {}, loginPath);
  }

  if (isAdminTarget && !getConfiguredAdminId()) {
    return loginRedirect(origin, "config", [], {}, ADMIN_LOGIN_PATH);
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return loginRedirect(origin, "callback", [], {}, loginPath);
  }

  const nextPath = requestedNext;
  const pendingCookies: PendingCookie[] = [];
  const cacheHeaders: Record<string, string> = {};

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        pendingCookies.push(...cookiesToSet);
        Object.assign(cacheHeaders, headers);
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      return loginRedirect(origin, "callback", pendingCookies, cacheHeaders, loginPath);
    }

    if (isAdminTarget && !isAuthorizedAdminId(data.user.id)) {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // The authorization check still blocks the admin area even if the
        // session cleanup request fails.
      }

      return loginRedirect(
        origin,
        "unauthorized",
        pendingCookies,
        cacheHeaders,
        ADMIN_LOGIN_PATH,
      );
    }

    return applyCookiesAndHeaders(
      NextResponse.redirect(new URL(nextPath, origin)),
      pendingCookies,
      cacheHeaders,
    );
  } catch {
    return loginRedirect(origin, "callback", pendingCookies, cacheHeaders, loginPath);
  }
}
