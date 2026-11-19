import { IG } from '@/config/instagram';
import { monthKeyOf } from '@/lib/dates';
import type { MonthFilterState } from '@/hooks/useMonthFilter';
import type { Post, PostType } from '@/types/domain';

export type GridTab = 'posts' | 'reels';

const inFilter = (p: Post, f: MonthFilterState) => f.mode === 'all' || monthKeyOf(p.scheduled_date) === f.key;

/** Publicações do mês (sem stories), em ordem de data decrescente (o feed já vem ordenado). */
export const monthPosts = (posts: Post[], f: MonthFilterState): Post[] =>
  posts.filter((p) => p.type !== 'story' && inFilter(p, f));

export const gridPosts = (posts: Post[], f: MonthFilterState, tab: GridTab): Post[] =>
  monthPosts(posts, f).filter((p) => tab === 'posts' || p.type === 'reel');

/** Stories do filtro, do mais antigo para o mais novo. */
export const monthStories = (posts: Post[], f: MonthFilterState): Post[] =>
  posts
    .filter((p) => p.type === 'story' && inFilter(p, f))
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date) || a.id.localeCompare(b.id));

/** Miniatura da grade: Reels usa a capa; imagem e carrossel usam a 1ª mídia. */
export const thumbPath = (p: Post): string =>
  p.type === 'reel' ? (p.cover_path ?? p.media[0]?.poster_path ?? '') : (p.media[0]?.path ?? '');

/** Proporção (largura/altura) usada para desenhar a mídia do post. */
export const postRatio = (p: Post): number =>
  p.aspect_ratio === '9:16' ? IG.REEL_STORY_RATIO : IG.FEED_RATIOS[p.aspect_ratio];

export const TYPE_LABEL: Record<PostType, string> = {
  image: 'Imagem',
  carousel: 'Carrossel',
  reel: 'Reels',
  story: 'Story',
};
