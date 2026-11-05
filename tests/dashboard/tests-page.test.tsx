import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TestsPage } from "@/components/dashboard/pages";
import {
  badgeQualityFixture,
  badgeRunQualityFixture,
  emptyQualityFixture,
} from "../fixtures/quality";
import { mockQualityApi, renderWithQuality } from "../utils";

describe("dashboard pages", () => {
  it("lists the individual test cases for each registered component", async () => {
    mockQualityApi({ get: badgeQualityFixture });
    renderWithQuality(<TestsPage />);

    expect(await screen.findByText("Badge › renders its status and an optional dot")).toBeInTheDocument();
    expect(screen.getByText("Badge › applies the selected tone")).toBeInTheDocument();
  });

  it("requests an isolated test run for the selected component", async () => {
    const api = mockQualityApi({
      get: emptyQualityFixture,
      post: badgeRunQualityFixture,
    });
    renderWithQuality(<TestsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Run Badge tests" }));

    expect(await screen.findByText("Badge › applies the selected tone")).toBeInTheDocument();
    const postRequest = api.requests.find((request) => request.method === "POST");
    expect(postRequest?.url.pathname).toBe("/api/quality");
    expect(postRequest?.headers.get("content-type")).toBe("application/json");
    expect(postRequest?.body).toEqual({ itemType: "component", itemSlug: "badge" });
  });
});
