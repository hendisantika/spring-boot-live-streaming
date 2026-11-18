"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROOM_PATTERN } from "@/lib/api";

export default function EnterRoomForm() {
  const router = useRouter();
  const [room, setRoom] = useState("");
  const valid = ROOM_PATTERN.test(room);

  return (
    <form
      className="flex w-full flex-col gap-3 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) router.push(`/room/${room}`);
      }}
    >
      <label className="sr-only" htmlFor="room">
        Nama kelas
      </label>
      <input
        id="room"
        value={room}
        onChange={(e) => setRoom(e.target.value.trim())}
        placeholder="mis. matematika-kelas-7"
        className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <button
        type="submit"
        disabled={!valid}
        className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Masuk kelas
      </button>
    </form>
  );
}
