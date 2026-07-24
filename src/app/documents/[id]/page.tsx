import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { canAccessDocument } from "@/lib/access";
import { DocumentEditor } from "@/components/DocumentEditor";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { shares: true, owner: true },
  });

  if (!doc) notFound();

  const access = canAccessDocument(doc, doc.shares, userId);
  if (!access.canView) notFound();

  return (
    <DocumentEditor
      documentId={doc.id}
      initialTitle={doc.title}
      initialContentHtml={doc.contentHtml}
      canEdit={access.canEdit}
      isOwner={access.isOwner}
      ownerName={doc.owner.name}
    />
  );
}
