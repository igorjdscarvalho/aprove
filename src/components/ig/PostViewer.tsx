import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useModal } from '@/hooks/useModal';
import { formatDateLong } from '@/lib/dates';
import { mediaSrc } from '@/lib/mediaSrc';
import { postRatio, TYPE_LABEL } from '@/lib/posts';
import { toast } from '@/lib/toast';
import type { ClientProfile, Post, ReviewDecision } from '@/types/domain';
import { ApprovalPanel, type ReviewResult } from './ApprovalPanel';
import { Caption } from './Caption';
import { Carousel } from './Carousel';
import { ReelPlayer } from './ReelPlayer';

interface Props {
  posts: Post[];
  index: number;
  client: ClientProfile;
  onNavigate: (index: number) => void;
  onClose: () => void;
  onSubmitReview: (post: Post, decision: ReviewDecision, comment: string, name: string) => Promise<ReviewResult>;
}

const navBtn =
  'fixed top-1/2 z-[60] hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xl text-black md:flex';

// Visualizador de publicação (seção 11.5): modal em 2 colunas no desktop, tela cheia no celular.
export function PostViewer({ posts, index, client, onNavigate, onClose, onSubmitReview }: Props) {
  const post = posts[index];
  const dialog = useRef<HTMLDivElement>(null);
  const mobile = useIsMobile();
  const [slide, setSlide] = useState(0);
  useModal(dialog);

  useEffect(() => setSlide(0), [post?.id]);

  const canPrev = index > 0;
  const canNext = index < posts.length - 1;
  const go = useCallback(
    (d: number) => {
      const next = index + d;
      if (next >= 0 && next < posts.length) onNavigate(next);
    },
    [index, posts.length, onNavigate],
  );

  // Teclado. Shift+←/→ troca de publicação. ←/→ sozinhos: slides do carrossel, ±5 s no Reels
  // (o ReelPlayer cuida) e, na imagem única, trocam de publicação.
  useEffect(() => {
    if (!post) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName)) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        return onClose();
      }
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const d = e.key === 'ArrowRight' ? 1 : -1;
      if (e.shiftKey) {
        e.preventDefault();
        return go(d);
      }
      if (post.type === 'carousel') {
        e.preventDefault();
        setSlide((s) => Math.max(0, Math.min(post.media.length - 1, s + d)));
      } else if (post.type !== 'reel') {
        e.preventDefault();
        go(d);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [post, go, onClose]);

  if (!post) return null;

  const ratio = postRatio(post);
  const first = post.media[0];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast('Link da publicação copiado');
    } catch {
      toast('Não foi possível copiar o link');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="fixed right-3.5 top-3 z-[60] h-10 w-10 text-[22px] text-white drop-shadow"
      >
        ✕
      </button>
      {canPrev && (
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Publicação anterior"
          title="Publicação anterior (Shift + ←)"
          className={`${navBtn} left-3.5`}
        >
          ‹
        </button>
      )}
      {canNext && (
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Próxima publicação"
          title="Próxima publicação (Shift + →)"
          className={`${navBtn} right-3.5`}
        >
          ›
        </button>
      )}

      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Publicação"
        tabIndex={-1}
        className="flex max-h-[100dvh] w-screen flex-col overflow-auto bg-bg outline-none md:max-h-[92vh] md:w-auto md:max-w-[min(1000px,calc(100vw-120px))] md:flex-row md:overflow-hidden md:rounded-lg"
      >
        <div
          className="relative mx-auto h-[min(66vh,calc(100vw/var(--r)))] flex-none touch-pan-y overflow-hidden bg-black md:mx-0 md:h-[min(88vh,720px)]"
          style={{ '--r': ratio, aspectRatio: String(ratio) } as CSSProperties}
        >
          {post.type === 'reel' ? (
            <ReelPlayer key={post.id} post={post} />
          ) : post.type === 'carousel' && post.media.length > 1 ? (
            <Carousel slides={post.media} index={slide} onIndex={setSlide} />
          ) : (
            <img src={mediaSrc(first?.path)} alt="" className="block h-full w-full object-cover" />
          )}
        </div>

        <aside className="flex min-w-0 flex-col p-4 md:w-[340px] md:overflow-auto">
          <div className="flex items-center gap-2.5 border-b border-line pb-3">
            <img src={mediaSrc(client.avatar_path)} alt="" className="h-8 w-8 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{client.username}</div>
              {post.location && <div className="truncate text-xs text-muted">{post.location}</div>}
            </div>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="flex-none text-[13px] font-semibold text-accent"
              title="Copiar o link desta publicação"
            >
              Copiar link
            </button>
          </div>

          <div className="flex-1 py-3">
            <Caption username={client.username} text={post.caption} collapsible={mobile} />
          </div>

          <p className="mb-2.5 text-xs text-muted">
            {formatDateLong(post.scheduled_date)} · {TYPE_LABEL[post.type]}
            {post.type === 'reel' && post.audio_name ? ` · ${post.audio_name}` : ''}
            {post.revision > 1 ? ` · Revisão ${post.revision}` : ''}
          </p>

          <ApprovalPanel
            key={post.id}
            post={post}
            onSubmit={(d, c, n) => onSubmitReview(post, d, c, n)}
          />
        </aside>
      </div>
    </div>
  );
}
