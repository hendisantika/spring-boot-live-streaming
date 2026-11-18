import EnterRoomForm from "@/components/EnterRoomForm";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Kelas Live</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Masukkan nama kelas. Huruf, angka, tanda <code>-</code> dan <code>_</code>, tanpa spasi.
        </p>
      </div>
      <EnterRoomForm />
    </main>
  );
}
