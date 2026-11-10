import {
  buildAuthCallbackUrl,
  safeAdminNextPath,
} from "@/lib/auth/paths";
import { describe, expect, it } from "vitest";

describe("safeAdminNextPath", () => {
  it("keeps admin paths and their query strings", () => {
    expect(safeAdminNextPath("/admin")).toBe("/admin");
    expect(safeAdminNextPath("/admin/settings?tab=users")).toBe(
      "/admin/settings?tab=users",
    );
  });

  it("falls back to /admin for missing or unsafe values", () => {
    expect(safeAdminNextPath(null)).toBe("/admin");
    expect(safeAdminNextPath("")).toBe("/admin");
    expect(safeAdminNextPath("https://evil.example/admin")).toBe("/admin");
    expect(safeAdminNextPath("//evil.example/admin")).toBe("/admin");
    expect(safeAdminNextPath("/notes")).toBe("/admin");
    expect(safeAdminNextPath("/admin/login")).toBe("/admin");
    expect(safeAdminNextPath("/admin/login?error=oauth")).toBe("/admin");
  });

  it("builds an encoded callback URL and never redirects off-site", () => {
    expect(
      buildAuthCallbackUrl(
        "http://localhost:3000",
        "/admin/settings?tab=users",
      ),
    ).toBe(
      "http://localhost:3000/auth/callback?next=%2Fadmin%2Fsettings%3Ftab%3Dusers",
    );
    expect(
      buildAuthCallbackUrl("http://localhost:3000/", "https://evil.example"),
    ).toBe("http://localhost:3000/auth/callback?next=%2Fadmin");
  });
});
