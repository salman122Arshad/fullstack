import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [alice, bob, carol] = await Promise.all([
    prisma.user.upsert({
      where: { email: "alice@docdocs.dev" },
      update: {},
      create: { name: "Alice", email: "alice@docdocs.dev" },
    }),
    prisma.user.upsert({
      where: { email: "bob@docdocs.dev" },
      update: {},
      create: { name: "Bob", email: "bob@docdocs.dev" },
    }),
    prisma.user.upsert({
      where: { email: "carol@docdocs.dev" },
      update: {},
      create: { name: "Carol", email: "carol@docdocs.dev" },
    }),
  ]);

  const existing = await prisma.document.findFirst({
    where: { ownerId: alice.id, title: "Welcome to DocDocs" },
  });

  const doc =
    existing ??
    (await prisma.document.create({
      data: {
        title: "Welcome to DocDocs",
        ownerId: alice.id,
        contentHtml: `
          <h1>Welcome to DocDocs</h1>
          <p>This is a <strong>sample document</strong> owned by <em>Alice</em> and
          shared with <u>Bob</u> for viewing.</p>
          <ul>
            <li>Try bold, italic and underline</li>
            <li>Try headings and lists</li>
            <li>Upload a .txt, .md or .docx file from the dashboard</li>
          </ul>
        `.trim(),
      },
    }));

  await prisma.documentShare.upsert({
    where: { documentId_userId: { documentId: doc.id, userId: bob.id } },
    update: {},
    create: { documentId: doc.id, userId: bob.id, permission: "VIEW" },
  });

  console.log("Seeded users:", { alice: alice.email, bob: bob.email, carol: carol.email });
  console.log("Seeded document:", doc.title, "shared with", bob.email, "(view)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
