"use client";

import { useDataChannel, useParticipants } from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { useCallback, useState } from "react";
import { updateParticipant } from "@/lib/api";
import { HAND_TOPIC } from "./RaiseHandButton";

const decoder = new TextDecoder();

export const roleOf = (p: Participant) => p.attributes?.role ?? "VIEWER";

/** Daftar identity peserta yang sedang mengangkat tangan (diterima lewat data channel). */
export function useRaisedHands() {
  const [hands, setHands] = useState<ReadonlySet<string>>(new Set());

  const update = useCallback((identity: string, raised: boolean) => {
    setHands((prev) => {
      if (prev.has(identity) === raised) return prev;
      const next = new Set(prev);
      if (raised) next.add(identity);
      else next.delete(identity);
      return next;
    });
  }, []);

  useDataChannel(HAND_TOPIC, (msg) => {
    const identity = msg.from?.identity;
    if (!identity) return;
    try {
      const { raised } = JSON.parse(decoder.decode(msg.payload)) as { raised: boolean };
      update(identity, raised);
    } catch {
      // abaikan pesan yang tidak valid
    }
  });

  return { hands, lower: (identity: string) => update(identity, false) };
}

export default function HostPanel({
  room,
  hostToken,
  hands,
  lower,
}: {
  room: string;
  hostToken: string;
  hands: ReadonlySet<string>;
  lower: (identity: string) => void;
}) {
  const participants = useParticipants();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(p: Participant, action: "promote" | "demote") {
    setBusy(p.identity);
    setError(null);
    try {
      await updateParticipant(room, p.identity, action, hostToken);
      if (action === "promote") lower(p.identity);
    } catch (err) {
      const who = p.name || p.identity;
      setError(`${action === "promote" ? "Gagal mengizinkan" : "Gagal menghentikan"} ${who}: ${err instanceof Error ? err.message : "coba lagi"}`);
    } finally {
      setBusy(null);
    }
  }

  const remote = participants.filter((p) => !p.isLocal);
  const raised = remote.filter((p) => roleOf(p) === "VIEWER" && hands.has(p.identity));
  const speakers = remote.filter((p) => roleOf(p) === "SPEAKER");

  const row = (p: Participant, action: "promote" | "demote") => (
    <li key={p.identity} className="flex items-center justify-between gap-3 py-2.5">
      <span className="min-w-0 truncate">{p.name || p.identity}</span>
      <button
        type="button"
        disabled={busy === p.identity}
        onClick={() => act(p, action)}
        className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
          action === "promote"
            ? "bg-pensil text-tinta hover:bg-pensil-tekan"
            : "border border-kapur/30 text-kapur hover:bg-kapur/10"
        }`}
      >
        {busy === p.identity ? "…" : action === "promote" ? "Izinkan bicara" : "Selesai"}
      </button>
    </li>
  );

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-4">
      <section>
        <h2 className="font-semibold">Mengangkat tangan</h2>
        {raised.length === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-kapur-redup">
            Belum ada yang mengangkat tangan. Peserta yang ingin bertanya akan muncul di sini.
          </p>
        ) : (
          <ul className="mt-1 divide-y divide-kapur/10">{raised.map((p) => row(p, "promote"))}</ul>
        )}
      </section>

      {speakers.length > 0 && (
        <section>
          <h2 className="font-semibold">Sedang bicara</h2>
          <ul className="mt-1 divide-y divide-kapur/10">{speakers.map((p) => row(p, "demote"))}</ul>
        </section>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-tinta-merah/15 px-3 py-2 text-sm text-[#f3a497]">
          {error}
        </p>
      )}
    </div>
  );
}
