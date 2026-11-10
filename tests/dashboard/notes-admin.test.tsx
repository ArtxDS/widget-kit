import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotesPage } from "@/components/dashboard/pages";

describe("notes admin", () => {
  it("opens composer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/auth/me")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: "1",
              email: "a@b.com",
              name: "Admin",
              avatarUrl: null,
              role: "ADMIN",
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({ notes: [] }) });
      }),
    );
    render(<NotesPage />);
    await waitFor(() => expect(screen.getByText("No notes yet")).toBeInTheDocument());
    const btn = screen.getByRole("button", { name: /New note/i });
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText("New note")).toBeInTheDocument());
    expect(screen.getByText("Create Note")).toBeInTheDocument();
  });
});
