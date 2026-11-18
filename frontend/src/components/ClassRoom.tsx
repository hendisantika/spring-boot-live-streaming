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
import HostPanel, { useRaisedHands } from "./HostPanel";
import { ChatIcon, HandIcon, UsersIcon } from "./icons";
import JoinForm from "./JoinForm";
import RaiseHandButton from "./RaiseHandButton";
import Stage from "./Stage";

export default function ClassRoom({ params }: { params: Promise<{ room: string }> }) {
  const { room } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  if (!ROOM_PATTERN.test(room)) {
    return (
      <main className="papan-tulis flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-kapur text-5xl">Nama kelas tidak valid</p>
        <p className="text-kapur-redup">Pakai huruf, angka, tanda - atau _ saja, tanpa spasi.</p>
      </main>
    );
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
        setConnectionError(`Tidak bisa terhubung ke server kelas: ${err.message}`);
        setSession(null);
      }}
      data-lk-theme="default"
      className="flex h-dvh flex-col text-kapur"
    >
      <RoomView session={session} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

type Tab = "chat" | "qna";

function RoomView({ session }: { session: Session }) {
  const participants = useParticipants();
  const permissions = useLocalParticipantPermissions();
  const canPublish = permissions?.canPublish ?? session.role !== "VIEWER";
  const isPresenter = session.role !== "VIEWER";
  const isHost = session.role === "HOST";
  const { hands, lower } = useRaisedHands();
  const [tab, setTab] = useState<Tab>("chat");
  const raisedCount = hands.size;

  return (
    <>
      <header className="flex items-center gap-4 border-b border-kapur/10 px-4 py-3 sm:px-6">
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-tinta-merah px-2.5 py-1 text-xs font-bold text-kapur">
          <span className="denyut-live size-1.5 rounded-full bg-kapur" aria-hidden />
          Live
        </span>
        <h1 className="min-w-0 flex-1 truncate font-kapur text-3xl leading-none">{session.room}</h1>
        <span className="hidden items-center gap-1.5 text-sm text-kapur-redup sm:flex" title="Jumlah orang di kelas">
          <UsersIcon className="text-base" />
          {participants.length}
        </span>
        <span className="rounded-full border border-kapur/25 px-3 py-1 text-sm">{ROLE_LABEL[session.role]}</span>
        <StartAudio label="Aktifkan suara" className="lk-button" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="min-h-[42vh] flex-1 p-3 sm:p-4">
          <Stage isPresenter={isPresenter} />
        </main>

        <aside className="flex h-[42vh] flex-col border-t border-kapur/10 bg-papan-gelap lg:h-auto lg:w-[22rem] lg:border-t-0 lg:border-l">
          {isHost ? (
            <div role="tablist" aria-label="Panel samping" className="flex border-b border-kapur/10">
              <TabButton active={tab === "chat"} onClick={() => setTab("chat")} icon={<ChatIcon />}>
                Chat
              </TabButton>
              <TabButton active={tab === "qna"} onClick={() => setTab("qna")} icon={<HandIcon />}>
                Tanya jawab
                {raisedCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-pensil px-1.5 text-xs font-bold text-tinta">{raisedCount}</span>
                )}
              </TabButton>
            </div>
          ) : (
            <h2 className="flex items-center gap-2 border-b border-kapur/10 px-4 py-3 font-semibold">
              <ChatIcon /> Chat
            </h2>
          )}

          {/* Keduanya tetap ter-mount agar riwayat chat & daftar angkat tangan tidak hilang saat pindah tab */}
          <div className={`min-h-0 flex-1 ${isHost && tab !== "chat" ? "hidden" : ""}`}>
            <Chat />
          </div>
          {isHost && (
            <div className={`min-h-0 flex-1 ${tab !== "qna" ? "hidden" : ""}`}>
              <HostPanel room={session.room} hostToken={session.token} hands={hands} lower={lower} />
            </div>
          )}
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-3 border-t border-kapur/10 px-3 py-3">
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

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
        active ? "border-pensil text-kapur" : "border-transparent text-kapur-redup hover:text-kapur"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
