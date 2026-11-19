import { useEffect, useState } from 'react';
import { formatDateTime } from '@/lib/format';
import type { Post, ReviewDecision } from '@/types/domain';

export interface ReviewResult {
  ok: boolean;
  error?: string;
}

interface Props {
  post: Post;
  onSubmit: (decision: ReviewDecision, comment: string, reviewerName: string) => Promise<ReviewResult>;
  /** Avisa quando a caixa de ajustes abre/fecha (o story pausa enquanto ela está aberta). */
  onFormOpenChange?: (open: boolean) => void;
  /** Mantém o comentário translúcido dentro do painel desfocado dos stories no desktop. */
  storyOverlay?: boolean;
}

const NAME_KEY = 'reviewer_name';
const MAX = 2000;

const ERRORS: Record<string, string> = {
  comment_required: 'Descreva os ajustes para enviar.',
  comment_too_long: 'O texto passou do limite de 2000 caracteres.',
  rate_limited: 'Muitas ações em pouco tempo. Aguarde um instante e tente de novo.',
  not_found: 'Esta publicação não está mais disponível.',
};

function rememberedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

// Aprovar / Não aprovar (seção 11.10). O cliente pode mudar de ideia: o histórico é mantido (D8).
export function ApprovalPanel({ post, onSubmit, onFormOpenChange, storyOverlay = false }: Props) {
  const [form, setForm] = useState(false);
  const [changing, setChanging] = useState(false); // "Alterar decisão" sem apagar nada
  const [text, setText] = useState('');
  const [name, setName] = useState(rememberedName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    onFormOpenChange?.(form);
    return () => onFormOpenChange?.(false);
  }, [form, onFormOpenChange]);

  const last = post.reviews[0];
  const decided = post.approval_status !== 'pending' && !changing;

  async function send(decision: ReviewDecision) {
    if (busy) return;
    const comment = text.trim();
    if (decision === 'changes_requested' && !comment) {
      setInvalid(true);
      setError(ERRORS.comment_required);
      return;
    }
    setBusy(true);
    setError('');
    try {
      try {
        localStorage.setItem(NAME_KEY, name.trim().slice(0, 60));
      } catch {
        /* ignora */
      }
      const r = await onSubmit(decision, comment, name);
      if (r.ok) {
        setForm(false);
        setChanging(false);
        setText('');
        setInvalid(false);
      } else {
        setError(ERRORS[r.error ?? ''] ?? 'Não foi possível enviar. Tente novamente.');
      }
    } catch {
      setError('Não foi possível enviar. Verifique a internet e tente de novo.');
    } finally {
      setBusy(false);
    }
  }

  const btn = 'flex min-h-11 flex-1 items-center justify-center rounded-lg px-3 py-2.5 font-semibold text-white disabled:opacity-50';

  return (
    <div>
      {form ? (
        <div>
          <label htmlFor={`adj-${post.id}`} className="sr-only">
            Ajustes desejados
          </label>
          <textarea
            id={`adj-${post.id}`}
            autoFocus
            value={text}
            maxLength={MAX}
            onChange={(e) => {
              setText(e.target.value);
              if (invalid) {
                setInvalid(false);
                setError('');
              }
            }}
            placeholder="Descreva os ajustes que você gostaria…"
            aria-invalid={invalid}
            className={`min-h-[92px] w-full resize-y rounded-lg border bg-bg p-2.5 text-fg ${
              invalid ? 'border-bad' : 'border-line'
            }`}
          />
          <div className="mt-1 text-right text-xs text-muted">
            {text.length}/{MAX}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Seu nome (opcional)"
            aria-label="Seu nome (opcional)"
            className="mt-1 w-full rounded-lg border border-line bg-bg p-2.5 text-fg"
          />
          <div className="mt-2.5 flex gap-2">
            <button type="button" disabled={busy} onClick={() => void send('changes_requested')} className={`${btn} bg-[#a85f00] hover:bg-[#8b4b00]`}>
              {busy ? 'Enviando…' : 'Enviar ajustes'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setForm(false);
                setError('');
                setInvalid(false);
              }}
              className={`${btn} border border-line bg-surface !text-fg`}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : decided ? (
        <div>
          <span
            className={`inline-block rounded-full px-3 py-1 text-[13px] font-semibold text-white ${
              post.approval_status === 'approved' ? 'bg-[#267a45]' : 'bg-[#a85f00]'
            }`}
          >
            {post.approval_status === 'approved' ? '✓ Aprovado' : '✎ Ajustes solicitados'}
          </span>
          {last?.comment && <p className={`mt-2 rounded-lg px-2.5 py-2 text-[13px] ${storyOverlay ? 'bg-transparent' : 'bg-surface'}`}>{last.comment}</p>}
          <button type="button" onClick={() => setChanging(true)} className="mt-2 block font-semibold text-accent">
            Alterar decisão
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={() => void send('approved')} className={`${btn} bg-[#267a45] hover:bg-[#1f6b3e]`}>
            {busy ? 'Enviando…' : '✓ Aprovar'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setForm(true);
              setError('');
            }}
            className={`${btn} bg-[#a85f00] hover:bg-[#8b4b00]`}
          >
            ✎ Não aprovar
          </button>
        </div>
      )}

      <p role="alert" className="mt-2 min-h-[1.25rem] text-[13px] text-bad">
        {error}
      </p>

      {post.reviews.length > 0 && (
        <div className="mt-2 border-t border-line pt-2 text-xs text-muted">
          <p className="font-semibold">Histórico</p>
          <ul>
            {post.reviews.map((r, i) => (
              <li key={`${r.created_at}-${i}`} className="py-0.5">
                {r.decision === 'approved' ? '✓ Aprovado' : '✎ Ajustes'} · {formatDateTime(r.created_at)} · Revisão{' '}
                {r.revision}
                {r.reviewer_name ? ` · ${r.reviewer_name}` : ''}
                {r.comment ? ` — ${r.comment}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
