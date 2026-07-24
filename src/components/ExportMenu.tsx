"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileDown, Printer } from "lucide-react";
import { downloadTextFile, htmlToMarkdown, slugifyFilename } from "@/lib/exportMarkdown";

export function ExportMenu({ title, getHtml }: { title: string; getHtml: () => string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function exportMarkdown() {
    // The title is already carried by the filename; the body is exported as-is
    // rather than prepending a second heading (many documents already open
    // with their own H1 matching the title, which would otherwise duplicate).
    const markdown = htmlToMarkdown(getHtml());
    downloadTextFile(`${slugifyFilename(title)}.md`, markdown, "text/markdown");
    setOpen(false);
  }

  function exportPdf() {
    setOpen(false);
    // Print-to-PDF via the browser's native dialog, styled by the @media print
    // rules in globals.css (hides chrome, keeps just the document content).
    window.print();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </button>

      {open && (
        <div className="animate-in absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <button
            onClick={exportMarkdown}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <FileDown className="h-4 w-4 text-slate-400" />
            Export as Markdown
          </button>
          <button
            onClick={exportPdf}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4 text-slate-400" />
            Export as PDF
          </button>
        </div>
      )}
    </div>
  );
}
