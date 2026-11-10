"use client";

import { signInUserWithGoogle } from "@/lib/auth/client";
import { LoginView } from "./login-view";

export type UserLoginError = "config" | "callback" | "oauth";

const userErrorMessages: Record<UserLoginError, string> = {
  config: "Authentication is not yet configured in this environment.",
  callback: "It was not possible to complete the login. Try again.",
  oauth: "Google did not complete the authentication. Try again.",
};

export function UserLoginView({
  errorCode,
  nextPath,
  signedOut = false,
}: {
  errorCode?: UserLoginError;
  nextPath: string;
  signedOut?: boolean;
}) {
  return (
    <LoginView
      description="Enter your Google account to propose widgets and track your contributions."
      eyebrow="Access"
      errorCode={errorCode}
      errorMessages={userErrorMessages}
      nextPath={nextPath}
      note="Use your Google account to access."
      signIn={signInUserWithGoogle}
      signedOut={signedOut}
      title="Login"
    />
  );
}