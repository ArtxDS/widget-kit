import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth/server";
import { getAuthenticatedUser } from "@/lib/auth/users";
import { SupabaseConfigError } from "@/lib/auth/config";

export async function GET() {
  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return NextResponse.json(
        { error: "Auth is not configured." },
        { status: 503 },
      );
    }
    throw error;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = data.user;

  let profile;
  try {
    profile = await getAuthenticatedUser();
  } catch {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 },
    );
  }

  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    email: profile.email ?? user.email ?? null,
    name:
      profile.name ??
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : null),
    avatarUrl:
      profile.avatarUrl ??
      (typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : typeof user.user_metadata?.picture === "string"
          ? user.user_metadata.picture
          : null),
    role: profile.role,
  });
}