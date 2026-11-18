"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROOM_PATTERN } from "@/lib/api";

export default function EnterRoomForm() {
  const router = useRouter();
  const [room, setRoom] = useState("");
  const [touched, setTouched] = useState(false);
  const valid = ROOM_PATTERN.test(room);
  const showError = touched && !valid;

  return (
    <form
      className="flex w-full max-w-xl flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (valid) router.push(`/room/${room}`);
      }}
    >
      <label htmlFor="room" className="text-sm text-kapur-redup">
        Nama kelas
      </label>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <input
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value.trim())}
          onBlur={() => room.length > 0 && setTouched(true)}
          placeholder="matematika-kelas-7"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={showError}
          aria-describedby="room-hint"
          className="garis-kapur flex-1 px-1 pb-2 font-kapur text-4xl text-kapur placeholder:text-kapur/30 sm:text-5xl"
        />
        <button
          type="submit"
          className="rounded-full bg-pensil px-7 py-3.5 font-semibold text-tinta transition-colors hover:bg-pensil-tekan"
        >
          Masuk kelas
        </button>
      </div>
      <p id="room-hint" className={`text-sm ${showError ? "text-[#f3a497]" : "text-kapur-redup"}`}>
        {showError
          ? room.length === 0
            ? "Tulis nama kelas dulu, misalnya matematika-kelas-7."
            : "Pakai huruf, angka, tanda - atau _ saja, tanpa spasi."
          : "Semua orang yang memasukkan nama kelas yang sama akan berada di ruang yang sama."}
      </p>
    </form>
  );
}
