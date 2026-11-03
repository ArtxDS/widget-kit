import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ComponentsPage, NotesPage, OverviewPage, PlaygroundPage, TestsPage } from "@/components/dashboard/pages";
import { QualityProvider } from "@/components/dashboard/quality-provider";
import { components } from "@/lib/catalog";

function withQuality(ui: ReactNode) {
  return render(<QualityProvider>{ui}</QualityProvider>);
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("dashboard pages", () => {
  it("shows honest empty quality data on the overview", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ testRun: null, coverage: null, averageRenderTimeMs: null }) }));
    withQuality(<OverviewPage />);

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/quality", { cache: "no-store" }));
    expect(screen.getByRole("heading", { level: 1, name: /build better interfaces/i })).toBeInTheDocument();
    expect(screen.getByText("Run component or suite tests to record a quality history.")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(2);
  });

  it("filters the registered component catalog by name", () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ testRun: null, coverage: null, averageRenderTimeMs: null }) }));
    withQuality(<ComponentsPage />);

    fireEvent.change(screen.getByRole("textbox", { name: "Search components" }), { target: { value: "badge" } });

    expect(screen.getByRole("heading", { name: "Badge" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Button" })).not.toBeInTheDocument();
    expect(screen.getByText("1 component")).toBeInTheDocument();
    expect(components).toHaveLength(1);
  });

  it("updates the badge preview and code for tone and dot settings", () => {
    render(<PlaygroundPage />);

    fireEvent.click(screen.getByRole("button", { name: "Color tone" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Purple" }));
    const dotSwitch = screen.getByRole("switch", { name: "Show status dot" });
    fireEvent.click(dotSwitch);
    expect(dotSwitch).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Ready")).toHaveClass("wk-badge--purple");
    expect(screen.getByText("Ready").querySelector(".wk-badge__dot")).not.toBeInTheDocument();
    expect(screen.getByText('<Badge tone="purple">Ready</Badge>')).toBeInTheDocument();
  });

  it("lists the individual test cases for each registered component", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        testRun: { total: 2, passed: 2, failed: 0, pending: 0, passedPercentage: 100, coverageLines: 40, completedAt: "2026-11-03T12:00:00.000Z", durationMs: 300 },
        history: [],
        componentTests: {
          badge: {
            total: 2,
            passed: 2,
            failed: 0,
            pending: 0,
            assertions: [
              { name: "Badge › renders its status and an optional dot", status: "passed" },
              { name: "Badge › applies the selected tone", status: "passed" },
            ],
          },
        },
        coverage: null,
        averageRenderTimeMs: null,
      }),
    }));
    withQuality(<TestsPage />);

    expect(await screen.findByText("Badge › renders its status and an optional dot")).toBeInTheDocument();
    expect(screen.getByText("Badge › applies the selected tone")).toBeInTheDocument();
  });

  it("requests an isolated test run for the selected component", async () => {
    const emptySnapshot = {
      testRun: null,
      history: [],
      componentTests: {},
      coverage: null,
      averageRenderTimeMs: null,
    };
    const badgeResult = {
      ...emptySnapshot,
      componentTests: {
        badge: {
          total: 1,
          passed: 1,
          failed: 0,
          pending: 0,
          assertions: [{ name: "Badge › applies the selected tone", status: "passed" }],
          completedAt: "2026-11-03T12:00:00.000Z",
          durationMs: 120,
        },
      },
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => emptySnapshot })
      .mockResolvedValueOnce({ ok: true, json: async () => badgeResult });
    vi.stubGlobal("fetch", fetchMock);
    withQuality(<TestsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Run Badge tests" }));

    expect(await screen.findByText("Badge › applies the selected tone")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith("/api/quality", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ componentSlug: "badge" }),
    });
  });

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
