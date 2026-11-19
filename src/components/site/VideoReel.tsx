"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { Video } from "@/content/media";

/**
 * Vidéo verticale muette, lue en boucle uniquement quand elle est visible à l'écran
 * (rien n'est téléchargé avant : preload="none" + affiche). Si le visiteur a demandé
 * moins d'animations, elle reste à l'arrêt et se lance avec le bouton.
 */
export function VideoReel({ video, className = "" }: { video: Video; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || userPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [userPaused]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      setUserPaused(false);
      el.play().catch(() => {});
    } else {
      setUserPaused(true);
      el.pause();
    }
  };

  return (
    <figure className={`relative overflow-hidden rounded-xl bg-ink-2 ${className}`}>
      <video
        ref={ref}
        src={video.src}
        poster={video.poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={video.title}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="aspect-[9/16] w-full object-cover"
      />
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/90 to-transparent p-4 pr-16 text-sm text-paper">
        {video.title}
      </figcaption>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Mettre la vidéo en pause" : "Lire la vidéo"}
        className="absolute bottom-3 right-3 flex size-11 items-center justify-center rounded-full bg-paper/90 text-ink transition-colors hover:bg-paper"
      >
        {playing ? <Pause className="size-5" /> : <Play className="size-5 translate-x-px" />}
      </button>
    </figure>
  );
}
