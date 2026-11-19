import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { clientProvider as provider } from '@/providers';
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
  const { slug = '' } = useParams();
  const [view, setView] = useState<View>({ kind: 'loading' });

  const start = useCallback(async () => {
    setView({ kind: 'loading' });
    try {
      const g = await provider.gate(slug);
      if (!g.available) return setView({ kind: 'unavailable' });

      if (provider.hasToken(slug)) {
        const f = await provider.getFeed(slug);
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
      const f = await provider.getFeed(slug);
      if ('unauthorized' in f) return void start();
      setView({ kind: 'feed', feed: f });
    } catch {
      setView({ kind: 'error' });
    }
  }

  async function leave() {
    await provider.logout(slug);
    void start();
  }

  switch (view.kind) {
    case 'loading':
      return (
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
          onLogin={(pw) => provider.login(slug, pw)}
          onUnavailable={() => setView({ kind: 'unavailable' })}
          onSuccess={() => void enterFeed()}
        />
      );
    case 'feed':
      return <ClientFeed slug={slug} feed={view.feed} onLogout={() => void leave()} />;
    default:
      return null;
  }
}
