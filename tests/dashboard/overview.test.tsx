import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { OverviewPage } from "@/components/dashboard/pages";
import type { NoteDto } from "@/lib/notes";
import { emptyQualityFixture } from "../fixtures/quality";
import { server } from "../mocks/server";
import { mockQualityApi, renderWithQuality } from "../utils";

const recentNote: NoteDto = {
  id: "note-1",
  title: "Document activity feed",
  type: "IDEA",
  content: "",
  typeData: null,
  tags: [],
  componentSlug: null,
  priority: null,
  status: "OPEN",
  author: null,
  authorId: "user-1",
  lastEditedBy: null,
  createdAt: "2026-11-10T12:00:00.000Z",
  updatedAt: "2026-11-10T12:00:00.000Z",
};

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

  it("shows note creations in the recent activity feed", async () => {
    mockQualityApi({ get: emptyQualityFixture });
    server.use(
      http.get("*/api/notes", () => HttpResponse.json({ notes: [recentNote] })),
    );
    renderWithQuality(<OverviewPage />);

    expect(
      await screen.findByText("Created note “Document activity feed”"),
    ).toBeInTheDocument();
    expect(screen.getByText("Idea · Open")).toBeInTheDocument();
  });
});
