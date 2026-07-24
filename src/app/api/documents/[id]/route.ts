import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { canAccessDocument } from "@/lib/access";

type RouteParams = { params: Promise<{ id: string }> };

async function loadDocWithShares(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: { shares: true, owner: true },
  });
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = await loadDocWithShares(id);
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const access = canAccessDocument(doc, doc.shares, userId);
  if (!access.canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    id: doc.id,
    title: doc.title,
    contentHtml: doc.contentHtml,
    updatedAt: doc.updatedAt,
    ownerId: doc.ownerId,
    ownerName: doc.owner.name,
    access,
    shares: access.isOwner
      ? await Promise.all(
          doc.shares.map(async (s) => {
            const user = await prisma.user.findUnique({ where: { id: s.userId } });
            return { id: s.id, userId: s.userId, name: user?.name, email: user?.email, permission: s.permission };
          })
        )
      : undefined,
  });
}

const patchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  contentHtml: z.string().max(1_000_000).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = await loadDocWithShares(id);
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const access = canAccessDocument(doc, doc.shares, userId);
  if (!access.canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const updated = await prisma.document.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (doc.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
