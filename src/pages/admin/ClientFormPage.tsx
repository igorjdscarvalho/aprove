import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AvatarCropper } from '@/components/admin/AvatarCropper';
import { Spinner } from '@/components/ui/Spinner';
import { mediaUrl } from '@/lib/supabase';
import {
  getClient,
  removeClientAvatar,
  revokeClientSessions,
  saveClient,
  setClientPassword,
  setClientStatus,
  unlockClient,
  uploadClientAvatar,
} from '@/providers/admin/SupabaseAdminProvider';
import type { AdminClientInput } from '@/providers/admin/types';
import type { ClientStatus } from '@/types/domain';

type Draft = Omit<AdminClientInput, 'id'>;

function randomSuffix(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => 'abcdefghijklmnopqrstuvwxyz0123456789'[n % 36]).join('');
}

function slugBase(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 66);
}

function randomPassword(length = 14): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join('');
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

function errorText(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message === 'slug_taken') return 'Esse link já está em uso. Altere o slug e tente novamente.';
  if (message.includes('username')) return 'O @usuário deve usar apenas letras minúsculas, números, ponto ou sublinhado.';
  if (message.includes('password_too_short')) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (message.includes('forbidden') || message.includes('42501')) return 'A conta não tem permissão de administrador para esta ação.';
  return message || 'Não foi possível salvar. Verifique a conexão e tente novamente.';
}

function emptyDraft(suffix: string): Draft {
  return {
    slug: `novo-cliente-${suffix}`,
    name: '',
    username: '',
    bio: '',
    category: '',
    website: '',
    avatar_path: null,
    followers_count: 0,
    following_count: 0,
    status: 'unpublished',
    internal_notes: '',
  };
}

export function ClientFormPage({ clientId }: { clientId?: string }) {
  const navigate = useNavigate();
  const [recordId, setRecordId] = useState(clientId);
  const isNew = !recordId;
  const [form, setForm] = useState<Draft>(() => emptyDraft(randomSuffix()));
  const [initialStatus, setInitialStatus] = useState<ClientStatus>('unpublished');
  const [originalAvatar, setOriginalAvatar] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!clientId);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(!!clientId);
  const [busy, setBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const publishing = form.status === 'published' && initialStatus !== 'published';

  useEffect(() => {
    if (!clientId) return;
    let live = true;
    void getClient(clientId)
      .then((client) => {
        if (!live) return;
        setForm({
          slug: client.slug,
          name: client.name,
          username: client.username,
          bio: client.bio,
          category: client.category,
          website: client.website,
          avatar_path: client.avatar_path,
          followers_count: client.followers_count,
          following_count: client.following_count,
          status: client.status,
          internal_notes: client.internal_notes,
        });
        setInitialStatus(client.status);
        setOriginalAvatar(client.avatar_path);
      })
      .catch((e: unknown) => {
        if (live) setError(errorText(e));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [clientId]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview('');
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const avatarSource = useMemo(
    () => avatarPreview || (form.avatar_path ? mediaUrl(form.avatar_path) : ''),
    [avatarPreview, form.avatar_path],
  );

  function field<K extends keyof Draft>(key: K, value: Draft[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateName(name: string) {
    setForm((current) => ({
      ...current,
      name,
      ...(!slugTouched && !clientId ? { slug: `${slugBase(name) || 'cliente'}-${slugSuffix}` } : {}),
    }));
  }

  async function save(passwordToSet = '') {
    if (busy) return;
    if (passwordToSet && passwordToSet.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    const publishAfterPassword = form.status === 'published' && initialStatus !== 'published';
    const saveStatus: ClientStatus = publishAfterPassword ? 'unpublished' : form.status;
    let savedId = recordId;
    let warning = '';
    try {
      const saved = await saveClient({ ...form, status: saveStatus, ...(savedId ? { id: savedId } : {}) });
      savedId = saved.id;
      setRecordId(saved.id);
      setInitialStatus(saveStatus);

      if (avatarFile) {
        const result = await uploadClientAvatar(saved.id, avatarFile, originalAvatar);
        setOriginalAvatar(result.path);
        setAvatarFile(null);
        field('avatar_path', result.path);
        if (result.cleanupWarning) warning = result.cleanupWarning;
      } else if (originalAvatar && form.avatar_path === null) {
        try {
          await removeClientAvatar(originalAvatar);
          setOriginalAvatar(null);
        } catch {
          warning = 'O perfil foi salvo, mas o avatar antigo não foi removido do Storage.';
        }
      }

      if (passwordToSet.trim()) await setClientPassword(saved.id, passwordToSet.trim());
      if (publishAfterPassword) {
        await setClientStatus(saved.id, 'published');
        setInitialStatus('published');
      }
      setPassword('');
      setPasswordDialog(false);
      navigate('/admin', { state: { notice: warning || (publishAfterPassword ? 'Cliente salvo e publicado.' : 'Cliente salvo.') } });
    } catch (e) {
      if (savedId) {
        setRecordId(savedId);
        if (publishAfterPassword) {
          setInitialStatus('unpublished');
          field('status', 'unpublished');
        }
      }
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (publishing) {
      setPasswordDialog(true);
      setError('');
      return;
    }
    if (password && password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    void save(password);
  }

  async function runClientAction(action: 'revoke' | 'unlock') {
    if (!recordId || actionBusy) return;
    setActionBusy(true);
    setError('');
    setNotice('');
    try {
      if (action === 'revoke') await revokeClientSessions(recordId);
      else await unlockClient(recordId);
      setNotice(action === 'revoke' ? 'Sessões do cliente revogadas.' : 'Acesso do cliente destravado.');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setActionBusy(false);
    }
  }

  async function copyLink() {
    try {
      await copyText(`${window.location.origin}${import.meta.env.BASE_URL}#/c/${form.slug}`);
      setNotice('Link copiado.');
    } catch {
      setError('Não foi possível copiar o link neste navegador.');
    }
  }

  async function copyMessage() {
    if (!password) {
      setError('Digite ou gere uma senha antes de copiar a mensagem.');
      return;
    }
    const link = `${window.location.origin}${import.meta.env.BASE_URL}#/c/${form.slug}`;
    try {
      await copyText(`Olá! Seu perfil para aprovação de conteúdo está disponível em ${link}\nSenha de acesso: ${password}`);
      setNotice('Mensagem com o link e a senha copiada.');
      setError('');
    } catch {
      setError('Não foi possível copiar a mensagem neste navegador.');
    }
  }

  const slugSuffix = useMemo(() => randomSuffix(), []);

  if (loading) return <main className="mx-auto max-w-xl p-6"><Spinner label="Carregando cliente" /></main>;

  return (
    <div className="min-h-screen bg-bg">
      <AdminHeader title={isNew ? 'Novo cliente' : 'Editar cliente'} />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold">{isNew ? 'Criar perfil' : form.name}</h2>
          <p className="mt-1 text-sm text-muted">Os dados ficam salvos no Supabase.</p>
        </div>
        {error && <p role="alert" className="mb-4 rounded-lg border border-bad bg-surface px-3 py-2 text-sm text-bad">{error}</p>}
        {notice && <p className="mb-4 rounded-lg border border-line bg-surface px-3 py-2 text-sm">{notice}</p>}

        <form onSubmit={submit} className="space-y-5">
          <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
            <h3 className="font-bold">Perfil</h3>
            <div className="mt-4 flex flex-col gap-5 sm:flex-row">
              <div className="flex flex-col items-center gap-2 sm:w-36">
                {avatarSource ? (
                  <img src={avatarSource} alt="Prévia do avatar" className="h-24 w-24 rounded-full border border-line object-cover" />
                ) : (
                  <span className="grid h-24 w-24 place-items-center rounded-full bg-line text-3xl font-bold text-muted">{form.name.slice(0, 1).toUpperCase() || '?'}</span>
                )}
                <label className="cursor-pointer text-center text-sm font-semibold text-accent hover:underline">
                  Escolher foto
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.currentTarget.value = '';
                      if (!file) return;
                      if (!file.type.startsWith('image/')) {
                        setError('Escolha um arquivo de imagem.');
                        return;
                      }
                      if (file.size > 20 * 1024 * 1024) {
                        setError('A foto precisa ter até 20 MB.');
                        return;
                      }
                      setError('');
                      setCropFile(file);
                    }}
                  />
                </label>
                {(form.avatar_path || avatarFile) && <button type="button" onClick={() => { setAvatarFile(null); field('avatar_path', null); }} className="text-xs text-muted hover:text-bad">Remover foto</button>}
              </div>
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium sm:col-span-2">Nome do perfil
                  <input required maxLength={80} value={form.name} onChange={(e) => updateName(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg" />
                </label>
                <label className="text-sm font-medium">@usuário
                  <input required maxLength={30} pattern="[a-z0-9._]{1,30}" value={form.username} onChange={(e) => field('username', e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))} className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg" />
                </label>
                <label className="text-sm font-medium">Categoria
                  <input maxLength={60} value={form.category} onChange={(e) => field('category', e.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg" />
                </label>
                <label className="text-sm font-medium sm:col-span-2">Bio <span className="font-normal text-muted">{form.bio.length}/150</span>
                  <textarea maxLength={150} rows={3} value={form.bio} onChange={(e) => field('bio', e.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg" />
                </label>
                <label className="text-sm font-medium sm:col-span-2">Link do perfil
                  <input maxLength={200} value={form.website} onChange={(e) => field('website', e.target.value)} placeholder="seusite.com.br" className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg" />
                </label>
                <label className="text-sm font-medium">Seguidores
                  <input type="number" min={0} step={1} value={form.followers_count} onChange={(e) => field('followers_count', Math.max(0, Number(e.target.value)))} className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg" />
                </label>
                <label className="text-sm font-medium">Seguindo
                  <input type="number" min={0} step={1} value={form.following_count} onChange={(e) => field('following_count', Math.max(0, Number(e.target.value)))} className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg" />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
            <h3 className="font-bold">Acesso do cliente</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium sm:col-span-2">Slug do link
                <input required maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(e) => { setSlugTouched(true); field('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')); }} onBlur={() => field('slug', form.slug.replace(/^-+|-+$/g, ''))} className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-mono text-sm text-fg" />
                <span className="mt-1 block text-xs font-normal text-muted">Link: {window.location.origin}{import.meta.env.BASE_URL}#/c/{form.slug}</span>
              </label>
              <label className="text-sm font-medium sm:col-span-2">Status
                <select value={form.status} onChange={(e) => field('status', e.target.value as ClientStatus)} className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg">
                  <option value="unpublished">Não publicado</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Arquivado</option>
                </select>
                <span className="mt-1 block text-xs font-normal text-muted">Ao publicar, o sistema pede uma senha de pelo menos 8 caracteres.</span>
              </label>
              <label className="text-sm font-medium sm:col-span-2">{isNew ? 'Senha de acesso (opcional)' : 'Definir nova senha (opcional)'}
                <div className="mt-1.5 flex gap-2">
                  <input type="text" autoComplete="new-password" minLength={password ? 8 : undefined} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2.5 text-fg" />
                  <button type="button" onClick={() => setPassword(randomPassword())} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">Gerar</button>
                </div>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                <button type="button" onClick={() => void copyLink()} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">Copiar link</button>
                <button type="button" onClick={() => void copyMessage()} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">Copiar mensagem</button>
                {recordId && <>
                <button type="button" disabled={actionBusy} onClick={() => void runClientAction('revoke')} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">Revogar sessões</button>
                <button type="button" disabled={actionBusy} onClick={() => void runClientAction('unlock')} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">Destravar login</button>
                </>}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
            <h3 className="font-bold">Observações internas</h3>
            <textarea rows={4} value={form.internal_notes} onChange={(e) => field('internal_notes', e.target.value)} className="mt-3 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg" />
            <p className="mt-1 text-xs text-muted">Visíveis apenas no painel administrativo.</p>
          </section>

          <div className="flex flex-wrap justify-end gap-2 pb-8">
            <button type="button" onClick={() => navigate('/admin')} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold">Cancelar</button>
            <button type="submit" disabled={busy} className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Salvando…' : 'Salvar cliente'}</button>
          </div>
        </form>
      </main>

      {cropFile && <AvatarCropper file={cropFile} onCancel={() => setCropFile(null)} onComplete={(file) => { setAvatarFile(file); setCropFile(null); }} />}

      {passwordDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget && !busy) { setPasswordDialog(false); field('status', initialStatus); } }}>
          <section role="dialog" aria-modal="true" aria-labelledby="publish-title" className="w-full max-w-md rounded-2xl bg-bg p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="publish-title" className="text-lg font-bold">Defina a senha do cliente</h2>
            <p className="mt-2 text-sm text-muted">O link só ficará publicado depois que essa senha for salva. Use pelo menos 8 caracteres.</p>
            <label className="mt-4 block text-sm font-medium">Senha de acesso
              <div className="mt-1.5 flex gap-2">
                <input autoFocus type="text" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2.5 text-fg" />
                <button type="button" onClick={() => setPassword(randomPassword())} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">Gerar</button>
              </div>
            </label>
            {error && <p role="alert" className="mt-3 text-sm text-bad">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" disabled={busy} onClick={() => { setPasswordDialog(false); field('status', initialStatus); }} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">Cancelar</button>
              <button type="button" disabled={busy || password.length < 8} onClick={() => void save(password)} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Salvando…' : 'Salvar e publicar'}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
