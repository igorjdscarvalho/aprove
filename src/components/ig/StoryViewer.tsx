import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { useModal } from '@/hooks/useModal';
import { useStoryTimer } from '@/hooks/useStoryTimer';
import { formatDateLong } from '@/lib/dates';
import { mediaSrc } from '@/lib/mediaSrc';
import { markSeen } from '@/lib/storiesSeen';
import type { ClientProfile, Post, ReviewDecision } from '@/types/domain';
import { ApprovalPanel, type ReviewResult } from './ApprovalPanel';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, MuteIcon, PauseIcon, PlayIcon, VolumeIcon } from './icons';

interface Props {
  slug: string;
  stories: Post[];
  startIndex: number;
  client: ClientProfile;
  onClose: () => void;
  onSubmitReview?: (post: Post, decision: ReviewDecision, comment: string, name: string) => Promise<ReviewResult>;
  adminPreview?: boolean;
  onEdit?: (post: Post) => void;
}

const HOLD_MS = 250; // toque curto navega; segurar pausa

// Stories em tela cheia (seção 11.9): barras, toque 30%/70%, segurar = pausa, vídeo ou imagem.
export function StoryViewer({ slug, stories, startIndex, client, onClose, onSubmitReview, adminPreview = false, onEdit }: Props) {
  const [i, setI] = useState(() => Math.max(0, Math.min(stories.length - 1, startIndex)));
  const [hold, setHold] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const story = stories[i];
  const dialog = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const pressedAt = useRef(0);
  useModal(dialog);

  const media = story?.media[0];
  const isVideo = media?.kind === 'video' && !!media.path;
  const paused = hold || manualPause || formOpen;

  const next = useCallback(() => {
    if (i < stories.length - 1) setI(i + 1);
    else onClose();
  }, [i, stories.length, onClose]);

  const { progress, restart } = useStoryTimer({
    storyKey: story?.id ?? '',
    seconds: story?.story_seconds ?? 5,
    videoRef: video,
    paused,
    onEnd: next,
  });

  const prev = useCallback(() => {
    if (i > 0) setI(i - 1);
    else restart();
  }, [i, restart]);

  // Cada story exibido conta como visto; o estado de pausa volta ao normal.
  const storyId = story?.id;
  useEffect(() => {
    if (!storyId || adminPreview) return;
    markSeen(slug, storyId);
    setHold(false);
    setManualPause(false);
  }, [slug, storyId, adminPreview]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName)) return;
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'BUTTON') {
        e.preventDefault();
        setManualPause((p) => !p);
      } else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  if (!story) return null;

  const zone = (action: () => void) => ({
    onPointerDown: (e: PointerEvent) => {
      e.preventDefault();
      pressedAt.current = Date.now();
      setHold(true);
    },
    onPointerUp: () => {
      setHold(false);
      if (Date.now() - pressedAt.current < HOLD_MS) action();
    },
    onPointerLeave: () => setHold(false),
    onPointerCancel: () => setHold(false),
  });

  const headBtn = 'flex h-11 w-11 items-center justify-center text-xl text-white';
  const arrow =
    'absolute top-1/2 z-[5] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white/75 shadow-sm backdrop-blur-sm transition-colors hover:bg-black/55 hover:text-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`Stories de ${client.username}`}
        tabIndex={-1}
        className="relative aspect-[9/16] h-[min(100dvh,900px)] max-w-[100vw] overflow-hidden bg-black outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            key={story.id}
            ref={video}
            src={mediaSrc(media.path)}
            poster={mediaSrc(media.poster_path)}
            muted={videoMuted}
            playsInline
            autoPlay
            className="block h-full w-full object-cover"
          />
        ) : (
          <img src={mediaSrc(media?.path || media?.poster_path)} alt="" className="block h-full w-full object-cover" />
        )}

        <div className="absolute inset-x-2.5 top-2.5 z-[4] flex gap-1" aria-hidden="true">
          {stories.map((s, k) => (
            <i key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-sm bg-white/35">
              <b
                className="block h-full bg-white"
                style={{ width: `${k < i ? 100 : k === i ? progress * 100 : 0}%` }}
              />
            </i>
          ))}
        </div>

        <div className="absolute left-3 right-1.5 top-[22px] z-[4] flex items-center gap-2 text-[13px] text-white">
          <img src={mediaSrc(client.avatar_path)} alt="" className="h-[30px] w-[30px] rounded-full object-cover" />
          <b>{client.username}</b>
          <span className="mr-auto opacity-80">{formatDateLong(story.scheduled_date)}</span>
          {isVideo && (
            <button
              type="button"
              onClick={() => setVideoMuted((m) => !m)}
              aria-label={videoMuted ? 'Ativar som' : 'Silenciar'}
              className={headBtn}
            >
              {videoMuted ? <MuteIcon /> : <VolumeIcon />}
            </button>
          )}
          <button
            type="button"
            onClick={() => setManualPause((p) => !p)}
            aria-label={manualPause ? 'Retomar' : 'Pausar'}
            className={headBtn}
          >
            {manualPause ? <PlayIcon /> : <PauseIcon />}
          </button>
          <button type="button" onClick={onClose} aria-label="Fechar" className={headBtn}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="absolute bottom-[170px] left-0 top-[70px] z-[3] w-[30%]" {...zone(prev)} />
        <div className="absolute bottom-[170px] right-0 top-[70px] z-[3] w-[70%]" {...zone(next)} />

        {i > 0 && (
          <button type="button" onClick={prev} aria-label="Story anterior" className={`${arrow} left-2`}>
            <ChevronLeftIcon />
          </button>
        )}
        <button type="button" onClick={next} aria-label="Próximo story" className={`${arrow} right-2`}>
          <ChevronRightIcon />
        </button>

        {adminPreview ? (
          <div className="absolute inset-x-0 bottom-0 z-[5] flex items-center justify-between gap-3 bg-black/65 px-4 py-3 text-sm text-white backdrop-blur">
            <span>{story.reviews.length ? `${story.reviews.length} avaliação(ões)` : 'Sem avaliações'}</span>
            <button type="button" onClick={() => onEdit?.(story)} className="rounded-lg bg-white px-3 py-2 font-semibold text-black">Editar story</button>
          </div>
        ) : (
          <div className="story-approval-panel absolute inset-x-0 bottom-0 z-[5] rounded-t-[14px] px-3.5 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3">
            {onSubmitReview && (
              <ApprovalPanel
                key={story.id}
                post={story}
                storyOverlay
                onSubmit={(d, c, n) => onSubmitReview(story, d, c, n)}
                onFormOpenChange={setFormOpen}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
