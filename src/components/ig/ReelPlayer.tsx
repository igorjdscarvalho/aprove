import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { loadPlayerPrefs, type PlayerSource } from '@/lib/playerSource';
import { mediaSrc } from '@/lib/mediaSrc';
import { SimVideo } from '@/lib/simVideo';
import type { Post } from '@/types/domain';
import { PlayIcon } from './icons';
import { PlayerHUD } from './PlayerHUD';

const HUD_IDLE_MS = 2500;
const SKIP_SECONDS = 5;

// Reels com HUD próprio (RF-C5). Usa o <video> real quando o post tem arquivo;
// sem arquivo (dados de exemplo) usa o vídeo simulado em canvas.
export function ReelPlayer({ post }: { post: Post }) {
  const media = post.media[0];
  const realSrc = media?.path ? mediaSrc(media.path) : '';
  const poster = mediaSrc(post.cover_path ?? media?.poster_path);

  const source = useRef<PlayerSource | null>(null);
  const sim = useMemo(() => (realSrc ? null : new SimVideo(media?.duration ?? 12)), [realSrc, media?.duration]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const resumeAfterSeek = useRef(false);
  const idle = useRef<number>();

  const { state, play, pause, toggle, seek, skip, setVolume, toggleMute } = useVideoPlayer(source);
  const [awake, setAwake] = useState(true);

  // Vídeo simulado: relógio e desenho a cada quadro.
  useEffect(() => {
    if (!sim) return;
    source.current = sim;
    const ctx = canvas.current?.getContext('2d');
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      sim.tick(Math.min(0.25, (t - last) / 1000));
      last = t;
      if (ctx && canvas.current) sim.draw(ctx, canvas.current.width, canvas.current.height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      source.current = null;
    };
  }, [sim]);

  // Vídeo real: autoplay mudo (o navegador bloqueia som automático), preferências lembradas, liberar ao fechar.
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = video.current;
    if (!v || !realSrc) return;
    // Em desenvolvimento (StrictMode) o efeito roda duas vezes: a 1ª limpeza remove o src.
    if (!v.getAttribute('src')) v.src = realSrc;
    source.current = v;
    const prefs = loadPlayerPrefs();
    if (prefs) v.volume = prefs.volume;
    v.muted = prefs?.muted ?? true;
    void v.play().catch(() => {
      v.muted = true;
      void v.play().catch(() => undefined);
    });
    return () => {
      source.current = null;
      v.pause();
      v.removeAttribute('src');
      v.load();
    };
  }, [realSrc]);

  // HUD: aparece ao mexer; some após 2,5 s tocando; pausado fica sempre visível.
  const wake = useCallback(() => {
    setAwake(true);
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => setAwake(false), HUD_IDLE_MS);
  }, []);
  useEffect(() => {
    wake();
    return () => window.clearTimeout(idle.current);
  }, [wake]);
  const hudVisible = awake || state.paused;

  // Atalhos: Espaço/K, ←/→ (∓5 s), ↑/↓ (volume), M (mudo), 0–9 (salta para 0–90%).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return; // Shift+setas = trocar de post
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      const duration = source.current && Number.isFinite(source.current.duration) ? source.current.duration : 0;
      let handled = true;
      switch (e.key) {
        case ' ':
          if (t.tagName === 'BUTTON') return; // Espaço no botão = clique dele
          toggle();
          break;
        case 'k':
        case 'K':
          toggle();
          break;
        case 'ArrowLeft':
          skip(-SKIP_SECONDS);
          break;
        case 'ArrowRight':
          skip(SKIP_SECONDS);
          break;
        case 'ArrowUp':
          setVolume((source.current?.volume ?? 1) + 0.1);
          break;
        case 'ArrowDown':
          setVolume((source.current?.volume ?? 1) - 0.1);
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        default:
          if (/^[0-9]$/.test(e.key)) seek((Number(e.key) / 10) * duration);
          else handled = false;
      }
      if (handled) {
        e.preventDefault();
        wake();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, skip, seek, setVolume, toggleMute, wake]);

  return (
    <div
      className="absolute inset-0 cursor-pointer bg-black"
      onPointerMove={wake}
      onPointerDown={wake}
      onFocusCapture={wake}
      onClick={toggle}
      role="group"
      aria-label={sim ? 'Reels (vídeo simulado)' : 'Reels'}
    >
      {sim ? (
        <canvas ref={canvas} width={360} height={640} className="block h-full w-full" />
      ) : (
        <video
          ref={video}
          src={realSrc}
          poster={poster}
          playsInline
          loop
          preload="metadata"
          className="block h-full w-full object-cover"
        />
      )}

      {state.paused && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-white/90 drop-shadow">
          <PlayIcon size={64} />
        </span>
      )}

      <PlayerHUD
        state={state}
        visible={hudVisible}
        onToggle={toggle}
        onSeek={seek}
        onSeekStart={() => {
          resumeAfterSeek.current = !state.paused;
          pause();
        }}
        onSeekEnd={() => {
          if (resumeAfterSeek.current) play();
        }}
        onToggleMute={toggleMute}
        onVolume={setVolume}
      />
    </div>
  );
}
