import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getConfiguredAdminId,
  isAuthorizedAdminId,
} from "@/lib/auth/admin-policy";
import { getSupabasePublicConfig } from "@/lib/auth/config";
import {
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  safeAdminNextPath,
} from "@/lib/auth/paths";

const AUTH_COOKIE_PREFIX = "sb-";
const CACHE_HEADERS = ["cache-control", "expires", "pragma"] as const;

function copyCookiesAndCacheHeaders(
  source: NextResponse,
  target: NextResponse,
): NextResponse {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));

  for (const header of CACHE_HEADERS) {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  }

  return target;
}

function redirectToLogin(
  request: NextRequest,
  source: NextResponse,
  error?: string,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = ADMIN_LOGIN_PATH;
  url.search = "";

  if (error) url.searchParams.set("error", error);

  const nextPath = safeAdminNextPath(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  if (nextPath !== ADMIN_HOME_PATH) url.searchParams.set("next", nextPath);

  return copyCookiesAndCacheHeaders(source, NextResponse.redirect(url));
}

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(
      ({ name }) =>
        name.startsWith(AUTH_COOKIE_PREFIX) && name.includes("auth-token"),
    );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginRoute =
    pathname === ADMIN_LOGIN_PATH ||
    pathname.startsWith(`${ADMIN_LOGIN_PATH}/`);
  const config = getSupabasePublicConfig();

  if (!config || !getConfiguredAdminId()) {
    if (isLoginRoute) return NextResponse.next({ request });

    return redirectToLogin(
      request,
      NextResponse.next({ request }),
      "config",
    );
  }

  let response = NextResponse.next({ request });
  const cacheHeaders: Record<string, string> = {};

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        Object.assign(cacheHeaders, headers);
        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        for (const [name, value] of Object.entries(cacheHeaders)) {
          response.headers.set(name, value);
        }
      },
    },
  });

  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getClaims();
    userId =
      typeof data?.claims.sub === "string" ? data.claims.sub : null;
  } catch {
    userId = null;
  }

  const authorized = isAuthorizedAdminId(userId);

  if (isLoginRoute) {
    if (authorized) {
      const nextPath = safeAdminNextPath(
        request.nextUrl.searchParams.get("next"),
      );
      const target = new URL(nextPath, request.nextUrl.origin);
      return copyCookiesAndCacheHeaders(
        response,
        NextResponse.redirect(target),
      );
    }

    return response;
  }

  if (!userId) {
    return redirectToLogin(
      request,
      response,
      hasSupabaseAuthCookie(request) ? "session-expired" : undefined,
    );
  }

  if (!authorized) {
    return redirectToLogin(request, response, "unauthorized");
  }

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
