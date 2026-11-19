import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Spinner } from '@/components/ui/Spinner';
import { MonthFilter } from '@/components/ig/MonthFilter';
import { PostGrid } from '@/components/ig/PostGrid';
import { PostViewer } from '@/components/ig/PostViewer';
import { ProfileHeader } from '@/components/ig/ProfileHeader';
import { ProfileTabs } from '@/components/ig/ProfileTabs';
import { StoryViewer } from '@/components/ig/StoryViewer';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { formatMonthLabel } from '@/lib/dates';
import { gridPosts, monthPosts, monthStories, thumbPath, type GridTab } from '@/lib/posts';
import { mediaSrc } from '@/lib/mediaSrc';
import { listClientPosts, setPostVisibility, deleteClientPost, type AdminPost } from '@/providers/admin/SupabasePostProvider';
import { getClient } from '@/providers/admin/SupabaseAdminProvider';
import type { AdminClient } from '@/providers/admin/types';
import type { ClientProfile } from '@/types/domain';
import type { Post } from '@/types/domain';

type WorkspaceTab = 'feed' | 'posts' | 'settings';
type PostTypeFilter = 'all' | AdminPost['type'];
type StatusFilter = 'all' | AdminPost['approval_status'];

const TYPE_LABEL: Record<AdminPost['type'], string> = { image: 'Imagem', carousel: 'Carrossel', reel: 'Reels', story: 'Story' };
const STATUS_LABEL: Record<AdminPost['approval_status'], string> = {
  pending: 'Pendente', approved: 'Aprovado', changes_requested: 'Ajustes solicitados',
};

function profileOf(client: AdminClient): ClientProfile {
  return {
    name: client.name,
    username: client.username,
    bio: client.bio,
    category: client.category,
    website: client.website,
    avatar_path: client.avatar_path,
    followers_count: client.followers_count,
    following_count: client.following_count,
  };
}

export function ClientWorkspacePage() {
  const { clientId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [client, setClient] = useState<AdminClient | null>(null);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(() => (location.state as { notice?: string } | null)?.notice ?? '');
  const [tab, setTab] = useState<WorkspaceTab>('feed');
  const [gridTab, setGridTab] = useState<GridTab>('posts');
  const [postType, setPostType] = useState<PostTypeFilter>('all');
  const [approvalStatus, setApprovalStatus] = useState<StatusFilter>('all');
  const [listMonth, setListMonth] = useState('all');
  const [viewerPostId, setViewerPostId] = useState<string | null>(null);
  const [storyStart, setStoryStart] = useState<number | null>(null);
  const month = useMonthFilter();

  const refresh = useCallback(async () => {
    setError('');
    try {
      const [clientRecord, postRecords] = await Promise.all([getClient(clientId), listClientPosts(clientId)]);
      setClient(clientRecord);
      setPosts(postRecords);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o espaço do cliente.');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const publicPosts = useMemo(() => posts.filter((post) => post.is_visible), [posts]);
  const feedStories = useMemo(() => monthStories(publicPosts, month.filter), [publicPosts, month.filter]);
  const shownPosts = useMemo(() => gridPosts(publicPosts, month.filter, gridTab), [publicPosts, month.filter, gridTab]);
  const selectedPost = shownPosts.find((post) => post.id === viewerPostId);
  const selectedIndex = selectedPost ? shownPosts.findIndex((post) => post.id === selectedPost.id) : -1;
  const filteredPosts = useMemo(() => posts.filter((post) => {
    const monthMatches = listMonth === 'all' || post.scheduled_date.slice(0, 7) === listMonth;
    return (postType === 'all' || post.type === postType) &&
      (approvalStatus === 'all' || post.approval_status === approvalStatus) && monthMatches;
  }), [posts, listMonth, postType, approvalStatus]);
  const monthOptions = useMemo(() => [...new Set(posts.map((post) => post.scheduled_date.slice(0, 7)))].sort().reverse(), [posts]);

  async function toggleVisibility(post: AdminPost) {
    try {
      await setPostVisibility(post.id, !post.is_visible);
      setNotice(post.is_visible ? 'Publicação ocultada do cliente.' : 'Publicação visível para o cliente.');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível alterar a visibilidade.');
    }
  }

  async function removePost(post: AdminPost) {
    if (!window.confirm(`Excluir esta publicação de ${client?.name ?? 'cliente'}? O arquivo também será removido do Storage.`)) return;
    try {
      const result = await deleteClientPost(post.id);
      setNotice(result.warning ?? 'Publicação excluída.');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível excluir a publicação.');
    }
  }

  async function openClientView() {
    if (!client) return;
    const url = `${window.location.origin}${import.meta.env.BASE_URL}#/c/${client.slug}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function editPost(post: Post) {
    navigate(`/admin/clients/${clientId}/posts/${post.id}`);
  }

  const tabClass = (active: boolean) => `border-b-2 px-3 py-3 text-sm font-semibold ${active ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-fg'}`;
  const emptyLabel = month.filter.mode === 'all' ? 'todos os meses' : formatMonthLabel(month.filter.key);

  if (loading) return <Spinner label="Carregando espaço do cliente" />;
  if (!client) return <div className="mx-auto max-w-3xl p-6"><p role="alert" className="text-bad">{error || 'Cliente não encontrado.'}</p><Link to="/admin" className="mt-4 inline-block font-semibold text-accent">Voltar ao dashboard</Link></div>;

  const profile = profileOf(client);
  const activeStoryIndex = storyStart === null ? -1 : storyStart;

  return (
    <div className="min-h-screen bg-bg">
      <AdminHeader
        title={client.name}
        action={<button type="button" onClick={() => void openClientView()} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">Ver como cliente</button>}
      />
      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        {(error || notice) && (
          <div className={`mb-4 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${error ? 'border-bad text-bad' : 'border-line'}`}>
            <span role={error ? 'alert' : 'status'}>{error || notice}</span>
            <button type="button" onClick={() => { setError(''); setNotice(''); }} aria-label="Fechar aviso">×</button>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">@{client.username} · {client.slug}</p>
            <h2 className="mt-1 text-xl font-bold">Espaço do cliente</h2>
          </div>
          <span className={`rounded-full border border-line px-3 py-1 text-xs font-semibold ${client.status === 'published' ? 'text-ok' : 'text-muted'}`}>
            {client.status === 'published' ? 'Publicado' : client.status === 'archived' ? 'Arquivado' : 'Não publicado'}
          </span>
        </div>

        <nav className="mt-5 flex gap-2 overflow-x-auto border-b border-line" aria-label="Abas do espaço do cliente">
          {([['feed', 'Feed'], ['posts', 'Publicações'], ['settings', 'Configurações']] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined} className={tabClass(tab === id)}>{label}</button>
          ))}
        </nav>

        {tab === 'feed' && (
          <section className="mx-auto max-w-profile pt-5">
            <ProfileHeader
              client={profile}
              publications={monthPosts(publicPosts, month.filter).length}
              stories={feedStories.length}
              ring={feedStories.length ? 'unseen' : 'none'}
              onOpenStories={() => setStoryStart(0)}
            />
            <ProfileTabs tab={gridTab} onChange={setGridTab} />
            <MonthFilter f={month} />
            <PostGrid posts={shownPosts} emptyLabel={emptyLabel} onShowAll={month.showAll} onOpen={(index) => setViewerPostId(shownPosts[index]?.id ?? null)} />
          </section>
        )}

        {tab === 'posts' && (
          <section className="pt-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Publicações</h3>
                <p className="mt-1 text-sm text-muted">{posts.length} no total · {publicPosts.length} visíveis para o cliente</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['image', 'carousel', 'reel', 'story'] as const).map((type) => (
                  <Link key={type} to={`/admin/clients/${clientId}/posts/new?type=${type}`} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">+ {TYPE_LABEL[type]}</Link>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <label className="text-sm">Tipo
                <select value={postType} onChange={(event) => setPostType(event.target.value as PostTypeFilter)} className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2">
                  <option value="all">Todos os tipos</option>{Object.entries(TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="text-sm">Avaliação
                <select value={approvalStatus} onChange={(event) => setApprovalStatus(event.target.value as StatusFilter)} className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2">
                  <option value="all">Todos os status</option>{Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="text-sm">Mês
                <select value={listMonth} onChange={(event) => setListMonth(event.target.value)} className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2">
                  <option value="all">Todos os meses</option>{monthOptions.map((key) => <option key={key} value={key}>{formatMonthLabel(key)}</option>)}
                </select>
              </label>
            </div>
            {filteredPosts.length ? (
              <ul className="mt-4 space-y-3">
                {filteredPosts.map((post) => (
                  <li key={post.id} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:flex-row sm:items-center">
                    <div className="h-24 w-20 shrink-0 overflow-hidden rounded bg-line">
                      {post.media[0] && <img src={mediaSrc(thumbPath(post))} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong>{TYPE_LABEL[post.type]}</strong>
                        <span className="text-xs text-muted">{post.scheduled_date}{post.scheduled_time ? ` · ${post.scheduled_time.slice(0, 5)}` : ''}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted">{post.caption || 'Sem legenda'}</p>
                      <p className="mt-1 text-xs text-muted">{post.is_visible ? 'Visível ao cliente' : 'Rascunho oculto'} · {STATUS_LABEL[post.approval_status]} · Revisão {post.revision}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => navigate(`/admin/clients/${clientId}/posts/${post.id}`)} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">Editar</button>
                      <button type="button" onClick={() => void toggleVisibility(post)} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">{post.is_visible ? 'Ocultar' : 'Mostrar'}</button>
                      <button type="button" onClick={() => void removePost(post)} className="rounded-lg border border-bad px-3 py-2 text-sm font-semibold text-bad">Excluir</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-8 rounded-lg border border-dashed border-line p-8 text-center text-sm text-muted">Nenhuma publicação corresponde a esses filtros.</p>}
          </section>
        )}

        {tab === 'settings' && (
          <section className="mt-5 rounded-xl border border-line bg-surface p-5">
            <h3 className="text-lg font-bold">Configurações do cliente</h3>
            <p className="mt-1 text-sm text-muted">Edite o perfil, avatar, senha e status de publicação.</p>
            <Link to={`/admin/clients/${clientId}/edit`} className="mt-4 inline-block rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white">Editar perfil e acesso</Link>
          </section>
        )}
      </main>

      {selectedPost && selectedIndex >= 0 && (
        <PostViewer
          posts={shownPosts}
          index={selectedIndex}
          client={profile}
          onNavigate={(index) => setViewerPostId(shownPosts[index]?.id ?? null)}
          onClose={() => setViewerPostId(null)}
          adminPreview
          onEdit={editPost}
        />
      )}
      {storyStart !== null && feedStories.length > 0 && (
        <StoryViewer
          slug={client.slug}
          stories={feedStories}
          startIndex={activeStoryIndex >= 0 ? activeStoryIndex : 0}
          client={profile}
          onClose={() => setStoryStart(null)}
          adminPreview
          onEdit={editPost}
        />
      )}
    </div>
  );
}
