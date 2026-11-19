import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Spinner } from '@/components/ui/Spinner';
import { mediaUrl } from '@/lib/supabase';
import { checkClientGate, deleteClient, listClients, setClientStatus } from '@/providers/admin/SupabaseAdminProvider';
import type { ClientSummary } from '@/providers/admin/types';

type Filter = 'all' | 'published' | 'unpublished' | 'archived';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'published', label: 'Publicados' },
  { id: 'unpublished', label: 'Não publicados' },
  { id: 'archived', label: 'Arquivados' },
];

function statusLabel(status: ClientSummary['status']): string {
  return status === 'published' ? 'Publicado' : status === 'archived' ? 'Arquivado' : 'Não publicado';
}

function clientLink(slug: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}#/c/${slug}`;
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement('textarea');
  input.value = value;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.append(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

export function AdminDashboard() {
  const location = useLocation();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState(() => (location.state as { notice?: string } | null)?.notice ?? '');
  const [deleteTarget, setDeleteTarget] = useState<ClientSummary | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [gateBusyId, setGateBusyId] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    try {
      setClients(await listClients());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar os clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR');
    return clients.filter((client) => {
      const matchesFilter = filter === 'all' || client.status === filter;
      const matchesQuery =
        !q || `${client.name} ${client.username} ${client.slug}`.toLocaleLowerCase('pt-BR').includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [clients, filter, query]);

  async function archive(client: ClientSummary) {
    if (!window.confirm(`Arquivar ${client.name}? O cliente não poderá acessar o link enquanto estiver arquivado.`)) return;
    setError('');
    try {
      await setClientStatus(client.id, 'archived');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível arquivar o cliente.');
    }
  }

  async function removeClient() {
    if (!deleteTarget || deleteName !== deleteTarget.name || deleting) return;
    setDeleting(true);
    setError('');
    try {
      const warning = await deleteClient(deleteTarget.id, deleteTarget.avatar_path);
      setDeleteTarget(null);
      setDeleteName('');
      if (warning) setNotice(warning);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível excluir o cliente.');
    } finally {
      setDeleting(false);
    }
  }

  async function copyLink(client: ClientSummary) {
    try {
      await copyText(clientLink(client.slug));
      setNotice(`Link de ${client.name} copiado.`);
    } catch {
      setError('Não foi possível copiar o link neste navegador.');
    }
  }

  async function testLink(client: ClientSummary) {
    setGateBusyId(client.id);
    setError('');
    try {
      const available = await checkClientGate(client.slug);
      setNotice(available ? `client_gate: ${client.slug} está disponível.` : `client_gate: ${client.slug} está indisponível.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível verificar o link.');
    } finally {
      setGateBusyId('');
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <AdminHeader
        title="Clientes"
        action={<Link to="/admin/clients/new" className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">Novo cliente</Link>}
      />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {error && <p role="alert" className="mb-4 rounded-lg border border-bad bg-surface px-3 py-2 text-sm text-bad">{error}</p>}
        {notice && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice('')} aria-label="Fechar aviso" className="font-bold">×</button>
          </div>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Seus clientes</h2>
            <p className="mt-1 text-sm text-muted">Gerencie perfis e acompanhe as aprovações pendentes.</p>
          </div>
          <label className="block w-full text-sm sm:max-w-xs">
            Buscar cliente
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome, @usuário ou link"
              className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-fg"
            />
          </label>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto border-b border-line" role="tablist" aria-label="Filtrar clientes">
          {FILTERS.map((item) => {
            const count = item.id === 'all' ? clients.length : clients.filter((client) => client.status === item.id).length;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                onClick={() => setFilter(item.id)}
                className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold ${filter === item.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-fg'}`}
              >
                {item.label} <span className="ml-1 text-xs opacity-75">{count}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <Spinner label="Carregando clientes" />
        ) : visible.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-line p-8 text-center">
            <h3 className="font-semibold">{clients.length ? 'Nenhum cliente encontrado' : 'Ainda não há clientes'}</h3>
            <p className="mt-1 text-sm text-muted">{clients.length ? 'Tente outro filtro ou termo de busca.' : 'Crie o primeiro perfil para começar.'}</p>
            {!clients.length && <Link to="/admin/clients/new" className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">Novo cliente</Link>}
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {visible.map((client) => (
              <li key={client.id} className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
                {client.avatar_path ? (
                  <img src={mediaUrl(client.avatar_path)} alt="" className="h-14 w-14 shrink-0 rounded-full border border-line object-cover" />
                ) : (
                  <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-line text-lg font-bold text-muted">{client.name.slice(0, 1).toUpperCase()}</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-bold">{client.name}</h3>
                    <span className={`rounded-full border border-line bg-bg px-2.5 py-1 text-xs font-semibold ${client.status === 'published' ? 'text-ok' : client.status === 'archived' ? 'text-muted' : 'text-warn'}`}>
                      {statusLabel(client.status)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">@{client.username} · /{client.slug}</p>
                  <p className="mt-2 text-xs text-muted">
                    {client.pending} pendentes · {client.changes_requested} ajustes · {client.approved} aprovados
                    {client.unread_reviews > 0 && <span className="ml-2 font-semibold text-accent">{client.unread_reviews} retornos não lidos</span>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Link to={`/admin/clients/${client.id}`} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-bg">Abrir</Link>
                  <Link to={`/admin/clients/${client.id}/edit`} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-bg">Editar</Link>
                  <button type="button" disabled={gateBusyId === client.id} onClick={() => void testLink(client)} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-bg disabled:opacity-50">{gateBusyId === client.id ? 'Verificando…' : 'Testar link'}</button>
                  <button type="button" onClick={() => void copyLink(client)} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-bg">Copiar link</button>
                  {client.status !== 'archived' && <button type="button" onClick={() => void archive(client)} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted hover:bg-bg">Arquivar</button>}
                  <button type="button" onClick={() => { setDeleteTarget(client); setDeleteName(''); }} className="rounded-lg border border-bad px-3 py-2 text-sm font-semibold text-bad hover:bg-bg">Excluir</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteTarget(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-md rounded-2xl bg-bg p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="delete-title" className="text-lg font-bold">Excluir {deleteTarget.name}?</h2>
            <p className="mt-2 text-sm text-muted">Essa ação remove o cliente e os dados relacionados. Digite o nome completo para confirmar.</p>
            <input value={deleteName} onChange={(e) => setDeleteName(e.target.value)} className="mt-4 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-fg" aria-label="Digite o nome do cliente" />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">Cancelar</button>
              <button type="button" disabled={deleting || deleteName !== deleteTarget.name} onClick={() => void removeClient()} className="rounded-lg bg-bad px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{deleting ? 'Excluindo…' : 'Excluir cliente'}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
