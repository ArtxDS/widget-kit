import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WidgetsPage } from "@/components/dashboard/pages";
import { useMascotRuntime } from "../utils";

describe("dashboard pages", () => {
  it("shows a live mascot preview in the widget catalog", async () => {
    useMascotRuntime();
    render(<WidgetsPage />);

    expect(screen.getByRole("heading", { name: "Mascot" })).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: "Mascot widget preview" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mascot/i })).toHaveAttribute(
      "href",
      "/playground?item=mascot",
    );
  });
});
