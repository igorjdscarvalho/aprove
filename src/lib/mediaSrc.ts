import { mediaUrl } from '@/lib/supabase';

/** Dados de exemplo usam data:/blob:; mídia real vem do Storage do Supabase. */
export function mediaSrc(path?: string | null): string {
  if (!path) return '';
  if (/^(data:|blob:|https?:)/.test(path)) return path;
  return mediaUrl(path);
}
