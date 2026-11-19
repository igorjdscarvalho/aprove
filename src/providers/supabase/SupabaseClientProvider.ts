import type { FeedData, ReviewDecision } from '@/types/domain';
import { supabase } from '@/lib/supabase';
import type { ClientDataProvider, GateResult, LoginError } from '../types';

const tokenKey = (slug: string) => `supabase:cli_token:${slug.toLowerCase()}`;

function readToken(slug: string): string {
  try {
    return localStorage.getItem(tokenKey(slug)) ?? '';
  } catch {
    return '';
  }
}

function clearToken(slug: string): void {
  try {
    localStorage.removeItem(tokenKey(slug));
  } catch {
    /* localStorage pode estar indisponível */
  }
}

type RpcObject = Record<string, unknown>;

function asObject(value: unknown): RpcObject {
  return value && typeof value === 'object' ? (value as RpcObject) : {};
}

export const supabaseClientProvider: ClientDataProvider = {
  async gate(slug): Promise<GateResult> {
    const { data, error } = await supabase.rpc('client_gate', { p_slug: slug });
    if (error) throw new Error(error.message);
    const result = asObject(data);
    return {
      available: result.available === true,
      name: typeof result.name === 'string' ? result.name : undefined,
      username: typeof result.username === 'string' ? result.username : undefined,
      avatar_path: typeof result.avatar_path === 'string' ? result.avatar_path : null,
    };
  },

  async login(slug, password) {
    const { data, error } = await supabase.rpc('client_login', {
      p_slug: slug,
      p_password: password,
    });
    if (error) throw new Error(error.message);
    const result = asObject(data);
    if (result.ok !== true) {
      const reason = result.error;
      const allowed: LoginError[] = ['unavailable', 'invalid_password', 'locked'];
      return { ok: false, error: allowed.includes(reason as LoginError) ? (reason as LoginError) : 'invalid_password' };
    }

    if (typeof result.token !== 'string' || !result.token) throw new Error('A sessão do cliente não foi criada.');
    try {
      localStorage.setItem(tokenKey(slug), result.token);
    } catch {
      throw new Error('Não foi possível salvar a sessão neste navegador.');
    }
    return { ok: true };
  },

  hasToken(slug) {
    return !!readToken(slug);
  },

  async getFeed(slug): Promise<FeedData | { unauthorized: true }> {
    const token = readToken(slug);
    if (!token) return { unauthorized: true };
    const { data, error } = await supabase.rpc('client_get_feed', { p_token: token });
    if (error) throw new Error(error.message);
    const result = asObject(data);
    if (result.ok !== true || !result.client || !Array.isArray(result.posts)) {
      clearToken(slug);
      return { unauthorized: true };
    }
    return { client: result.client as FeedData['client'], posts: result.posts as FeedData['posts'] };
  },

  async submitReview(slug, postId, decision: ReviewDecision, comment, reviewerName) {
    const token = readToken(slug);
    if (!token) return { ok: false, error: 'unauthorized' };
    try {
      const { data, error } = await supabase.rpc('client_submit_review', {
        p_token: token,
        p_post_id: postId,
        p_decision: decision,
        p_comment: comment,
        p_reviewer_name: reviewerName,
      });
      if (error) throw new Error(error.message);
      const result = asObject(data);
      if (result.ok === true) return { ok: true };
      if (result.error === 'unauthorized') clearToken(slug);
      return { ok: false, error: typeof result.error === 'string' ? result.error : 'network' };
    } catch {
      return { ok: false, error: 'network' };
    }
  },

  async logout(slug) {
    const token = readToken(slug);
    clearToken(slug);
    if (!token) return;
    const { error } = await supabase.rpc('client_logout', { p_token: token });
    if (error) throw new Error(error.message);
  },
};
