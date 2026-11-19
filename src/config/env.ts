// Lê as variáveis públicas do build. Lança erro claro se alguma faltar.
function required(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(
      `Variável ${name} ausente. Copie .env.example para .env.local, preencha e reinicie o "npm run dev".`,
    );
  }
  return value.trim();
}

export const env = {
  SUPABASE_URL: required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL as string | undefined).replace(/\/+$/, ''),
  // Publishable key (sb_publishable_...) ou anon key legada: ambas são públicas.
  SUPABASE_ANON_KEY: required('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined),
};
