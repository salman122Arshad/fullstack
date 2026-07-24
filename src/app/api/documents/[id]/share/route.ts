import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

async function requireOwner(id: string, userId: string) {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return { error: NextResponse.json({ error: "Document not found." }, { status: 404 }) } as const;
  if (doc.ownerId !== userId) return { error: NextResponse.json({ error: "Only the owner can manage sharing." }, { status: 403 }) } as const;
  return { doc } as const;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await requireOwner(id, userId);
  if ("error" in result) return result.error;

  const shares = await prisma.documentShare.findMany({
    where: { documentId: id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    shares.map((s) => ({ id: s.id, userId: s.userId, name: s.user.name, email: s.user.email, permission: s.permission }))
  );
}

const shareSchema = z.object({
  email: z.string().trim().email(),
  permission: z.enum(["VIEW", "EDIT"]),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await requireOwner(id, userId);
  if ("error" in result) return result.error;

  const parsed = shareSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a valid email and permission (VIEW or EDIT)." }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!targetUser) {
    return NextResponse.json({ error: "No user with that email exists." }, { status: 404 });
  }
  if (targetUser.id === userId) {
    return NextResponse.json({ error: "You already own this document." }, { status: 400 });
  }

  const share = await prisma.documentShare.upsert({
    where: { documentId_userId: { documentId: id, userId: targetUser.id } },
    update: { permission: parsed.data.permission },
    create: { documentId: id, userId: targetUser.id, permission: parsed.data.permission },
  });

  return NextResponse.json({
    id: share.id,
    userId: targetUser.id,
    name: targetUser.name,
    email: targetUser.email,
    permission: share.permission,
  });
}

const revokeSchema = z.object({ userId: z.string().min(1) });

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await requireOwner(id, userId);
  if ("error" in result) return result.error;

  const parsed = revokeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  await prisma.documentShare.deleteMany({ where: { documentId: id, userId: parsed.data.userId } });
  return NextResponse.json({ ok: true });
}
