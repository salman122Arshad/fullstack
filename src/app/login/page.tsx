import { FileText, KeyRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LoginButton } from "@/components/LoginButton";

export default async function LoginPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_theme(colors.indigo.100),_transparent_60%)]"
      />

      <div className="relative flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">DocDocs</h1>
            <p className="mt-1 text-sm text-slate-500">A lightweight collaborative document editor</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur">
          <div className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-400">
            <KeyRound className="h-3.5 w-3.5" />
            Mocked auth — pick an account, no password needed
          </div>

          <div className="flex flex-col gap-2.5">
            {users.map((u) => (
              <LoginButton key={u.id} userId={u.id} name={u.name} email={u.email} />
            ))}
          </div>

          {users.length === 0 && (
            <p className="text-sm text-red-600">
              No seeded users found. Run <code className="rounded bg-red-50 px-1 py-0.5">npm run db:seed</code> first.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
