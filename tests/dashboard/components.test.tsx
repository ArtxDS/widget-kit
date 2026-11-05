import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComponentsPage } from "@/components/dashboard/pages";
import { components } from "@/lib/catalog";
import { emptyQualityFixture } from "../fixtures/quality";
import { mockQualityApi, renderWithQuality } from "../utils";

describe("dashboard pages", () => {
  it("filters the registered component catalog by name", () => {
    mockQualityApi({ get: emptyQualityFixture });
    renderWithQuality(<ComponentsPage />);

    fireEvent.change(screen.getByRole("textbox", { name: "Search components" }), { target: { value: "badge" } });

    expect(screen.getByRole("heading", { name: "Badge" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Button" })).not.toBeInTheDocument();
    expect(screen.getByText("1 component")).toBeInTheDocument();
    expect(components).toHaveLength(2);
  });
});
