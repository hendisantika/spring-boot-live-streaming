"use client";

import { useChat } from "@livekit/components-react";
import { useEffect, useRef, useState } from "react";

const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

export default function ChatPanel() {
  const { send, chatMessages, isSending } = useChat();
  const [text, setText] = useState("");
  const listRef = useRef<HTMLOListElement>(null);

  // Pesan baru: gulir ke bawah
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [chatMessages.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (!message) return;
    await send(message);
    setText("");
  }

  return (
    <div className="flex h-full flex-col">
      {chatMessages.length === 0 ? (
        <p className="flex-1 px-4 py-4 text-sm leading-relaxed text-kapur-redup">
          Belum ada pesan. Sapa kelas atau tulis pertanyaanmu di sini.
        </p>
      ) : (
        <ol ref={listRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4" aria-live="polite">
          {chatMessages.map((msg) => {
            const mine = msg.from?.isLocal ?? false;
            return (
              <li key={msg.id} className={`flex max-w-[85%] flex-col gap-1 ${mine ? "items-end self-end" : "items-start"}`}>
                <span className="text-xs text-kapur-redup">
                  {mine ? "Kamu" : msg.from?.name || msg.from?.identity || "Seseorang"}
                  <span className="ml-1.5 opacity-70">{timeFormat.format(msg.timestamp)}</span>
                </span>
                <p
                  className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words ${
                    mine ? "rounded-br-sm bg-pensil text-tinta" : "rounded-bl-sm bg-papan-terang text-kapur"
                  }`}
                >
                  {msg.message}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      <form onSubmit={submit} className="flex gap-2 border-t border-kapur/10 p-3">
        <label htmlFor="chat-input" className="sr-only">
          Pesan
        </label>
        <input
          id="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis pesan…"
          maxLength={500}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-full border border-kapur/15 bg-papan px-4 py-2.5 text-sm text-kapur placeholder:text-kapur-redup focus:border-pensil focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSending || !text.trim()}
          className="shrink-0 rounded-full bg-pensil px-4 py-2.5 text-sm font-semibold text-tinta transition-colors hover:bg-pensil-tekan disabled:opacity-40"
        >
          Kirim
        </button>
      </form>
    </div>
  );
}
