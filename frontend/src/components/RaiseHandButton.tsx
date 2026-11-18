"use client";

import { useDataChannel } from "@livekit/components-react";
import { useState } from "react";
import { HandIcon, MicIcon } from "./icons";

export const HAND_TOPIC = "raise-hand";
const encoder = new TextEncoder();

export default function RaiseHandButton({ onStage }: { onStage: boolean }) {
  const [raised, setRaised] = useState(false);
  const [prevOnStage, setPrevOnStage] = useState(onStage);
  const { send, isSending } = useDataChannel(HAND_TOPIC);

  // Begitu diizinkan bicara, tangan otomatis turun.
  if (onStage !== prevOnStage) {
    setPrevOnStage(onStage);
    if (onStage) setRaised(false);
  }

  if (onStage) {
    return (
      <p className="flex items-center gap-2 rounded-full bg-pensil/15 px-4 py-2.5 text-sm text-pensil">
        <MicIcon className="text-base" />
        Host mengizinkan kamu bicara. Nyalakan mic di sebelah kanan.
      </p>
    );
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
      className={`flex items-center gap-2.5 rounded-full px-6 py-3 font-semibold transition-colors disabled:opacity-60 ${
        raised
          ? "border-2 border-pensil bg-transparent text-pensil hover:bg-pensil/10"
          : "bg-pensil text-tinta hover:bg-pensil-tekan"
      }`}
    >
      <HandIcon className="text-xl" />
      {raised ? "Turunkan tangan" : "Angkat tangan"}
    </button>
  );
}
