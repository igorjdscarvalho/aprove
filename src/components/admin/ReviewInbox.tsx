import { useMemo, useState } from 'react';
import { formatDateTime } from '@/lib/format';
import { mediaSrc } from '@/lib/mediaSrc';
import { thumbPath } from '@/lib/posts';
import type { AdminPost, AdminReview } from '@/providers/admin/SupabasePostProvider';

type InboxFilter = 'all' | 'unread' | 'changes_requested' | 'approved';

interface InboxItem {
  review: AdminReview;
  post: AdminPost;
}

interface Props {
  posts: AdminPost[];
  onOpenPost: (post: AdminPost) => void;
  onMarkRead: (review: AdminReview) => Promise<void>;
}

const FILTERS: { id: InboxFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'unread', label: 'Não lidas' },
  { id: 'changes_requested', label: 'Ajustes' },
  { id: 'approved', label: 'Aprovadas' },
];

const DECISION_LABEL = {
  approved: 'Aprovado',
  changes_requested: 'Ajustes solicitados',
} as const;

export function ReviewInbox({ posts, onOpenPost, onMarkRead }: Props) {
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const items = useMemo<InboxItem[]>(() => posts
    .flatMap((post) => post.reviews.map((review) => ({ review, post })))
    .sort((a, b) => b.review.created_at.localeCompare(a.review.created_at)), [posts]);

  const visible = items.filter(({ review }) => {
    if (filter === 'unread') return review.read_at === null;
    return filter === 'all' || review.decision === filter;
  });

  async function markRead(review: AdminReview) {
    if (busyId) return;
    setBusyId(review.id);
    setError('');
    try {
      await onMarkRead(review);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível marcar como lida.');
    } finally {
      setBusyId('');
    }
  }

  return (
    <section className="pt-5">
      <div>
        <h3 className="text-lg font-bold">Aprovações</h3>
        <p className="mt-1 text-sm text-muted">Retornos enviados pelo cliente, atualizados em tempo real.</p>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto border-b border-line" role="tablist" aria-label="Filtrar aprovações">
        {FILTERS.map((item) => {
          const count = item.id === 'all'
            ? items.length
            : item.id === 'unread'
              ? items.filter(({ review }) => !review.read_at).length
              : items.filter(({ review }) => review.decision === item.id).length;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold ${filter === item.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-fg'}`}
            >
              {item.label} <span className="ml-1 text-xs opacity-75">{count}</span>
            </button>
          );
        })}
      </div>

      {error && <p role="alert" className="mt-3 rounded-lg border border-bad px-3 py-2 text-sm text-bad">{error}</p>}
      {visible.length ? (
        <ul className="mt-4 space-y-3">
          {visible.map(({ review, post }) => {
            const thumbnail = thumbPath(post);
            const unread = !review.read_at;
            return (
              <li key={review.id} className={`flex flex-col gap-3 rounded-xl border bg-surface p-3 sm:flex-row sm:items-start ${unread ? 'border-accent/50' : 'border-line'}`}>
                <div className="h-24 w-20 shrink-0 overflow-hidden rounded bg-line">
                  {thumbnail && <img src={mediaSrc(thumbnail)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white ${review.decision === 'approved' ? 'bg-[#267a45]' : 'bg-[#a85f00]'}`}>
                      {DECISION_LABEL[review.decision]}
                    </span>
                    {unread && <span className="rounded-full bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">Não lida</span>}
                    <time className="text-xs text-muted" dateTime={review.created_at}>{formatDateTime(review.created_at)}</time>
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold">{post.caption || 'Publicação sem legenda'}</p>
                  <p className="mt-1 text-xs text-muted">
                    {review.reviewer_name || 'Cliente'} · Revisão {review.revision} · {post.scheduled_date}
                  </p>
                  {review.comment && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{review.comment}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                  <button type="button" onClick={() => onOpenPost(post)} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-bg">Abrir post</button>
                  {unread && (
                    <button
                      type="button"
                      disabled={!!busyId}
                      onClick={() => void markRead(review)}
                      className="rounded-lg border border-line px-3 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      {busyId === review.id ? 'Salvando…' : 'Marcar como lida'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-8 rounded-lg border border-dashed border-line p-8 text-center text-sm text-muted">
          {items.length ? 'Nenhum retorno corresponde a esse filtro.' : 'Ainda não há aprovações ou pedidos de ajuste.'}
        </p>
      )}
    </section>
  );
}
