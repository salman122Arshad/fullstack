"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Toolbar } from "@/components/Toolbar";
import { ShareDialog } from "@/components/ShareDialog";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function DocumentEditor({
  documentId,
  initialTitle,
  initialContentHtml,
  canEdit,
  isOwner,
  ownerName,
}: {
  documentId: string;
  initialTitle: string;
  initialContentHtml: string;
  canEdit: boolean;
  isOwner: boolean;
  ownerName: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [shareOpen, setShareOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit, // includes Underline by default (Tiptap v3)
      Placeholder.configure({ placeholder: canEdit ? "Start writing…" : "" }),
    ],
    content: initialContentHtml,
    editable: canEdit,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      scheduleSave({ contentHtml: editor.getHTML() });
    },
  });

  const save = useCallback(
    async (patch: { title?: string; contentHtml?: string }) => {
      setStatus("saving");
      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error("Save failed");
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [documentId]
  );

  function scheduleSave(patch: { title?: string; contentHtml?: string }) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(patch), 700);
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function handleTitleBlur() {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(initialTitle);
      return;
    }
    if (trimmed !== initialTitle) {
      save({ title: trimmed });
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/documents" className="text-sm text-slate-500 hover:underline">
          ← All documents
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {status === "saving" && "Saving…"}
            {status === "saved" && "Saved"}
            {status === "error" && <span className="text-red-500">Could not save</span>}
          </span>
          {isOwner && (
            <button
              onClick={() => setShareOpen(true)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Share
            </button>
          )}
        </div>
      </div>

      {!isOwner && (
        <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Shared by {ownerName} · You can {canEdit ? "edit" : "only view"} this document.
        </p>
      )}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        disabled={!canEdit}
        className="mb-4 w-full border-none bg-transparent text-3xl font-semibold text-slate-900 outline-none disabled:opacity-90"
        aria-label="Document title"
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {canEdit && <Toolbar editor={editor} />}
        <EditorContent editor={editor} className="prose prose-slate max-w-none px-4 py-4 focus:outline-none" />
      </div>

      {shareOpen && <ShareDialog documentId={documentId} onClose={() => setShareOpen(false)} />}
    </main>
  );
}
