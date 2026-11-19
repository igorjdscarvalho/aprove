import { IG } from '@/config/instagram';

export interface ImageInfo {
  file: File;
  width: number;
  height: number;
}

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  poster: File;
}

const MAX_VIDEO_BYTES = IG.VIDEO_MAX_MB * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm']);

export function validateMediaFile(file: File, kind: 'image' | 'video'): void {
  const allowed = kind === 'image' ? IMAGE_TYPES : VIDEO_TYPES;
  if (!allowed.has(file.type)) {
    throw new Error(kind === 'image' ? 'Use uma imagem JPG, PNG ou WebP.' : 'Use um vídeo MP4, MOV ou WebM.');
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(`O arquivo ultrapassa o limite de ${IG.VIDEO_MAX_MB} MB.`);
  }
}

export async function prepareImage(file: File): Promise<ImageInfo> {
  validateMediaFile(file, 'image');
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, IG.IMAGE_MAX_LONG_SIDE / Math.max(width, height));
  if (scale === 1) {
    bitmap.close();
    return { file, width, height };
  }

  const outWidth = Math.max(1, Math.round(width * scale));
  const outHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = outWidth;
  canvas.height = outHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('Não foi possível preparar a imagem neste navegador.');
  }
  context.drawImage(bitmap, 0, 0, outWidth, outHeight);
  bitmap.close();

  const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Não foi possível comprimir a imagem.'))), mime, 0.9);
  });
  const stem = file.name.replace(/\.[^.]+$/, '') || 'imagem';
  return {
    file: new File([blob], `${stem}.${mime === 'image/png' ? 'png' : 'jpg'}`, { type: mime, lastModified: Date.now() }),
    width: outWidth,
    height: outHeight,
  };
}

function seekVideo(video: HTMLVideoElement, seconds: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (Math.abs(video.currentTime - seconds) < 0.001) {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        resolve();
        return;
      }
      const onData = () => {
        video.removeEventListener('loadeddata', onData);
        video.removeEventListener('error', failed);
        resolve();
      };
      const failed = () => {
        video.removeEventListener('loadeddata', onData);
        video.removeEventListener('error', failed);
        reject(new Error('Este vídeo não pode ser lido pelo navegador. Use um MP4 H.264 ou envie uma capa.'));
      };
      video.addEventListener('loadeddata', onData, { once: true });
      video.addEventListener('error', failed, { once: true });
      return;
    }
    const done = () => {
      video.removeEventListener('seeked', done);
      video.removeEventListener('error', failed);
      resolve();
    };
    const failed = () => {
      video.removeEventListener('seeked', done);
      video.removeEventListener('error', failed);
      reject(new Error('Este vídeo não pode ser lido pelo navegador. Use um MP4 H.264 ou envie uma capa.'));
    };
    video.addEventListener('seeked', done, { once: true });
    video.addEventListener('error', failed, { once: true });
    video.currentTime = seconds;
  });
}

async function captureFrame(video: HTMLVideoElement, fileName: string): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Não foi possível gerar a capa neste navegador.');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Não foi possível gerar a capa do vídeo.'))), 'image/jpeg', 0.88);
  });
  return new File([blob], fileName, { type: 'image/jpeg', lastModified: Date.now() });
}

export async function inspectVideo(file: File): Promise<VideoInfo> {
  validateMediaFile(file, 'video');
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;
  video.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Não foi possível ler o vídeo. Use um MP4 H.264 ou uma capa enviada por imagem.'));
    });
    if (!Number.isFinite(video.duration) || !video.videoWidth || !video.videoHeight) {
      throw new Error('O vídeo não tem duração ou dimensões válidas.');
    }
    await seekVideo(video, Math.min(0.1, Math.max(0, video.duration - 0.05)));
    return {
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
      poster: await captureFrame(video, `${file.name.replace(/\.[^.]+$/, '') || 'capa'}.jpg`),
    };
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}

export async function captureVideoFrame(file: File, seconds: number): Promise<File> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Este vídeo não pode ser lido para escolher um frame.'));
    });
    await new Promise<void>((resolve, reject) => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return resolve();
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('Não foi possível carregar esse frame do vídeo.'));
    });
    await seekVideo(video, Math.max(0, Math.min(seconds, video.duration - 0.05)));
    return await captureFrame(video, `${file.name.replace(/\.[^.]+$/, '') || 'capa'}-frame.jpg`);
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}

export function fileExtension(file: File): string {
  const ext = /\.([a-z0-9]+)$/i.exec(file.name)?.[1]?.toLowerCase();
  if (ext && ext.length <= 6) return ext;
  const byMime: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
  };
  return byMime[file.type] ?? 'bin';
}
