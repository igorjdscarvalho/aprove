import { useEffect, useState } from 'react';
import { TOAST_EVENT } from '@/lib/toast';

// Mostra o aviso mais recente por 2,2 s (acima do visualizador, que usa z-50).
export function ToastHost() {
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let timer = 0;
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMsg(''), 2200);
    };
    window.addEventListener(TOAST_EVENT, on);
    return () => {
      window.removeEventListener(TOAST_EVENT, on);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-7 z-[80] flex justify-center">
      {msg && <div className="rounded-full bg-fg px-[18px] py-2.5 font-medium text-bg shadow-lg">{msg}</div>}
    </div>
  );
}
