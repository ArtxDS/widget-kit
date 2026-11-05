import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OverviewPage } from "@/components/dashboard/pages";
import { emptyQualityFixture } from "../fixtures/quality";
import { mockQualityApi, renderWithQuality } from "../utils";

describe("dashboard pages", () => {
  it("shows honest empty quality data on the overview", async () => {
    const api = mockQualityApi({ get: emptyQualityFixture });
    renderWithQuality(<OverviewPage />);

    await screen.findByText(/Run an individual component or widget test to record quality history/i);
    expect(api.requests).toHaveLength(1);
    expect(api.requests[0]?.method).toBe("GET");
    expect(api.requests[0]?.url.pathname).toBe("/api/quality");
    expect(screen.getByRole("heading", { level: 1, name: /build better interfaces/i })).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(2);
  });
});
