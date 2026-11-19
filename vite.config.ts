import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  base: '/aprove/', // nome do repositório no GitHub (D23)
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { sourcemap: false },
});
