"use client";

import { Blocks, LoaderCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { GoogleSignInResult } from "@/lib/auth/client";

export type SharedLoginError = string;

export function LoginView({
  title,
  eyebrow,
  description,
  note,
  errorMessages,
  signIn,
  nextPath,
  errorCode,
  signedOut = false,
}: {
  title: string;
  eyebrow: string;
  description: string;
  note: string;
  errorMessages: Record<string, string>;
  signIn: (nextPath: string) => Promise<GoogleSignInResult>;
  nextPath: string;
  errorCode?: string;
  signedOut?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const message = localError ?? errorCode ?? null;
  const statusMessage = !message && signedOut ? "Sessão encerrada com sucesso." : null;

  async function handleSignIn() {
    setPending(true);
    setLocalError(null);

    const result = await signIn(nextPath);
    if (!result.ok) {
      setLocalError(result.error);
      setPending(false);
    }
  }

  return (
    <main className="admin-auth">
      <div aria-hidden="true" className="admin-auth__glow" />
      <section aria-labelledby="login-title" className="admin-auth__card">
        <Link aria-label="widget-kit — voltar ao site" className="admin-auth__brand" href="/">
          <span className="admin-auth__brand-mark">
            <Blocks size={25} strokeWidth={1.9} />
          </span>
          <strong>widget-kit</strong>
        </Link>

        <p className="admin-auth__eyebrow">{eyebrow}</p>
        <h1 id="login-title">{title}</h1>
        <p className="admin-auth__description">{description}</p>

        {message && (
          <p className="admin-auth__message admin-auth__message--error" role="alert">
            {errorMessages[message]}
          </p>
        )}

        {statusMessage && (
          <p className="admin-auth__message admin-auth__message--success" role="status">
            {statusMessage}
          </p>
        )}

        <button
          aria-busy={pending}
          className="admin-auth__button"
          disabled={pending}
          onClick={handleSignIn}
          type="button"
        >
          {pending ? (
            <LoaderCircle aria-hidden="true" className="admin-auth__spinner" size={18} />
          ) : (
            <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18">
              <path d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" fill="#4285F4" />
              <path d="M12 22c2.7 0 4.96-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.62A10 10 0 0 0 12 22Z" fill="#34A853" />
              <path d="M6.41 13.94A6 6 0 0 1 6.1 12c0-.67.11-1.32.31-1.94V7.44H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.56l3.35-2.62Z" fill="#FBBC05" />
              <path d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.94 5.44l3.35 2.62C7.2 7.7 9.4 5.94 12 5.94Z" fill="#EA4335" />
            </svg>
          )}
          <span>
            {pending ? "Redirecionando para o Google..." : "Entrar com Google"}
          </span>
        </button>

        <p className="admin-auth__note">
          <ShieldCheck aria-hidden="true" size={15} />
          {note}
        </p>

        <Link className="admin-auth__back" href="/">
          Return to public site
        </Link>
      </section>
    </main>
  );
}