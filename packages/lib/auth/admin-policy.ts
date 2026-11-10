const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getConfiguredAdminId(): string | null {
  const value = process.env.ADMIN_USER_ID?.trim();
  if (!value || !UUID_PATTERN.test(value)) return null;
  return value.toLowerCase();
}

export function isAuthorizedAdminId(userId: string | null | undefined): boolean {
  const adminId = getConfiguredAdminId();
  if (!adminId || !userId) return false;

  return userId.trim().toLowerCase() === adminId;
}
