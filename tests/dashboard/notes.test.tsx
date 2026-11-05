import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NotesPage } from "@/components/dashboard/pages";

afterEach(() => {
  window.localStorage.clear();
});

describe("dashboard pages", () => {
  it("saves and removes notes in browser storage", async () => {
    render(<NotesPage />);
    fireEvent.change(screen.getByRole("textbox", { name: "Note text" }), { target: { value: "Add a loading state to Button" } });
    fireEvent.click(screen.getByRole("button", { name: "Add note" }));

    expect(await screen.findByText("Add a loading state to Button")).toBeInTheDocument();
    await waitFor(() => expect(window.localStorage.getItem("widget-kit-notes")).toContain("Add a loading state to Button"));
    fireEvent.click(screen.getByRole("button", { name: "Delete note: Add a loading state to Button" }));
    expect(screen.queryByText("Add a loading state to Button")).not.toBeInTheDocument();
  });
});
