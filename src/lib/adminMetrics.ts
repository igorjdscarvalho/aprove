import type { PostType } from '@/types/domain';
import type { AdminPost } from '@/providers/admin/SupabasePostProvider';

export interface PostMetrics {
  evaluated: number;
  approvedFirst: number;
  rejected: number;
  adjustments: number;
  resends: number;
}

export interface ClientMetrics extends PostMetrics {
  byType: Record<PostType, PostMetrics>;
}

function emptyMetrics(): PostMetrics {
  return { evaluated: 0, approvedFirst: 0, rejected: 0, adjustments: 0, resends: 0 };
}

function addPost(metrics: PostMetrics, post: AdminPost): void {
  const history = [...post.reviews].sort((a, b) =>
    a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  );
  const changes = history.filter((review) => review.decision === 'changes_requested').length;

  if (history.length) {
    metrics.evaluated += 1;
    if (history[0].decision === 'approved') metrics.approvedFirst += 1;
    if (changes) metrics.rejected += 1;
  }
  metrics.adjustments += changes;
  metrics.resends += Math.max(0, post.revision - 1);
}

/** D21: considera apenas conteúdos visíveis ao cliente e conta histórico por publicação. */
export function calculateClientMetrics(posts: AdminPost[]): ClientMetrics {
  const byType: Record<PostType, PostMetrics> = {
    image: emptyMetrics(),
    carousel: emptyMetrics(),
    reel: emptyMetrics(),
    story: emptyMetrics(),
  };
  const total = emptyMetrics();

  for (const post of posts) {
    if (!post.is_visible) continue;
    addPost(byType[post.type], post);
    addPost(total, post);
  }

  return { ...total, byType };
}
