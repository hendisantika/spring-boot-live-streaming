"use client";

import "@livekit/components-styles";
import {
  Chat,
  ControlBar,
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  useLocalParticipantPermissions,
  useParticipants,
} from "@livekit/components-react";
import { use, useState } from "react";
import { ROLE_LABEL, ROOM_PATTERN, type Session } from "@/lib/api";
import HostPanel from "./HostPanel";
import JoinForm from "./JoinForm";
import RaiseHandButton from "./RaiseHandButton";
import Stage from "./Stage";

export default function ClassRoom({ params }: { params: Promise<{ room: string }> }) {
  const { room } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  if (!ROOM_PATTERN.test(room)) {
    return <p className="p-6">Nama kelas tidak valid.</p>;
  }

  if (!session) {
    return (
      <JoinForm
        room={room}
        initialError={connectionError}
        onJoined={(s) => {
          setConnectionError(null);
          setSession(s);
        }}
      />
    );
  }

  return (
    <LiveKitRoom
      serverUrl={session.serverUrl}
      token={session.token}
      connect
      audio={false}
      video={false}
      onDisconnected={() => setSession(null)}
      onError={(err) => {
        setConnectionError(`Tidak bisa terhubung ke server live: ${err.message}`);
        setSession(null);
      }}
      data-lk-theme="default"
      className="flex h-dvh flex-col"
    >
      <RoomView session={session} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function RoomView({ session }: { session: Session }) {
  const participants = useParticipants();
  const permissions = useLocalParticipantPermissions();
  const canPublish = permissions?.canPublish ?? session.role !== "VIEWER";
  const isPresenter = session.role !== "VIEWER";

  return (
    <>
      <header className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-2.5 text-zinc-100">
        <div className="min-w-0">
          <h1 className="truncate font-semibold">{session.room}</h1>
          <p className="text-xs text-zinc-400">
            {ROLE_LABEL[session.role]} · {participants.length} orang
          </p>
        </div>
        <StartAudio label="Aktifkan suara" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="min-h-[40vh] flex-1 p-2">
          <Stage />
        </main>
        <aside className="flex h-[45vh] flex-col border-t border-zinc-800 lg:h-auto lg:w-80 lg:border-t-0 lg:border-l">
          {session.role === "HOST" && <HostPanel room={session.room} hostToken={session.token} />}
          <Chat className="min-h-0 flex-1" />
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-2 border-t border-zinc-800 p-2">
        {!isPresenter && <RaiseHandButton onStage={canPublish} />}
        <ControlBar
          variation="minimal"
          controls={{
            microphone: canPublish,
            camera: canPublish,
            screenShare: isPresenter,
            chat: false,
            settings: false,
            leave: true,
          }}
        />
      </footer>
    </>
  );
}
