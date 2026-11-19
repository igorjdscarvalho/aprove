import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import type { PlayerState } from '@/hooks/useVideoPlayer';
import { formatClock } from '@/lib/format';
import { MuteIcon, PauseIcon, PlayIcon, VolumeIcon } from './icons';

interface Props {
  state: PlayerState;
  visible: boolean;
  onToggle: () => void;
  onSeek: (t: number) => void;
  /** Pausa durante o arrasto e retoma ao soltar (feito pelo ReelPlayer). */
  onSeekStart: () => void;
  onSeekEnd: () => void;
  onToggleMute: () => void;
  onVolume: (v: number) => void;
}

// Barra de controle dos Reels (RF-C5): play/pause, progresso arrastável, tempo, mudo e volume.
export function PlayerHUD({ state, visible, onToggle, onSeek, onSeekStart, onSeekEnd, onToggleMute, onVolume }: Props) {
  const bar = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const pct = state.duration > 0 ? Math.min(100, (state.current / state.duration) * 100) : 0;
  const silent = state.muted || state.volume === 0;

  const timeAt = (e: PointerEvent) => {
    const r = bar.current!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * state.duration;
  };

  const down = (e: PointerEvent) => {
    e.stopPropagation();
    dragging.current = true;
    bar.current!.setPointerCapture(e.pointerId);
    onSeekStart();
    onSeek(timeAt(e));
  };
  const move = (e: PointerEvent) => {
    if (dragging.current) onSeek(timeAt(e));
  };
  const up = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onSeekEnd();
  };
  // As setas ←/→ com o foco na barra são tratadas pelo ReelPlayer (atalhos do player).
  const keys = (e: KeyboardEvent) => {
    if (e.key === 'Home') onSeek(0);
    else if (e.key === 'End') onSeek(state.duration);
  };

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-[3] bg-gradient-to-t from-black/65 to-transparent px-3 pb-2 pt-7 text-white transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={bar}
        role="slider"
        tabIndex={0}
        aria-label="Progresso do vídeo"
        aria-valuemin={0}
        aria-valuemax={Math.round(state.duration)}
        aria-valuenow={Math.round(state.current)}
        aria-valuetext={`${formatClock(state.current)} de ${formatClock(state.duration)}`}
        className="flex h-[18px] cursor-pointer touch-none items-center"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={keys}
      >
        <div className="relative h-1 w-full rounded-sm bg-white/35">
          <div className="absolute inset-y-0 left-0 rounded-sm bg-white" style={{ width: `${pct}%` }}>
            <span className="absolute -right-1.5 -top-1 h-3 w-3 rounded-full bg-white" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-medium">
        <button type="button" onClick={onToggle} aria-label={state.paused ? 'Reproduzir' : 'Pausar'} className="flex p-1">
          {state.paused ? <PlayIcon /> : <PauseIcon />}
        </button>
        <span className="mr-auto tabular-nums">
          {formatClock(state.current)} / {formatClock(state.duration)}
        </span>
        <button type="button" onClick={onToggleMute} aria-label={silent ? 'Ativar som' : 'Silenciar'} className="flex p-1">
          {silent ? <MuteIcon /> : <VolumeIcon />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={silent ? 0 : state.volume}
          onChange={(e) => onVolume(Number(e.target.value))}
          aria-label="Volume"
          className="hidden w-[70px] accent-white md:block"
        />
      </div>
    </div>
  );
}
