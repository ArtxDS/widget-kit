import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const NOTE_ATTACHMENTS_BUCKET = "note-attachments";
export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; 
export const ALLOWED_IMAGE_MIME_TYPES = ["image/png", "image/jpeg"] as const;
export const ALLOWED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg"] as const;
export const SIGNED_URL_EXPIRES_IN_SECONDS = 3600; 

export function getStorageServiceRoleKey(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return key || null;
}

export function getSupabaseUrl(): string | null {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    null
  );
}

export function createSupabaseStorageAdminClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const serviceRoleKey = getStorageServiceRoleKey();
  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Validates the true binary format using magic bytes.
 * PNG: 89 50 4E 47 0D 0A 1A 0A
 * JPEG: FF D8 FF
 */
export function detectImageMimeType(
  buffer: Uint8Array | Buffer,
): "image/png" | "image/jpeg" | null {
  if (!buffer || buffer.length < 8) return null;

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  return null;
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

export function isAllowedImageExtension(ext: string): boolean {
  return (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(
    ext.toLowerCase(),
  );
}

const STORAGE_PATH_REGEX =
  /^notes\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\.(png|jpg|jpeg)$/;

export function isValidNoteAttachmentPath(
  path: string,
  noteId?: string,
): boolean {
  if (!path || typeof path !== "string") return false;
  const normalized = path.replace(/^storage:/, "").trim();
  const match = STORAGE_PATH_REGEX.exec(normalized);
  if (!match) return false;
  if (noteId && match[1] !== noteId) return false;
  return true;
}

export function normalizeStoragePath(pathOrUri: string): string {
  return pathOrUri.replace(/^storage:/, "").trim();
}

export function toStorageUri(path: string): string {
  const clean = normalizeStoragePath(path);
  return `storage:${clean}`;
}

export function extractStoragePathsFromMarkdown(
  content: string,
  noteId?: string,
): string[] {
  if (!content || typeof content !== "string") return [];

  // Match storage:notes/{noteId}/{filename}.{ext}
  const regex =
    /storage:(notes\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg))/g;
  const paths = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const path = match[1];
    if (isValidNoteAttachmentPath(path, noteId)) {
      paths.add(path);
    }
  }

  return Array.from(paths);
}

export async function generateSignedUrlsForPaths(
  paths: string[],
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};

  const client = createSupabaseStorageAdminClient();
  if (!client) {
    return {};
  }

  const results: Record<string, string> = {};

  try {
    const { data, error } = await client.storage
      .from(NOTE_ATTACHMENTS_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_EXPIRES_IN_SECONDS);

    if (error || !data) {
      return {};
    }

    for (const item of data) {
      if (item.signedUrl && item.path && !item.error) {
        results[`storage:${item.path}`] = item.signedUrl;
        results[item.path] = item.signedUrl;
      }
    }
  } catch {
    return {};
  }

  return results;
}

export async function getSignedUrlsForNoteContent(
  content: string,
  noteId?: string,
): Promise<Record<string, string>> {
  const paths = extractStoragePathsFromMarkdown(content, noteId);
  return generateSignedUrlsForPaths(paths);
}

export type UploadAttachmentResult = {
  path: string;
  storageUri: string;
  signedUrl: string;
  filename: string;
  mimeType: string;
  size: number;
};

export async function uploadAttachmentToStorage({
  noteId,
  buffer,
  originalFilename,
}: {
  noteId: string;
  buffer: Buffer | Uint8Array;
  originalFilename: string;
}): Promise<UploadAttachmentResult> {
  if (!noteId || !/^[a-zA-Z0-9_-]+$/.test(noteId)) {
    throw new Error("Invalid note identifier.");
  }

  if (buffer.length > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error("File size exceeds 5 MB limit.");
  }

  const detectedMime = detectImageMimeType(buffer);
  if (!detectedMime) {
    throw new Error(
      "Invalid file type: file content must be a valid PNG or JPEG image.",
    );
  }

  const rawExt = getFileExtension(originalFilename);
  if (!isAllowedImageExtension(rawExt)) {
    throw new Error(
      "Invalid file extension: only .png, .jpg, and .jpeg are allowed.",
    );
  }

  if (detectedMime === "image/png" && rawExt !== ".png") {
    throw new Error("File extension does not match binary PNG image type.");
  }
  if (
    detectedMime === "image/jpeg" &&
    rawExt !== ".jpg" &&
    rawExt !== ".jpeg"
  ) {
    throw new Error("File extension does not match binary JPEG image type.");
  }

  const client = createSupabaseStorageAdminClient();
  if (!client) {
    throw new Error(
      "Storage is not configured: SUPABASE_SERVICE_ROLE_KEY is required on server.",
    );
  }

  const ext = detectedMime === "image/png" ? "png" : "jpg";
  const uniqueFilename = `${crypto.randomUUID()}.${ext}`;
  const storagePath = `notes/${noteId}/${uniqueFilename}`;

  const { error: uploadError } = await client.storage
    .from(NOTE_ATTACHMENTS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: detectedMime,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: signedData, error: signError } = await client.storage
    .from(NOTE_ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRES_IN_SECONDS);

  if (signError || !signedData?.signedUrl) {
    throw new Error("Failed to generate signed URL for uploaded image.");
  }

  return {
    path: storagePath,
    storageUri: `storage:${storagePath}`,
    signedUrl: signedData.signedUrl,
    filename: uniqueFilename,
    mimeType: detectedMime,
    size: buffer.length,
  };
}

export async function deleteAttachmentFromStorage(
  storagePathOrUri: string,
  noteId?: string,
): Promise<{ success: boolean; path: string }> {
  const path = normalizeStoragePath(storagePathOrUri);

  if (!isValidNoteAttachmentPath(path, noteId)) {
    throw new Error("Invalid attachment path or does not belong to this note.");
  }

  const client = createSupabaseStorageAdminClient();
  if (!client) {
    throw new Error(
      "Storage is not configured: SUPABASE_SERVICE_ROLE_KEY is required on server.",
    );
  }

  const { error } = await client.storage
    .from(NOTE_ATTACHMENTS_BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete object from storage: ${error.message}`);
  }

  return { success: true, path };
}
