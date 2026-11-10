import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  detectImageMimeType,
  extractStoragePathsFromMarkdown,
  getFileExtension,
  isAllowedImageExtension,
  isValidNoteAttachmentPath,
  MAX_ATTACHMENT_SIZE_BYTES,
  NOTE_ATTACHMENTS_BUCKET,
} from "@/lib/notes-storage";

describe("notes-storage logic and security", () => {
  it("enforces bucket name and 5MB maximum file size limit", () => {
    expect(NOTE_ATTACHMENTS_BUCKET).toBe("note-attachments");
    expect(MAX_ATTACHMENT_SIZE_BYTES).toBe(5 * 1024 * 1024);
  });

  it("detects genuine PNG magic bytes", () => {
    const pngHeader = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
    ]);
    expect(detectImageMimeType(pngHeader)).toBe("image/png");
  });

  it("detects genuine JPEG magic bytes", () => {
    const jpegHeader = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
    ]);
    expect(detectImageMimeType(jpegHeader)).toBe("image/jpeg");
  });

  it("rejects disguised files or invalid magic bytes (e.g. text/html/executable with .png name)", () => {
    const fakeFile = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    expect(detectImageMimeType(fakeFile)).toBeNull();

    const empty = new Uint8Array([]);
    expect(detectImageMimeType(empty)).toBeNull();
  });

  it("validates allowed image extensions", () => {
    expect(getFileExtension("photo.png")).toBe(".png");
    expect(getFileExtension("photo.JPG")).toBe(".jpg");
    expect(getFileExtension("photo.jpeg")).toBe(".jpeg");
    expect(getFileExtension("photo.svg")).toBe(".svg");

    expect(isAllowedImageExtension(".png")).toBe(true);
    expect(isAllowedImageExtension(".jpg")).toBe(true);
    expect(isAllowedImageExtension(".jpeg")).toBe(true);
    expect(isAllowedImageExtension(".gif")).toBe(false);
    expect(isAllowedImageExtension(".svg")).toBe(false);
    expect(isAllowedImageExtension(".webp")).toBe(false);
  });

  it("validates organized note attachment paths and prevents directory traversal", () => {
    expect(
      isValidNoteAttachmentPath(
        "notes/note-123/a1b2c3d4-e5f6-7890-abcd-ef1234567890.png",
        "note-123",
      ),
    ).toBe(true);

    // Mismatched note ID
    expect(
      isValidNoteAttachmentPath("notes/note-other/uuid.png", "note-123"),
    ).toBe(false);

    // Path traversal attempt
    expect(
      isValidNoteAttachmentPath("notes/note-123/../../etc/passwd.png", "note-123"),
    ).toBe(false);

    // Arbitrary bucket path
    expect(
      isValidNoteAttachmentPath("avatars/user-1/profile.png", "note-123"),
    ).toBe(false);
  });

  it("extracts and validates storage paths from markdown content", () => {
    const markdown = `
# Bug Report
Here is an image:
![Safari glitch](storage:notes/note-1/glitch.png)
And another:
![Console log](storage:notes/note-1/console.jpg)
And an external image that should NOT be extracted as internal storage:
![External](https://example.com/ext.png)
And an image from a different note:
![Other note](storage:notes/note-2/other.png)
    `;

    const note1Paths = extractStoragePathsFromMarkdown(markdown, "note-1");
    expect(note1Paths).toEqual([
      "notes/note-1/glitch.png",
      "notes/note-1/console.jpg",
    ]);

    const allPaths = extractStoragePathsFromMarkdown(markdown);
    expect(allPaths).toContain("notes/note-1/glitch.png");
    expect(allPaths).toContain("notes/note-1/console.jpg");
    expect(allPaths).toContain("notes/note-2/other.png");
  });
});
