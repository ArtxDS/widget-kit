import { connection } from "next/server";
import { signOutAdminAction } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/server";
import { Blocks, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";

export async function AdminHome() {
  await connection();
  const user = await requireAdmin();
  const metadata = user.user_metadata;
  const name =
    typeof metadata?.full_name === "string"
      ? metadata.full_name
      : typeof metadata?.name === "string"
        ? metadata.name
        : null;
  const label = name ?? user.email ?? "Administrador";

  return (
    <main className="admin-auth">
      <div aria-hidden="true" className="admin-auth__glow" />
      <section
        aria-labelledby="admin-home-title"
        className="admin-auth__card admin-auth__card--wide"
      >
        <Link
          aria-label="widget-kit — voltar ao site"
          className="admin-auth__brand"
          href="/"
        >
          <span className="admin-auth__brand-mark">
            <Blocks size={25} strokeWidth={1.9} />
          </span>
          <strong>widget-kit</strong>
        </Link>

        <p className="admin-auth__eyebrow">Administrative Area</p>
        <h1 id="admin-home-title">Confirmed Access</h1>
        <p className="admin-auth__description">
          Authentication and access control are active. Administrative features
          will be added in the next steps.
        </p>

        <div className="admin-auth__identity">
          <span className="admin-auth__identity-icon">
            <ShieldCheck aria-hidden="true" size={19} />
          </span>
          <div>
            <small>Authorized Identity</small>
            <strong>{label}</strong>
            {user.email && user.email !== label && <span>{user.email}</span>}
          </div>
        </div>

        <form action={signOutAdminAction}>
          <button
            className="admin-auth__button admin-auth__button--secondary"
            type="submit"
          >
            <LogOut aria-hidden="true" size={17} />
            <span>Logout from administrative area</span>
          </button>
        </form>

        <Link className="admin-auth__back" href="/">
          Return to public site
        </Link>
      </section>
    </main>
  );
}

export function AdminHomeFallback() {
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
