import { useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { CoverCropper } from '@/components/admin/CoverCropper';
import { MediaUploader, type UploadTaskState } from '@/components/admin/MediaUploader';
import { Spinner } from '@/components/ui/Spinner';
import { IG } from '@/config/instagram';
import { captureVideoFrame, fileExtension, inspectVideo, prepareImage } from '@/lib/media';
import { mediaSrc } from '@/lib/mediaSrc';
import { cancelResumableUpload, removeMediaPaths, uploadMedia } from '@/lib/storage';
import { todayIso } from '@/lib/dates';
import { getClient } from '@/providers/admin/SupabaseAdminProvider';
import {
  getClientPost,
  saveClientPost,
  type AdminMediaInput,
  type AdminPost,
  type AdminPostInput,
} from '@/providers/admin/SupabasePostProvider';
import type { AdminClient } from '@/providers/admin/types';
import type { AspectRatio, MediaKind, PostType } from '@/types/domain';

interface DraftMedia extends AdminMediaInput {
  file?: File;
  uploadPath: string;
  posterFile?: File;
  posterUploadPath?: string;
  preview: string;
  posterPreview: string;
}

interface CoverDraft {
  file?: File;
  path: string | null;
  uploadPath: string;
  preview: string;
}

const POST_TYPES: { value: PostType; label: string }[] = [
  { value: 'image', label: 'Imagem única' },
  { value: 'carousel', label: 'Carrossel' },
  { value: 'reel', label: 'Reels' },
  { value: 'story', label: 'Story' },
];
const ASPECTS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: 'Quadrada · 1:1' },
  { value: '4:5', label: 'Retrato · 4:5' },
  { value: '1.91:1', label: 'Paisagem · 1,91:1' },
];

function uploadPath(clientId: string, postId: string, file: File, kind: string): string {
  return `clients/${clientId}/posts/${postId}/${kind}-${crypto.randomUUID()}.${fileExtension(file)}`;
}

function temporaryUrl(file: File, urls: Set<string>): string {
  const url = URL.createObjectURL(file);
  urls.add(url);
  return url;
}

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function emptyMedia(file: File, postId: string, clientId: string, urls: Set<string>, kind: MediaKind, dimensions: { width: number; height: number; duration: number | null; poster?: File }): DraftMedia {
  const preview = temporaryUrl(file, urls);
  const posterPreview = dimensions.poster ? temporaryUrl(dimensions.poster, urls) : '';
  return {
    id: crypto.randomUUID(),
    position: 0,
    kind,
    path: '',
    poster_path: null,
    mime: file.type,
    width: dimensions.width,
    height: dimensions.height,
    duration: dimensions.duration,
    size_bytes: file.size,
    file,
    uploadPath: uploadPath(clientId, postId, file, 'media'),
    posterFile: dimensions.poster,
    posterUploadPath: dimensions.poster ? uploadPath(clientId, postId, dimensions.poster, 'poster') : undefined,
    preview,
    posterPreview,
  };
}

function toDraftMedia(media: AdminPost['media']): DraftMedia[] {
  return media.map((item) => ({
    ...item,
    uploadPath: item.path,
    preview: item.path,
    posterPreview: item.poster_path ?? '',
  }));
}

export function PostEditorPage() {
  const { clientId = '', postId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const idRef = useRef(postId ?? crypto.randomUUID());
  const urlsRef = useRef(new Set<string>());
  const uploadedPathsRef = useRef(new Set<string>());
  const controllersRef = useRef(new Map<string, AbortController>());
  const dragRef = useRef<number | null>(null);
  const queryType = new URLSearchParams(location.search).get('type');
  const initialType = POST_TYPES.some((item) => item.value === queryType) ? (queryType as PostType) : 'image';
  const [client, setClient] = useState<AdminClient | null>(null);
  const [existing, setExisting] = useState<AdminPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<PostType>(initialType);
  const [scheduledDate, setScheduledDate] = useState(todayIso);
  const [scheduledTime, setScheduledTime] = useState('');
  const [caption, setCaption] = useState('');
  const [locationText, setLocationText] = useState('');
  const [audioName, setAudioName] = useState('Áudio original');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5');
  const [storySeconds, setStorySeconds] = useState<number>(IG.STORY_DEFAULT_SECONDS);
  const [gridCrop, setGridCrop] = useState({ x: 50, y: 50 });
  const [media, setMedia] = useState<DraftMedia[]>([]);
  const [customCover, setCustomCover] = useState<CoverDraft | null>(null);
  const [resend, setResend] = useState(true);
  const [saving, setSaving] = useState(false);
  const [frameTime, setFrameTime] = useState(0.1);
  const [frameBusy, setFrameBusy] = useState(false);
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState<UploadTaskState[]>([]);

  useEffect(() => {
    let live = true;
    void Promise.all([getClient(clientId), postId ? getClientPost(clientId, postId) : Promise.resolve(null)])
      .then(([clientRecord, post]) => {
        if (!live) return;
        setClient(clientRecord);
        if (!post) return;
        idRef.current = post.id;
        setExisting(post);
        setType(post.type);
        setScheduledDate(post.scheduled_date);
        setScheduledTime(post.scheduled_time?.slice(0, 5) ?? '');
        setCaption(post.caption);
        setLocationText(post.location);
        setAudioName(post.audio_name || 'Áudio original');
        setAspectRatio(post.aspect_ratio);
        setStorySeconds(post.story_seconds);
        setGridCrop({ x: post.grid_crop_x, y: post.grid_crop_y });
        setMedia(toDraftMedia(post.media));
        setResend(post.reviews.length > 0);
        if (post.cover_path && post.cover_path !== post.media[0]?.poster_path) {
          setCustomCover({ path: post.cover_path, uploadPath: post.cover_path, preview: post.cover_path });
        }
      })
      .catch((cause: unknown) => {
        if (live) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a publicação.');
      })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [clientId, postId]);

  useEffect(() => () => urlsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);
  useEffect(() => {
    if (!saving && uploadedPathsRef.current.size === 0) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [saving]);

  const coverSource = customCover?.preview || media[0]?.posterPreview || media[0]?.poster_path || '';
  const previewSource = type === 'reel' && coverSource ? coverSource : media[0]?.preview ?? '';
  const hasReviews = (existing?.reviews.length ?? 0) > 0;
  const availableSlots = type === 'carousel' ? Math.max(0, IG.CAROUSEL_MAX_ITEMS - media.length) : Math.max(0, 1 - media.length);
  const typeLabel = POST_TYPES.find((item) => item.value === type)?.label ?? 'Publicação';

  function cancelUpload(taskId: string) {
    controllersRef.current.get(taskId)?.abort();
  }

  async function runUpload(taskId: string, label: string, file: File, path: string): Promise<void> {
    const controller = new AbortController();
    controllersRef.current.set(taskId, controller);
    setTasks((current) => [...current.filter((task) => task.id !== taskId), { id: taskId, label, percent: 0, status: 'uploading' }]);
    try {
      await uploadMedia(file, path, (progress) => {
        setTasks((current) => current.map((task) => task.id === taskId ? { ...task, percent: progress.percent } : task));
      }, controller.signal);
      uploadedPathsRef.current.add(path);
      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Falha no envio.';
      setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: 'failed', error: message } : task));
      throw cause;
    } finally {
      controllersRef.current.delete(taskId);
    }
  }

  async function chooseMedia(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length || !client) return;
    if (files.length > availableSlots) {
      setError(type === 'carousel' ? `O carrossel aceita até ${IG.CAROUSEL_MAX_ITEMS} itens.` : `${typeLabel} aceita uma mídia.`);
      return;
    }
    setError('');
    try {
      const added: DraftMedia[] = [];
      for (const file of files) {
        const kind: MediaKind = file.type.startsWith('video/') ? 'video' : 'image';
        if (type === 'image' && kind !== 'image') throw new Error('Imagem única aceita apenas JPG, PNG ou WebP.');
        if ((type === 'reel' || type === 'story') && files.length === 1 && type === 'reel' && kind !== 'video') throw new Error('Reels precisa de um vídeo.');
        if (type === 'story' && files.length === 1 && kind === 'video' && file.size > IG.VIDEO_MAX_MB * 1024 * 1024) throw new Error(`O vídeo ultrapassa ${IG.VIDEO_MAX_MB} MB.`);
        if (kind === 'image') {
          const prepared = await prepareImage(file);
          added.push(emptyMedia(prepared.file, idRef.current, client.id, urlsRef.current, 'image', { width: prepared.width, height: prepared.height, duration: null }));
        } else {
          const info = await inspectVideo(file);
          added.push(emptyMedia(file, idRef.current, client.id, urlsRef.current, 'video', info));
        }
      }
      setMedia((current) => type === 'carousel' ? [...current, ...added] : added.slice(-1));
      if (type === 'reel' || type === 'story') setAspectRatio('9:16');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível preparar a mídia.');
    }
  }

  async function chooseCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !client) return;
    try {
      const prepared = await prepareImage(file);
      setCustomCover({
        file: prepared.file,
        path: null,
        uploadPath: uploadPath(client.id, idRef.current, prepared.file, 'cover'),
        preview: temporaryUrl(prepared.file, urlsRef.current),
      });
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível preparar a capa.');
    }
  }

  async function chooseVideoFrame(seconds: number) {
    const source = media[0];
    if (!source?.file || source.kind !== 'video') return;
    setFrameBusy(true);
    try {
      const poster = await captureVideoFrame(source.file, seconds);
      const preview = temporaryUrl(poster, urlsRef.current);
      setMedia((current) => current.map((item, index) => index === 0 ? {
        ...item,
        posterFile: poster,
        poster_path: null,
        posterUploadPath: uploadPath(clientId, idRef.current, poster, 'poster'),
        posterPreview: preview,
      } : item));
      if (customCover) setCustomCover(null);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível escolher esse frame.');
    } finally {
      setFrameBusy(false);
    }
  }

  function removeMedia(index: number) {
    const item = media[index];
    [item?.preview, item?.posterPreview].forEach((url) => {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    });
    // Mídias novas já enviadas são removidas no salvamento (ou em Cancelar),
    // junto com as demais que ficaram fora da versão final do post.
    if (type === 'reel' && index === 0) setCustomCover(null);
    setMedia((current) => current.filter((_, i) => i !== index));
  }

  function reorderMedia(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || to >= media.length) return;
    setMedia((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function dragStart(event: PointerEvent<HTMLButtonElement>, index: number) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = index;
  }

  function dragMove(event: PointerEvent<HTMLButtonElement>) {
    if (dragRef.current === null) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-media-index]');
    const to = target ? Number(target.dataset.mediaIndex) : -1;
    if (to >= 0 && to !== dragRef.current) {
      reorderMedia(dragRef.current, to);
      dragRef.current = to;
    }
  }

  async function save(visible: boolean) {
    if (!client || saving) return;
    setError('');
    const validCount = type === 'carousel' ? media.length >= 2 && media.length <= IG.CAROUSEL_MAX_ITEMS : media.length === 1;
    if (!validCount) {
      setError(type === 'carousel' ? 'Adicione de 2 a 20 itens ao carrossel.' : `Adicione uma mídia para ${typeLabel.toLowerCase()}.`);
      return;
    }
    if (type === 'reel' && media[0].kind !== 'video') {
      setError('Reels precisa de um vídeo.');
      return;
    }
    if (!scheduledDate) {
      setError('Informe a data planejada.');
      return;
    }

    setSaving(true);
    try {
      let nextMedia = [...media];
      for (let index = 0; index < nextMedia.length; index += 1) {
        let item = nextMedia[index];
        if (item.file && !item.path) {
          await runUpload(`media:${item.id}`, item.file.name, item.file, item.uploadPath);
          item = { ...item, path: item.uploadPath };
          nextMedia[index] = item;
          setMedia(nextMedia);
        }
        if (item.posterFile && !item.poster_path && item.posterUploadPath) {
          await runUpload(`poster:${item.id}`, `Capa · ${item.file?.name ?? item.id}`, item.posterFile, item.posterUploadPath);
          item = { ...item, poster_path: item.posterUploadPath };
          nextMedia[index] = item;
          setMedia(nextMedia);
        }
      }

      let nextCover = customCover;
      if (nextCover?.file && !nextCover.path) {
        await runUpload('cover', 'Capa da grade', nextCover.file, nextCover.uploadPath);
        nextCover = { ...nextCover, path: nextCover.uploadPath };
        setCustomCover(nextCover);
      }
      const coverPath = type === 'reel' ? (nextCover?.path ?? nextMedia[0]?.poster_path ?? null) : null;
      const input: AdminPostInput = {
        id: idRef.current,
        client_id: client.id,
        type,
        caption: type === 'story' ? '' : caption.trim(),
        location: type === 'story' ? '' : locationText.trim(),
        audio_name: type === 'reel' ? (audioName.trim() || 'Áudio original') : '',
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime || null,
        is_visible: visible,
        approval_status: existing?.approval_status ?? 'pending',
        revision: existing?.revision ?? 1,
        aspect_ratio: type === 'reel' || type === 'story' ? '9:16' : aspectRatio,
        cover_path: coverPath,
        grid_crop_x: gridCrop.x,
        grid_crop_y: gridCrop.y,
        story_seconds: type === 'story' ? storySeconds : IG.STORY_DEFAULT_SECONDS,
      };
      const mediaInput: AdminMediaInput[] = nextMedia.map((item, position) => ({
        id: item.id,
        position,
        kind: item.kind,
        path: item.path,
        poster_path: item.poster_path,
        width: item.width,
        height: item.height,
        duration: item.duration,
        mime: item.mime,
        size_bytes: item.size_bytes,
      }));
      const result = await saveClientPost(input, mediaInput, resend);
      const retainedPaths = new Set([
        coverPath,
        ...mediaInput.flatMap((item) => [item.path, item.poster_path]),
      ].filter((path): path is string => !!path));
      const abandonedPaths = [...uploadedPathsRef.current].filter((path) => !retainedPaths.has(path));
      const cleanupFailures = abandonedPaths.length ? await removeMediaPaths(abandonedPaths) : [];
      uploadedPathsRef.current.clear();
      cleanupFailures.forEach((path) => uploadedPathsRef.current.add(path));
      const noticeText = [result.warning, cleanupFailures.length ? 'Alguns arquivos temporários não foram removidos do Storage.' : null]
        .filter(Boolean).join(' ') || 'Publicação salva.';
      navigate(`/admin/clients/${client.id}`, { state: { notice: noticeText } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a publicação.');
      setSaving(false);
    }
  }

  async function cancelEditor() {
    if (saving) return;
    const uploaded = [...uploadedPathsRef.current];
    uploadedPathsRef.current.clear();
    if (uploaded.length) await removeMediaPaths(uploaded);
    const pendingTus = [
      ...media.flatMap((item) => [item.file ? item.uploadPath : '', item.posterFile ? item.posterUploadPath ?? '' : '']),
      customCover?.file ? customCover.uploadPath : '',
    ].filter(Boolean);
    await Promise.all(pendingTus.map((path) => cancelResumableUpload(path).catch(() => {})));
    navigate(`/admin/clients/${client?.id ?? clientId}`);
  }

  const previewLabel = useMemo(() => caption.trim() || 'Prévia da legenda e da publicação', [caption]);
  const expectedRatio = type === 'reel' || type === 'story'
    ? 9 / 16
    : aspectRatio === '1:1' ? 1 : aspectRatio === '4:5' ? 4 / 5 : 1.91;
  const ratioMismatch = media.some((item) => item.width && item.height && Math.abs(item.width / item.height - expectedRatio) > 0.08);

  if (loading) return <Spinner label="Carregando editor" />;
  if (!client) return <main className="mx-auto max-w-3xl p-6"><p role="alert" className="text-bad">{error || 'Cliente não encontrado.'}</p></main>;

  return (
    <div className="min-h-screen bg-bg">
      <AdminHeader title={`${postId ? 'Editar' : 'Nova'} publicação · ${client.name}`} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <button type="button" onClick={() => void cancelEditor()} disabled={saving} className="mb-4 text-sm font-semibold text-accent disabled:opacity-50">← Voltar ao espaço do cliente</button>
        {error && <p role="alert" className="mb-4 rounded-lg border border-bad bg-surface px-3 py-2 text-sm text-bad">{error}</p>}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <fieldset disabled={saving} className="min-w-0 space-y-5 border-0 p-0">
            <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
              <h2 className="text-lg font-bold">Detalhes</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">Tipo de conteúdo
                  <select value={type} disabled={!!postId} onChange={(event) => { setType(event.target.value as PostType); setMedia([]); setCustomCover(null); }} className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg">
                    {POST_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium">Data planejada
                  <input type="date" required value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg" />
                </label>
                <label className="text-sm font-medium">Horário (opcional)
                  <input type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg" />
                </label>
                {(type === 'image' || type === 'carousel') && <label className="text-sm font-medium">Proporção da publicação
                  <select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value as AspectRatio)} className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg">
                    {ASPECTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>}
                {type !== 'story' && <label className="text-sm font-medium sm:col-span-2">Legenda <span className="text-muted">{caption.length}/{IG.CAPTION_MAX}</span>
                  <textarea value={caption} maxLength={IG.CAPTION_MAX} onChange={(event) => setCaption(event.target.value)} rows={5} className="mt-1.5 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2.5 text-fg" />
                </label>}
                {type !== 'story' && <label className="text-sm font-medium">Localização (opcional)
                  <input value={locationText} maxLength={100} onChange={(event) => setLocationText(event.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg" />
                </label>}
                {type === 'reel' && <label className="text-sm font-medium">Nome do áudio
                  <input value={audioName} maxLength={100} onChange={(event) => setAudioName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg" />
                </label>}
                {type === 'story' && <label className="text-sm font-medium sm:col-span-2">Duração da imagem · {storySeconds} s
                  <input type="range" min="1" max="15" value={storySeconds} onChange={(event) => setStorySeconds(Number(event.target.value))} className="mt-2 w-full" />
                </label>}
              </div>
            </section>

            <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Mídia</h2>
                  <p className="mt-1 text-sm text-muted">{type === 'carousel' ? `Adicione de 2 a ${IG.CAROUSEL_MAX_ITEMS} imagens ou vídeos.` : type === 'reel' ? 'Envie um vídeo vertical. MP4 H.264 é o formato mais compatível.' : type === 'story' ? 'Envie uma imagem ou vídeo vertical.' : 'Envie uma imagem JPG, PNG ou WebP.'}</p>
                </div>
                {availableSlots > 0 && <label className="cursor-pointer rounded-lg border border-line bg-bg px-3 py-2 text-sm font-semibold">
                  {media.length ? 'Adicionar mídia' : 'Escolher arquivo'}
                  <input type="file" accept={type === 'image' ? 'image/jpeg,image/png,image/webp' : type === 'reel' ? 'video/mp4,video/quicktime,video/webm' : type === 'carousel' ? 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm' : 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm'} multiple={type === 'carousel'} onChange={(event) => void chooseMedia(event)} className="sr-only" />
                </label>}
              </div>
              {media.length > 0 && <ul className="mt-4 space-y-2">
                {media.map((item, index) => (
                  <li key={item.id} data-media-index={index} className="flex items-center gap-3 rounded-lg border border-line bg-bg p-2.5">
                    <button type="button" aria-label={`Arrastar mídia ${index + 1}`} onPointerDown={(event) => dragStart(event, index)} onPointerMove={dragMove} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }} className="cursor-grab touch-none px-1 text-lg text-muted active:cursor-grabbing">⠿</button>
                    <div className="h-16 w-14 shrink-0 overflow-hidden rounded bg-line">
                      {item.kind === 'video' ? <video src={mediaSrc(item.preview)} poster={mediaSrc(item.posterPreview || item.poster_path)} muted playsInline className="h-full w-full object-cover" /> : <img src={mediaSrc(item.preview)} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate font-semibold">{item.file?.name ?? `Mídia ${index + 1}`}</p>
                      <p className="text-xs text-muted">{item.kind === 'video' ? 'Vídeo' : 'Imagem'} · {formatSize(item.size_bytes)} · {item.width}×{item.height}{item.duration ? ` · ${Math.round(item.duration)} s` : ''}</p>
                      {type === 'carousel' && <div className="mt-1 flex gap-2 text-xs"><button type="button" disabled={index === 0} onClick={() => reorderMedia(index, index - 1)} className="font-semibold text-accent disabled:opacity-30">↑ Subir</button><button type="button" disabled={index === media.length - 1} onClick={() => reorderMedia(index, index + 1)} className="font-semibold text-accent disabled:opacity-30">↓ Descer</button></div>}
                    </div>
                    <button type="button" onClick={() => removeMedia(index)} className="rounded border border-bad px-2 py-1 text-xs font-semibold text-bad">Remover</button>
                  </li>
                ))}
              </ul>}
              {ratioMismatch && <p className="mt-3 rounded-lg border border-warn bg-bg px-3 py-2 text-xs text-warn">A proporção de uma mídia não coincide com a publicação; a prévia poderá recortar parte da imagem ou vídeo.</p>}
              {type === 'reel' && media[0]?.kind === 'video' && (
                <div className="mt-4 space-y-4 rounded-lg border border-line p-3">
                  <div>
                    <h3 className="text-sm font-semibold">Capa do Reels</h3>
                    {media[0].file && media[0].duration && <label className="mt-2 block text-xs">Escolher frame · {frameTime.toFixed(1)} s
                      <input type="range" min="0.1" max={Math.max(0.1, media[0].duration - 0.1)} step="0.1" value={Math.min(frameTime, Math.max(0.1, media[0].duration - 0.1))} onChange={(event) => setFrameTime(Number(event.target.value))} disabled={frameBusy} className="mt-1 w-full" />
                    </label>}
                    {media[0].file && <button type="button" disabled={frameBusy} onClick={() => void chooseVideoFrame(frameTime)} className="mt-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold disabled:opacity-50">{frameBusy ? 'Capturando frame…' : 'Usar este frame como capa'}</button>}
                    <label className="mt-2 inline-block cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-semibold">Enviar imagem de capa
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void chooseCover(event)} className="sr-only" />
                    </label>
                  </div>
                  <CoverCropper src={coverSource} x={gridCrop.x} y={gridCrop.y} onChange={setGridCrop} />
                </div>
              )}
              {type === 'carousel' && media.length > 1 && <p className="mt-3 text-xs text-muted">Arraste pelo ícone ⠿ ou use Subir/Descer para ordenar. A primeira mídia aparece na grade.</p>}
            </section>

            {hasReviews && <label className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4 text-sm">
              <input type="checkbox" checked={resend} onChange={(event) => setResend(event.target.checked)} className="mt-0.5" />
              <span><b>Reenviar para aprovação</b><span className="mt-0.5 block text-xs text-muted">Cria uma nova revisão e volta o status para pendente. O histórico anterior será mantido.</span></span>
            </label>}
            </fieldset>

            <MediaUploader tasks={tasks} onCancel={cancelUpload} />
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" disabled={saving} onClick={() => void cancelEditor()} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold">Cancelar</button>
              <button type="button" disabled={saving} onClick={() => void save(false)} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold disabled:opacity-50">{saving ? 'Salvando…' : 'Salvar rascunho'}</button>
              <button type="button" disabled={saving} onClick={() => void save(true)} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Enviando…' : 'Salvar e publicar para o cliente'}</button>
            </div>
          </div>

          <aside className="h-fit rounded-xl border border-line bg-surface p-4 lg:sticky lg:top-4">
            <h2 className="text-lg font-bold">Prévia</h2>
            <p className="mt-1 text-xs text-muted">Prévia da mídia e do recorte na grade.</p>
            <div className="mx-auto mt-4 max-w-[220px] overflow-hidden rounded-2xl border border-line bg-bg shadow-sm">
              <div className="flex items-center gap-2 border-b border-line p-3">
                {client.avatar_path ? <img src={mediaSrc(client.avatar_path)} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="grid h-8 w-8 place-items-center rounded-full bg-line text-xs font-bold">{client.name.slice(0, 1)}</span>}
                <div className="min-w-0"><p className="truncate text-xs font-semibold">@{client.username}</p><p className="truncate text-[10px] text-muted">{client.name}</p></div>
              </div>
              <div className="grid grid-cols-3 gap-[2px] bg-bg">
                <div className="relative aspect-[3/4] overflow-hidden bg-line">
                  {previewSource && <img src={mediaSrc(previewSource)} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${gridCrop.x}% ${gridCrop.y}%` }} />}
                </div>
                {Array.from({ length: 5 }, (_, i) => <div key={i} className="aspect-[3/4] bg-surface" />)}
              </div>
              <div className="p-3"><p className="text-xs font-semibold">{typeLabel} · {scheduledDate || 'Data planejada'}</p><p className="mt-1 line-clamp-4 whitespace-pre-wrap text-xs text-muted">{previewLabel}</p></div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
