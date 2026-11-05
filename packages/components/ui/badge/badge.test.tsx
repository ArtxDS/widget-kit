import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders its status and an optional dot", () => {
    const { container } = render(<Badge tone="green" dot>Ready</Badge>);
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(container.querySelector(".wk-badge__dot")).toBeInTheDocument();
  });

  it("applies the selected tone", () => {
    render(<Badge tone="cyan">In progress</Badge>);
    expect(screen.getByText("In progress")).toHaveClass("wk-badge--cyan");
  });
});
