import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Footer } from '@/components/ui/Footer';
import { ToastHost } from '@/components/ui/ToastHost';
import type { RingState } from '@/components/ig/Avatar';
import type { ReviewResult } from '@/components/ig/ApprovalPanel';
import { MonthFilter } from '@/components/ig/MonthFilter';
import { PostGrid } from '@/components/ig/PostGrid';
import { PostViewer } from '@/components/ig/PostViewer';
import { ProfileHeader } from '@/components/ig/ProfileHeader';
import { ProfileTabs } from '@/components/ig/ProfileTabs';
import { StoryViewer } from '@/components/ig/StoryViewer';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { formatMonthLabel } from '@/lib/dates';
import { gridPosts, monthPosts, monthStories, type GridTab } from '@/lib/posts';
import { getSeen } from '@/lib/storiesSeen';
import { toast } from '@/lib/toast';
import type { ClientDataProvider } from '@/providers/types';
import type { FeedData, Post, Review, ReviewDecision } from '@/types/domain';

interface Props {
  slug: string;
  /** Id da publicação na URL (`#/c/:slug/p/:postId`), se houver. */
  postId: string | null;
  feed: FeedData;
  provider: ClientDataProvider;
  onLogout: () => void;
  /** Sessão expirou ou foi derrubada: volta ao Gate. */
  onUnauthorized: () => void;
}

const ALL = { mode: 'all' } as const;

// Perfil do cliente: cabeçalho, abas, filtro de mês, grade, visualizador de post e stories.
export function ClientFeed({ slug, postId, feed: initialFeed, provider, onLogout, onUnauthorized }: Props) {
  const [feed, setFeed] = useState(initialFeed);
  const { client, posts } = feed;
  const month = useMonthFilter();
  const [tab, setTab] = useState<GridTab>('posts');
  const [storyStart, setStoryStart] = useState<number | null>(null);
  const [seenTick, setSeenTick] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const base = `/c/${slug}`;
  const search = location.search;
  const viaViewer = (location.state as { viewer?: boolean } | null)?.viewer === true;

  const view = useMemo(() => {
    const stories = monthStories(posts, month.filter);
    const seen = getSeen(slug);
    const ring: RingState =
      stories.length === 0 ? 'none' : stories.some((s) => !seen.has(s.id)) ? 'unseen' : 'seen';
    const firstUnseen = Math.max(0, stories.findIndex((s) => !seen.has(s.id)));
    return {
      grid: gridPosts(posts, month.filter, tab),
      total: monthPosts(posts, month.filter).length,
      stories,
      firstUnseen,
      ring,
    };
    // seenTick: recalcula o anel depois de fechar os stories.
  }, [posts, month.filter, tab, slug, seenTick]);

  // ---- publicação aberta pela URL ----
  const urlPost = postId ? posts.find((p) => p.id === postId) : undefined;
  const urlStory = urlPost?.type === 'story' ? urlPost : undefined;

  const postList = useMemo<Post[]>(() => {
    if (!urlPost || urlPost.type === 'story') return [];
    return view.grid.some((p) => p.id === urlPost.id) ? view.grid : [urlPost];
  }, [urlPost, view.grid]);
  const postIndex = urlPost && !urlStory ? postList.findIndex((p) => p.id === urlPost.id) : -1;

  // Link com id que não existe (ou rascunho): avisa e volta ao perfil.
  useEffect(() => {
    if (postId && !urlPost) {
      toast('Publicação não encontrada');
      navigate(`${base}${search}`, { replace: true });
    }
  }, [postId, urlPost, navigate, base, search]);

  const openPost = useCallback(
    (i: number) => {
      const p = view.grid[i];
      if (p) navigate(`${base}/p/${p.id}${search}`, { state: { viewer: true } });
    },
    [navigate, base, search, view.grid],
  );

  const navigatePost = useCallback(
    (i: number) => {
      const p = postList[i];
      if (p) navigate(`${base}/p/${p.id}${search}`, { replace: true, state: { viewer: viaViewer } });
    },
    [navigate, base, search, postList, viaViewer],
  );

  const closeUrlViewer = useCallback(() => {
    if (viaViewer) navigate(-1);
    else navigate(`${base}${search}`, { replace: true });
  }, [viaViewer, navigate, base, search]);

  // ---- stories ----
  const allStories = useMemo(() => monthStories(posts, ALL), [posts]);
  const storyList =
    storyStart !== null
      ? view.stories
      : urlStory
        ? view.stories.some((s) => s.id === urlStory.id)
          ? view.stories
          : allStories
        : [];
  const storyIndex =
    storyStart !== null ? storyStart : urlStory ? storyList.findIndex((s) => s.id === urlStory.id) : -1;

  const closeStories = useCallback(() => {
    setSeenTick((t) => t + 1);
    if (storyStart !== null) setStoryStart(null);
    else closeUrlViewer();
  }, [storyStart, closeUrlViewer]);

  // ---- aprovação (otimista + reconciliação com o provider) ----
  const submitReview = useCallback(
    async (post: Post, decision: ReviewDecision, comment: string, name: string): Promise<ReviewResult> => {
      const r = await provider.submitReview(slug, post.id, decision, comment, name);
      if (r.ok) {
        const review: Review = {
          decision,
          comment: decision === 'approved' ? '' : comment.trim(),
          reviewer_name: name.trim().slice(0, 60),
          revision: post.revision,
          created_at: new Date().toISOString(),
        };
        setFeed((f) => ({
          ...f,
          posts: f.posts.map((p) =>
            p.id === post.id ? { ...p, approval_status: decision, reviews: [review, ...p.reviews] } : p,
          ),
        }));
        toast(decision === 'approved' ? 'Aprovado. Obrigado!' : 'Retorno enviado');
        void provider.getFeed(slug).then((f) => {
          if (!('unauthorized' in f)) setFeed(f);
        }).catch(() => {});
      } else if (r.error === 'unauthorized') {
        toast('Sua sessão expirou. Entre novamente.');
        onUnauthorized();
      }
      return r;
    },
    [slug, provider, onUnauthorized],
  );

  const emptyLabel = month.filter.mode === 'all' ? 'todos os meses' : formatMonthLabel(month.filter.key);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-profile flex-1 px-4 pb-12 pt-6">
        <ProfileHeader
          client={client}
          publications={view.total}
          stories={view.stories.length}
          ring={view.ring}
          onOpenStories={() => setStoryStart(view.firstUnseen)}
        />
        <ProfileTabs tab={tab} onChange={setTab} />
        <MonthFilter f={month} />
        <PostGrid posts={view.grid} emptyLabel={emptyLabel} onShowAll={month.showAll} onOpen={openPost} />
        <p className="mt-7 text-center text-xs text-muted">
          <button type="button" onClick={onLogout} className="font-semibold text-link hover:underline">
            Sair
          </button>
        </p>
      </main>
      <Footer />

      {postIndex >= 0 && (
        <PostViewer
          posts={postList}
          index={postIndex}
          client={client}
          onNavigate={navigatePost}
          onClose={closeUrlViewer}
          onSubmitReview={submitReview}
        />
      )}
      {storyIndex >= 0 && storyList.length > 0 && (
        <StoryViewer
          slug={slug}
          stories={storyList}
          startIndex={storyIndex}
          client={client}
          onClose={closeStories}
          onSubmitReview={submitReview}
        />
      )}
      <ToastHost />
    </div>
  );
}
