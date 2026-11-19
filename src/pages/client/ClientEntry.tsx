import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ProfileSkeleton } from '@/components/ig/ProfileSkeleton';
import { Spinner } from '@/components/ui/Spinner';
import { mockClientProvider } from '@/providers/mock/MockProvider';
import { MOCK_CLIENT_SLUGS } from '@/providers/mock/seed';
import { supabaseClientProvider } from '@/providers/supabase/SupabaseClientProvider';
import type { ClientDataProvider } from '@/providers/types';
import type { FeedData } from '@/types/domain';
import { ClientFeed } from './ClientFeed';
import { Gate } from './Gate';
import { Unavailable } from './Unavailable';

type View =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'error' }
  | { kind: 'gate'; name: string; username: string; avatar: string | null }
  | { kind: 'feed'; feed: FeedData };

// Rota do cliente: gate -> senha -> feed. Nada do admin é renderizado aqui (seção 13).
export function ClientEntry() {
  // Rota `/c/:slug/*`: o resto do caminho pode ser `p/:postId` (deep link de uma publicação).
  const { slug = '', '*': rest = '' } = useParams();
  const postId = /^p\/([^/]+)/.exec(rest)?.[1] ?? null;
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [provider, setProvider] = useState<ClientDataProvider | null>(null);

  const start = useCallback(async () => {
    setView({ kind: 'loading' });
    setProvider(null);
    try {
      const realGate = await supabaseClientProvider.gate(slug);
      let activeProvider: ClientDataProvider = supabaseClientProvider;
      let g = realGate;

      // Mantém as duas rotas de demonstração da E1; links reais sempre consultam o Supabase.
      if (!realGate.available && (MOCK_CLIENT_SLUGS as readonly string[]).includes(slug.toLowerCase())) {
        activeProvider = mockClientProvider;
        g = await mockClientProvider.gate(slug);
      }
      setProvider(activeProvider);
      if (!g.available) return setView({ kind: 'unavailable' });

      if (activeProvider.hasToken(slug)) {
        const f = await activeProvider.getFeed(slug);
        if (!('unauthorized' in f)) return setView({ kind: 'feed', feed: f });
      }
      setView({ kind: 'gate', name: g.name ?? '', username: g.username ?? '', avatar: g.avatar_path ?? null });
    } catch {
      setView({ kind: 'error' });
    }
  }, [slug]);

  useEffect(() => {
    void start();
  }, [start]);

  async function enterFeed() {
    setView({ kind: 'loading' });
    try {
      if (!provider) return void setView({ kind: 'error' });
      const f = await provider.getFeed(slug);
      if ('unauthorized' in f) return void start();
      setView({ kind: 'feed', feed: f });
    } catch {
      setView({ kind: 'error' });
    }
  }

  async function leave() {
    try {
      await provider?.logout(slug);
    } catch {
      // O token local já foi apagado pelo provider; a tela deve voltar ao gate mesmo se o RPC falhar.
    }
    void start();
  }

  switch (view.kind) {
    case 'loading':
      // Com sessão guardada o feed vem a seguir: mostra o esqueleto do perfil.
      return provider?.hasToken(slug) ? (
        <ProfileSkeleton />
      ) : (
        <div className="flex min-h-screen items-center justify-center">
          <Spinner />
        </div>
      );
    case 'unavailable':
      return <Unavailable />;
    case 'error':
      return <Unavailable onRetry={() => void start()} />;
    case 'gate':
      return (
        <Gate
          name={view.name}
          avatarPath={view.avatar}
          onLogin={async (pw) =>
            provider ? provider.login(slug, pw) : { ok: false, error: 'unavailable' }
          }
          onUnavailable={() => setView({ kind: 'unavailable' })}
          onSuccess={() => void enterFeed()}
        />
      );
    case 'feed':
      return (
        <ClientFeed
          slug={slug}
          postId={postId}
          feed={view.feed}
          provider={provider ?? mockClientProvider}
          onLogout={() => void leave()}
          onUnauthorized={() => void start()}
        />
      );
    default:
      return null;
  }
}
