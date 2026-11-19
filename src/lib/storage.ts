import { env } from '@/config/env';
import { supabase } from '@/lib/supabase';

const TUS_THRESHOLD = 6 * 1024 * 1024;
const TUS_CHUNK = 6 * 1024 * 1024;
const STORAGE_BUCKET = 'media';

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

interface XhrResult {
  status: number;
  text: string;
  header(name: string): string | null;
}

function xhrRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: Blob | null,
  signal?: AbortSignal,
  progress?: (loaded: number) => void,
): Promise<XhrResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;
    const removeAbortListener = () => signal?.removeEventListener('abort', abort);
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      removeAbortListener();
      reject(error);
    };
    const abort = () => xhr.abort();

    xhr.open(method, url, true);
    Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    if (progress && body) xhr.upload.onprogress = (event) => progress(event.loaded);
    xhr.onload = () => {
      if (settled) return;
      settled = true;
      removeAbortListener();
      resolve({ status: xhr.status, text: xhr.responseText, header: (name) => xhr.getResponseHeader(name) });
    };
    xhr.onerror = () => fail(new Error('A conexão caiu durante o envio. Tente novamente.'));
    xhr.onabort = () => fail(new DOMException('Envio cancelado.', 'AbortError'));
    if (signal?.aborted) {
      xhr.abort();
      return;
    }
    signal?.addEventListener('abort', abort, { once: true });
    xhr.send(body);
  });
}

function pathUrl(path: string): string {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `${env.SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${encoded}`;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error('Sua sessão administrativa expirou. Entre novamente.');
  return { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` };
}

function reportProgress(loaded: number, total: number, onProgress?: (p: UploadProgress) => void): void {
  onProgress?.({ loaded, total, percent: total ? Math.min(100, Math.round((loaded / total) * 100)) : 0 });
}

async function uploadSimple(
  file: File,
  path: string,
  onProgress?: (p: UploadProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  const headers = await authHeaders();
  const result = await xhrRequest(
    'POST',
    pathUrl(path),
    { ...headers, 'Content-Type': file.type || 'application/octet-stream', 'Cache-Control': '31536000', 'x-upsert': 'false' },
    file,
    signal,
    (loaded) => reportProgress(loaded, file.size, onProgress),
  );
  if (result.status < 200 || result.status >= 300) {
    // A response can be lost after Storage has committed the object; accept a matching retry.
    if (await objectHasSize(path, file.size)) {
      reportProgress(file.size, file.size, onProgress);
      return;
    }
    throw new Error(`Upload falhou (${result.status}): ${result.text || 'verifique a conexão e tente de novo.'}`);
  }
  reportProgress(file.size, file.size, onProgress);
}

function encodeMetadata(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
}

function tusStorageKey(path: string): string {
  return `aprove:tus:${path}`;
}

function readTusUrl(path: string): string | null {
  try {
    return localStorage.getItem(tusStorageKey(path));
  } catch {
    return null;
  }
}

function saveTusUrl(path: string, url: string): void {
  try {
    localStorage.setItem(tusStorageKey(path), url);
  } catch {
    /* Upload ainda segue sem cache local de retomada. */
  }
}

function clearTusUrl(path: string): void {
  try {
    localStorage.removeItem(tusStorageKey(path));
  } catch {
    /* ignora */
  }
}

async function objectHasSize(path: string, size: number): Promise<boolean> {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).info(path);
  return !error && Number(data.size) === size;
}

async function createTusUpload(file: File, path: string, headers: Record<string, string>, signal?: AbortSignal): Promise<string> {
  const endpoint = `${env.SUPABASE_URL}/storage/v1/upload/resumable`;
  const metadata = [
    ['bucketName', STORAGE_BUCKET],
    ['objectName', path],
    ['contentType', file.type || 'application/octet-stream'],
    ['cacheControl', '31536000'],
  ]
    .map(([key, value]) => `${key} ${encodeMetadata(value)}`)
    .join(',');
  const result = await xhrRequest(
    'POST',
    endpoint,
    { ...headers, 'Tus-Resumable': '1.0.0', 'Upload-Length': String(file.size), 'Upload-Metadata': metadata },
    null,
    signal,
  );
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Não foi possível iniciar o envio resumível (${result.status}).`);
  }
  const location = result.header('Location');
  if (!location) throw new Error('O Supabase não retornou o endereço da sessão de upload.');
  const uploadUrl = new URL(location, endpoint).toString();
  saveTusUrl(path, uploadUrl);
  return uploadUrl;
}

async function tusOffset(url: string, headers: Record<string, string>, size: number, signal?: AbortSignal): Promise<number> {
  const result = await xhrRequest('HEAD', url, { ...headers, 'Tus-Resumable': '1.0.0' }, null, signal);
  if (result.status < 200 || result.status >= 300) throw new Error(`Não foi possível retomar o envio (${result.status}).`);
  const rawOffset = result.header('Upload-Offset');
  const offset = rawOffset === null ? Number.NaN : Number(rawOffset);
  if (!Number.isInteger(offset) || offset < 0 || offset > size) throw new Error('O Supabase retornou uma posição de upload inválida.');
  return offset;
}

async function uploadTus(
  file: File,
  path: string,
  onProgress?: (p: UploadProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  const headers = await authHeaders();
  const uploadUrl = readTusUrl(path) ?? (await createTusUpload(file, path, headers, signal));
  let offset: number;
  try {
    offset = await tusOffset(uploadUrl, headers, file.size, signal);
  } catch (error) {
    if (await objectHasSize(path, file.size)) {
      clearTusUrl(path);
      reportProgress(file.size, file.size, onProgress);
      return;
    }
    throw error;
  }
  let failures = 0;

  while (offset < file.size) {
    if (signal?.aborted) throw new DOMException('Envio cancelado.', 'AbortError');
    const end = Math.min(offset + TUS_CHUNK, file.size);
    const chunk = file.slice(offset, end);
    try {
      const result = await xhrRequest(
        'PATCH',
        uploadUrl,
        {
          ...headers,
          'Tus-Resumable': '1.0.0',
          'Upload-Offset': String(offset),
          'Content-Type': 'application/offset+octet-stream',
        },
        chunk,
        signal,
        (loaded) => reportProgress(offset + loaded, file.size, onProgress),
      );
      if (result.status < 200 || result.status >= 300) throw new Error(`O envio foi interrompido (${result.status}).`);
      const rawNextOffset = result.header('Upload-Offset');
      const nextOffset = rawNextOffset === null ? Number.NaN : Number(rawNextOffset);
      if (!Number.isInteger(nextOffset) || nextOffset <= offset || nextOffset > file.size) {
        throw new Error('O Supabase retornou uma posição de upload inválida.');
      }
      offset = nextOffset;
      failures = 0;
      reportProgress(offset, file.size, onProgress);
    } catch (error) {
      if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) throw error;
      failures += 1;
      if (failures > 3) throw error;
      await new Promise((resolve) => window.setTimeout(resolve, failures * 500));
      try {
        offset = await tusOffset(uploadUrl, headers, file.size, signal);
      } catch (resumeError) {
        if (await objectHasSize(path, file.size)) {
          clearTusUrl(path);
          reportProgress(file.size, file.size, onProgress);
          return;
        }
        throw resumeError;
      }
      reportProgress(offset, file.size, onProgress);
    }
  }

  clearTusUrl(path);
  reportProgress(file.size, file.size, onProgress);
}

export async function uploadMedia(
  file: File,
  path: string,
  onProgress?: (p: UploadProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (file.size > TUS_THRESHOLD) return uploadTus(file, path, onProgress, signal);
  return uploadSimple(file, path, onProgress, signal);
}

export async function cancelResumableUpload(path: string): Promise<void> {
  const uploadUrl = readTusUrl(path);
  if (!uploadUrl) return;
  const headers = await authHeaders();
  const result = await xhrRequest('DELETE', uploadUrl, { ...headers, 'Tus-Resumable': '1.0.0' }, null);
  if (result.status < 200 || result.status >= 300) throw new Error(`Não foi possível cancelar o upload resumível (${result.status}).`);
  clearTusUrl(path);
}

export async function removeMediaPaths(paths: string[]): Promise<string[]> {
  const unique = [...new Set(paths.filter(Boolean))];
  const failed: string[] = [];
  for (let index = 0; index < unique.length; index += 1000) {
    const batch = unique.slice(index, index + 1000);
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(batch);
    if (error) failed.push(...batch);
  }
  return failed;
}

export async function copyMediaPath(source: string, destination: string): Promise<void> {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).copy(source, destination);
  if (error) throw new Error(error.message);
}
