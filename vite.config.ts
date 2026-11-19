import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

function productionCsp(supabaseHost: string): Plugin {
  return {
    name: 'production-csp',
    transformIndexHtml(html, context) {
      if (context.server) return html;
      const policy = [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        `img-src 'self' data: blob: https://${supabaseHost}`,
        `media-src 'self' data: blob: https://${supabaseHost}`,
        `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self'",
        "font-src 'self' data:",
        "worker-src 'self' blob:",
      ].join('; ');
      return html.replace('</head>', `    <meta http-equiv="Content-Security-Policy" content="${policy}" />\n  </head>`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const host = env.VITE_SUPABASE_URL ? new URL(env.VITE_SUPABASE_URL).host : 'localhost';
  return {
    plugins: [react(), productionCsp(host)],
    base: '/aprove/', // nome do repositório no GitHub (D23)
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    build: { sourcemap: false },
  };
});
