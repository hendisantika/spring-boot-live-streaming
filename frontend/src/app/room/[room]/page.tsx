import { Suspense } from "react";
import ClassRoom from "@/components/ClassRoom";

export default function RoomPage({ params }: PageProps<"/room/[room]">) {
  return (
    <Suspense fallback={<p className="p-6 text-zinc-500">Memuat kelas…</p>}>
      <ClassRoom params={params} />
    </Suspense>
  );
}
