import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AssistantPlaygroundStage,
  useAssistantPlayground,
} from "./assistant-playground";

function stubGlobals() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  }));
}

function PlaygroundStageHarness() {
  const playground = useAssistantPlayground();
  return <AssistantPlaygroundStage playground={playground} />;
}

describe("assistant playground", () => {
  beforeEach(() => {
    stubGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the assistant open by default", () => {
    render(<PlaygroundStageHarness />);

    expect(screen.getByRole("dialog", { name: "Nova" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Assistant" })).not.toBeInTheDocument();
  });

  it("renders the stage widget directly", () => {
    const { container } = render(<PlaygroundStageHarness />);
    expect(container.querySelector(".wk-assistant")).toBeInTheDocument();
  });
});
