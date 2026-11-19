import { useMemo, useState } from 'react';
import { Footer } from '@/components/ui/Footer';
import { MonthFilter } from '@/components/ig/MonthFilter';
import { PostGrid } from '@/components/ig/PostGrid';
import { ProfileHeader } from '@/components/ig/ProfileHeader';
import { ProfileTabs } from '@/components/ig/ProfileTabs';
import type { RingState } from '@/components/ig/Avatar';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { formatMonthLabel } from '@/lib/dates';
import { gridPosts, monthPosts, monthStories, type GridTab } from '@/lib/posts';
import { getSeen } from '@/lib/storiesSeen';
import type { FeedData } from '@/types/domain';

interface Props {
  slug: string;
  feed: FeedData;
  onLogout: () => void;
}

// Bloco 2b: perfil, abas, filtro de mês e grade. Abrir post (2c) e stories (2d) ainda não existem.
export function ClientFeed({ slug, feed, onLogout }: Props) {
  const { client, posts } = feed;
  const month = useMonthFilter();
  const [tab, setTab] = useState<GridTab>('posts');

  const view = useMemo(() => {
    const stories = monthStories(posts, month.filter);
    const seen = getSeen(slug);
    const ring: RingState =
      stories.length === 0 ? 'none' : stories.some((s) => !seen.has(s.id)) ? 'unseen' : 'seen';
    return {
      grid: gridPosts(posts, month.filter, tab),
      total: monthPosts(posts, month.filter).length,
      stories: stories.length,
      ring,
    };
  }, [posts, month.filter, tab, slug]);

  const emptyLabel = month.filter.mode === 'all' ? 'todos os meses' : formatMonthLabel(month.filter.key);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-profile flex-1 px-4 pb-12 pt-6">
        <ProfileHeader client={client} publications={view.total} stories={view.stories} ring={view.ring} />
        <ProfileTabs tab={tab} onChange={setTab} />
        <MonthFilter f={month} />
        <PostGrid posts={view.grid} emptyLabel={emptyLabel} onShowAll={month.showAll} />
        <p className="mt-7 text-center text-xs text-muted">
          <button type="button" onClick={onLogout} className="font-semibold text-link hover:underline">
            Sair
          </button>
        </p>
      </main>
      <Footer />
    </div>
  );
}
