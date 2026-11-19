import { useEffect, useRef, useState, type PointerEvent } from 'react';

const STAGE = 280;
const OUTPUT = 300;

export function AvatarCropper({ file, onCancel, onComplete }: { file: File; onCancel: () => void; onComplete: (file: File) => void }) {
  const [url, setUrl] = useState('');
  const [dimensions, setDimensions] = useState<[number, number] | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const image = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const scale = dimensions ? Math.max(STAGE / dimensions[0], STAGE / dimensions[1]) * zoom : 1;
  const displayWidth = dimensions ? dimensions[0] * scale : STAGE;
  const displayHeight = dimensions ? dimensions[1] * scale : STAGE;

  function pointerDown(e: PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    last.current = { x: e.clientX, y: e.clientY };
  }

  function pointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!last.current || !dimensions) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setOffset((current) => ({
      x: Math.max((STAGE - displayWidth) / 2, Math.min((displayWidth - STAGE) / 2, current.x + dx)),
      y: Math.max((STAGE - displayHeight) / 2, Math.min((displayHeight - STAGE) / 2, current.y + dy)),
    }));
  }

  function finish() {
    last.current = null;
  }

  function changeZoom(nextZoom: number) {
    setZoom(nextZoom);
    if (!dimensions) return;
    const nextScale = Math.max(STAGE / dimensions[0], STAGE / dimensions[1]) * nextZoom;
    const nextWidth = dimensions[0] * nextScale;
    const nextHeight = dimensions[1] * nextScale;
    setOffset((current) => ({
      x: Math.max((STAGE - nextWidth) / 2, Math.min((nextWidth - STAGE) / 2, current.x)),
      y: Math.max((STAGE - nextHeight) / 2, Math.min((nextHeight - STAGE) / 2, current.y)),
    }));
  }

  function saveCrop() {
    if (!image.current || !dimensions || busy) return;
    setBusy(true);
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const context = canvas.getContext('2d');
    if (!context) {
      setBusy(false);
      return;
    }
    const outputScale = OUTPUT / STAGE;
    context.drawImage(
      image.current,
      ((STAGE - displayWidth) / 2 + offset.x) * outputScale,
      ((STAGE - displayHeight) / 2 + offset.y) * outputScale,
      displayWidth * outputScale,
      displayHeight * outputScale,
    );
    canvas.toBlob((blob) => {
      setBusy(false);
      if (!blob) return;
      const stem = file.name.replace(/\.[^.]+$/, '') || 'avatar';
      onComplete(new File([blob], `${stem}.jpg`, { type: 'image/jpeg', lastModified: Date.now() }));
    }, 'image/jpeg', 0.9);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4" onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="avatar-crop-title" className="w-full max-w-sm rounded-2xl bg-bg p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="avatar-crop-title" className="text-lg font-bold">Ajustar foto do perfil</h2>
        <p className="mt-1 text-sm text-muted">Arraste para posicionar e ajuste o zoom.</p>
        <div
          className="relative mx-auto mt-4 h-[280px] w-[280px] touch-none cursor-grab overflow-hidden rounded-full bg-black active:cursor-grabbing"
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={finish}
          onPointerCancel={finish}
        >
          {url && (
            <img
              ref={image}
              src={url}
              alt=""
              draggable={false}
              onLoad={(e) => setDimensions([e.currentTarget.naturalWidth, e.currentTarget.naturalHeight])}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: displayWidth,
                height: displayHeight,
                maxWidth: 'none',
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
        <label className="mt-4 block text-sm font-medium">
          Zoom
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => changeZoom(Number(e.target.value))} className="mt-2 w-full" />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">Cancelar</button>
          <button type="button" disabled={!dimensions || busy} onClick={saveCrop} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Preparando…' : 'Usar esta foto'}</button>
        </div>
      </section>
    </div>
  );
}
