import { mediaSrc } from '@/lib/mediaSrc';

interface Props {
  src: string;
  x: number;
  y: number;
  onChange: (point: { x: number; y: number }) => void;
}

export function CoverCropper({ src, x, y, onChange }: Props) {
  if (!src) return null;
  return (
    <fieldset className="rounded-xl border border-line p-3">
      <legend className="px-1 text-sm font-semibold">Recorte da capa na grade</legend>
      <div className="mx-auto aspect-[3/4] w-36 overflow-hidden rounded-md bg-surface">
        <img src={mediaSrc(src)} alt="Prévia do recorte da capa" className="h-full w-full object-cover" style={{ objectPosition: `${x}% ${y}%` }} />
      </div>
      <label className="mt-3 block text-xs font-medium">
        Horizontal
        <input type="range" min="0" max="100" value={x} onChange={(event) => onChange({ x: Number(event.target.value), y })} className="mt-1 w-full" />
      </label>
      <label className="mt-2 block text-xs font-medium">
        Vertical
        <input type="range" min="0" max="100" value={y} onChange={(event) => onChange({ x, y: Number(event.target.value) })} className="mt-1 w-full" />
      </label>
    </fieldset>
  );
}
