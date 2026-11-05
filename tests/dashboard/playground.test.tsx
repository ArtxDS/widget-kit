import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlaygroundPage } from "@/components/dashboard/pages";
import {
  getGeneratedCode,
  renderWithQuality,
  selectMenuOption,
  useMascotRuntime,
} from "../utils";

describe("dashboard pages", () => {
  it("updates the badge preview and code for tone and dot settings", async () => {
    const { user } = renderWithQuality(<PlaygroundPage />);

    await selectMenuOption(user, "Color tone", "Purple");
    const dotSwitch = screen.getByRole("switch", { name: "Show status dot" });
    await user.click(dotSwitch);
    expect(dotSwitch).toHaveAttribute("aria-checked", "false");
    const badge = document.querySelector(".wk-badge");
    expect(badge).toHaveClass("wk-badge--purple");
    expect(badge?.querySelector(".wk-badge__dot")).not.toBeInTheDocument();
    expect(getGeneratedCode()).toContain('<Badge tone="purple">Ready</Badge>');
  });

  it("opens the mascot playground with live SVG and customizations", async () => {
    useMascotRuntime();
    const { user } = renderWithQuality(<PlaygroundPage initialItem="mascot" />);

    expect(await screen.findByRole("img", { name: "Playground mascot" })).toBeInTheDocument();
    await selectMenuOption(user, "Theme preset", "ocean");
    await user.click(screen.getByRole("button", { name: "say" }));
    expect(await screen.findByText("Eu sou o mascote.")).toBeInTheDocument();
    expect(getGeneratedCode()).toContain('theme: "ocean"');
  });
});
