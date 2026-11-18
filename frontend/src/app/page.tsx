import EnterRoomForm from "@/components/EnterRoomForm";

const roles = [
  {
    name: "Host",
    detail: "Mengajar di panggung dengan kamera, mic, dan share screen, lalu memilih siapa yang boleh bertanya.",
  },
  {
    name: "Co-host",
    detail: "Ikut tampil di panggung untuk membantu host, misalnya membawakan materi atau demo.",
  },
  {
    name: "Peserta",
    detail: "Menyimak, menulis di chat, dan mengangkat tangan saat ingin bertanya langsung.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="papan-tulis flex min-h-[72vh] flex-col px-5 pt-6 pb-14 sm:px-10 lg:px-16">
        <p className="text-sm font-semibold tracking-tight text-kapur">
          <span className="denyut-live mr-2 inline-block size-2 rounded-full bg-tinta-merah align-middle" aria-hidden />
          Kelas Live
        </p>
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 pt-12">
          <h1 className="max-w-3xl font-kapur text-6xl leading-[0.95] text-kapur sm:text-7xl lg:text-8xl">
            Hari ini kita belajar apa?
          </h1>
          <EnterRoomForm />
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-10 lg:px-0">
        <h2 className="text-lg font-semibold">Siapa saja yang ada di kelas</h2>
        <dl className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-3">
          {roles.map((role) => (
            <div key={role.name} className="border-t-2 border-tinta pt-4">
              <dt className="font-semibold">{role.name}</dt>
              <dd className="mt-1.5 leading-relaxed text-tinta-redup">{role.detail}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
