"use client";

import { useDataChannel, useParticipants } from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { useState } from "react";
import { updateParticipant } from "@/lib/api";
import { HAND_TOPIC } from "./RaiseHandButton";

const decoder = new TextDecoder();

const roleOf = (p: Participant) => p.attributes?.role ?? "VIEWER";

export default function HostPanel({ room, hostToken }: { room: string; hostToken: string }) {
  const participants = useParticipants();
  const [hands, setHands] = useState<ReadonlySet<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useDataChannel(HAND_TOPIC, (msg) => {
    const identity = msg.from?.identity;
    if (!identity) return;
    try {
      const { raised } = JSON.parse(decoder.decode(msg.payload)) as { raised: boolean };
      setHands((prev) => {
        const next = new Set(prev);
        if (raised) next.add(identity);
        else next.delete(identity);
        return next;
      });
    } catch {
      // abaikan pesan yang tidak valid
    }
  });

  async function act(identity: string, action: "promote" | "demote") {
    setBusy(identity);
    setError(null);
    try {
      await updateParticipant(room, identity, action, hostToken);
      if (action === "promote") {
        setHands((prev) => {
          const next = new Set(prev);
          next.delete(identity);
          return next;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah peserta");
    } finally {
      setBusy(null);
    }
  }

  const remote = participants.filter((p) => !p.isLocal);
  const raised = remote.filter((p) => roleOf(p) === "VIEWER" && hands.has(p.identity));
  const speakers = remote.filter((p) => roleOf(p) === "SPEAKER");

  const row = (p: Participant, action: "promote" | "demote") => (
    <li key={p.identity} className="flex items-center justify-between gap-2 py-1.5">
      <span className="truncate text-sm">{p.name || p.identity}</span>
      <button
        type="button"
        disabled={busy === p.identity}
        onClick={() => act(p.identity, action)}
        className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
          action === "promote" ? "bg-indigo-600 hover:bg-indigo-500" : "bg-zinc-700 hover:bg-zinc-600"
        }`}
      >
        {action === "promote" ? "Izinkan bicara" : "Selesai"}
      </button>
    </li>
  );

  return (
    <section className="flex flex-col gap-3 border-b border-zinc-800 p-3 text-zinc-100">
      <div>
        <h2 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">Angkat tangan ({raised.length})</h2>
        {raised.length === 0 ? (
          <p className="py-1.5 text-sm text-zinc-500">Belum ada yang bertanya</p>
        ) : (
          <ul>{raised.map((p) => row(p, "promote"))}</ul>
        )}
      </div>
      {speakers.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">Sedang bertanya</h2>
          <ul>{speakers.map((p) => row(p, "demote"))}</ul>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    </section>
  );
}
