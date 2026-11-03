import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home page", () => {
  it("renders the temporary widget-kit landing page", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "widget-kit" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Componentes, widgets e utilitários reutilizáveis."),
    ).toBeInTheDocument();
  });
});
