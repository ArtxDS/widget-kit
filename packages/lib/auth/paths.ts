export const ADMIN_HOME_PATH = "/admin";
export const ADMIN_LOGIN_PATH = "/admin/login";
export const USER_HOME_PATH = "/";
export const USER_LOGIN_PATH = "/login";
export const AUTH_CALLBACK_PATH = "/auth/callback";

const SAFE_NEXT_BASE = "http://widget-kit.local";

export function safeAdminNextPath(value: string | null | undefined): string {
  if (!value) return ADMIN_HOME_PATH;

  let parsed: URL;
  try {
    parsed = new URL(value, SAFE_NEXT_BASE);
  } catch {
    return ADMIN_HOME_PATH;
  }

  if (parsed.origin !== SAFE_NEXT_BASE) return ADMIN_HOME_PATH;

  const isAdminPath =
    parsed.pathname === ADMIN_HOME_PATH ||
    parsed.pathname.startsWith(`${ADMIN_HOME_PATH}/`);
  if (!isAdminPath) return ADMIN_HOME_PATH;

  const isLoginPath =
    parsed.pathname === ADMIN_LOGIN_PATH ||
    parsed.pathname.startsWith(`${ADMIN_LOGIN_PATH}/`);
  if (isLoginPath) return ADMIN_HOME_PATH;

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function safeUserNextPath(value: string | null | undefined): string {
  if (!value) return USER_HOME_PATH;

  let parsed: URL;
  try {
    parsed = new URL(value, SAFE_NEXT_BASE);
  } catch {
    return USER_HOME_PATH;
  }

  if (parsed.origin !== SAFE_NEXT_BASE) return USER_HOME_PATH;

  const isLoginPath =
    parsed.pathname === USER_LOGIN_PATH ||
    parsed.pathname.startsWith(`${USER_LOGIN_PATH}/`) ||
    parsed.pathname === ADMIN_LOGIN_PATH ||
    parsed.pathname.startsWith(`${ADMIN_LOGIN_PATH}/`);
  if (isLoginPath) return USER_HOME_PATH;

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function buildUserAuthCallbackUrl(origin: string, nextPath: string): string {
  const safeNext = safeUserNextPath(nextPath);
  const normalizedOrigin = origin.replace(/\/$/, "");
  return `${normalizedOrigin}${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(safeNext)}`;
}

export function buildAuthCallbackUrl(origin: string, nextPath: string): string {
  const safeNext = safeAdminNextPath(nextPath);
  const normalizedOrigin = origin.replace(/\/$/, "");
  return `${normalizedOrigin}${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(safeNext)}`;
}
