// Stories "vistos" ficam só neste navegador (seção 11.1).
const key = (slug: string) => `stories_seen:${slug}`;

export function getSeen(slug: string): Set<string> {
  try {
    const raw = localStorage.getItem(key(slug));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function markSeen(slug: string, id: string): void {
  try {
    const s = getSeen(slug);
    s.add(id);
    localStorage.setItem(key(slug), JSON.stringify([...s]));
  } catch {
    /* sem localStorage: ignora */
  }
}
