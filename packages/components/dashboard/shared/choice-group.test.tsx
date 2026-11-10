import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChoiceControl } from "./choice-group";

const fewOptions = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

const manyOptions = Array.from({ length: 7 }, (_, index) => ({
  label: `Option ${index + 1}`,
  value: `option-${index + 1}`,
}));

describe("ChoiceControl", () => {
  it("renders clickable badges with a selected state for up to six options", () => {
    const onChange = vi.fn();
    render(
      <ChoiceControl
        label="Theme"
        onChange={onChange}
        options={fewOptions}
        value="dark"
      />,
    );

    expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Light" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    fireEvent.click(screen.getByRole("button", { name: "Light" }));
    expect(onChange).toHaveBeenCalledWith("light");
  });

  it("keeps a dropdown when there are more than six options", () => {
    render(
      <ChoiceControl
        label="Position"
        onChange={() => {}}
        options={manyOptions}
        value="option-1"
      />,
    );

    expect(
      screen.queryByRole("group", { name: "Position" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Position" }),
    ).toBeInTheDocument();
  });
});
