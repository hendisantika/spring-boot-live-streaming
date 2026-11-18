"use client";

import Link from "next/link";
import { useState } from "react";
import { fetchToken, makeIdentity, type Role, type Session } from "@/lib/api";

const ROLE_OPTIONS: { value: Role; label: string; hint: string }[] = [
  { value: "VIEWER", label: "Peserta", hint: "Menyimak, chat, dan angkat tangan untuk bertanya" },
  { value: "CO_HOST", label: "Co-host", hint: "Tampil di panggung membantu host" },
  { value: "HOST", label: "Host", hint: "Mengajar dan mengatur siapa yang boleh bicara" },
];

const fieldClass =
  "w-full rounded-lg border border-kertas-garis bg-white px-3.5 py-3 text-tinta outline-none transition-colors focus:border-papan focus:ring-2 focus:ring-papan/15";

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
  const needsKey = role !== "VIEWER";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const trimmed = name.trim();
      onJoined(await fetchToken(room, { identity: makeIdentity(trimmed), name: trimmed, role }, hostKey));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal bergabung. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid flex-1 lg:grid-cols-[1.1fr_1fr]">
      <section className="papan-tulis flex flex-col justify-between gap-10 px-5 py-6 sm:px-10 lg:px-14 lg:py-10">
        <Link href="/" className="w-fit text-sm font-semibold text-kapur hover:text-pensil">
          Kelas Live
        </Link>
        <div className="pb-4 lg:pb-16">
          <p className="text-sm text-kapur-redup">Kamu akan masuk ke kelas</p>
          <h1 className="mt-2 font-kapur text-5xl leading-none break-all text-kapur sm:text-6xl lg:text-7xl">{room}</h1>
        </div>
      </section>

      <section className="flex items-center px-5 py-10 sm:px-10 lg:px-14">
        <form onSubmit={submit} className="mx-auto flex w-full max-w-md flex-col gap-7">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="font-semibold">
              Nama kamu
            </label>
            <input
              id="name"
              required
              maxLength={100}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama yang terlihat di kelas"
              className={fieldClass}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-semibold">Masuk sebagai</legend>
            {ROLE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors ${
                  role === option.value ? "border-papan bg-papan/5" : "border-kertas-garis bg-white hover:border-tinta-redup"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                  className="mt-1 accent-[var(--papan)]"
                />
                <span>
                  <span className="block font-medium">{option.label}</span>
                  <span className="block text-sm text-tinta-redup">{option.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {needsKey && (
            <div className="flex flex-col gap-2">
              <label htmlFor="host-key" className="font-semibold">
                Host key
              </label>
              <input
                id="host-key"
                required
                type="password"
                autoComplete="off"
                value={hostKey}
                onChange={(e) => setHostKey(e.target.value)}
                className={fieldClass}
              />
              <p className="text-sm text-tinta-redup">Minta ke pengelola kelas kalau kamu belum punya.</p>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-lg border border-tinta-merah/40 bg-tinta-merah/10 px-3.5 py-3 text-sm text-[#9b2f20]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || (needsKey && !hostKey)}
            className="rounded-full bg-papan px-6 py-3.5 font-semibold text-kapur transition-colors hover:bg-papan-gelap disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Menghubungkan…" : "Gabung ke kelas"}
          </button>
        </form>
      </section>
    </main>
  );
}
