import { AdminLoginView } from "@/components/dashboard/auth/admin-login-view";
import { signInWithGoogle } from "@/lib/auth/client";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/client", () => ({
  signInWithGoogle: vi.fn(),
}));

const signInMock = vi.mocked(signInWithGoogle);

beforeEach(() => {
  signInMock.mockReset();
  signInMock.mockResolvedValue({ ok: true });
});

describe("AdminLoginView", () => {
  it("shows the Google-only admin login", () => {
    render(<AdminLoginView nextPath="/admin" />);

    expect(
      screen.getByRole("heading", { name: "Área restrita" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Entrar com Google" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/senha/i)).not.toBeInTheDocument();
  });

  it("starts the OAuth flow with the safe next path", async () => {
    const user = userEvent.setup();
    render(<AdminLoginView nextPath="/admin/settings" />);

    await user.click(
      screen.getByRole("button", { name: "Entrar com Google" }),
    );

    expect(signInMock).toHaveBeenCalledWith("/admin/settings");
    expect(
      await screen.findByRole("button", {
        name: /Redirecionando para o Google/,
      }),
    ).toBeDisabled();
  });

  it("shows feedback for an unauthorized account", () => {
    render(<AdminLoginView errorCode="unauthorized" nextPath="/admin" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      /não está autorizada/,
    );
  });

  it("shows feedback after logout", () => {
    render(<AdminLoginView nextPath="/admin" signedOut />);

    expect(screen.getByRole("status")).toHaveTextContent(
      /Sessão encerrada/,
    );
  });

  it("shows an OAuth error and re-enables the button", async () => {
    signInMock.mockResolvedValue({ ok: false, error: "oauth" });
    const user = userEvent.setup();
    render(<AdminLoginView nextPath="/admin" />);

    await user.click(
      screen.getByRole("button", { name: "Entrar com Google" }),
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /Google não concluiu/,
      ),
    );
    expect(
      screen.getByRole("button", { name: "Entrar com Google" }),
    ).toBeEnabled();
  });
});
