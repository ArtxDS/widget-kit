import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotesPage } from "@/components/dashboard/pages";
import type { NoteDto } from "@/lib/notes";

const sampleNotes: NoteDto[] = [
  {
    id: "note-1",
    title: "Button onClick not firing in Safari 17",
    type: "BUG",
    content: "The onClick handler for our Button component is not firing in Safari 17 on macOS.",
    typeData: {
      steps: [
        "Open the application in Safari 17",
        "Navigate to a page with a Button component",
        "Click the button",
      ],
      expectedBehavior: "onClick handler is called",
      actualBehavior: "Nothing happens",
    },
    tags: ["frontend", "safari", "event-handling"],
    componentSlug: "badge",
    priority: "P1",
    status: "OPEN",
    authorId: "user-1",
    author: {
      id: "user-1",
      name: "Arthur Alves",
      email: "arthur@example.com",
      avatarUrl: null,
    },
    lastEditedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "note-2",
    title: "Add optimistic updates for better UX",
    type: "IDEA",
    content: "Add optimistic updates when creating items to make UI instantaneous.",
    typeData: {
      context: "Network latency is sometimes 300ms",
      description: "Optimistic updates pattern",
      benefit: "Snappier user experience",
    },
    tags: ["frontend", "performance"],
    componentSlug: "toast",
    priority: "P2",
    status: "IN_PROGRESS",
    authorId: "user-1",
    author: {
      id: "user-1",
      name: "Arthur Alves",
      email: "arthur@example.com",
      avatarUrl: null,
    },
    lastEditedBy: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "note-3",
    title: "Migrate error handling to Result type",
    type: "IMPROVEMENT",
    content: "Refactor core API client to return Result<T, E>.",
    typeData: {
      currentLimitation: "Exceptions are untyped",
      proposedImprovement: "Result type pattern",
      expectedOutcome: "Compile-time error handling",
    },
    tags: ["backend", "typescript"],
    componentSlug: null,
    priority: "P3",
    status: "DONE",
    authorId: "user-1",
    author: {
      id: "user-1",
      name: "Arthur Alves",
      email: "arthur@example.com",
      avatarUrl: null,
    },
    lastEditedBy: null,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

function mockFetch(role: "ADMIN" | "USER" = "ADMIN", notes: NoteDto[] = sampleNotes) {
  return vi.fn().mockImplementation(async (input: unknown) => {
    const url = typeof input === "string" ? input : (input as { url?: string })?.url ?? "";
    if (url.includes("/api/auth/me")) {
      return {
        ok: true,
        json: async () => ({
          id: role === "ADMIN" ? "user-1" : "user-2",
          email: "test@example.com",
          name: "Test User",
          avatarUrl: null,
          role,
        }),
      };
    }
    return {
      ok: true,
      json: async () => ({ notes }),
    };
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("Notes workbench and dashboard", () => {
  it("renders notes list after loading", async () => {
    vi.stubGlobal("fetch", mockFetch("ADMIN", []));

    render(<NotesPage />);
    expect(screen.getByTestId("notes-skeleton")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("No notes yet")).toBeInTheDocument(),
    );
  });

  it("shows a loading state and recovers from error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (input: unknown) => {
        const url = typeof input === "string" ? input : (input as { url?: string })?.url ?? "";
        if (url.includes("/api/auth/me")) {
          return {
            ok: true,
            json: async () => ({ id: "user-1", role: "ADMIN", name: "Admin" }),
          };
        }
        return { ok: false, json: async () => ({ error: "boom" }) };
      }),
    );

    render(<NotesPage />);
    await waitFor(() => expect(screen.getByText("boom")).toBeInTheDocument());
  });

  it("displays notes stream, telemetry bar, and inspector for selected note", async () => {
    vi.stubGlobal("fetch", mockFetch("ADMIN", sampleNotes));

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByText("Triage Stream")).toBeInTheDocument();
    });

    // Check Telemetry Live indicator
    expect(screen.getByText("Telemetry • Live")).toBeInTheDocument();

    // Check that notes are listed in the stream
    expect(screen.getAllByText("Button onClick not firing in Safari 17").length).toBeGreaterThan(0);
    expect(screen.getByText("Add optimistic updates for better UX")).toBeInTheDocument();
    expect(screen.getByText("Migrate error handling to Result type")).toBeInTheDocument();

    // Check Inspector displays the first selected note details
    expect(screen.getByText("Steps to Reproduce")).toBeInTheDocument();
    expect(screen.getByText("Open the application in Safari 17")).toBeInTheDocument();
    expect(screen.getByText("Expected Behavior")).toBeInTheDocument();
    expect(screen.getByText("Actual Behavior")).toBeInTheDocument();
  });

  it("filters notes via Telemetry HUD status pills", async () => {
    vi.stubGlobal("fetch", mockFetch("ADMIN", sampleNotes));

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Button onClick not firing in Safari 17").length).toBeGreaterThan(0);
    });

    // Click "Done" filter pill in the Telemetry Bar
    const telemetryBar = screen.getByTestId("telemetry-bar");
    const donePill = within(telemetryBar).getByRole("button", { name: /Done/i });
    fireEvent.click(donePill);

    // In the triage stream, only note-3 (DONE) should be present
    const triageStream = screen.getByTestId("triage-stream");
    expect(within(triageStream).queryByText("Button onClick not firing in Safari 17")).not.toBeInTheDocument();
    expect(within(triageStream).queryByText("Add optimistic updates for better UX")).not.toBeInTheDocument();
    expect(within(triageStream).getByText("Migrate error handling to Result type")).toBeInTheDocument();
  });

  it("preserves dynamic category data when switching note types in composer", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", mockFetch("ADMIN", sampleNotes));

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /New note/i })).toBeInTheDocument();
    });

    // Open composer via New note stream button
    fireEvent.click(screen.getByRole("button", { name: /New note/i }));

    expect(screen.getByText("Capture a bug, idea, or feedback for the team.")).toBeInTheDocument();

    const composerForm = document.getElementById("note-composer-form")!;

    // Type a bug step
    const stepInput = within(composerForm).getByPlaceholderText("Step 1...");
    await user.type(stepInput, "Step one of bug");

    // Switch to Idea
    const ideaButton = within(composerForm).getByRole("button", { name: /Idea/i });
    fireEvent.click(ideaButton);

    // Dynamic field for Idea should show
    expect(within(composerForm).getByText("Context")).toBeInTheDocument();
    const benefitInput = within(composerForm).getByPlaceholderText(/How does this improve developer experience/i);
    await user.type(benefitInput, "Massive speed improvement");

    // Switch back to Bug
    const bugButton = within(composerForm).getByRole("button", { name: /Bug/i });
    fireEvent.click(bugButton);

    // Bug step must be PRESERVED without being wiped!
    expect(within(composerForm).getByDisplayValue("Step one of bug")).toBeInTheDocument();

    // Switch back to Idea: Benefit must also be PRESERVED!
    fireEvent.click(ideaButton);
    expect(within(composerForm).getByDisplayValue("Massive speed improvement")).toBeInTheDocument();
  });

  it("shows new note creation form on the right panel when no notes exist", async () => {
    vi.stubGlobal("fetch", mockFetch("ADMIN", []));

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByText("No notes yet")).toBeInTheDocument();
    });

    // The right panel must display the New Note composer form directly!
    expect(screen.getByText("Capture a bug, idea, or feedback for the team.")).toBeInTheDocument();
    expect(screen.getAllByText("Create Note").length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/e\.g\. Button onClick not firing/i)).toBeInTheDocument();
  });

  it("filters stream notes by category using the pill filter", async () => {
    vi.stubGlobal("fetch", mockFetch("ADMIN", sampleNotes));

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Button onClick not firing in Safari 17").length).toBeGreaterThan(0);
    });

    const triageStream = screen.getByTestId("triage-stream");

    // Click the "Bug" pill directly
    const bugPill = within(triageStream).getByRole("button", { name: /^Bug$/i });
    fireEvent.click(bugPill);

    // Only Bug note should remain in the stream
    expect(within(triageStream).getByText("Button onClick not firing in Safari 17")).toBeInTheDocument();
    expect(within(triageStream).queryByText("Add optimistic updates for better UX")).not.toBeInTheDocument();
    expect(within(triageStream).queryByText("Migrate error handling to Result type")).not.toBeInTheDocument();
  });

  it("prevents non-admin user from creating or editing notes (read-only view)", async () => {
    vi.stubGlobal("fetch", mockFetch("USER", sampleNotes));

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Button onClick not firing in Safari 17").length).toBeGreaterThan(0);
    });

    // "New note" button must not exist
    expect(screen.queryByRole("button", { name: /New note/i })).not.toBeInTheDocument();

    // "Edit" or "Edit Markdown" button must not exist
    expect(screen.queryByText("Edit Markdown")).not.toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();

    // Read-only view indicator is visible
    expect(screen.getByText("Read-only view")).toBeInTheDocument();
  });

  it("renders structured fields with Markdown formatting (lists, bold, code) in NoteInspector", async () => {
    const markdownIdeaNote: NoteDto = {
      id: "note-idea-markdown",
      title: "Interactive Widget Canvas",
      type: "IDEA",
      content: "Main description with **bold** text.",
      typeData: {
        context: "### Architecture Context\nNeed better speed:\n- Bullet Alpha\n- Bullet Beta",
        description: "1. First phase\n2. Second phase\n\nIncludes `widgetRef` token.",
        benefit: "Provides **high productivity** for all developers.",
      },
      tags: ["canvas", "ux"],
      componentSlug: "toast",
      priority: "P1",
      status: "OPEN",
      authorId: "user-1",
      author: {
        id: "user-1",
        name: "Arthur Alves",
        email: "arthur@example.com",
        avatarUrl: null,
      },
      lastEditedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.stubGlobal("fetch", mockFetch("ADMIN", [markdownIdeaNote]));

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Interactive Widget Canvas").length).toBeGreaterThan(0);
    });

    const inspector = screen.getByTestId("note-inspector");

    // Context field headings, bold and lists rendered as Markdown
    expect(within(inspector).getByRole("heading", { level: 3, name: "Architecture Context" })).toBeInTheDocument();
    expect(within(inspector).getByText("Bullet Alpha")).toBeInTheDocument();
    expect(within(inspector).getByText("Bullet Beta")).toBeInTheDocument();

    // Detailed Description numbered lists and code
    expect(within(inspector).getByText("First phase")).toBeInTheDocument();
    expect(within(inspector).getByText("Second phase")).toBeInTheDocument();
    const codeToken = within(inspector).getByText("widgetRef");
    expect(codeToken.tagName.toLowerCase()).toBe("code");

    // Expected Benefit bold formatting
    const boldBenefit = within(inspector).getByText("high productivity");
    expect(boldBenefit.tagName.toLowerCase()).toBe("strong");

    // Top tags in inspector rendered as rounded-full badges
    const canvasTag = within(inspector).getByText("#canvas");
    expect(canvasTag.closest("span")).toHaveClass("rounded-full");
    const uxTag = within(inspector).getByText("#ux");
    expect(uxTag.closest("span")).toHaveClass("rounded-full");

    // Stream card tags rendered as rounded-full badges
    const triageStream = screen.getByTestId("triage-stream");
    const streamCanvasTag = within(triageStream).getByText("#canvas");
    expect(streamCanvasTag.closest("span")).toHaveClass("rounded-full");
  });
});
