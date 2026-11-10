import {
  getConfiguredAdminId,
  isAuthorizedAdminId,
} from "@/lib/auth/admin-policy";
import { afterEach, describe, expect, it, vi } from "vitest";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("admin authorization policy", () => {
  it("authorizes only the configured Supabase user id", () => {
    vi.stubEnv("ADMIN_USER_ID", ADMIN_ID);

    expect(isAuthorizedAdminId(ADMIN_ID)).toBe(true);
    expect(
      isAuthorizedAdminId("22222222-2222-4222-8222-222222222222"),
    ).toBe(false);
  });

  it("denies access when the admin id is missing", () => {
    vi.stubEnv("ADMIN_USER_ID", "");

    expect(getConfiguredAdminId()).toBeNull();
    expect(isAuthorizedAdminId(ADMIN_ID)).toBe(false);
  });

  it("normalizes case and whitespace", () => {
    vi.stubEnv("ADMIN_USER_ID", `  ${ADMIN_ID.toUpperCase()}  `);

    expect(isAuthorizedAdminId(` ${ADMIN_ID} `)).toBe(true);
  });

  it("rejects malformed admin ids instead of comparing arbitrary strings", () => {
    vi.stubEnv("ADMIN_USER_ID", "owner@example.com");

    expect(getConfiguredAdminId()).toBeNull();
    expect(isAuthorizedAdminId("owner@example.com")).toBe(false);
  });

  it("denies empty or missing user ids", () => {
    vi.stubEnv("ADMIN_USER_ID", ADMIN_ID);

    expect(isAuthorizedAdminId(null)).toBe(false);
    expect(isAuthorizedAdminId("")).toBe(false);
  });
});
