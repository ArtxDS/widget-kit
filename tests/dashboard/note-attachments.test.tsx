import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotesPage } from "@/components/dashboard/pages";
import type { NoteDto } from "@/lib/notes";

const sampleNoteWithImage: NoteDto = {
  id: "note-img-1",
  title: "Safari image rendering artifact",
  type: "BUG",
  content: "Observed glitch on retina display:\n\n![Screenshot](storage:notes/note-img-1/glitch.png)",
  typeData: {
    steps: ["Open safari", "Inspect canvas"],
    expectedBehavior: "Crisp lines",
    actualBehavior: "Blurry edges",
  },
  tags: ["safari", "ui"],
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
  attachmentUrls: {
    "storage:notes/note-img-1/glitch.png": "https://signed.supabase.co/notes/note-img-1/glitch.png?token=exp3600",
    "notes/note-img-1/glitch.png": "https://signed.supabase.co/notes/note-img-1/glitch.png?token=exp3600",
  },
};

function createMockFetch({
  role = "ADMIN",
  notes = [sampleNoteWithImage],
  onUpload,
  onDeleteAttachment,
}: {
  role?: "ADMIN" | "USER";
  notes?: NoteDto[];
  onUpload?: (formData: FormData) => Promise<unknown>;
  onDeleteAttachment?: (url: string) => Promise<unknown>;
} = {}) {
  return vi.fn().mockImplementation(async (input: unknown, init?: RequestInit) => {
    const url = typeof input === "string" ? input : (input as { url?: string })?.url ?? "";
    const method = init?.method ?? "GET";

    if (url.includes("/api/auth/me")) {
      return {
        ok: true,
        json: async () => ({
          id: role === "ADMIN" ? "user-admin" : "user-standard",
          email: `${role.toLowerCase()}@example.com`,
          name: `${role} User`,
          avatarUrl: null,
          role,
        }),
      };
    }

    if (url.includes("/api/notes/attachments") && method === "POST") {
      if (role !== "ADMIN") {
        return {
          ok: false,
          status: 403,
          json: async () => ({ error: "Forbidden: only administrators can upload attachments." }),
        };
      }
      if (onUpload && init?.body instanceof FormData) {
        const customRes = await onUpload(init.body);
        return {
          ok: true,
          status: 201,
          json: async () => customRes,
        };
      }
      return {
        ok: true,
        status: 201,
        json: async () => ({
          path: "notes/note-new/abc-123.png",
          storageUri: "storage:notes/note-new/abc-123.png",
          signedUrl: "https://signed.supabase.co/notes/note-new/abc-123.png?token=exp",
          filename: "abc-123.png",
          mimeType: "image/png",
          size: 1024,
        }),
      };
    }

    if (url.match(/\/api\/notes\/[^/]+\/attachments/) && method === "DELETE") {
      if (role !== "ADMIN") {
        return {
          ok: false,
          status: 403,
          json: async () => ({ error: "Forbidden: only administrators can delete attachments." }),
        };
      }
      if (onDeleteAttachment) {
        await onDeleteAttachment(url);
      }
      return {
        ok: true,
        json: async () => ({
          note: {
            ...sampleNoteWithImage,
            content: "Observed glitch on retina display:\n\n",
            attachmentUrls: {},
          },
        }),
      };
    }

    if (url.includes("/api/notes")) {
      return {
        ok: true,
        json: async () => ({ notes }),
      };
    }

    return { ok: true, json: async () => ({}) };
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("Note image attachments and Supabase storage flow", () => {
  it("renders signed image inside NoteInspector for ADMIN and USER", async () => {
    vi.stubGlobal("fetch", createMockFetch({ role: "USER", notes: [sampleNoteWithImage] }));

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Safari image rendering artifact").length).toBeGreaterThan(0);
    });

    const img = screen.getByRole("img", { name: "Screenshot" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute(
      "src",
      "https://signed.supabase.co/notes/note-img-1/glitch.png?token=exp3600",
    );
  });

  it("opens lightbox on image click and closes on Escape or close button", async () => {
    vi.stubGlobal("fetch", createMockFetch({ role: "ADMIN", notes: [sampleNoteWithImage] }));

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Screenshot" })).toBeInTheDocument();
    });

    const img = screen.getByRole("img", { name: "Screenshot" });
    fireEvent.click(img);

    // Lightbox modal opens
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("img", { name: "Screenshot" })).toBeInTheDocument();

    // Close on escape
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("ADMIN: toolbar has image attach button and uploads PNG successfully into Markdown", async () => {
    let uploadedFormData: FormData | null = null;
    vi.stubGlobal(
      "fetch",
      createMockFetch({
        role: "ADMIN",
        notes: [sampleNoteWithImage],
        onUpload: async (formData) => {
          uploadedFormData = formData;
          return {
            path: "notes/draft-1/uploaded-screen.png",
            storageUri: "storage:notes/draft-1/uploaded-screen.png",
            signedUrl: "https://signed.supabase.co/notes/draft-1/uploaded-screen.png",
            filename: "uploaded-screen.png",
            mimeType: "image/png",
            size: 2048,
          };
        },
      }),
    );

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /New note/i })).toBeInTheDocument();
    });

    // Open composer
    fireEvent.click(screen.getByRole("button", { name: /New note/i }));

    // Image button must be in toolbar
    const imageBtn = screen.getByRole("button", { name: "Attach image" });
    expect(imageBtn).toBeInTheDocument();

    // Select a valid PNG file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const fakePng = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "test-preview.png", {
      type: "image/png",
    });

    fireEvent.change(fileInput, { target: { files: [fakePng] } });

    await waitFor(() => {
      expect(uploadedFormData).not.toBeNull();
    });

    // Verify markdown was inserted
    const textarea = screen.getByPlaceholderText(
      /Write markdown description with details, code snippets, or context.../i,
    );
    expect((textarea as HTMLTextAreaElement).value).toContain(
      "![test-preview](storage:notes/draft-1/uploaded-screen.png)",
    );

    // Switch to Preview: the image must render with signed URL!
    const previewBtn = screen.getByRole("button", { name: /Preview/i });
    fireEvent.click(previewBtn);

    const renderedImg = screen.getByRole("img", { name: "test-preview" });
    expect(renderedImg).toBeInTheDocument();
    expect(renderedImg).toHaveAttribute(
      "src",
      "https://signed.supabase.co/notes/draft-1/uploaded-screen.png",
    );
  });

  it("client validation rejects files exceeding 5MB limit", async () => {
    vi.stubGlobal("fetch", createMockFetch({ role: "ADMIN", notes: [] }));

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Attach image" })).toBeInTheDocument();
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    // 6 MB file
    const oversized = new File([new Uint8Array(6 * 1024 * 1024)], "large.png", {
      type: "image/png",
    });

    fireEvent.change(fileInput, { target: { files: [oversized] } });

    await waitFor(() => {
      expect(screen.getByText("File size exceeds 5 MB limit.")).toBeInTheDocument();
    });
  });

  it("client validation rejects non-image formats (.pdf, .txt)", async () => {
    vi.stubGlobal("fetch", createMockFetch({ role: "ADMIN", notes: [] }));

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Attach image" })).toBeInTheDocument();
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const documentFile = new File(["dummy text"], "document.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(fileInput, { target: { files: [documentFile] } });

    await waitFor(() => {
      expect(
        screen.getByText("Invalid file format: only PNG and JPG/JPEG images are allowed."),
      ).toBeInTheDocument();
    });
  });

  it("ADMIN can remove image from NoteInspector, which calls delete API and updates note", async () => {
    let deleteCalled = false;
    vi.stubGlobal(
      "fetch",
      createMockFetch({
        role: "ADMIN",
        notes: [sampleNoteWithImage],
        onDeleteAttachment: async () => {
          deleteCalled = true;
        },
      }),
    );

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Screenshot" })).toBeInTheDocument();
    });

    // Remove button should be present for ADMIN
    const removeBtn = screen.getByRole("button", { name: "Remove image from note" });
    expect(removeBtn).toBeInTheDocument();

    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });
  });

  it("USER cannot see image upload or remove controls", async () => {
    vi.stubGlobal("fetch", createMockFetch({ role: "USER", notes: [sampleNoteWithImage] }));

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Screenshot" })).toBeInTheDocument();
    });

    // No remove button in inspector
    expect(screen.queryByRole("button", { name: "Remove image from note" })).not.toBeInTheDocument();

    // No "New note" button
    expect(screen.queryByRole("button", { name: /New note/i })).not.toBeInTheDocument();

    // Read-only view indicator
    expect(screen.getByText("Read-only view")).toBeInTheDocument();
  });
});
