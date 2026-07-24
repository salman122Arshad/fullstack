"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { ArrowLeft, Check, Eye, Loader2, Share2, TriangleAlert } from "lucide-react";
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
    editorProps: {
      attributes: { class: "prose prose-slate max-w-none px-6 py-6 focus:outline-none min-h-[60vh]" },
    },
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
        <Link
          href="/documents"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          All documents
        </Link>
        <div className="flex items-center gap-3">
          <SaveIndicator status={status} />
          {isOwner && (
            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          )}
        </div>
      </div>

      {!isOwner && (
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <Eye className="h-3.5 w-3.5" />
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
        className="mb-4 w-full rounded-lg border-none bg-transparent px-1 text-3xl font-semibold text-slate-900 outline-none transition focus:bg-white focus:shadow-sm disabled:opacity-90"
        aria-label="Document title"
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {canEdit && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
      </div>

      {shareOpen && <ShareDialog documentId={documentId} onClose={() => setShareOpen(false)} />}
    </main>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
      {status === "saving" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving…
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          Saved
        </>
      )}
      {status === "error" && (
        <span className="inline-flex items-center gap-1.5 text-red-500">
          <TriangleAlert className="h-3.5 w-3.5" />
          Could not save
        </span>
      )}
    </span>
  );
}
