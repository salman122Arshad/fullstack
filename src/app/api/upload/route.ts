import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { importFileToHtml, UnsupportedFileTypeError, SUPPORTED_EXTENSIONS } from "@/lib/fileImport";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 5MB)." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { title, html } = await importFileToHtml(file.name, buffer);

    const doc = await prisma.document.create({
      data: { title, contentHtml: html, ownerId: userId },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    if (err instanceof UnsupportedFileTypeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("File import failed:", err);
    return NextResponse.json(
      { error: `Could not import that file. Supported types: ${SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(", ")}.` },
      { status: 422 }
    );
  }
}
