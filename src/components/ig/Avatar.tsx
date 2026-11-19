import { mediaSrc } from '@/lib/mediaSrc';

export type RingState = 'none' | 'unseen' | 'seen';

interface Props {
  src: string | null;
  ring: RingState;
  onClick?: () => void;
}

// Anel em gradiente quando há story não visto; cinza quando já foi visto; sem anel se não há stories.
export function Avatar({ src, ring, onClick }: Props) {
  const wrap =
    ring === 'unseen'
      ? 'bg-[linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)] p-[3px]'
      : ring === 'seen'
        ? 'bg-line p-[3px]'
        : 'p-0';
  const img = (
    <img
      src={mediaSrc(src)}
      alt=""
      className={`block aspect-square w-[clamp(78px,18vw,150px)] rounded-full object-cover ${
        ring === 'none' ? 'border border-line' : 'border-[3px] border-bg'
      }`}
    />
  );
  const cls = `block flex-none rounded-full ${wrap}`;

  if (ring === 'none' || !onClick) {
    return <span className={cls}>{img}</span>;
  }
  return (
    <button type="button" onClick={onClick} aria-label="Ver stories" className={cls}>
      {img}
    </button>
  );
}
