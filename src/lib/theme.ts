// Tema claro/escuro (seção 15). "auto" segue o aparelho; a escolha fica em localStorage.
export type Theme = 'auto' | 'light' | 'dark';
const KEY = 'theme';

export function getTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export function applyTheme(t: Theme): void {
  const root = document.documentElement;
  root.classList.toggle('light', t === 'light');
  root.classList.toggle('dark', t === 'dark');
}

export function setTheme(t: Theme): void {
  try {
    if (t === 'auto') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, t);
  } catch {
    /* sem localStorage: vale só nesta sessão */
  }
  applyTheme(t);
}

export function initTheme(): void {
  applyTheme(getTheme());
}
