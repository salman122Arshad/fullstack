"use client";

import { useEffect, useState } from "react";

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
    await fetch(`/api/documents/${documentId}/share`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setShares((prev) => prev.filter((s) => s.userId !== userId));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Share document</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleShare} className="mb-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="email"
              required
              placeholder="teammate@docdocs.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as "VIEW" | "EDIT")}
              className="rounded-md border border-slate-300 px-2 py-2 text-sm"
            >
              <option value="VIEW">Can view</option>
              <option value="EDIT">Can edit</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Sharing…" : "Share"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">People with access</h3>
          {loadingList ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : shares.length === 0 ? (
            <p className="text-sm text-slate-400">Only you have access right now.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {shares.map((s) => (
                <li key={s.userId} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                  <span>
                    <span className="block font-medium text-slate-800">{s.name}</span>
                    <span className="block text-xs text-slate-400">{s.email}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{s.permission === "EDIT" ? "Can edit" : "Can view"}</span>
                    <button onClick={() => handleRevoke(s.userId)} className="text-xs text-red-500 hover:underline">
                      Remove
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
