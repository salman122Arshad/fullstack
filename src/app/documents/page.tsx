import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Files, Pencil, Eye, Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NewDocumentButton } from "@/components/NewDocumentButton";
import { UploadButton } from "@/components/UploadButton";
import { LogoutButton } from "@/components/LogoutButton";
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";
import { Avatar } from "@/components/Avatar";

function formatDate(date: Date) {
  return new Date(date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [owned, sharedWithMe] = await Promise.all([
    prisma.document.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" } }),
    prisma.documentShare.findMany({
      where: { userId: user.id },
      include: { document: { include: { owner: true } } },
      orderBy: { document: { updatedAt: "desc" } },
    }),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">DocDocs</h1>
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Avatar name={user.name} size="sm" />
              <span className="truncate">
                <span className="font-medium text-slate-700">{user.name}</span> · {user.email}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <UploadButton />
          <NewDocumentButton />
          <LogoutButton />
        </div>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <Files className="h-4 w-4" />
          My documents
        </h2>
        {owned.length === 0 ? (
          <EmptyState message="No documents yet — create one or upload a file to get started." />
        ) : (
          <ul className="flex flex-col gap-2">
            {owned.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/documents/${doc.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-900">{doc.title}</span>
                    <span className="block text-xs text-slate-400">Updated {formatDate(doc.updatedAt)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Owner</span>
                    <DeleteDocumentButton id={doc.id} title={doc.title} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <Inbox className="h-4 w-4" />
          Shared with me
        </h2>
        {sharedWithMe.length === 0 ? (
          <EmptyState message="Nothing has been shared with you yet." />
        ) : (
          <ul className="flex flex-col gap-2">
            {sharedWithMe.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/documents/${s.documentId}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                >
                  <Avatar name={s.document.owner.name} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-900">{s.document.title}</span>
                    <span className="block text-xs text-slate-400">
                      Owned by {s.document.owner.name} · Updated {formatDate(s.document.updatedAt)}
                    </span>
                  </span>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      s.permission === "EDIT" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {s.permission === "EDIT" ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {s.permission === "EDIT" ? "Can edit" : "Can view"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-10 text-center">
      <Files className="h-6 w-6 text-slate-300" />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}
