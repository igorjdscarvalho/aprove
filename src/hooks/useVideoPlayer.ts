import { useCallback, useEffect, useState, type RefObject } from 'react';
import { savePlayerPrefs, type PlayerSource } from '@/lib/playerSource';

export interface PlayerState {
  paused: boolean;
  current: number;
  duration: number;
  volume: number;
  muted: boolean;
}

const INITIAL: PlayerState = { paused: true, current: 0, duration: 0, volume: 1, muted: true };
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/**
 * Lê o estado da fonte (<video> ou SimVideo) a cada quadro e expõe as ações do HUD.
 * Ler por quadro (em vez de ouvir eventos) faz o mesmo código servir às duas fontes.
 */
export function useVideoPlayer(ref: RefObject<PlayerSource | null>) {
  const [state, setState] = useState<PlayerState>(INITIAL);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const m = ref.current;
      if (m) {
        const duration = Number.isFinite(m.duration) ? m.duration : 0;
        setState((prev) =>
          prev.paused === m.paused &&
          Math.abs(prev.current - m.currentTime) < 0.04 &&
          prev.duration === duration &&
          prev.volume === m.volume &&
          prev.muted === m.muted
            ? prev
            : { paused: m.paused, current: m.currentTime, duration, volume: m.volume, muted: m.muted },
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref]);

  const play = useCallback(() => {
    const m = ref.current;
    if (m) void Promise.resolve(m.play()).catch(() => undefined);
  }, [ref]);

  const pause = useCallback(() => ref.current?.pause(), [ref]);

  const toggle = useCallback(() => {
    const m = ref.current;
    if (!m) return;
    if (m.paused) play();
    else m.pause();
  }, [ref, play]);

  const seek = useCallback(
    (t: number) => {
      const m = ref.current;
      if (!m) return;
      const d = Number.isFinite(m.duration) ? m.duration : 0;
      m.currentTime = Math.max(0, Math.min(t, d));
    },
    [ref],
  );

  const skip = useCallback((delta: number) => seek((ref.current?.currentTime ?? 0) + delta), [ref, seek]);

  const setVolume = useCallback(
    (x: number) => {
      const m = ref.current;
      if (!m) return;
      m.volume = clamp01(x);
      m.muted = m.volume === 0;
      savePlayerPrefs({ volume: m.volume, muted: m.muted });
    },
    [ref],
  );

  const toggleMute = useCallback(() => {
    const m = ref.current;
    if (!m) return;
    m.muted = !m.muted;
    if (!m.muted && m.volume === 0) m.volume = 0.5;
    savePlayerPrefs({ volume: m.volume, muted: m.muted });
  }, [ref]);

  return { state, play, pause, toggle, seek, skip, setVolume, toggleMute };
}
