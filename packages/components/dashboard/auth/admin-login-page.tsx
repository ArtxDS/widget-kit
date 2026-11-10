import { safeAdminNextPath } from "@/lib/auth/paths";
import {
  AdminLoginView,
  type AdminLoginError,
} from "./admin-login-view";

const ERROR_CODES = new Set<AdminLoginError>([
  "unauthorized",
  "session-expired",
  "config",
  "callback",
  "oauth",
]);

type LoginSearchParams = {
  error?: string | string[];
  next?: string | string[];
  status?: string | string[];
};

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function parseError(value: string | null): AdminLoginError | undefined {
  if (!value) return undefined;
  return ERROR_CODES.has(value as AdminLoginError)
    ? (value as AdminLoginError)
    : undefined;
}

export async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const params = await searchParams;
  const errorCode = parseError(firstValue(params.error));
  const nextPath = safeAdminNextPath(firstValue(params.next));
  const signedOut = firstValue(params.status) === "signed-out";

  return (
    <AdminLoginView
      errorCode={errorCode}
      nextPath={nextPath}
      signedOut={signedOut}
    />
  );
}

export function AdminLoginFallback() {
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
