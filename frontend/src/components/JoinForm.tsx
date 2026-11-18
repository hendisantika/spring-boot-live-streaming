"use client";

import { useState } from "react";
import { fetchToken, makeIdentity, type Role, type Session } from "@/lib/api";

const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export default function JoinForm({
  room,
  initialError,
  onJoined,
}: {
  room: string;
  initialError?: string | null;
  onJoined: (s: Session) => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("VIEWER");
  const [hostKey, setHostKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const trimmed = name.trim();
      onJoined(await fetchToken(room, { identity: makeIdentity(trimmed), name: trimmed, role }, hostKey));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal bergabung");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-zinc-500">Kelas</p>
          <h1 className="text-2xl font-semibold break-all">{room}</h1>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Nama kamu
          <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Masuk sebagai
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputClass}>
            <option value="VIEWER">Peserta</option>
            <option value="CO_HOST">Co-host</option>
            <option value="HOST">Host</option>
          </select>
        </label>

        {role !== "VIEWER" && (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Host key
            <input
              required
              type="password"
              autoComplete="off"
              value={hostKey}
              onChange={(e) => setHostKey(e.target.value)}
              className={inputClass}
            />
          </label>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Menghubungkan…" : "Gabung"}
        </button>
      </form>
    </main>
  );
}
