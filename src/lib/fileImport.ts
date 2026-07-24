import { marked } from "marked";
import mammoth from "mammoth";

export const SUPPORTED_EXTENSIONS = ["txt", "md", "docx"] as const;
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

export class UnsupportedFileTypeError extends Error {
  constructor(extension: string) {
    super(
      `Unsupported file type ".${extension}". Supported types: ${SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(", ")}.`
    );
    this.name = "UnsupportedFileTypeError";
  }
}

function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function plainTextToHtml(text: string): string {
  return text
    .split(/\r?\n\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\r?\n/g, "<br>")}</p>`)
    .join("\n");
}

export interface ImportedDocument {
  title: string;
  html: string;
}

/** Converts an uploaded .txt/.md/.docx file into HTML suitable for the Tiptap editor. */
export async function importFileToHtml(filename: string, buffer: Buffer): Promise<ImportedDocument> {
  const extension = getExtension(filename);
  if (!SUPPORTED_EXTENSIONS.includes(extension as SupportedExtension)) {
    throw new UnsupportedFileTypeError(extension || "unknown");
  }

  const title = filename.replace(/\.[^.]+$/, "") || "Imported document";

  if (extension === "txt") {
    return { title, html: plainTextToHtml(buffer.toString("utf-8")) };
  }

  if (extension === "md") {
    const html = await marked.parse(buffer.toString("utf-8"));
    return { title, html };
  }

  // docx
  const result = await mammoth.convertToHtml({ buffer });
  return { title, html: result.value };
}
