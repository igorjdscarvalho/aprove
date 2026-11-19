import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

interface Options {
  /** Muda quando o story muda: reinicia a barra. */
  storyKey: string;
  /** Duração do story de imagem, em segundos. */
  seconds: number;
  /** <video> do story, quando for vídeo (a barra segue o `currentTime`). */
  videoRef: RefObject<HTMLVideoElement | null>;
  paused: boolean;
  onEnd: () => void;
}

/** Barra de progresso do story: requestAnimationFrame para imagem; `currentTime` para vídeo. */
export function useStoryTimer({ storyKey, seconds, videoRef, paused, onEnd }: Options) {
  const [progress, setProgress] = useState(0);
  const elapsed = useRef(0);
  const pausedRef = useRef(paused);
  const endRef = useRef(onEnd);
  pausedRef.current = paused;
  endRef.current = onEnd;

  useEffect(() => {
    elapsed.current = 0;
    setProgress(0);
    let last = 0;
    let raf = 0;

    const loop = (t: number) => {
      const dt = last ? Math.min(0.25, (t - last) / 1000) : 0; // aba em segundo plano não "pula" o story
      last = t;
      const v = videoRef.current;
      let dur = seconds;

      if (v) {
        if (Number.isFinite(v.duration) && v.duration > 0) dur = v.duration;
        if (pausedRef.current) {
          if (!v.paused) v.pause();
        } else if (v.paused && !v.ended) {
          void v.play().catch(() => undefined);
        }
        elapsed.current = v.currentTime;
        if (v.ended) return endRef.current();
      } else if (!pausedRef.current) {
        elapsed.current += dt;
      }

      setProgress(Math.min(1, elapsed.current / dur));
      if (!v && elapsed.current >= dur) return endRef.current();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [storyKey, seconds, videoRef]);

  const restart = useCallback(() => {
    elapsed.current = 0;
    setProgress(0);
    if (videoRef.current) videoRef.current.currentTime = 0;
  }, [videoRef]);

  return { progress, restart };
}
