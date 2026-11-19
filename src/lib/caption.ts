// Parser de legenda (seção 10.5): separa texto, #hashtag, @menção e link.
// Devolve partes simples; quem renderiza decide o visual (nunca HTML cru, então não há risco de XSS).
export type CaptionPart = { kind: 'text' | 'tag' | 'mention' | 'url'; text: string };

const TOKEN = /(https?:\/\/[^\s]+|#[\p{L}\p{N}_]+|@[A-Za-z0-9_.]+)/gu;
const TRAILING = /[.,;:!?)\]"']+$/;
const WORD_CHAR = /[\p{L}\p{N}_]/u;

export function parseCaption(input: string): CaptionPart[] {
  const parts: CaptionPart[] = [];
  const push = (kind: CaptionPart['kind'], text: string) => {
    if (!text) return;
    const last = parts[parts.length - 1];
    if (kind === 'text' && last && last.kind === 'text') last.text += text;
    else parts.push({ kind, text });
  };

  let pos = 0;
  for (const m of input.matchAll(TOKEN)) {
    const start = m.index ?? 0;
    push('text', input.slice(pos, start));
    pos = start + m[0].length;

    const raw = m[0];
    const kind: CaptionPart['kind'] = raw.startsWith('http') ? 'url' : raw[0] === '#' ? 'tag' : 'mention';

    // "texto#tag" e "email@site" não são hashtag/menção.
    if (kind !== 'url' && start > 0 && WORD_CHAR.test(input[start - 1])) {
      push('text', raw);
      continue;
    }

    let tok = raw;
    if (kind !== 'tag') {
      const t = tok.match(TRAILING);
      if (t) tok = tok.slice(0, -t[0].length);
    }
    if (kind === 'mention' && tok.length < 2) {
      push('text', raw);
      continue;
    }
    push(kind, tok);
    push('text', raw.slice(tok.length));
  }
  push('text', input.slice(pos));
  return parts;
}
