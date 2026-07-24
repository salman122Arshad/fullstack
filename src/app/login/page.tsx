import { prisma } from "@/lib/prisma";
import { LoginButton } from "@/components/LoginButton";

export default async function LoginPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">DocDocs</h1>
        <p className="mt-1 text-sm text-slate-500">
          This demo uses mocked auth — pick a seeded account to sign in, no password needed.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {users.map((u) => (
          <LoginButton key={u.id} userId={u.id} name={u.name} email={u.email} />
        ))}
      </div>

      {users.length === 0 && (
        <p className="text-sm text-red-600">
          No seeded users found. Run <code>npm run db:seed</code> first.
        </p>
      )}
    </main>
  );
}
