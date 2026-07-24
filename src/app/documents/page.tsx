import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NewDocumentButton } from "@/components/NewDocumentButton";
import { UploadButton } from "@/components/UploadButton";
import { LogoutButton } from "@/components/LogoutButton";
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";

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
      <header className="mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">DocDocs</h1>
          <p className="text-sm text-slate-500">
            Signed in as <span className="font-medium text-slate-700">{user.name}</span> ({user.email})
          </p>
        </div>
        <div className="flex items-start gap-4">
          <UploadButton />
          <NewDocumentButton />
          <LogoutButton />
        </div>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">My documents</h2>
        {owned.length === 0 ? (
          <p className="text-sm text-slate-400">No documents yet — create one or upload a file to get started.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {owned.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300 hover:shadow"
                >
                  <span>
                    <span className="block font-medium text-slate-900">{doc.title}</span>
                    <span className="block text-xs text-slate-400">Updated {formatDate(doc.updatedAt)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Owner</span>
                    <DeleteDocumentButton id={doc.id} title={doc.title} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Shared with me</h2>
        {sharedWithMe.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing has been shared with you yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sharedWithMe.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/documents/${s.documentId}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300 hover:shadow"
                >
                  <span>
                    <span className="block font-medium text-slate-900">{s.document.title}</span>
                    <span className="block text-xs text-slate-400">
                      Owned by {s.document.owner.name} · Updated {formatDate(s.document.updatedAt)}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.permission === "EDIT" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
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
