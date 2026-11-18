"use client";

import {
  CarouselLayout,
  GridLayout,
  isTrackReference,
  ParticipantTile,
  type TrackReference,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { ScreenIcon } from "./icons";

/** Tile share screen dengan label berbahasa Indonesia (bawaan LiveKit: "<nama>'s screen"). */
function ScreenShareTile({ trackRef }: { trackRef: TrackReference }) {
  const owner = trackRef.participant.name || trackRef.participant.identity;
  return (
    <div className="relative h-full overflow-hidden rounded-2xl border border-kapur/10 bg-black">
      <VideoTrack trackRef={trackRef} className="h-full w-full object-contain" />
      <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-papan-gelap/85 px-2.5 py-1 text-sm text-kapur">
        <ScreenIcon />
        Layar {owner}
      </span>
    </div>
  );
}

/** Panggung: share screen diprioritaskan, kamera host/co-host/penanya di bawahnya. */
export default function Stage({ isPresenter }: { isPresenter: boolean }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const screen = tracks.filter(isTrackReference).find((t) => t.source === Track.Source.ScreenShare);
  const cameras = tracks.filter((t) => t.source === Track.Source.Camera);

  if (tracks.length === 0) {
    return (
      <div className="papan-tulis flex h-full flex-col items-center justify-center gap-3 rounded-2xl px-6 text-center">
        <p className="font-kapur text-4xl text-kapur sm:text-5xl">
          {isPresenter ? "Panggung masih kosong" : "Kelas belum dimulai"}
        </p>
        <p className="max-w-sm text-kapur-redup">
          {isPresenter
            ? "Nyalakan kamera atau share screen dari tombol di bawah untuk mulai mengajar."
            : "Panggung akan tampil begitu host menyalakan kamera atau share screen."}
        </p>
      </div>
    );
  }

  if (screen) {
    return (
      <div className="flex h-full flex-col gap-2">
        <div className="min-h-0 flex-1">
          <ScreenShareTile trackRef={screen} />
        </div>
        {cameras.length > 0 && (
          <div className="h-28 shrink-0 sm:h-36">
            <CarouselLayout tracks={cameras} orientation="horizontal">
              <ParticipantTile />
            </CarouselLayout>
          </div>
        )}
      </div>
    );
  }

  return (
    <GridLayout tracks={cameras} className="h-full">
      <ParticipantTile />
    </GridLayout>
  );
}
