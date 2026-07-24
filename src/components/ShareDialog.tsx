"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Share2, Users, X } from "lucide-react";
import { Avatar } from "@/components/Avatar";

interface Share {
  id: string;
  userId: string;
  name?: string;
  email?: string;
  permission: "VIEW" | "EDIT";
}

export function ShareDialog({ documentId, onClose }: { documentId: string; onClose: () => void }) {
  const [shares, setShares] = useState<Share[]>([]);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"VIEW" | "EDIT">("VIEW");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    fetch(`/api/documents/${documentId}/share`)
      .then((res) => res.json())
      .then((data) => setShares(Array.isArray(data) ? data : []))
      .finally(() => setLoadingList(false));
  }, [documentId]);

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, permission }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not share document.");
      setShares((prev) => [...prev.filter((s) => s.userId !== data.userId), data]);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not share document.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(userId: string) {
    setShares((prev) => prev.filter((s) => s.userId !== userId));
    await fetch(`/api/documents/${documentId}/share`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm animate-in"
      onClick={onClose}
    >
      <div
        className="scale-in w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Share2 className="h-4.5 w-4.5 text-indigo-600" />
            Share document
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleShare} className="mb-5 flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="teammate@docdocs.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as "VIEW" | "EDIT")}
              className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-auto"
            >
              <option value="VIEW">Can view</option>
              <option value="EDIT">Can edit</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Sharing…" : "Share"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Users className="h-3.5 w-3.5" />
            People with access
          </h3>
          {loadingList ? (
            <div className="flex items-center gap-2 py-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : shares.length === 0 ? (
            <p className="py-1 text-sm text-slate-400">Only you have access right now.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {shares.map((s) => (
                <li key={s.userId} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <Avatar name={s.name ?? "?"} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-800">{s.name}</span>
                    <span className="block truncate text-xs text-slate-400">{s.email}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.permission === "EDIT" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {s.permission === "EDIT" ? "Can edit" : "Can view"}
                  </span>
                  <button
                    onClick={() => handleRevoke(s.userId)}
                    className="shrink-0 text-xs text-slate-400 transition hover:text-red-600"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
