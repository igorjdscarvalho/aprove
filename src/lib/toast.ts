// Aviso rápido (toast) sem biblioteca: qualquer parte do app chama toast('texto')
// e o <ToastHost /> mostra. Evento no `window` para não precisar de contexto.
const EVENT = 'app:toast';

export function toast(message: string): void {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: message }));
}

export const TOAST_EVENT = EVENT;
