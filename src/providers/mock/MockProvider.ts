import type { FeedData, Post, ReviewDecision } from '@/types/domain';
import type { ClientDataProvider, GateResult } from '../types';
import { buildSeed, MOCK_VERSION, type MockState } from './seed';

const STATE_KEY = 'mock:state';
const SESSIONS_KEY = 'mock:sessions';
const FAILS_KEY = 'mock:fails';
const tokenKey = (slug: string) => `cli_token:${slug}`;

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

const wait = () => new Promise<void>((r) => setTimeout(r, 150 + Math.random() * 250));

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* cota cheia ou localStorage indisponível: segue só em memória */
  }
}

let memory: MockState | null = null;

function state(): MockState {
  if (memory) return memory;
  const saved = read<MockState | null>(STATE_KEY, null);
  memory = saved && saved.v === MOCK_VERSION ? saved : buildSeed();
  save();
  return memory;
}

function save(): void {
  if (memory) write(STATE_KEY, memory);
}

/** Apaga tudo do protótipo e recria os dados de exemplo ("Resetar dados de exemplo"). */
export function resetMock(): void {
  memory = null;
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('mock:') || k.startsWith('cli_token:')) localStorage.removeItem(k);
    }
  } catch {
    /* ignora */
  }
  state();
}

type Sessions = Record<string, { slug: string; expires: number }>;

function randomToken(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return 'mock-' + Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

function findClient(slug: string) {
  return state().clients.find((c) => c.slug === slug.toLowerCase());
}

/** Resolve o token guardado -> cliente publicado (ou null). Espelha `_session_client`. */
function sessionClient(slug: string) {
  let token = '';
  try {
    token = localStorage.getItem(tokenKey(slug)) ?? '';
  } catch {
    /* ignora */
  }
  if (!token) return null;
  const s = read<Sessions>(SESSIONS_KEY, {})[token];
  if (!s || s.slug !== slug || s.expires < Date.now()) return null;
  const c = findClient(slug);
  return c && c.status === 'published' ? c : null;
}

function recentFails(slug: string): number[] {
  const all = read<Record<string, number[]>>(FAILS_KEY, {});
  return (all[slug] ?? []).filter((t) => t > Date.now() - LOCK_MS);
}

function setFails(slug: string, list: number[]): void {
  const all = read<Record<string, number[]>>(FAILS_KEY, {});
  all[slug] = list;
  write(FAILS_KEY, all);
}

export const mockClientProvider: ClientDataProvider = {
  async gate(slug): Promise<GateResult> {
    await wait();
    const c = findClient(slug);
    // Inexistente, não publicado e arquivado: resposta idêntica (seção 4.2).
    if (!c || c.status !== 'published') return { available: false };
    return { available: true, name: c.name, username: c.username, avatar_path: c.avatar_path };
  },

  async login(slug, password) {
    await wait();
    const c = findClient(slug);
    if (!c || c.status !== 'published') return { ok: false, error: 'unavailable' };

    const fails = recentFails(c.slug);
    if (fails.length >= MAX_FAILS) return { ok: false, error: 'locked' };

    if (password !== c.password) {
      setFails(c.slug, [...fails, Date.now()]);
      return { ok: false, error: 'invalid_password' };
    }

    const token = randomToken();
    const sessions = read<Sessions>(SESSIONS_KEY, {});
    for (const t of Object.keys(sessions)) if (sessions[t].expires < Date.now()) delete sessions[t];
    sessions[token] = { slug: c.slug, expires: Date.now() + SESSION_MS };
    write(SESSIONS_KEY, sessions);
    setFails(c.slug, []);
    try {
      localStorage.setItem(tokenKey(c.slug), token);
    } catch {
      /* ignora */
    }
    return { ok: true };
  },

  hasToken(slug) {
    try {
      return !!localStorage.getItem(tokenKey(slug));
    } catch {
      return false;
    }
  },

  async getFeed(slug): Promise<FeedData | { unauthorized: true }> {
    await wait();
    const c = sessionClient(slug);
    if (!c) {
      try {
        localStorage.removeItem(tokenKey(slug));
      } catch {
        /* ignora */
      }
      return { unauthorized: true };
    }
    const posts: Post[] = state()
      .posts.filter((p) => p.client_id === c.id && p.is_visible)
      .sort(
        (a, b) =>
          b.scheduled_date.localeCompare(a.scheduled_date) ||
          (b.scheduled_time ?? '').localeCompare(a.scheduled_time ?? ''),
      )
      .map(({ client_id: _c, is_visible: _v, ...post }) => ({
        ...post,
        reviews: [...post.reviews].sort((x, y) => y.created_at.localeCompare(x.created_at)),
      }));
    return {
      client: {
        name: c.name,
        username: c.username,
        bio: c.bio,
        category: c.category,
        website: c.website,
        avatar_path: c.avatar_path,
        followers_count: c.followers_count,
        following_count: c.following_count,
      },
      posts,
    };
  },

  async submitReview(slug, postId, decision: ReviewDecision, comment, reviewerName) {
    await wait();
    const c = sessionClient(slug);
    if (!c) return { ok: false, error: 'unauthorized' };
    const p = state().posts.find((x) => x.id === postId && x.client_id === c.id && x.is_visible);
    if (!p) return { ok: false, error: 'not_found' };
    const text = comment.trim();
    if (decision === 'changes_requested' && !text) return { ok: false, error: 'comment_required' };
    if (text.length > 2000) return { ok: false, error: 'comment_too_long' };
    p.reviews.push({
      decision,
      comment: decision === 'approved' ? '' : text,
      reviewer_name: reviewerName.trim().slice(0, 60),
      revision: p.revision,
      created_at: new Date().toISOString(),
    });
    p.approval_status = decision;
    save();
    return { ok: true };
  },

  async logout(slug) {
    await wait();
    let token = '';
    try {
      token = localStorage.getItem(tokenKey(slug)) ?? '';
      localStorage.removeItem(tokenKey(slug));
    } catch {
      /* ignora */
    }
    if (token) {
      const sessions = read<Sessions>(SESSIONS_KEY, {});
      delete sessions[token];
      write(SESSIONS_KEY, sessions);
    }
  },
};
