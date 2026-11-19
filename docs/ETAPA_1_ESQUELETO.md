# Etapa 1 da Fase 5: esqueleto do projeto (Vite + React + TypeScript + Tailwind)

Objetivo: confirmar que o projeto **roda no seu computador** e que o site **conversa com o Supabase**. Ainda não tem telas de verdade: só uma página de diagnóstico com 4 verificações.

Use o **CMD** (não o PowerShell). Cada comando vai numa linha só.

## Parte A: testar no seu computador

1. Extraia o zip. Vai surgir a pasta `aprove`. Coloque-a onde preferir, por exemplo `C:\Users\IGOR-PC\Projetos\aprove`.
2. Abra o CMD e entre na pasta (troque pelo seu caminho):
   ```
   cd /d C:\Users\IGOR-PC\Projetos\aprove
   ```
3. Confira as ferramentas e **me diga as versões** que aparecerem:
   ```
   node -v
   npm -v
   git --version
   ```
4. Crie o arquivo de configuração local:
   ```
   copy .env.example .env.local
   notepad .env.local
   ```
   No Bloco de Notas, deixe as duas últimas linhas assim (são valores públicos) e salve com Ctrl+S:
   ```
   VITE_SUPABASE_URL=https://hxqczylwfsypdreydgzt.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_ZgtV_TApeN2Iudsdgb4CtQ_7NDh69oe
   ```
   O `.env.local` **não** vai para o GitHub (está no `.gitignore`).
5. Instale as bibliotecas (leva de 1 a 3 minutos; avisos amarelos são normais):
   ```
   npm install
   ```
6. Rode o site:
   ```
   npm run dev
   ```
7. Abra no navegador: **http://localhost:5173/aprove/**
   Deve aparecer a página "Aprovação de conteúdo" com **4 linhas em OK**:
   - Site abriu (React + roteador)
   - Supabase responde (ping)
   - Anônimo não lê a tabela clients
   - client_gate (link inexistente)
8. Para parar, volte ao CMD e aperte `Ctrl+C`. Depois teste a montagem final:
   ```
   npm run build
   ```
   Deve terminar com `built in ...` e sem erros em vermelho.

Se algo falhar, copie **a mensagem completa** do CMD (ou um print do navegador) e me mande.

## Parte B: publicar no GitHub (só depois que a Parte A deu certo)

Faça nesta ordem para o primeiro deploy não falhar:

1. No GitHub, repositório `aprove` → **Settings → Secrets and variables → Actions → New repository secret**. Crie dois:
   - Nome `VITE_SUPABASE_URL`, valor `https://hxqczylwfsypdreydgzt.supabase.co`
   - Nome `VITE_SUPABASE_ANON_KEY`, valor `sb_publishable_ZgtV_TApeN2Iudsdgb4CtQ_7NDh69oe`
2. **Settings → Pages → Source: GitHub Actions**.
3. No CMD, dentro da pasta `aprove` (se o Git pedir identificação, rode antes os dois `git config`):
   ```
   git config --global user.name "Seu Nome"
   git config --global user.email "seu-email@exemplo.com"
   git init
   git branch -M main
   git add .
   git commit -m "Esqueleto Vite (etapa 1)"
   git remote add origin https://github.com/igorjdscarvalho/aprove.git
   git push -u origin main
   ```
   Na primeira vez abre uma janela do navegador para você entrar no GitHub.
4. Na aba **Actions** do repositório, acompanhe o workflow *Deploy to GitHub Pages*. Quando ficar verde, abra **https://igorjdscarvalho.github.io/aprove/** e confira os mesmos 4 OK.

## O que vai no repositório
- `src/`, `public/`, `index.html` e arquivos de configuração: o projeto.
- `.github/workflows/`: `deploy.yml` (publica o site) e `keepalive.yml` (chama `ping()` a cada 3 dias para o Supabase não pausar).
- `supabase/`: migrações 001 a 007 e o teste de segurança.
- `prototipo/prototipo-aprovacao.html`: o protótipo, só guardado (o Pages publica apenas o resultado do build, não esta pasta).
- `docs/`: a continuidade e os guias.

**Nunca** coloque no repositório a Secret key nem a `service_role`.
