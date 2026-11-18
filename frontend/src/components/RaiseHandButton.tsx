"use client";

import { useDataChannel } from "@livekit/components-react";
import { useState } from "react";

export const HAND_TOPIC = "raise-hand";
const encoder = new TextEncoder();

export default function RaiseHandButton({ onStage }: { onStage: boolean }) {
  const [raised, setRaised] = useState(false);
  const [prevOnStage, setPrevOnStage] = useState(onStage);
  const { send, isSending } = useDataChannel(HAND_TOPIC);

  // Begitu dinaikkan ke panggung, tangan otomatis turun.
  if (onStage !== prevOnStage) {
    setPrevOnStage(onStage);
    if (onStage) setRaised(false);
  }

  if (onStage) {
    return <span className="rounded-lg bg-emerald-600/20 px-3 py-2 text-sm text-emerald-300">Kamu sedang bertanya</span>;
  }

  async function toggle() {
    const next = !raised;
    await send(encoder.encode(JSON.stringify({ raised: next })), { reliable: true });
    setRaised(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isSending}
      aria-pressed={raised}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
        raised ? "bg-amber-500 text-zinc-950 hover:bg-amber-400" : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
      }`}
    >
      {raised ? "✋ Turunkan tangan" : "✋ Angkat tangan"}
    </button>
  );
}
