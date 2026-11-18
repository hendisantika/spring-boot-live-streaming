"use client";

import {
  CarouselLayout,
  FocusLayout,
  GridLayout,
  ParticipantTile,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";

/** Panggung: share screen diprioritaskan, kamera host/co-host/penanya di bawahnya. */
export default function Stage() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const screen = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameras = tracks.filter((t) => t.source === Track.Source.Camera);

  if (tracks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-400">
        Menunggu host memulai kamera atau share screen…
      </div>
    );
  }

  if (screen) {
    return (
      <div className="flex h-full flex-col gap-2">
        <div className="min-h-0 flex-1">
          <FocusLayout trackRef={screen} />
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
