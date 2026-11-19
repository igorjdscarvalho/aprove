import { useState } from 'react';
import { getTheme, setTheme, type Theme } from '@/lib/theme';

const NEXT: Record<Theme, Theme> = { auto: 'light', light: 'dark', dark: 'auto' };
const LABEL: Record<Theme, string> = { auto: 'automático', light: 'claro', dark: 'escuro' };

export function Footer() {
  const [theme, set] = useState<Theme>(getTheme);

  return (
    <footer className="py-6 text-center text-xs text-muted">
      <p>Simulação para aprovação de conteúdo</p>
      <button
        type="button"
        onClick={() => {
          const t = NEXT[theme];
          setTheme(t);
          set(t);
        }}
        className="mt-2 rounded-full border border-line px-3 py-1 hover:bg-surface"
        aria-label={`Tema: ${LABEL[theme]}. Alternar tema`}
      >
        Tema: {LABEL[theme]}
      </button>
    </footer>
  );
}
