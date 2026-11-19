import { useEffect, useRef, type PointerEvent } from 'react';
import { mediaSrc } from '@/lib/mediaSrc';
import type { Media } from '@/types/domain';

interface Props {
  slides: Media[];
  index: number;
  onIndex: (i: number) => void;
}

const SWIPE_PX = 40;

// Faixa com `translateX`: setas, bolinhas, contador e arrastar com o dedo/mouse (seção 11.6).
export function Carousel({ slides, index, onIndex }: Props) {
  const count = slides.length;
  const i = Math.max(0, Math.min(count - 1, index));
  const startX = useRef<number | null>(null);
  const root = useRef<HTMLDivElement>(null);

  // Vídeo que sai de vista é pausado.
  useEffect(() => {
    root.current?.querySelectorAll('video').forEach((v) => v.pause());
  }, [i]);

  const go = (d: number) => onIndex(Math.max(0, Math.min(count - 1, i + d)));

  const down = (e: PointerEvent) => {
    if (e.isPrimary) startX.current = e.clientX;
  };
  const up = (e: PointerEvent) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > SWIPE_PX) go(dx < 0 ? 1 : -1);
  };

  return (
    <div
      ref={root}
      className="relative h-full w-full touch-pan-y select-none overflow-hidden"
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={() => (startX.current = null)}
      role="group"
      aria-roledescription="carrossel"
      aria-label={`Carrossel, ${count} itens`}
    >
      <div className="flex h-full transition-transform duration-300" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((m, k) => {
          const src = mediaSrc(m.path || m.poster_path);
          return m.kind === 'video' && m.path ? (
            <video
              key={m.id}
              src={src}
              poster={mediaSrc(m.poster_path)}
              controls
              muted
              playsInline
              preload="metadata"
              className="block h-full w-full flex-none object-cover"
            />
          ) : (
            <img
              key={m.id}
              src={src}
              alt={`Item ${k + 1} de ${count}`}
              draggable={false}
              loading={Math.abs(k - i) <= 1 ? 'eager' : 'lazy'}
              className="block h-full w-full flex-none object-cover"
            />
          );
        })}
      </div>

      {i > 0 && (
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Item anterior"
          className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black"
        >
          ‹
        </button>
      )}
      {i < count - 1 && (
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Próximo item"
          className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black"
        >
          ›
        </button>
      )}

      <span
        role="status"
        className="absolute right-2.5 top-2.5 rounded-full bg-black/60 px-2.5 py-0.5 text-xs text-white"
      >
        {i + 1}/{count}
      </span>
      <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-[5px]" aria-hidden="true">
        {slides.map((m, k) => (
          <i key={m.id} className={`h-1.5 w-1.5 rounded-full ${k === i ? 'bg-accent' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  );
}
