import { safeUserNextPath } from "@/lib/auth/paths";
import { UserLoginView, type UserLoginError } from "./user-login-view";

type LoginSearchParams = {
  error?: string | string[];
  next?: string | string[];
  status?: string | string[];
};

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function parseError(value: string | null): UserLoginError | undefined {
  if (!value) return undefined;
  const codes = new Set<UserLoginError>(["config", "callback", "oauth"]);
  return codes.has(value as UserLoginError)
    ? (value as UserLoginError)
    : undefined;
}

export async function UserLoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const params = await searchParams;
  const errorCode = parseError(firstValue(params.error));
  const nextPath = safeUserNextPath(firstValue(params.next));
  const signedOut = firstValue(params.status) === "signed-out";

  return (
    <UserLoginView
      errorCode={errorCode}
      nextPath={nextPath}
      signedOut={signedOut}
    />
  );
}

export function UserLoginFallback() {
  return (
    <main className="admin-auth">
      <section
        aria-hidden="true"
        className="admin-auth__card admin-auth__card--loading"
      >
        <span className="admin-auth__brand-skeleton" />
        <span className="admin-auth__line admin-auth__line--short" />
        <span className="admin-auth__line admin-auth__line--title" />
        <span className="admin-auth__line" />
        <span className="admin-auth__button-skeleton" />
      </section>
    </main>
  );
}