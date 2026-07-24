import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [owned, sharedWithMe] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.documentShare.findMany({
      where: { userId },
      include: { document: { include: { owner: true } } },
      orderBy: { document: { updatedAt: "desc" } },
    }),
  ]);

  return NextResponse.json({
    owned,
    shared: sharedWithMe.map((s) => ({
      ...s.document,
      ownerName: s.document.owner.name,
      permission: s.permission,
    })),
  });
}

const createSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const doc = await prisma.document.create({
    data: {
      title: parsed.data.title ?? "Untitled document",
      ownerId: userId,
      contentHtml: "",
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
