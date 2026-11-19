import { supabase } from '@/lib/supabase';
import { copyMediaPath, removeMediaPaths } from '@/lib/storage';
import type { ApprovalStatus, AspectRatio, Media, Post, PostType, Review } from '@/types/domain';

export interface AdminMedia extends Media {
  mime: string;
  size_bytes: number;
}

export type AdminPost = Omit<Post, 'media' | 'reviews'> & {
  media: AdminMedia[];
  reviews: AdminReview[];
  client_id: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export interface AdminReview extends Review {
  id: string;
  client_id: string;
  post_id: string;
  read_at: string | null;
}

export interface AdminPostInput {
  id: string;
  client_id: string;
  type: PostType;
  caption: string;
  location: string;
  audio_name: string;
  scheduled_date: string;
  scheduled_time: string | null;
  is_visible: boolean;
  approval_status: ApprovalStatus;
  revision: number;
  aspect_ratio: AspectRatio;
  cover_path: string | null;
  grid_crop_x: number;
  grid_crop_y: number;
  story_seconds: number;
}

export interface AdminMediaInput extends AdminMedia {}

function fail(error: { message: string; code?: string }): never {
  throw new Error(error.message || error.code || 'Falha ao acessar as publicações.');
}

function mapMedia(row: Record<string, unknown>): AdminMedia {
  return {
    id: String(row.id),
    position: Number(row.position ?? 0),
    kind: row.kind === 'video' ? 'video' : 'image',
    path: String(row.path ?? ''),
    poster_path: typeof row.poster_path === 'string' ? row.poster_path : null,
    width: row.width == null ? null : Number(row.width),
    height: row.height == null ? null : Number(row.height),
    duration: row.duration_seconds == null ? null : Number(row.duration_seconds),
    mime: String(row.mime ?? ''),
    size_bytes: Number(row.size_bytes ?? 0),
  };
}

function mapReview(row: Record<string, unknown>): AdminReview {
  return {
    id: String(row.id),
    post_id: String(row.post_id),
    client_id: String(row.client_id),
    decision: row.decision === 'approved' ? 'approved' : 'changes_requested',
    comment: String(row.comment ?? ''),
    reviewer_name: String(row.reviewer_name ?? ''),
    revision: Number(row.revision ?? 1),
    created_at: String(row.created_at ?? ''),
    read_at: typeof row.read_at === 'string' ? row.read_at : null,
  };
}

function mapPost(row: Record<string, unknown>, media: AdminMedia[], reviews: AdminReview[]): AdminPost {
  return {
    id: String(row.id),
    client_id: String(row.client_id),
    type: row.type as PostType,
    caption: String(row.caption ?? ''),
    location: String(row.location ?? ''),
    audio_name: String(row.audio_name ?? ''),
    scheduled_date: String(row.scheduled_date),
    scheduled_time: typeof row.scheduled_time === 'string' ? row.scheduled_time : null,
    is_visible: row.is_visible === true,
    approval_status: row.approval_status as ApprovalStatus,
    revision: Number(row.revision ?? 1),
    aspect_ratio: row.aspect_ratio as AspectRatio,
    cover_path: typeof row.cover_path === 'string' ? row.cover_path : null,
    grid_crop_x: Number(row.grid_crop_x ?? 50),
    grid_crop_y: Number(row.grid_crop_y ?? 50),
    story_seconds: Number(row.story_seconds ?? 5),
    media,
    reviews,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

export async function listClientPosts(clientId: string): Promise<AdminPost[]> {
  const { data: postRows, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .eq('client_id', clientId)
    .order('scheduled_date', { ascending: false })
    .order('scheduled_time', { ascending: false, nullsFirst: false });
  if (postsError) fail(postsError);

  const ids = (postRows ?? []).map((post) => String(post.id));
  if (!ids.length) return [];
  const [mediaResult, reviewsResult] = await Promise.all([
    supabase.from('post_media').select('*').in('post_id', ids).order('position'),
    supabase.from('reviews').select('*').in('post_id', ids).order('created_at', { ascending: false }),
  ]);
  if (mediaResult.error) fail(mediaResult.error);
  if (reviewsResult.error) fail(reviewsResult.error);

  const mediaByPost = new Map<string, AdminMedia[]>();
  for (const row of mediaResult.data ?? []) {
    const key = String(row.post_id);
    mediaByPost.set(key, [...(mediaByPost.get(key) ?? []), mapMedia(row as unknown as Record<string, unknown>)]);
  }
  const reviewsByPost = new Map<string, AdminReview[]>();
  for (const raw of reviewsResult.data ?? []) {
    const review = mapReview(raw as unknown as Record<string, unknown>);
    reviewsByPost.set(review.post_id, [...(reviewsByPost.get(review.post_id) ?? []), review]);
  }
  return (postRows ?? []).map((row) => {
    const key = String(row.id);
    return mapPost(row as unknown as Record<string, unknown>, mediaByPost.get(key) ?? [], reviewsByPost.get(key) ?? []);
  });
}

export async function markReviewRead(reviewId: string): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .update({ read_at: new Date().toISOString() })
    .eq('id', reviewId)
    .is('read_at', null);
  if (error) fail(error);
}

export async function duplicateClientPost(clientId: string, postId: string): Promise<{ warning?: string }> {
  const source = await getClientPost(clientId, postId);
  const duplicateId = crypto.randomUUID();
  const copiedPaths: string[] = [];
  const copiedBySource = new Map<string, string>();

  async function copyPath(sourcePath: string | null): Promise<string | null> {
    if (!sourcePath) return null;
    const existing = copiedBySource.get(sourcePath);
    if (existing) return existing;
    const extension = /\.[^./]+$/.exec(sourcePath)?.[0] ?? '';
    const destination = `clients/${clientId}/posts/${duplicateId}/copy-${crypto.randomUUID()}${extension}`;
    await copyMediaPath(sourcePath, destination);
    copiedBySource.set(sourcePath, destination);
    copiedPaths.push(destination);
    return destination;
  }

  try {
    const media: AdminMediaInput[] = [];
    for (const item of source.media) {
      const path = await copyPath(item.path);
      if (!path) throw new Error('Uma mídia da publicação não tem caminho no Storage.');
      media.push({
        ...item,
        id: crypto.randomUUID(),
        position: media.length,
        path,
        poster_path: await copyPath(item.poster_path),
      });
    }

    const input: AdminPostInput = {
      id: duplicateId,
      client_id: clientId,
      type: source.type,
      caption: source.caption,
      location: source.location,
      audio_name: source.audio_name,
      scheduled_date: source.scheduled_date,
      scheduled_time: source.scheduled_time,
      is_visible: false,
      approval_status: 'pending',
      revision: 1,
      aspect_ratio: source.aspect_ratio,
      cover_path: await copyPath(source.cover_path),
      grid_crop_x: source.grid_crop_x,
      grid_crop_y: source.grid_crop_y,
      story_seconds: source.story_seconds,
    };
    return await saveClientPost(input, media, false);
  } catch (cause) {
    const postDelete = await supabase.from('posts').delete().eq('id', duplicateId);
    const failedCleanup = await removeMediaPaths(copiedPaths);
    const reason = cause instanceof Error ? cause.message : 'Falha ao duplicar a publicação.';
    const cleanupWarning = postDelete.error || failedCleanup.length
      ? ' A limpeza da cópia incompleta no banco/Storage também falhou; revise os arquivos temporários.'
      : '';
    throw new Error(`${reason}${cleanupWarning}`);
  }
}

export async function getClientPost(clientId: string, postId: string): Promise<AdminPost> {
  const posts = await listClientPosts(clientId);
  const post = posts.find((item) => item.id === postId);
  if (!post) throw new Error('Publicação não encontrada.');
  return post;
}

export async function saveClientPost(input: AdminPostInput, media: AdminMediaInput[], resend: boolean): Promise<{ warning?: string }> {
  const existing = await supabase.from('posts').select('id,cover_path').eq('id', input.id).maybeSingle();
  if (existing.error) fail(existing.error);
  const wasExisting = !!existing.data;
  const oldMediaResult = wasExisting
    ? await supabase.from('post_media').select('id,path,poster_path').eq('post_id', input.id)
    : { data: [], error: null };
  if (oldMediaResult.error) fail(oldMediaResult.error);

  const reviewsResult = wasExisting
    ? await supabase.from('reviews').select('id').eq('post_id', input.id).limit(1)
    : { data: [], error: null };
  if (reviewsResult.error) fail(reviewsResult.error);
  const hasReviews = (reviewsResult.data ?? []).length > 0;
  const postRow = {
    ...input,
    revision: input.revision + (resend && hasReviews ? 1 : 0),
    approval_status: resend && hasReviews ? ('pending' as const) : input.approval_status,
  };
  const postSave = wasExisting
    ? await supabase.from('posts').update(postRow).eq('id', input.id)
    : await supabase.from('posts').insert(postRow);
  if (postSave.error) fail(postSave.error);

  const mediaRows = media.map((item, position) => ({
    id: item.id,
    post_id: input.id,
    position,
    kind: item.kind,
    path: item.path,
    poster_path: item.poster_path,
    mime: item.mime,
    width: item.width,
    height: item.height,
    duration_seconds: item.duration,
    size_bytes: item.size_bytes,
  }));
  if (mediaRows.length) {
    const { error } = await supabase.from('post_media').upsert(mediaRows, { onConflict: 'id' });
    if (error) fail(error);
  }

  const retainedIds = new Set(mediaRows.map((row) => row.id));
  const removedRows = (oldMediaResult.data ?? []).filter((row) => !retainedIds.has(String(row.id)));
  if (removedRows.length) {
    const { error } = await supabase.from('post_media').delete().in('id', removedRows.map((row) => String(row.id)));
    if (error) fail(error);
  }

  const retainedPaths = new Set([
    input.cover_path,
    ...mediaRows.flatMap((row) => [row.path, row.poster_path]),
  ].filter((path): path is string => !!path));
  const oldCoverPath = typeof existing.data?.cover_path === 'string' ? existing.data.cover_path : null;
  const removedPaths = [oldCoverPath, ...(oldMediaResult.data ?? []).flatMap((row) => [row.path, row.poster_path])].filter(
    (path): path is string => typeof path === 'string' && !!path && !retainedPaths.has(path),
  );
  const failedCleanup = await removeMediaPaths(removedPaths);
  return failedCleanup.length ? { warning: 'A publicação foi salva, mas algumas mídias antigas não foram removidas do Storage.' } : {};
}

export async function setPostVisibility(postId: string, isVisible: boolean): Promise<void> {
  const { error } = await supabase.from('posts').update({ is_visible: isVisible }).eq('id', postId);
  if (error) fail(error);
}

export async function setClientPostsVisibility(clientId: string, postIds: string[], isVisible: boolean): Promise<void> {
  if (!postIds.length) return;
  const { error } = await supabase
    .from('posts')
    .update({ is_visible: isVisible })
    .eq('client_id', clientId)
    .in('id', postIds);
  if (error) fail(error);
}

export async function deleteClientPost(postId: string): Promise<{ warning?: string }> {
  const [postResult, mediaResult] = await Promise.all([
    supabase.from('posts').select('cover_path').eq('id', postId).single(),
    supabase.from('post_media').select('path,poster_path').eq('post_id', postId),
  ]);
  if (postResult.error) fail(postResult.error);
  if (mediaResult.error) fail(mediaResult.error);
  const paths = [postResult.data.cover_path, ...(mediaResult.data ?? []).flatMap((item) => [item.path, item.poster_path])]
    .filter((path): path is string => typeof path === 'string' && !!path);
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) fail(error);
  const failed = await removeMediaPaths(paths);
  return failed.length ? { warning: 'A publicação foi excluída, mas algumas mídias não foram removidas do Storage.' } : {};
}
