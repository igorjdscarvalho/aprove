import type { FeedData, ReviewDecision } from '@/types/domain';

export type LoginError = 'unavailable' | 'invalid_password' | 'locked';

export interface GateResult {
  available: boolean;
  name?: string;
  username?: string;
  avatar_path?: string | null;
}

/**
 * Tudo que o lado do cliente precisa. Hoje a implementação é o MockProvider;
 * na Fase 7 entra o SupabaseProvider, sem mudar nenhuma tela (seção 10.0).
 */
export interface ClientDataProvider {
  gate(slug: string): Promise<GateResult>;
  login(slug: string, password: string): Promise<{ ok: boolean; error?: LoginError }>;
  /** Devolve { unauthorized: true } se não houver sessão válida. */
  getFeed(slug: string): Promise<FeedData | { unauthorized: true }>;
  hasToken(slug: string): boolean;
  submitReview(
    slug: string,
    postId: string,
    decision: ReviewDecision,
    comment: string,
    reviewerName: string,
  ): Promise<{ ok: boolean; error?: string }>;
  logout(slug: string): Promise<void>;
}
