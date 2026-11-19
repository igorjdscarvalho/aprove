/**
 * Interface mínima que o HUD controla. Um <video> real e o vídeo simulado do protótipo
 * a cumprem, então o mesmo player serve para os dois (e para o Storage, na Fase 6).
 */
export interface PlayerSource {
  currentTime: number;
  readonly duration: number;
  readonly paused: boolean;
  volume: number;
  muted: boolean;
  play(): unknown;
  pause(): void;
}

export interface PlayerPrefs {
  volume: number;
  muted: boolean;
}

const KEY = 'player_prefs';

export function loadPlayerPrefs(): PlayerPrefs | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PlayerPrefs>;
    if (typeof p.volume !== 'number' || typeof p.muted !== 'boolean') return null;
    return { volume: Math.max(0, Math.min(1, p.volume)), muted: p.muted };
  } catch {
    return null;
  }
}

export function savePlayerPrefs(p: PlayerPrefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignora */
  }
}
