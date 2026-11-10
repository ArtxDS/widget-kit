"use client";

import { signInWithGoogle } from "@/lib/auth/client";
import { LoginView } from "./login-view";

export type AdminLoginError =
  | "unauthorized"
  | "session-expired"
  | "config"
  | "callback"
  | "oauth";

const adminErrorMessages: Record<AdminLoginError, string> = {
  unauthorized:
    "Esta conta Google não está autorizada a acessar a administração. Entre com a conta do proprietário do projeto.",
  "session-expired": "Sua sessão expirou. Entre novamente para continuar.",
  config: "A autenticação administrativa ainda não está configurada neste ambiente.",
  callback: "Não foi possível concluir o login. Tente novamente.",
  oauth: "O Google não concluiu a autenticação. Tente novamente.",
};

export function AdminLoginView({
  errorCode,
  nextPath,
  signedOut = false,
}: {
  errorCode?: AdminLoginError;
  nextPath: string;
  signedOut?: boolean;
}) {
  return (
    <LoginView
      description="Entre com a conta Google autorizada para gerenciar o Widget Kit."
      eyebrow="Acesso Administrativo"
      errorCode={errorCode}
      errorMessages={adminErrorMessages}
      nextPath={nextPath}
      note="Apenas a identidade provisionada pelo proprietário pode acessar esta área."
      signIn={signInWithGoogle}
      signedOut={signedOut}
      title="Área restrita"
    />
  );
}