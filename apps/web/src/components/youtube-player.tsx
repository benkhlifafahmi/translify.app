"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/** Imperative handle the watch page uses to deep-link from a chat citation. */
export interface YouTubePlayerHandle {
  seekTo: (seconds: number) => void;
}

// Minimal slice of the YouTube IFrame Player API we actually use, typed so we
// avoid `any` while not pulling in the full @types/youtube surface.
interface YTPlayer {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  destroy: () => void;
}

interface YTPlayerOptions {
  videoId: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, string | number>;
}

interface YTNamespace {
  Player: new (el: HTMLElement, opts: YTPlayerOptions) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const API_SRC = "https://www.youtube.com/iframe_api";

/** Run `cb` once the IFrame API is ready, loading the script on first use.
 *  Chains any existing ready-handler so multiple players can coexist. */
function whenApiReady(cb: () => void): void {
  if (typeof window === "undefined") return;
  if (window.YT?.Player) {
    cb();
    return;
  }
  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    prev?.();
    cb();
  };
  if (!document.getElementById("youtube-iframe-api")) {
    const tag = document.createElement("script");
    tag.id = "youtube-iframe-api";
    tag.src = API_SRC;
    document.body.appendChild(tag);
  }
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, { videoId: string }>(
  function YouTubePlayer({ videoId }, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<YTPlayer | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        seekTo: (seconds: number) => {
          playerRef.current?.seekTo(Math.max(0, seconds), true);
          playerRef.current?.playVideo();
        },
      }),
      [],
    );

    useEffect(() => {
      let cancelled = false;
      let pollId: number | undefined;

      const create = () => {
        if (cancelled || !hostRef.current || !window.YT?.Player) return;
        playerRef.current?.destroy();
        // The API replaces the passed element with the <iframe>, so mount a
        // throwaway child to be replaced (keeps hostRef stable across re-creates).
        const mount = document.createElement("div");
        hostRef.current.innerHTML = "";
        hostRef.current.appendChild(mount);
        playerRef.current = new window.YT.Player(mount, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        });
      };

      whenApiReady(create);
      // Fallback poll in case the global ready-handler was consumed before ours.
      if (!window.YT?.Player) {
        pollId = window.setInterval(() => {
          if (window.YT?.Player) {
            window.clearInterval(pollId);
            create();
          }
        }, 200);
      }

      return () => {
        cancelled = true;
        if (pollId) window.clearInterval(pollId);
        playerRef.current?.destroy();
        playerRef.current = null;
      };
    }, [videoId]);

    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-[var(--shadow-paper)]">
        <div
          ref={hostRef}
          className="absolute inset-0 [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:h-full [&>iframe]:w-full"
        />
      </div>
    );
  },
);
