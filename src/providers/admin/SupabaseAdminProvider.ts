import { supabase } from '@/lib/supabase';
import type { AdminClient, AdminClientInput, ClientSummary } from './types';

const CLIENT_COLUMNS =
  'id,slug,name,username,bio,category,website,avatar_path,followers_count,following_count,status,internal_notes,created_at,updated_at';

function fail(error: { message: string; code?: string }): never {
  if (error.code === '23505') throw new Error('slug_taken');
  throw new Error(error.message);
}

export async function verifyAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) throw new Error(error.message);
  return data === true;
}

export async function checkClientGate(slug: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('client_gate', { p_slug: slug });
  if (error) fail(error);
  return (data as { available?: boolean } | null)?.available === true;
}

export async function listClients(): Promise<ClientSummary[]> {
  const [clientsResult, countersResult] = await Promise.all([
    supabase.from('clients').select(CLIENT_COLUMNS).order('updated_at', { ascending: false }),
    supabase.rpc('admin_client_counters'),
  ]);
  if (clientsResult.error) fail(clientsResult.error);
  if (countersResult.error) fail(countersResult.error);

  const counts = new Map<string, { pending: number; changes_requested: number; approved: number; unread_reviews: number }>();
  for (const row of countersResult.data ?? []) {
    counts.set(row.client_id, {
      pending: Number(row.pending),
      changes_requested: Number(row.changes_requested),
      approved: Number(row.approved),
      unread_reviews: Number(row.unread_reviews),
    });
  }

  return (clientsResult.data ?? []).map((row) => ({
    ...(row as unknown as AdminClient),
    ...(counts.get(row.id) ?? { pending: 0, changes_requested: 0, approved: 0, unread_reviews: 0 }),
  }));
}

export async function getClient(id: string): Promise<AdminClient> {
  const { data, error } = await supabase.from('clients').select(CLIENT_COLUMNS).eq('id', id).single();
  if (error) fail(error);
  return data as unknown as AdminClient;
}

export async function saveClient(input: AdminClientInput): Promise<AdminClient> {
  const { id, ...values } = input;
  const result = id
    ? await supabase.from('clients').update(values).eq('id', id).select(CLIENT_COLUMNS).single()
    : await supabase.from('clients').insert(values).select(CLIENT_COLUMNS).single();
  if (result.error) fail(result.error);
  return result.data as unknown as AdminClient;
}

export async function setClientStatus(id: string, status: AdminClient['status']): Promise<void> {
  const { error } = await supabase.from('clients').update({ status }).eq('id', id);
  if (error) fail(error);
}

export async function setClientPassword(id: string, password: string): Promise<void> {
  const { error } = await supabase.rpc('admin_set_client_password', {
    p_client_id: id,
    p_password: password,
  });
  if (error) fail(error);
}

export async function revokeClientSessions(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_revoke_sessions', { p_client_id: id });
  if (error) fail(error);
}

export async function unlockClient(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_unlock_client', { p_client_id: id });
  if (error) fail(error);
}

export async function uploadClientAvatar(id: string, file: File, oldPath: string | null): Promise<{ path: string; cleanupWarning?: string }> {
  const path = `avatars/${id}/${crypto.randomUUID()}.jpg`;
  const storage = supabase.storage.from('media');
  const upload = await storage.upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (upload.error) fail(upload.error);

  const update = await supabase.from('clients').update({ avatar_path: path }).eq('id', id);
  if (update.error) {
    await storage.remove([path]);
    fail(update.error);
  }

  if (oldPath && oldPath !== path) {
    const removed = await storage.remove([oldPath]);
    if (removed.error) return { path, cleanupWarning: 'O avatar foi atualizado, mas o arquivo anterior não foi removido do Storage.' };
  }
  return { path };
}

export async function removeClientAvatar(path: string): Promise<void> {
  const { error } = await supabase.storage.from('media').remove([path]);
  if (error) fail(error);
}

export async function deleteClient(id: string, avatarPath: string | null): Promise<string | null> {
  const { data: posts, error: postsError } = await supabase.from('posts').select('id,cover_path').eq('client_id', id);
  if (postsError) fail(postsError);
  const postIds = (posts ?? []).map((post) => post.id);
  const mediaRows = postIds.length
    ? await supabase.from('post_media').select('path,poster_path').in('post_id', postIds)
    : { data: [], error: null };
  if (mediaRows.error) fail(mediaRows.error);
  const paths = new Set<string>();
  if (avatarPath) paths.add(avatarPath);
  for (const post of posts ?? []) if (post.cover_path) paths.add(post.cover_path);
  for (const media of mediaRows.data ?? []) {
    paths.add(media.path);
    if (media.poster_path) paths.add(media.poster_path);
  }

  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) fail(error);
  if (paths.size === 0) return null;

  const storage = supabase.storage.from('media');
  const objects = [...paths];
  for (let i = 0; i < objects.length; i += 1000) {
    const { error: removeError } = await storage.remove(objects.slice(i, i + 1000));
    if (removeError) return 'O cliente foi excluído, mas alguns arquivos do Storage não foram removidos.';
  }
  return null;
}
