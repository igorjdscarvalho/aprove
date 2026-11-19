import { useMemo, useState } from 'react';
import { IG } from '@/config/instagram';
import { parseCaption } from '@/lib/caption';

interface Props {
  username: string;
  text: string;
  /** No celular a legenda longa começa recolhida ("… mais"); no desktop aparece inteira. */
  collapsible: boolean;
}

export function Caption({ username, text, collapsible }: Props) {
  const [open, setOpen] = useState(false);
  const long = collapsible && text.length > IG.CAPTION_COLLAPSED_CHARS;
  const shown = long && !open ? `${text.slice(0, IG.CAPTION_COLLAPSED_CHARS).trimEnd()}…` : text;
  const parts = useMemo(() => parseCaption(shown), [shown]);

  if (!text.trim()) return <p className="text-muted">Sem legenda.</p>;

  return (
    <p className="whitespace-pre-wrap break-words">
      <b className="mr-1">{username}</b>
      {parts.map((p, i) =>
        p.kind === 'text' ? (
          <span key={i}>{p.text}</span>
        ) : p.kind === 'url' ? (
          <a key={i} href={p.text} target="_blank" rel="noopener noreferrer nofollow" className="text-link underline">
            {p.text}
          </a>
        ) : (
          <span key={i} className="text-link">
            {p.text}
          </span>
        ),
      )}
      {long && (
        <button type="button" onClick={() => setOpen((v) => !v)} className="ml-1 text-muted">
          {open ? 'menos' : 'mais'}
        </button>
      )}
    </p>
  );
}
