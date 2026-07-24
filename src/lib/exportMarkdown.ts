import TurndownService from "turndown";

const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });

// Markdown has no native underline syntax; keep the semantic tag rather than
// silently dropping the formatting (most Markdown renderers pass raw HTML through).
turndown.addRule("underline", {
  filter: ["u"],
  replacement: (content) => `<u>${content}</u>`,
});

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html || "<p></p>");
}

export function downloadTextFile(filename: string, contents: string, mimeType = "text/plain") {
  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Turns a document title into a filesystem-safe base filename (no extension). */
export function slugifyFilename(title: string): string {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  );
}
