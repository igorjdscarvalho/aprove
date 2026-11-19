# CONTINUIDADE — Plano de Desenvolvimento

**Projeto:** Plataforma de aprovação de conteúdo para Instagram (simulador de perfil + fluxo de aprovação por cliente)
**Stack:** GitHub Pages (front estático) + Supabase (Auth, Postgres, Storage, Edge Functions opcionais)
**Versão do documento:** v13 — **Última atualização:** 19/11/2026 (v13: Etapa 1 concluída (site no ar com os 4 OK); Etapa 2 dividida em blocos 2a a 2e (D29); **bloco 2a entregue**, aguardando teste no PC: tipos, providers, `MockProvider` com 21 posts de exemplo, rotas do cliente, tela de senha e "link indisponível" portadas do protótipo; v12: Etapa 1 rodando no PC do usuário (`npm install` ok, `npm run dev` com os 4 OK na página de diagnóstico); versões de Node/npm/Git registradas; prompt de continuação para nova conversa; v11: Fase 5 em etapas (D28); Etapa 1 (esqueleto Vite + React + TS + Tailwind, diagnóstico do Supabase, workflows de deploy e keep-alive) entregue, aguardando teste no computador do usuário; v10: cadastro público do Supabase desligado, Node LTS e Git instalados, repositório `aprove` criado, decisão de não publicar o protótipo no Pages; v9: Fase 4 concluída no Supabase real (migrações 001 a 007, admin criado, teste de segurança com 39 PASS), nova migração 007 de permissões do admin, repositório `aprove` definido, limites do plano anotados; v8: migrações SQL 001 a 006 em arquivos, teste de segurança do banco e guia das Fases 3 e 4; v7: raiz abre o login do admin (e-mail e senha), exportar/importar dados, métricas de aprovação por cliente, contagem de publicações por mês e de stories no perfil; v6: story em vídeo, recorte circular do avatar e carrossel reordenável por arrastar, no HTML; v5: publicar pede senha; v4: admin completo no protótipo HTML)
**Natureza:** documento **vivo** — é atualizado a cada tarefa concluída (o que deu certo, o que não deu, por quê)

> Este arquivo é a **fonte da verdade** do projeto. Quem for continuar o desenvolvimento (você ou uma nova sessão com o Claude) deve ler primeiro as seções 0 e 1, atualizar o **Painel de progresso** ao terminar cada tarefa e só então seguir para a próxima fase.

---

## 0. Como retomar o trabalho e como manter este arquivo (leia primeiro)

### 0.1 Retomando
1. Abra a seção **2. Painel de progresso** e ache a primeira tarefa não concluída (`[ ]` ou `[~]`).
2. Leia **22.1 Próximo passo** e as entradas mais recentes do **22.2 Diário de bordo** (pode haver contexto do que parou no meio).
3. Leia **22.4 O que não deu certo** antes de implementar: evita repetir tentativas que já falharam.
4. Leia a fase correspondente (seção 16) e as seções técnicas que ela cita (dados, RPCs, componentes).
5. Nunca coloque a `service_role key` do Supabase no repositório nem no front-end. Só a `anon key` (hoje chamada **publishable key**, `sb_publishable_...`; pública por design) pode ir no build.

### 0.2 Regra de ouro: este arquivo é atualizado a cada tarefa
Ao **terminar (ou travar em)** qualquer tarefa, antes de responder ao usuário, quem estiver desenvolvendo (incluindo o Claude) deve atualizar o arquivo:

1. **Painel (seção 2):** trocar o status da tarefa/fase.
2. **Diário de bordo (22.2):** acrescentar **uma linha nova** com data, tarefa, resultado, o que foi feito, o que falhou e arquivos tocados.
3. **Lições (22.3 e 22.4):** se algo funcionou bem, registrar em *O que deu certo*; se algo falhou, registrar em *O que não deu certo* com **causa** e **alternativa adotada**.
4. **Problemas conhecidos (22.5):** abrir/fechar itens.
5. **Decisões (seção 3):** registrar qualquer decisão que mude o plano; se mudar o plano, anotar também em **22.6 Histórico de mudanças do plano**.
6. **Próximo passo (22.1):** reescrever em uma frase.

**Nunca apagar** registros de tentativas que falharam — é justamente o que evita retrabalho. Se estiverem resolvidas, marcar como "resolvido" e manter.

### 0.3 Legenda de status
| Marca | Significado |
|---|---|
| `[ ]` | Não iniciado |
| `[~]` | Em andamento / parcialmente feito |
| `[x]` | Concluído e **testado** (critério de aceite cumprido) |
| `[!]` | Bloqueado ou com falha (ver Diário e Problemas conhecidos) |
| `[-]` | Cancelado / substituído (explicar no Diário) |

### 0.4 Resultado de cada tentativa (usar no Diário)
✅ Deu certo · ⚠️ Parcial (funciona com ressalvas) · ❌ Não deu certo

### 0.5 TRAVA ANTI-ESQUECIMENTO (obrigatória em TODO turno)

> **Motivo:** a regra 0.2 já existia, mas foi esquecida na primeira entrega (registrado em 22.4, item E1). Regra sem gatilho falha; por isso existe esta trava.

**Gatilho:** qualquer turno em que algo for **criado, alterado, corrigido, decidido ou testado** — inclusive ajuste pequeno (cor, texto, hover) e inclusive quando o usuário só pediu "ajusta isso".

**Ritual de fim de turno (ordem fixa, nunca pular):**
1. **Publicar/entregar** o código ou arquivo.
2. **Atualizar ESTE arquivo** (editar o `.md` de verdade, não apenas dizer que vai fazer):
   - [ ] Painel (seção 2) e checklist da fase (seção 16): status mudou?
   - [ ] **Diário (22.2): uma linha nova por tarefa/ajuste**, com data, resultado e arquivos/links.
   - [ ] **22.3 / 22.4:** lição que deu certo ou que falhou (com causa).
   - [ ] **22.5:** problema novo aberto ou resolvido.
   - [ ] **Seção 3 / 22.6:** decisão ou mudança de plano.
   - [ ] **22.1 Próximo passo** reescrito.
   - [ ] Cabeçalho: versão/data/resumo do que mudou.
3. **Só então responder** ao usuário e **mencionar em uma frase** o que foi registrado no `.md`.

**Verificação final (pergunta obrigatória antes de enviar a resposta):**
"Existe alguma coisa que eu fiz neste turno que **não** está registrada no Diário?" Se sim, registrar antes de responder.

**Reconciliação no início de cada turno:** comparar a **última linha do Diário** com o que foi entregue no turno anterior. Se estiver faltando algo, registrar primeiro (marcar como "registro retroativo") e só depois continuar.

**Se o usuário disser "atualize o MD" ou perguntar se foi atualizado:** assumir que houve falha, corrigir imediatamente e registrar a falha em 22.4.

**Definição de pronto (DoD) de QUALQUER tarefa:** código entregue **e** este arquivo atualizado. Tarefa sem registro **não** está concluída.

---

## 1. Visão geral do produto

### 1.1 Problema
O designer/social media produz materiais (posts, carrosséis, Reels, stories) e precisa que o cliente os **veja exatamente como ficarão no Instagram** e **aprove ou peça ajustes** sem depender de PDF, WhatsApp ou prints.

### 1.2 Solução
Um site com dois lados:

| Lado | Quem usa | Como acessa | O que faz |
|---|---|---|---|
| **Admin** | Só você | Login (e-mail + senha) via Supabase Auth | Cria clientes, sobe materiais, define status, copia link/senha, vê aprovações |
| **Cliente (visualização)** | Seus clientes | **Link + senha** (sem conta) | Vê o perfil simulado, abre posts/Reels/stories, aprova ou pede ajustes |

### 1.3 Requisitos funcionais (resumo do que foi pedido)

**Admin**
- RF-A1: Dashboard com lista de clientes (avatar, nome, status, pendências de aprovação).
- RF-A2: Criar/editar/arquivar cliente com os dados de perfil (nome, @usuário, bio, categoria, link, avatar, seguidores/seguindo fictícios).
- RF-A3: Definir **status do cliente**: `não publicado`, `publicado`, `arquivado`.
- RF-A4: Definir/trocar a **senha de acesso** do cliente e **copiar o link**.
- RF-A5: Subir publicações de 4 tipos: **imagem única**, **carrossel**, **Reels** (vídeo + capa) e **stories**.
- RF-A6: Para Reels: subir vídeo e capa, e ajustar o **recorte da capa** que aparece na grade do perfil.
- RF-A7: Cada post tem legenda, data planejada e flag "visível ao cliente".
- RF-A8: Ver aprovações/ajustes pedidos pelos clientes (com contador de não lidas).
- RF-A9: A **página inicial do site é o login do admin** (só e-mail e senha, sem criar conta). O cliente só entra por `/#/c/:slug`.
- RF-A10: **Exportar dados** (backup JSON de clientes, posts, retornos e ajustes) e **Importar dados** (restaura o backup, com confirmação, substituindo o estado atual).
- RF-A11: **Métricas por cliente**: conteúdos avaliados, aprovados na 1ª avaliação, reprovados (com pedido de ajuste), taxa de reajuste por conteúdo e reenvios, no total e por tipo (imagem, carrossel, Reels, story).

**Cliente**
- RF-C1: Acessar por link; se o cliente não estiver `publicado`, ver **página de erro** (mesmo com o link).
- RF-C2: Se `publicado`, informar **senha** para liberar.
- RF-C3: Ver o perfil simulado: avatar (com **anel de gradiente** se houver stories), bio, estatísticas, grade de posts.
- RF-C4: Abrir um post e vê-lo "como no Instagram": imagem + legenda; carrossel com navegação entre slides; Reels com vídeo rodando.
- RF-C5: **Player com HUD** nos Reels (play/pause, barra de progresso com seek, volume/mudo) — recurso que o Instagram não tem, mas é útil para aprovação.
- RF-C9: O perfil mostra **publicações** e **stories** conforme o filtro de mês (em "Ver todos", o total).
- RF-C6: **Filtro por mês**: padrão = mês atual; botões voltar/avançar mês; avançar para mês sem posts mostra vazio; opção **"Ver todos"** (desde o início).
- RF-C7: **Aprovar** ou **Não aprovar** cada post; se não aprovar, aparece caixa de observações com os ajustes.
- RF-C8: Tudo isso **sem o cliente ter conta**; a resposta aparece para o admin.

### 1.4 Fora do escopo da v1 (ver backlog na seção 20)
Comentários em cima da imagem (pins), notificações por e-mail/WhatsApp, multi-usuário admin, versionamento visual lado a lado, transcodificação de vídeo no navegador.

### 1.5 Observação de marca
Não usar o nome/logo do Instagram nem copiar ícones proprietários. Usar ícones SVG genéricos (ex.: lucide) com aparência equivalente. Colocar rodapé discreto: "Simulação para aprovação de conteúdo".

---

## 2. Painel de progresso

> **Ordem definida:** (1) protótipo visual com dados fictícios → (2) painel admin sobre o protótipo → (3 em diante) infraestrutura real (Supabase) e integração. Detalhes e critérios de aceite na seção 16.

| Fase | Entrega | Status |
|---|---|---|
| **1** | **Protótipo visual do cliente** (dados fictícios): perfil, grade, filtro de mês, post, carrossel, player de Reels, stories, aprovação (local) | `[~]` (1.0 feita) |
| **2** | **Painel admin sobre o protótipo** (dados locais): dashboard, formulário de cliente, editor de post, preview, caixa de entrada | `[~]` (feito no HTML único; falta validação do usuário e refazer no Vite) |
| **3** | Contas e ferramentas (Supabase, GitHub, Node) | `[~]` (feito: projeto Supabase, URL e chave pública, limites, cadastro público desligado, repo `aprove` criado, Node LTS e Git instalados; falta confirmar Pages em *GitHub Actions* e anotar as quotas totais do plano) |
| **4** | Supabase: schema, RLS, RPCs, Storage | `[x]` (migrações 001 a 007 aplicadas no Supabase real; admin criado; `security_checks.sql` com 39 PASS; conferência REST manual ok) |
| **5** | Integração admin: Auth real, clientes reais, deploy automático | `[~]` (em etapas, D28: **Etapa 1 rodando no PC** (`npm run dev`, 4 OK); **Etapa 1 concluída em 19/11/2026** (site no ar no Pages com os 4 OK); **Etapa 2 em blocos (D29): 2a entregue, aguardando teste no PC**; 2b a 2e e Etapa 3 não iniciadas) |
| **6** | Posts e uploads reais (imagem, carrossel, Reels, stories) | `[ ]` |
| **7** | Acesso real do cliente: gate, senha, sessão, feed do banco | `[ ]` |
| **8** | Aprovações reais + caixa de entrada em tempo real | `[ ]` |
| **9** | Polimento, acessibilidade, performance, segurança, QA | `[ ]` |
| **10** | Go-live e rotina de manutenção | `[ ]` |

Os checklists detalhados de cada fase ficam na seção 16 (marcar lá também).

**Próximo passo imediato:** usuário testar o **bloco 2a** no PC (`npm run dev`, `npm run build`, push) e, se ok, seguir para o **2b** (perfil, grade, filtro de mês). O HTML do protótipo continua só como referência visual (D26). Em paralelo, validar o protótipo no celular e no desktop (P11).

---

## 3. Registro de decisões

| # | Decisão | Motivo | Reversível? |
|---|---|---|---|
| D1 | Front em **Vite + React + TypeScript + Tailwind** | Ecossistema forte, build estático simples para GitHub Pages | Sim |
| D2 | **HashRouter** (`/#/c/slug`) | GitHub Pages não tem rewrite de rotas; hash evita 404 ao recarregar | Sim (trocar por 404.html redirect) |
| D3 | Cliente **não tem conta Supabase**; acesso por **link + senha** validados em **funções RPC** no Postgres | Cliente anônimo nunca lê tabelas direto; toda leitura passa por função que valida senha/sessão | Não (é o núcleo de segurança) |
| D4 | Senha do cliente armazenada **com hash bcrypt** (`pgcrypto`) em tabela sem acesso por nenhuma role cliente | Mesmo vazamento do banco não expõe senhas em texto | Não |
| D5 | **Sessão do cliente** = token aleatório (guardado só como hash SHA-256 no banco) com validade de 7 dias | Evita reenviar senha a cada requisição | Sim |
| D6 | Mídias em bucket **público** `media`, caminhos com **UUID** não listáveis (v1) | Mais simples e rápido para vídeo; URLs não são adivinháveis | Sim → v2 com URLs assinadas (seção 8.3) |
| D7 | Cada **story** é um registro `posts` do tipo `story` | Permite aprovar story por story | Sim |
| D8 | Cliente pode **alterar** a decisão (histórico é mantido) | Clientes mudam de ideia | Sim |
| D9 | Filtro por mês usa **`scheduled_date`** (data planejada de publicação) | É o que o cliente espera ver no "calendário" | Não |
| D10 | Datas são `date` (sem fuso) e "mês atual" é calculado em `America/Sao_Paulo` | Evita bugs de virada de mês por fuso | Não |
| D11 | **Ordem de desenvolvimento: interface primeiro** (protótipo com dados fictícios → admin local → só então Supabase) | O usuário valida visual e fluxo antes de investir na infraestrutura | Não |
| D12 | Componentes visuais falam com uma **camada de provider** (`MockProvider` agora, `SupabaseProvider` depois) | Trocar a fonte de dados sem refazer telas | Não |
| D14 | **Selo de status (bolinhas) na grade é mantido** (verde aprovado · laranja ajustes · cinza pendente) | Usuário aprovou no protótipo | Sim |
| D15 | **Continuar no protótipo em arquivo único (HTML)** até haver ambiente para rodar o projeto Vite (aqui o npm está bloqueado) | Permite validar fluxo e visual do admin agora; a lógica é reaproveitável no `MockProvider` | Sim |
| D16 | Estado do protótipo **persiste em `localStorage`** (`mock:v2`); só vídeos enviados não persistem | Cliente e admin em abas diferentes enxergam o mesmo dado, como pede o aceite da Fase 2 | Sim |
| D17 | Post tem flag **visível ao cliente** (`v`): rascunho fica oculto; **"Salvar e publicar"** o torna visível; editar post com retorno oferece **"Reenviar para aprovação"** (marcada) que sobe a revisão e volta a pendente | Cumpre RF-A7 e 12.6/11.10 | Sim |
| D18 | Ao mudar o cliente de **não publicado/arquivado para publicado**, o admin é **sempre** solicitado a informar a senha (modal com campo e botão Gerar; mínimo de 8 caracteres; cancelar mantém o status). Vale no dashboard e no formulário | Pedido do usuário: toda publicação passa por uma senha definida na hora | Sim |
| D19 | A **raiz do site (sem hash) é sempre o login do admin**; o cliente só entra por `#/c/:slug`. Login só com e-mail e senha, sem criar conta (a conta é criada no Supabase) | Pedido do usuário; já era a rota `/` → `/admin` da seção 13, mas o protótipo caía no cliente demo | Não |
| D20 | **Exportar/Importar dados** no dashboard do admin: JSON `{app:'aprovacao-conteudo', v:2, n, C, P}`; importar valida o formato, pede confirmação e **substitui** os dados atuais. Vídeos enviados não entram no arquivo. O arquivo contém as senhas do protótipo | Backup antes de implementações futuras. No Supabase o backup passa a ser o dump SQL (14.4); aqui é só do protótipo | Sim |
| D21 | **Métricas**: *reprovado* = conteúdo com ao menos um pedido de ajuste (histórico inteiro); *aprovado na 1ª avaliação* = a primeira resposta do cliente foi aprovar; *ajustes por conteúdo reprovado* = pedidos de ajuste ÷ conteúdos reprovados; *reenvios* = soma de `revisão − 1`. Rascunhos não entram; total e por tipo | Definições escolhidas por mim a partir do pedido; o usuário pode ajustar | Sim |
| D22 | O número de **publicações** do perfil (cliente) segue o **filtro de mês** (em "Ver todos", o total); ao lado aparece o número de **stories** do mesmo filtro. Substitui a regra antiga de 11.2 (total não filtrado) | Pedido do usuário | Sim |
| D13 | Este arquivo é **documento vivo** com diário de bordo (seção 22) atualizado a cada tarefa | Continuidade entre sessões e memória do que falhou | Não |
| D23 | **Repositório `aprove`** (público) em `igorjdscarvalho`; site em `https://igorjdscarvalho.github.io/aprove/`; `base` do Vite = `/aprove/` | GitHub Pages grátis exige repositório público; nenhum segredo vai ao código (segurança fica no banco) | Sim |
| D24 | Nova migração **`007_grants_admin_tables.sql`**: `grant select, insert, update, delete` em `clients`, `posts`, `post_media` e `reviews` ao papel `authenticated` (+ `usage` no schema `public`). Quem filtra é o RLS (`is_admin()`). `client_credentials`, `client_sessions`, `login_attempts` e `admins` seguem sem acesso direto | O Supabase não concede mais permissão de tabela ao `authenticated` por padrão; sem isso nem o admin lê ou edita (`42501 permission denied`). Achado no teste de segurança rodado no Supabase real | Sim |
| D25 | Limite de arquivo do Storage = **50 MB**, igual ao `file_size_limit` da `003` (52428800 bytes) e ao `VIDEO_MAX_MB: 50`; nada a ajustar | Valor informado pelo usuário no painel (Storage → Settings) em 18/11/2026 | Sim |
| D26 | **Não publicar o protótipo HTML no Pages.** O usuário espera: o HTML só vai para o repositório `aprove` junto com a Fase 5 (backup opcional em `prototipo/`, sem ativar Pages); o deploy só nasce com o `deploy.yml` do projeto Vite | O protótipo tem dados fictícios e login de demonstração, ficaria visível num repo público e sem `noindex`/CSP (5.6) | Sim |
| D27 | **Só existe uma conta de login: a do admin** (já criada no Supabase Auth e em `admins`). O site **não tem tela de cadastro**; clientes não têm conta (link + senha, sem Supabase Auth). *Allow new users to sign up* foi **desligado** no Supabase em 18/11/2026 | A URL e a publishable key ficam públicas no código; sem desligar, qualquer pessoa poderia chamar a API de cadastro direto e criar contas (sem acesso a dados, por RLS, mas lixo e abuso) | Sim |
| D28 | **Fase 5 em etapas.** Etapa 1: esqueleto Vite + React + TS + Tailwind 3 (`base: '/aprove/'`), `env.ts`, `supabase.ts`, página de **diagnóstico** (ping, anônimo bloqueado em `clients`, `client_gate`), `deploy.yml` e `keepalive.yml`. Etapa 2: cliente no Vite (Fase 1.x). Etapa 3: admin com Supabase Auth e clientes reais. Dependências com faixas `^` (React 18, Router 6, Vite 5, Tailwind 3.4, supabase-js 2); a variável segue chamada `VITE_SUPABASE_ANON_KEY` mas recebe a **publishable key** | Usuário escolheu "Vite em etapas" por ser plano-fiel e verificável; aqui não há como instalar pacotes nem alcançar o Supabase, então cada etapa é testada no PC do usuário | Sim |
| D29 | **Etapa 2 em cinco blocos**: 2a providers + `MockProvider` + rotas + Gate/Unavailable (1.2 a 1.4); 2b perfil, avatar com anel, abas, grade, filtro de mês (1.5 a 1.7); 2c visualizador, legenda, carrossel (1.8, 1.9); 2d player de Reels com HUD e stories (1.10, 1.11); 2e painel de aprovação, responsividade, tema, skeletons (1.12, 1.13). As telas **não são redesenhadas**: são portadas do protótipo HTML (referência visual). Até a Fase 7 o lado do cliente usa sempre o `MockProvider`; o seed é recalculado por mês corrente e fica em `localStorage` (`mock:state`, versão 3) | Usuário deixou a ordem a critério do plano; blocos pequenos podem ser testados no PC, já que o ambiente do Claude não roda `npm` | Sim |

---

## 4. Arquitetura

```
┌──────────────────────────┐        HTTPS         ┌─────────────────────────────┐
│  GitHub Pages (estático) │ ───────────────────▶ │  Supabase                   │
│  React SPA (HashRouter)  │                      │  • Auth (só 1 admin)        │
│                          │ ◀─────────────────── │  • Postgres + RLS + RPCs    │
│  /#/admin/...  (admin)   │   JSON / mídia       │  • Storage (bucket media)   │
│  /#/c/:slug    (cliente) │                      │  • Edge Functions (v2)      │
└──────────────────────────┘                      └─────────────────────────────┘
```

### 4.1 Dois "caminhos de acesso" ao banco

1. **Admin (autenticado)** → usa `supabase-js` normal; políticas **RLS** liberam tudo só se `is_admin()` for verdadeiro.
2. **Cliente (anônimo)** → role `anon` **não tem acesso a nenhuma tabela**. Só pode chamar um conjunto fechado de **funções RPC** (`client_gate`, `client_login`, `client_get_feed`, `client_submit_review`, `client_logout`, `ping`). Cada função valida o token de sessão e o status do cliente.

### 4.2 Fluxo do cliente

```
Abre link /#/c/marca-x-7k3p9q
   │
   ├─ RPC client_gate(slug) ──▶ { available:false } → Página "Link indisponível"
   │                              (inexistente, não publicado e arquivado são IDÊNTICOS,
   │                               para não revelar se o slug existe)
   └─ { available:true, name, avatar } → Tela de senha
          │
          └─ RPC client_login(slug, senha) → { ok:true, token } | invalid_password | locked
                 │
                 └─ guarda token (localStorage, por slug) → RPC client_get_feed(token)
                        │
                        └─ renderiza perfil; aprovações via RPC client_submit_review(token, ...)
```

Se o admin mudar o cliente para `não publicado` ou `arquivado`, **todas as sessões deixam de funcionar imediatamente** (a função `_session_client` exige `status = 'published'`).

---

## 5. Estrutura do repositório

```
/
├─ .github/workflows/
│   ├─ deploy.yml                # build + publicação no Pages
│   └─ keepalive.yml             # evita pausa do projeto Supabase gratuito
├─ supabase/
│   ├─ tests/
│   │   └─ security_checks.sql   # teste de segurança do banco (17.2)
│   └─ migrations/
│       ├─ 001_schema.sql
│       ├─ 002_rls_admin.sql
│       ├─ 003_storage.sql
│       ├─ 004_rpc_client.sql
│       ├─ 005_rpc_admin.sql
│       ├─ 006_grants.sql
│       └─ 007_grants_admin_tables.sql
├─ public/
│   ├─ robots.txt                # Disallow: /
│   └─ favicon.svg
├─ src/
│   ├─ main.tsx
│   ├─ App.tsx                   # rotas
│   ├─ config/
│   │   ├─ env.ts                # lê VITE_* e valida
│   │   └─ instagram.ts          # constantes (proporções, limites) — fáceis de ajustar
│   ├─ lib/
│   │   ├─ supabase.ts           # createClient
│   │   ├─ clientApi.ts          # chamadas RPC do cliente
│   │   ├─ adminApi.ts           # queries do admin
│   │   ├─ storage.ts            # upload, URL pública, remoção
│   │   ├─ dates.ts              # helpers de mês / fuso
│   │   ├─ slug.ts               # gerador de slug + sufixo aleatório
│   │   ├─ password.ts           # gerador de senha legível
│   │   ├─ caption.ts            # parser de #hashtag, @menção, URLs
│   │   └─ media.ts              # metadados de imagem/vídeo, poster, resize
│   ├─ types/
│   │   └─ domain.ts
│   ├─ providers/
│   │   ├─ types.ts              # interfaces ClientDataProvider / AdminDataProvider
│   │   ├─ mock/                 # Fase 1–2: dados fictícios (memória + localStorage)
│   │   │   ├─ MockProvider.ts
│   │   │   └─ seed.ts           # clientes/posts de exemplo de todos os tipos
│   │   ├─ supabase/             # Fase 5–8: implementação real
│   │   │   └─ SupabaseProvider.ts
│   │   └─ index.ts              # escolhe o provider (VITE_DATA_SOURCE=mock|supabase)
│   ├─ hooks/
│   │   ├─ useAdminSession.ts
│   │   ├─ useClientSession.ts
│   │   ├─ useVideoPlayer.ts
│   │   └─ useStoryTimer.ts
│   ├─ components/
│   │   ├─ ig/                   # componentes que imitam o Instagram
│   │   │   ├─ ProfileHeader.tsx
│   │   │   ├─ Avatar.tsx        # com anel de gradiente
│   │   │   ├─ MonthFilter.tsx
│   │   │   ├─ ProfileTabs.tsx
│   │   │   ├─ PostGrid.tsx
│   │   │   ├─ GridTile.tsx
│   │   │   ├─ PostViewer.tsx
│   │   │   ├─ Carousel.tsx
│   │   │   ├─ Caption.tsx
│   │   │   ├─ ReelPlayer.tsx
│   │   │   ├─ PlayerHUD.tsx
│   │   │   ├─ StoryViewer.tsx
│   │   │   └─ ApprovalPanel.tsx
│   │   ├─ admin/
│   │   │   ├─ ClientForm.tsx
│   │   │   ├─ PostEditor.tsx
│   │   │   ├─ MediaUploader.tsx
│   │   │   ├─ CoverCropper.tsx
│   │   │   ├─ PhonePreview.tsx
│   │   │   └─ ReviewInbox.tsx
│   │   └─ ui/                   # Button, Modal, Toast, Spinner, Badge, etc.
│   ├─ pages/
│   │   ├─ admin/ (Login, Dashboard, ClientNew, ClientWorkspace, PostEdit, Inbox)
│   │   └─ client/ (Gate, ClientFeed, Unavailable)
│   └─ styles/index.css
├─ index.html
├─ vite.config.ts
├─ tailwind.config.ts
├─ tsconfig.json
├─ package.json
├─ .env.example
└─ CONTINUIDADE_PLANO_DE_DESENVOLVIMENTO.md
```

---

## 6. Modelo de dados (Postgres)

### 6.1 Diagrama lógico

```
auth.users ─┐
            └─< admins

clients ──< posts ──< post_media
   │          │
   │          └──< reviews
   ├── 1:1 client_credentials   (hash da senha; inacessível por qualquer role cliente)
   ├──< client_sessions         (token_hash, expiração)
   └──< login_attempts          (limite de tentativas)
```

### 6.2 Migração `001_schema.sql`

```sql
-- Extensões
create extension if not exists pgcrypto with schema extensions;

-- Tipos
create type public.client_status    as enum ('unpublished', 'published', 'archived');
create type public.post_type        as enum ('image', 'carousel', 'reel', 'story');
create type public.approval_status  as enum ('pending', 'approved', 'changes_requested');
create type public.review_decision  as enum ('approved', 'changes_requested');
create type public.media_kind       as enum ('image', 'video');

-- Admins (apenas você)
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Clientes
create table public.clients (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique
                   check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 80),
  name             text not null check (char_length(name) between 1 and 80),
  username         text not null check (username ~ '^[a-z0-9._]{1,30}$'),
  bio              text not null default '' check (char_length(bio) <= 150),
  category         text not null default '' check (char_length(category) <= 60),
  website          text not null default '' check (char_length(website) <= 200),
  avatar_path      text,
  followers_count  integer not null default 0 check (followers_count >= 0),
  following_count  integer not null default 0 check (following_count >= 0),
  status           public.client_status not null default 'unpublished',
  internal_notes   text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index clients_status_idx on public.clients(status);

-- Credenciais (hash). Nenhuma policy => ninguém lê via API; só funções SECURITY DEFINER.
create table public.client_credentials (
  client_id     uuid primary key references public.clients(id) on delete cascade,
  password_hash text not null,
  updated_at    timestamptz not null default now()
);

-- Posts
create table public.posts (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  type            public.post_type not null,
  caption         text not null default '' check (char_length(caption) <= 2200),
  location        text not null default '' check (char_length(location) <= 100),
  audio_name      text not null default '',               -- Reels: "Áudio original" etc.
  scheduled_date  date not null,                          -- data planejada (filtro por mês)
  scheduled_time  time,                                   -- opcional
  is_visible      boolean not null default false,         -- visível ao cliente?
  approval_status public.approval_status not null default 'pending',
  revision        integer not null default 1,             -- incrementa quando você reenvia
  aspect_ratio    text not null default '4:5'
                  check (aspect_ratio in ('1:1','4:5','1.91:1','9:16')),
  cover_path      text,                                   -- capa (Reels) ou miniatura
  grid_crop_x     numeric not null default 50 check (grid_crop_x between 0 and 100),
  grid_crop_y     numeric not null default 50 check (grid_crop_y between 0 and 100),
  story_seconds   integer not null default 5 check (story_seconds between 1 and 15),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index posts_client_date_idx on public.posts(client_id, scheduled_date desc);
create index posts_client_visible_idx on public.posts(client_id) where is_visible;

-- Mídias de um post (carrossel => várias)
create table public.post_media (
  id               uuid primary key default gen_random_uuid(),
  post_id          uuid not null references public.posts(id) on delete cascade,
  position         integer not null default 0,
  kind             public.media_kind not null,
  path             text not null,
  poster_path      text,                                  -- frame do vídeo
  mime             text not null default '',
  width            integer,
  height           integer,
  duration_seconds numeric,
  size_bytes       bigint,
  created_at       timestamptz not null default now(),
  unique (post_id, position) deferrable initially deferred
);
create index post_media_post_idx on public.post_media(post_id, position);

-- Aprovações (histórico completo, nunca sobrescreve)
create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references public.posts(id) on delete cascade,
  client_id     uuid not null references public.clients(id) on delete cascade,
  decision      public.review_decision not null,
  comment       text not null default '' check (char_length(comment) <= 2000),
  reviewer_name text not null default '' check (char_length(reviewer_name) <= 60),
  revision      integer not null,
  created_at    timestamptz not null default now(),
  read_at       timestamptz,                              -- quando VOCÊ leu
  check (decision = 'approved' or char_length(btrim(comment)) > 0)
);
create index reviews_unread_idx on public.reviews(created_at desc) where read_at is null;
create index reviews_post_idx   on public.reviews(post_id, created_at desc);

-- Sessões do cliente (token guardado só como hash)
create table public.client_sessions (
  token_hash text primary key,
  client_id  uuid not null references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index client_sessions_client_idx on public.client_sessions(client_id);

-- Tentativas de login (anti força bruta)
create table public.login_attempts (
  id         bigint generated always as identity primary key,
  client_id  uuid not null references public.clients(id) on delete cascade,
  success    boolean not null,
  created_at timestamptz not null default now()
);
create index login_attempts_idx on public.login_attempts(client_id, created_at desc);

-- updated_at automático
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger clients_touch before update on public.clients
  for each row execute function public.touch_updated_at();
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();
```

### 6.3 Migração `002_rls_admin.sql`

```sql
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

alter table public.admins             enable row level security;
alter table public.clients            enable row level security;
alter table public.client_credentials enable row level security;  -- sem policy: bloqueada
alter table public.posts              enable row level security;
alter table public.post_media         enable row level security;
alter table public.reviews            enable row level security;
alter table public.client_sessions    enable row level security;  -- sem policy: bloqueada
alter table public.login_attempts     enable row level security;  -- sem policy: bloqueada

create policy admin_all_clients on public.clients
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy admin_all_posts on public.posts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy admin_all_post_media on public.post_media
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy admin_all_reviews on public.reviews
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Realtime para a caixa de entrada de aprovações
alter publication supabase_realtime add table public.reviews;
```

> `admins` fica com RLS ligado e **sem policy**: você se insere uma única vez pelo SQL Editor (seção 6.7).

### 6.4 Migração `003_storage.sql`

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true,
  52428800,   -- 50 MB: confirmar o limite vigente do plano no painel do Supabase
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm']
)
on conflict (id) do nothing;

-- Admin pode tudo no bucket; anônimo NÃO pode listar (só acessar por URL exata de bucket público)
create policy media_admin_select on storage.objects
  for select to authenticated using (bucket_id = 'media' and public.is_admin());
create policy media_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_update on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy media_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());
```

**Convenção de caminhos** (sempre com UUID, nunca com nome original do arquivo):

```
media/{client_id}/avatar/{uuid}.{ext}
media/{client_id}/{post_id}/{uuid}.{ext}          # imagens e vídeos
media/{client_id}/{post_id}/cover-{uuid}.{ext}    # capa
media/{client_id}/{post_id}/poster-{uuid}.jpg     # frame do vídeo
```

URL pública: `${VITE_SUPABASE_URL}/storage/v1/object/public/media/${path}`

### 6.5 Migração `004_rpc_client.sql` (funções chamadas pelo cliente anônimo)

```sql
-- Resolve o token -> client_id (ou NULL). Só aceita cliente 'published' e sessão não expirada.
create or replace function public._session_client(p_token text) returns uuid
language sql stable security definer set search_path = public, extensions as $$
  select s.client_id
  from public.client_sessions s
  join public.clients c on c.id = s.client_id
  where s.token_hash = encode(digest(coalesce(p_token,''), 'sha256'), 'hex')
    and s.expires_at > now()
    and c.status = 'published'
  limit 1;
$$;

-- 1) Gate: diz se o link está disponível. Resposta IDÊNTICA para inexistente/não publicado/arquivado.
create or replace function public.client_gate(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c public.clients%rowtype;
begin
  select * into c from public.clients where slug = lower(coalesce(p_slug,''));
  if not found or c.status <> 'published' then
    return jsonb_build_object('available', false);
  end if;
  return jsonb_build_object('available', true, 'name', c.name,
                            'username', c.username, 'avatar_path', c.avatar_path);
end $$;

-- 2) Login por senha -> token de sessão
create or replace function public.client_login(p_slug text, p_password text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  c        public.clients%rowtype;
  v_hash   text;
  v_fails  integer;
  v_token  text;
begin
  select * into c from public.clients where slug = lower(coalesce(p_slug,''));
  if not found or c.status <> 'published' then
    return jsonb_build_object('ok', false, 'error', 'unavailable');
  end if;

  select count(*) into v_fails from public.login_attempts
   where client_id = c.id and success = false and created_at > now() - interval '15 minutes';
  if v_fails >= 5 then
    return jsonb_build_object('ok', false, 'error', 'locked');
  end if;

  select password_hash into v_hash from public.client_credentials where client_id = c.id;
  if v_hash is null or crypt(coalesce(p_password,''), v_hash) <> v_hash then
    insert into public.login_attempts(client_id, success) values (c.id, false);
    return jsonb_build_object('ok', false, 'error', 'invalid_password');
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.client_sessions(token_hash, client_id, expires_at)
  values (encode(digest(v_token, 'sha256'), 'hex'), c.id, now() + interval '7 days');

  delete from public.login_attempts where client_id = c.id;                 -- zera falhas
  delete from public.client_sessions where expires_at < now();               -- limpeza oportunista
  delete from public.login_attempts where created_at < now() - interval '2 days';

  return jsonb_build_object('ok', true, 'token', v_token);
end $$;

-- 3) Feed completo (perfil + posts visíveis + mídias + histórico de reviews)
create or replace function public.client_get_feed(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_id uuid := public._session_client(p_token);
  c public.clients%rowtype;
begin
  if v_id is null then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;
  select * into c from public.clients where id = v_id;

  return jsonb_build_object(
    'ok', true,
    'client', jsonb_build_object(
      'name', c.name, 'username', c.username, 'bio', c.bio, 'category', c.category,
      'website', c.website, 'avatar_path', c.avatar_path,
      'followers_count', c.followers_count, 'following_count', c.following_count
    ),
    'posts', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id, 'type', p.type, 'caption', p.caption, 'location', p.location,
          'audio_name', p.audio_name, 'scheduled_date', p.scheduled_date,
          'scheduled_time', p.scheduled_time, 'approval_status', p.approval_status,
          'revision', p.revision, 'aspect_ratio', p.aspect_ratio, 'cover_path', p.cover_path,
          'grid_crop_x', p.grid_crop_x, 'grid_crop_y', p.grid_crop_y,
          'story_seconds', p.story_seconds,
          'media', (
            select coalesce(jsonb_agg(jsonb_build_object(
                     'id', m.id, 'position', m.position, 'kind', m.kind, 'path', m.path,
                     'poster_path', m.poster_path, 'width', m.width, 'height', m.height,
                     'duration', m.duration_seconds) order by m.position), '[]'::jsonb)
            from public.post_media m where m.post_id = p.id),
          'reviews', (
            select coalesce(jsonb_agg(jsonb_build_object(
                     'decision', r.decision, 'comment', r.comment,
                     'reviewer_name', r.reviewer_name, 'revision', r.revision,
                     'created_at', r.created_at) order by r.created_at desc), '[]'::jsonb)
            from public.reviews r where r.post_id = p.id)
        )
        order by p.scheduled_date desc, p.scheduled_time desc nulls last, p.created_at desc
      )
      from public.posts p
      where p.client_id = v_id and p.is_visible
    ), '[]'::jsonb)
  );
end $$;

-- 4) Enviar aprovação / pedido de ajuste
create or replace function public.client_submit_review(
  p_token text, p_post_id uuid, p_decision public.review_decision,
  p_comment text, p_reviewer_name text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := public._session_client(p_token);
  p public.posts%rowtype;
  v_comment text := btrim(coalesce(p_comment, ''));
  v_recent integer;
begin
  if v_id is null then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;

  select * into p from public.posts
   where id = p_post_id and client_id = v_id and is_visible;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if p_decision = 'changes_requested' and v_comment = '' then
    return jsonb_build_object('ok', false, 'error', 'comment_required');
  end if;
  if char_length(v_comment) > 2000 then
    return jsonb_build_object('ok', false, 'error', 'comment_too_long');
  end if;

  -- anti-spam: no máx. 20 envios por cliente em 10 minutos
  select count(*) into v_recent from public.reviews
   where client_id = v_id and created_at > now() - interval '10 minutes';
  if v_recent >= 20 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  insert into public.reviews(post_id, client_id, decision, comment, reviewer_name, revision)
  values (p.id, v_id, p_decision,
          case when p_decision = 'approved' then '' else v_comment end,
          left(btrim(coalesce(p_reviewer_name,'')), 60), p.revision);

  update public.posts
     set approval_status = case p_decision when 'approved' then 'approved'::public.approval_status
                                           else 'changes_requested'::public.approval_status end
   where id = p.id;

  return jsonb_build_object('ok', true, 'approval_status', p_decision);
end $$;

-- 5) Logout
create or replace function public.client_logout(p_token text) returns void
language sql security definer set search_path = public, extensions as $$
  delete from public.client_sessions
   where token_hash = encode(digest(coalesce(p_token,''), 'sha256'), 'hex');
$$;

-- 6) Keep-alive (evita pausa por inatividade)
create or replace function public.ping() returns text
language sql stable as $$ select 'ok'::text $$;
```

> **Observação sobre a trava de 5 tentativas:** ela é por cliente (não por IP). Um invasor poderia travar o login do cliente por 15 min (DoS leve). É um trade-off aceito na v1; o admin pode destravar (RPC `admin_unlock_client`) e a tela informa o tempo de espera.

### 6.6 Migração `005_rpc_admin.sql`

```sql
-- Define/troca a senha de um cliente e derruba sessões existentes
create or replace function public.admin_set_client_password(p_client_id uuid, p_password text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if char_length(coalesce(p_password,'')) < 8 then raise exception 'password_too_short'; end if;

  insert into public.client_credentials(client_id, password_hash, updated_at)
  values (p_client_id, crypt(p_password, gen_salt('bf', 10)), now())
  on conflict (client_id) do update
     set password_hash = excluded.password_hash, updated_at = now();

  delete from public.client_sessions where client_id = p_client_id;
  delete from public.login_attempts  where client_id = p_client_id;
end $$;

-- Destrava o login de um cliente
create or replace function public.admin_unlock_client(p_client_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  delete from public.login_attempts where client_id = p_client_id;
end $$;

-- Derruba todas as sessões (ex.: suspeita de vazamento)
create or replace function public.admin_revoke_sessions(p_client_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  delete from public.client_sessions where client_id = p_client_id;
end $$;

-- Contadores para o dashboard (pendências por cliente)
create or replace function public.admin_client_counters()
returns table (client_id uuid, pending bigint, changes_requested bigint, approved bigint, unread_reviews bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return query
  select c.id,
         count(p.*) filter (where p.is_visible and p.approval_status = 'pending'),
         count(p.*) filter (where p.is_visible and p.approval_status = 'changes_requested'),
         count(p.*) filter (where p.is_visible and p.approval_status = 'approved'),
         (select count(*) from public.reviews r where r.client_id = c.id and r.read_at is null)
  from public.clients c
  left join public.posts p on p.client_id = c.id
  group by c.id;
end $$;
```

### 6.7 Migração `006_grants.sql` e criação do admin

```sql
-- Anon não toca em nenhuma tabela
revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;

-- Funções: ninguém executa por padrão; liberamos só o que é necessário
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

grant execute on function
  public.client_gate(text),
  public.client_login(text, text),
  public.client_get_feed(text),
  public.client_submit_review(text, uuid, public.review_decision, text, text),
  public.client_logout(text),
  public.ping()
to anon, authenticated;

grant execute on function
  public.is_admin(),
  public.admin_set_client_password(uuid, text),
  public.admin_unlock_client(uuid),
  public.admin_revoke_sessions(uuid),
  public.admin_client_counters()
to authenticated;
```

**Criar o admin (uma única vez):**
1. Painel Supabase → Authentication → Users → *Add user* (seu e-mail + senha forte; marque *Auto confirm*).
2. **Desligar cadastro público:** Authentication → Sign In / Providers → desativar *Allow new users to sign up*.
3. SQL Editor:
   ```sql
   insert into public.admins(user_id)
   select id from auth.users where email = 'SEU_EMAIL_AQUI';
   ```
4. (Recomendado) Ativar MFA para a sua conta quando disponível.

### 6.8 Migração `007_grants_admin_tables.sql` (permissões das tabelas para o admin)

Criada em 18/11/2026 depois que o teste de segurança falhou no Supabase real (item 28: `42501 permission denied for table clients`). Rodar **depois** da `006`.

```sql
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.clients,
  public.posts,
  public.post_media,
  public.reviews
to authenticated;
```

Segurança: o acesso continua decidido pelo RLS da `002` (todas as policies exigem `is_admin()`), então um usuário logado que **não** é admin continua vendo 0 linhas. As tabelas `client_credentials`, `client_sessions`, `login_attempts` e `admins` não recebem GRANT: só funções `security definer` mexem nelas.

---

## 7. Segurança — o que cada camada garante

| Ameaça | Mitigação |
|---|---|
| Alguém com o link tenta ver cliente não publicado/arquivado | `client_gate`/`client_login` devolvem o mesmo "indisponível" (sem revelar se existe) |
| Chute de senha | Bloqueio após 5 falhas em 15 min; bcrypt custo 10; senha mínima de 8 caracteres (gerador cria 12+) |
| Cliente A tentando ver cliente B | Todas as RPCs usam o `client_id` **derivado do token**, nunca um id enviado pelo front |
| Cliente enviando review em post de outro cliente / post oculto | `client_submit_review` exige `client_id = sessão` e `is_visible` |
| Leitura direta das tabelas via REST com a anon key | `anon` sem GRANT + RLS sem policy → 401/403/vazio |
| Cadastro de pessoas estranhas no Supabase Auth | Signup desabilitado + `is_admin()` exige estar em `admins` |
| XSS pela legenda | Legenda renderizada **como texto** (React escapa); hashtag/menção/URL via parser que gera elementos, **sem** `dangerouslySetInnerHTML` |
| Indexação pelo Google | `robots.txt` com `Disallow: /` + `<meta name="robots" content="noindex,nofollow">` |
| Vazamento de URL de mídia | UUID de 128 bits, bucket sem listagem. Risco residual → v2 com URLs assinadas |
| Segredos no repositório | Apenas `anon key` (pública). `service_role` **nunca** no repo |
| Sessão roubada | Validade de 7 dias; troca de senha/status derruba sessões; botão "Revogar sessões" |

> **Repositório público no GitHub Pages:** no plano gratuito o repo precisa ser público. Tudo bem **desde que** não haja segredo nenhum no código (a segurança está no Postgres, não no front).

**CSP (meta tag no `index.html`)** — ajustar com a URL real do Supabase:
```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; img-src 'self' data: blob: https://SEU-PROJETO.supabase.co;
           media-src 'self' blob: https://SEU-PROJETO.supabase.co;
           connect-src 'self' https://SEU-PROJETO.supabase.co wss://SEU-PROJETO.supabase.co;
           style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'">
```
(`frame-ancestors` via meta é ignorado pelos navegadores; para anti-clickjacking real seria necessário header, o que o Pages não permite — risco baixo aqui.)

---

## 8. Mídia: regras, limites e uploads

### 8.1 Constantes em `src/config/instagram.ts` (fáceis de ajustar)

```ts
export const IG = {
  // Proporções (confirmar valores vigentes do Instagram periodicamente)
  FEED_RATIOS: { '1:1': 1, '4:5': 4 / 5, '1.91:1': 1.91 },
  REEL_STORY_RATIO: 9 / 16,
  GRID_TILE_RATIO: 3 / 4,        // miniatura na grade do perfil (retrato)
  CAPTION_MAX: 2200,
  CAPTION_COLLAPSED_CHARS: 125,  // antes do "mais..."
  CAROUSEL_MAX_ITEMS: 20,
  STORY_DEFAULT_SECONDS: 5,
  IMAGE_MAX_LONG_SIDE: 2160,     // redimensiona se maior
  VIDEO_MAX_MB: 50,              // alinhar com o limite do bucket
};
```

### 8.2 Pipeline de upload (admin)

**Imagens**
1. Validar MIME (`jpeg/png/webp`) e tamanho.
2. Ler dimensões (`createImageBitmap`).
3. Se o lado maior > `IMAGE_MAX_LONG_SIDE`, redimensionar em `<canvas>` e reencodar (JPEG q=0.9 ou manter PNG).
4. Gerar caminho com UUID e enviar com `supabase.storage.from('media').upload(path, file, { cacheControl: '31536000', upsert: false, contentType })`.
5. Gravar `post_media` com `width/height/size_bytes/mime`.

**Vídeos (Reels e stories em vídeo)**
1. Validar MIME `video/mp4` (preferir **H.264 + AAC**) e tamanho ≤ `VIDEO_MAX_MB`. Mostrar aviso claro se o arquivo for `.mov`/HEVC (Chrome/Windows pode não reproduzir).
2. Ler metadados com `<video preload="metadata">`: `duration`, `videoWidth`, `videoHeight`.
3. Gerar **poster** (frame em `t = 0.1s`) em `<canvas>` → JPEG → enviar como `poster-{uuid}.jpg`.
4. Enviar o vídeo. Para arquivos > ~6 MB usar **upload resumível TUS** (`tus-js-client`) no endpoint `/storage/v1/upload/resumable`, com **barra de progresso** real e retomada em caso de queda.
5. Gravar `post_media`.

**Capa de Reel**
- Opção A: **enviar imagem** de capa.
- Opção B: **escolher frame do vídeo** (slider de tempo + `<canvas>`).
- Em ambas: `CoverCropper` (seção 11.4) para definir o **recorte na grade** (`grid_crop_x/y`).

**Exclusão:** ao excluir post/mídia, remover também os arquivos (`storage.remove([paths])`). Ao trocar capa/mídia, remover o arquivo antigo. Manter função utilitária `collectPaths(post)`.

### 8.3 Hardening opcional (v2): URLs assinadas
- Trocar bucket para **privado**.
- Edge Function `sign-media` recebe `{ token, paths[] }`, valida sessão (mesma lógica de `_session_client`) e devolve `createSignedUrls(paths, 3600)`.
- O front chama a função após `client_get_feed` e usa as URLs assinadas. O admin continua usando `createSignedUrl` com sua sessão.

### 8.4 Limites do plano gratuito — **verificar no painel antes de começar**
**Registrado em 18/11/2026 (plano Free, projeto `aprovacao-conteudo`, região sa-east-1):**
- **Tamanho máximo por arquivo:** 50 MB (informado pelo usuário em Storage → Settings). Bate com a `003` e com `VIDEO_MAX_MB: 50`.
- **Pausa por inatividade:** confirmada no painel (projeto grátis pausa se ficar parado) → `keepalive.yml` na Fase 5.
- **Uso atual** (Settings → Usage, ciclo 29/10 a 29/11/2026): banco 0,027 GB; Storage 0 GB; egress 0 GB; 0 MAU. Essa tela mostra o **uso**, não o limite.
- **Quotas totais** de banco, Storage e egress do plano Free: **ainda não anotadas** (conferir em Supabase Plans / Billing). Não bloqueia a Fase 5; vira bloqueio na Fase 6 se os vídeos forem pesados.

Pontos originais a verificar:
- Tamanho máximo por arquivo e espaço total do Storage (o limite por arquivo costuma ser baixo no plano gratuito, afetando Reels longos).
- Projeto gratuito pode **pausar por inatividade** → workflow `keepalive.yml` (seção 14.3).
- Se vídeos ficarem grandes, considerar plano pago ou comprimir antes do upload (HandBrake / ffmpeg: `-c:v libx264 -crf 23 -preset slow -c:a aac -movflags +faststart`). O `+faststart` é importante para começar a tocar rápido.

---

## 9. Tipos TypeScript (`src/types/domain.ts`)

```ts
export type ClientStatus = 'unpublished' | 'published' | 'archived';
export type PostType = 'image' | 'carousel' | 'reel' | 'story';
export type ApprovalStatus = 'pending' | 'approved' | 'changes_requested';
export type ReviewDecision = 'approved' | 'changes_requested';
export type MediaKind = 'image' | 'video';
export type AspectRatio = '1:1' | '4:5' | '1.91:1' | '9:16';

export interface Media {
  id: string; position: number; kind: MediaKind; path: string;
  poster_path: string | null; width: number | null; height: number | null; duration: number | null;
}
export interface Review {
  decision: ReviewDecision; comment: string; reviewer_name: string;
  revision: number; created_at: string;
}
export interface Post {
  id: string; type: PostType; caption: string; location: string; audio_name: string;
  scheduled_date: string;            // 'YYYY-MM-DD'
  scheduled_time: string | null;     // 'HH:MM:SS'
  approval_status: ApprovalStatus; revision: number; aspect_ratio: AspectRatio;
  cover_path: string | null; grid_crop_x: number; grid_crop_y: number; story_seconds: number;
  media: Media[]; reviews: Review[];
}
export interface ClientProfile {
  name: string; username: string; bio: string; category: string; website: string;
  avatar_path: string | null; followers_count: number; following_count: number;
}
export interface FeedData { client: ClientProfile; posts: Post[]; }
```

> **Regra de ouro:** os componentes de visualização (`components/ig/*`) recebem `FeedData` por props e **não sabem de onde vem**. No cliente vem de `client_get_feed`; no preview do admin vem de queries diretas. Assim o preview do admin é idêntico ao que o cliente vê.

---

## 10. Camada de API do front

> Nota: as funções de 10.1–10.2 passam a ser a implementação do `SupabaseProvider` (Fases 5–8). Antes disso vale a seção 10.0.

### 10.0 Camada de providers (base da ordem "interface primeiro")

Toda tela chama **apenas** estas interfaces, nunca `supabase` diretamente. Na Fase 1–2 a implementação é o `MockProvider`; na Fase 5–8 passa a ser o `SupabaseProvider`. A escolha é feita por `VITE_DATA_SOURCE=mock|supabase`.

```ts
// src/providers/types.ts
export interface ClientDataProvider {
  gate(slug: string): Promise<{ available: boolean; name?: string; username?: string; avatar_path?: string | null }>;
  login(slug: string, password: string): Promise<{ ok: boolean; error?: 'unavailable' | 'invalid_password' | 'locked' }>;
  getFeed(slug: string): Promise<FeedData | { unauthorized: true }>;
  submitReview(slug: string, postId: string, decision: ReviewDecision,
               comment: string, reviewerName: string): Promise<{ ok: boolean; error?: string }>;
  logout(slug: string): Promise<void>;
}

export interface AdminDataProvider {
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  listClients(): Promise<AdminClient[]>;
  getClient(id: string): Promise<AdminClient>;
  saveClient(input: AdminClientInput): Promise<AdminClient>;
  deleteClient(id: string): Promise<void>;
  setClientPassword(id: string, password: string): Promise<void>;
  listPosts(clientId: string): Promise<AdminPost[]>;
  savePost(input: AdminPostInput): Promise<AdminPost>;
  deletePost(id: string): Promise<void>;
  uploadMedia(file: File, ctx: { clientId: string; postId: string }, onProgress?: (p: number) => void): Promise<Media>;
  listReviews(filter?: { clientId?: string; unreadOnly?: boolean }): Promise<AdminReview[]>;
  markReviewRead(id: string): Promise<void>;
}
```

**`MockProvider` (Fases 1–2):**
- Estado em memória, **persistido em `localStorage`** (prefixo `mock:`) para sobreviver a recarregamentos; botão "Resetar dados de exemplo" no admin.
- `seed.ts` cria pelo menos: 2 clientes (um `published`, um `unpublished`), ~25 posts distribuídos em 3 meses (mês anterior, atual e próximo), com **todos os tipos** (imagem 1:1, 4:5, 1.91:1, carrossel de 5, Reels, stories ×4) e estados de aprovação variados (pendente, aprovado, ajustes).
- Senha de demonstração: `demo1234`. Slug de demonstração: `demo-marca-abc123`.
- **Imagens fictícias:** SVG/canvas com gradientes e rótulo ("Post 12 · 4:5") gerados no código (data URIs), sem arquivos externos.
- **Vídeos fictícios:** 1–2 `.mp4` curtos (H.264, ≤ 5 MB, 9:16) em `public/mock/` (fornecidos pelo usuário ou de banco gratuito livre de direitos).
- Upload no admin (Fase 2) usa `URL.createObjectURL(file)`; arquivos escolhidos **não persistem** após recarregar (limitação conhecida do protótipo, resolvida na Fase 6).
- Latência artificial (150–400 ms) para exercitar skeletons/estados de carregamento.

### 10.1 `src/lib/supabase.ts`
```ts
import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

export const mediaUrl = (path?: string | null) =>
  path ? `${env.SUPABASE_URL}/storage/v1/object/public/media/${path}` : '';
```

### 10.2 `src/lib/clientApi.ts` (cliente anônimo)
```ts
const tokenKey = (slug: string) => `cli_token:${slug}`;

export async function gate(slug: string) {
  const { data, error } = await supabase.rpc('client_gate', { p_slug: slug });
  if (error) throw error;
  return data as { available: boolean; name?: string; username?: string; avatar_path?: string | null };
}

export async function login(slug: string, password: string) {
  const { data, error } = await supabase.rpc('client_login', { p_slug: slug, p_password: password });
  if (error) throw error;
  if (data.ok) localStorage.setItem(tokenKey(slug), data.token);
  return data as { ok: boolean; token?: string; error?: 'unavailable' | 'invalid_password' | 'locked' };
}

export async function getFeed(slug: string): Promise<FeedData | { unauthorized: true }> {
  const token = localStorage.getItem(tokenKey(slug)) ?? '';
  const { data, error } = await supabase.rpc('client_get_feed', { p_token: token });
  if (error) throw error;
  if (!data.ok) { localStorage.removeItem(tokenKey(slug)); return { unauthorized: true }; }
  return { client: data.client, posts: data.posts };
}

export async function submitReview(slug: string, postId: string, decision: ReviewDecision,
                                   comment: string, reviewerName: string) {
  const token = localStorage.getItem(tokenKey(slug)) ?? '';
  const { data, error } = await supabase.rpc('client_submit_review', {
    p_token: token, p_post_id: postId, p_decision: decision,
    p_comment: comment, p_reviewer_name: reviewerName,
  });
  if (error) throw error;
  return data as { ok: boolean; error?: string };
}
```
> Importante: o front do cliente usa o **mesmo** `supabase` mas **não** deve herdar a sessão do admin para as RPCs do cliente. Funciona porque as RPCs são concedidas a `anon, authenticated` e não dependem de `auth.uid()`. Se o admin estiver logado no mesmo navegador, o preview via link continua igual ao do cliente.

### 10.3 Datas (`src/lib/dates.ts`)
```ts
const TZ = 'America/Sao_Paulo';

export function todayMonthKey(): string {            // 'YYYY-MM' no fuso de SP
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' })
    .format(new Date()).slice(0, 7);
}
export const monthKeyOf = (isoDate: string) => isoDate.slice(0, 7);   // sem new Date(): evita bug de fuso
export function addMonths(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
export function formatMonthLabel(key: string): string {   // "Novembro de 2026"
  const [y, m] = key.split('-').map(Number);
  const s = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, 1)));
  return s.charAt(0).toUpperCase() + s.slice(1);
}
```

### 10.4 Gerador de slug e senha
- **Slug:** `slugify(name)` (sem acentos, minúsculas, hífens) + `-` + 6 caracteres aleatórios `[a-z0-9]` (via `crypto.getRandomValues`). Ex.: `padaria-do-ze-7k3p9q`. O admin pode editar a parte legível; o sufixo aleatório permanece por padrão (camada extra além da senha). Validar unicidade antes de salvar (tratar erro `23505`).
- **Senha:** 12 caracteres sem ambíguos (`0O1lI`), via `crypto.getRandomValues`. Botão "Gerar" + campo editável. Exibir **uma vez** após salvar, com botão **"Copiar mensagem para o cliente"**:
  ```
  Olá! Aqui está o link para aprovar os materiais da {NOME}:
  {URL}
  Senha: {SENHA}
  ```
  (O hash não é reversível; para o cliente receber de novo, use "Gerar nova senha".)

### 10.5 Parser de legenda (`src/lib/caption.ts`)
Quebra o texto em tokens: `text | hashtag | mention | url | newline`. Regex sugeridos:
- hashtag: `/#[\p{L}\p{N}_]+/gu`
- menção: `/@[a-z0-9._]+/gi`
- URL: `/https?:\/\/[^\s]+/g`

Renderizar hashtags/menções com cor de link (azul do Instagram `#00376B` no claro) **sem** navegação real (apenas `<span>`); URLs como `<a rel="noopener noreferrer" target="_blank">`.

---

## 11. Componentes — especificação detalhada

### 11.1 `Avatar` (com anel de gradiente)
- Props: `src`, `size`, `ring: 'none' | 'unseen' | 'seen'`, `onClick`.
- `unseen`: borda em gradiente cônico/linear (amarelo → laranja → rosa → roxo) de 3px, com **gap branco/escuro** de 2–3px entre anel e foto (usar wrapper com `padding` e `background: linear-gradient(...)` e a imagem com `border: 3px solid var(--bg)`).
- `seen`: anel cinza (`#C7C7C7` / `#3a3a3a` no escuro).
- "Visto/não visto" é guardado em `localStorage` (`stories_seen:{slug}` = lista de ids). Anel `unseen` se existir story visível **no filtro atual** não visto.
- Acessível: `<button aria-label="Ver stories">` quando há stories.

### 11.2 `ProfileHeader`
- Layout mobile: avatar à esquerda, 3 estatísticas à direita (publicações, seguidores, seguindo); abaixo nome em negrito, categoria em cinza, bio (respeita quebras de linha), link.
- Desktop (≥768px): avatar maior (≈150px) à esquerda; linha com @usuário; estatísticas em linha; bio.
- **Publicações** = quantidade de posts não-story visíveis **no filtro de mês atual** (em "Ver todos", o total); ao lado, **stories** no mesmo filtro (D22).
- Seguidores/seguindo: valores fictícios cadastrados, formatados (`12,3 mil`, `1,2 mi`) em pt-BR.
- Botões "Seguir/Mensagem": **opcionais e decorativos** (desabilitados visualmente) — decidir na Fase 1; por padrão **ocultos** para não confundir o cliente.

### 11.3 `MonthFilter`
- Estado: `{ mode: 'month'; key: 'YYYY-MM' } | { mode: 'all' }`. Persistir em query da hash: `/#/c/slug?m=2026-11` ou `?m=all` (compartilhável, sobrevive ao recarregar).
- Padrão ao abrir: `todayMonthKey()`.
- UI: `‹  Novembro de 2026  ›` + chip **"Ver todos"**. Quando em "todos", o chip fica ativo e as setas ficam desabilitadas; clicar em "Mês atual"/chip volta ao mês corrente.
- Setas **não têm limite** artificial (pode avançar para meses futuros; mostra estado vazio). Limitar a ±36 meses só para evitar loop de cliques infinito.
- Estado vazio: ícone + "Nenhuma publicação planejada para {mês}." + botão "Ver todos".
- Pequeno indicador numérico por mês (ex.: "12 publicações · 8 aprovadas") — nice-to-have.
- Aplica-se à **grade e aos stories**.

### 11.4 `PostGrid` e `GridTile`
- Grade de **3 colunas** com gap de 2–4px, tiles com proporção **3:4** (`aspect-ratio: 3/4`), `object-fit: cover` e `object-position: {grid_crop_x}% {grid_crop_y}%`.
- Fonte da miniatura: imagem → 1ª mídia; carrossel → 1ª mídia; Reels → `cover_path` (se não houver, `poster_path` do vídeo).
- Ícones no canto superior direito: carrossel (camadas), Reels (clapper/play). Tipo `image` sem ícone.
- **Selo de status** (opcional, ligado por padrão): bolinha/etiqueta no canto inferior — verde ✓ aprovado, laranja ✎ ajustes, cinza pendente. O cliente entende rápido o que falta.
- Ordenação: `scheduled_date desc`, depois `scheduled_time desc`.
- Abas **Posts** (imagem + carrossel + Reels, como o feed real do perfil) e **Reels** (apenas Reels). Stories **não** entram na grade.
- Clique → abre `PostViewer` na posição do post, com navegação anterior/próximo **dentro da lista filtrada**.
- Performance: `loading="lazy"` + `decoding="async"`, e `content-visibility: auto` em listas longas.

#### `CoverCropper` (admin)
- Mostra a capa **inteira (9:16)** com uma **moldura 3:4 arrastável** (representando o recorte da grade). Arrastar altera `grid_crop_x/y` (0–100%); salvar grava os valores.
- Ao lado, `PhonePreview` mostra a grade com a miniatura **ao vivo**.
- Dica de segurança: exibir "zona segura" (áreas que a grade corta) para o designer saber o que cai fora.

### 11.5 `PostViewer`
**Desktop (≥768px):** modal centralizado, 2 colunas.
- Esquerda: mídia (fundo preto, `object-fit: contain`, respeita proporção). Para Reels: container 9:16.
- Direita: cabeçalho (avatar + @usuário + localização), **legenda** (rolável, "mais/menos" após 125 caracteres no mobile; completa no desktop com scroll), data planejada formatada, **linha de ícones decorativos** (curtir/comentar/enviar/salvar — sem ação), histórico de aprovações do post, e **`ApprovalPanel` fixo no rodapé da coluna**.
- Setas ‹ › nas bordas (post anterior/próximo), teclado: `←/→` navega posts, `Esc` fecha. `←/→` dentro do carrossel navega slides **quando o foco está no carrossel**, senão navega posts (definir: `Shift+←/→` para posts, `←/→` para slides quando há carrossel; documentar em tooltip).

**Mobile (<768px):** tela cheia com scroll vertical:
- Cabeçalho fixo (‹ voltar, "Publicação", ⋯ decorativo).
- Autor + mídia + ícones + legenda.
- `ApprovalPanel` **fixo no rodapé** (barra com dois botões; ao tocar em "Não aprovar" expande uma folha inferior com a caixa de texto).
- Para Reels: mídia ocupa a tela com overlay (avatar, legenda truncada em 2 linhas, linha de áudio), `ApprovalPanel` na barra inferior.

**Deep link:** `/#/c/:slug/p/:postId` abre o post direto (após senha). Ao abrir/fechar, atualizar a hash sem recarregar. Botão "copiar link do post" no cabeçalho (útil para o admin citar um post específico).

**Foco e acessibilidade:** `role="dialog" aria-modal="true"`, foco preso dentro do modal, retorno do foco ao tile ao fechar, rolagem do body travada.

### 11.6 `Carousel`
- Container com `scroll-snap-type: x mandatory` e slides `flex: 0 0 100%` (swipe nativo no celular) + botões ‹ › no desktop; **bolinhas** de paginação embaixo; contador `1/5` no canto superior direito (estilo Instagram).
- Mídia mista (imagem e vídeo): vídeo dentro do carrossel usa player simplificado (play/pause + mudo). Pausa quando sai da vista (`IntersectionObserver`).
- Todos os slides seguem a proporção definida no post (`aspect_ratio`); `object-fit: cover` quando a mídia é diferente (e avisar no admin).
- Pré-carregar o slide seguinte.

### 11.7 `Caption`
- Mostra `@usuário` em negrito + texto. Colapsa em `CAPTION_COLLAPSED_CHARS` com "… mais"; ao clicar expande. Respeita `\n`. Usa o parser da seção 10.5.

### 11.8 `ReelPlayer` + `PlayerHUD` (requisito especial)

**Comportamento**
- Container `9:16`, `max-height: 100dvh`, vídeo com `playsInline`, `preload="metadata"`, `poster` = capa, **sem controles nativos**.
- Ao abrir: tentar `play()` **mudo** (autoplay com som é bloqueado pelos navegadores); mostrar botão/ícone de som com dica "Toque para ativar o som". Depois que o usuário interage, lembrar volume/mudo em `localStorage` (`player_prefs`).
- Ao fechar o viewer, **pausar e liberar** o vídeo (`video.pause(); video.removeAttribute('src'); video.load()`).
- Loop opcional (padrão: **loop ligado**, como no Reels; botão no HUD para desligar).

**HUD (visível ao mover o mouse/tocar; some após 2,5 s de inatividade enquanto toca; sempre visível pausado):**
1. Botão **play/pause** (também clicar/tocar no vídeo alterna; ícone grande central animado).
2. **Barra de progresso** com: trilho, **buffer** (cinza claro), progresso (branco), **bolinha** arrastável (pointer events, funciona com mouse/toque), *hover preview* do tempo (desktop).
3. **Tempo** `0:07 / 0:30`.
4. **Volume:** botão mudo/ativar + slider vertical/horizontal (desktop); no mobile apenas botão de mudo (volume do aparelho).
5. **Velocidade** (0,5× · 1× · 1,5× · 2×) — opcional.
6. **Tela cheia** (`requestFullscreen`; iOS: `webkitEnterFullscreen` no `<video>`).
7. **Voltar 5s / avançar 5s** (atalho de teclado e duplo toque nas laterais no mobile).

**Atalhos (quando o player está em foco):** `Espaço/K` play-pause · `←/→` ∓5s · `↑/↓` volume ±10% · `M` mudo · `F` tela cheia · `0–9` salta para 0–90%.

**Esqueleto do hook `useVideoPlayer`:**
```ts
export function useVideoPlayer(videoRef: RefObject<HTMLVideoElement>) {
  const [s, set] = useState({ playing: false, current: 0, duration: 0, buffered: 0,
                              volume: 1, muted: true, waiting: false, ended: false, rate: 1 });

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const on = <K extends keyof HTMLVideoElementEventMap>(e: K, fn: () => void) => {
      v.addEventListener(e, fn); return () => v.removeEventListener(e, fn);
    };
    const offs = [
      on('play',  () => set(p => ({ ...p, playing: true,  ended: false }))),
      on('pause', () => set(p => ({ ...p, playing: false }))),
      on('timeupdate', () => set(p => ({ ...p, current: v.currentTime }))),
      on('loadedmetadata', () => set(p => ({ ...p, duration: v.duration }))),
      on('progress', () => {
        const b = v.buffered; if (b.length) set(p => ({ ...p, buffered: b.end(b.length - 1) }));
      }),
      on('volumechange', () => set(p => ({ ...p, volume: v.volume, muted: v.muted }))),
      on('waiting', () => set(p => ({ ...p, waiting: true }))),
      on('playing', () => set(p => ({ ...p, waiting: false }))),
      on('ended',   () => set(p => ({ ...p, ended: true, playing: false }))),
    ];
    return () => offs.forEach(off => off());
  }, [videoRef]);

  const toggle = () => { const v = videoRef.current!; v.paused ? v.play() : v.pause(); };
  const seek   = (t: number) => { videoRef.current!.currentTime = Math.max(0, Math.min(t, s.duration)); };
  const setVol = (x: number) => { const v = videoRef.current!; v.volume = x; v.muted = x === 0; };
  const toggleMute = () => { const v = videoRef.current!; v.muted = !v.muted; };
  return { state: s, toggle, seek, setVol, toggleMute };
}
```
- **Seek por arrasto:** `onPointerDown` captura o ponteiro (`setPointerCapture`), pausa temporariamente, atualiza `currentTime` em `onPointerMove` (com `requestAnimationFrame`) e retoma ao soltar se estava tocando.
- **Atenção:** usar `v.currentTime` direto durante arrasto para não "brigar" com `timeupdate`.

### 11.9 `StoryViewer`
- Fullscreen escuro, conteúdo 9:16 centralizado (`max-height: 100dvh`).
- **Barras de progresso** segmentadas no topo (uma por story do conjunto), as anteriores cheias, a atual animando.
- Cabeçalho: avatar pequeno, @usuário, **data planejada** (no lugar de "há 2 h"), botão fechar `✕`.
- **Imagem:** avança após `story_seconds` (padrão 5s) — usar `requestAnimationFrame` (hook `useStoryTimer`) para a barra e o avanço.
- **Vídeo:** barra acompanha `currentTime/duration`; avança no `ended`.
- **Toque/clique:** 30% esquerdo = anterior · 70% direito = próximo · **segurar** = pausa (e esconde UI) · teclado `←/→/Esc/Espaço`.
- Ao final do último story → fecha. Ao abrir, começa no 1º não visto (ou no 1º).
- **Aprovação por story:** `ApprovalPanel` na parte inferior (em barra compacta). Ao focar a caixa de texto: **pausar o timer** e impedir que toques nela naveguem (`stopPropagation`).
- Em vídeo de story, mostrar mini HUD (pausar, som) — reutilizar `PlayerHUD` em modo `compact`.
- Marcar como "visto" em `localStorage` ao exibir.

### 11.10 `ApprovalPanel` (cliente)
Estados e UI:

| Estado do post | Exibição |
|---|---|
| `pending` | Dois botões: **✓ Aprovar** e **✎ Não aprovar** |
| `approved` | Selo verde "Aprovado" + link "Alterar decisão" |
| `changes_requested` | Selo laranja "Ajustes solicitados" + último comentário + "Alterar decisão" |

Fluxo "Não aprovar":
1. Aparece `textarea` (placeholder: "Descreva os ajustes que você gostaria…", limite 2000, contador) — **obrigatória**.
2. Campo opcional "Seu nome" (lembrado em `localStorage`) para identificar quem do cliente comentou.
3. Botões **Enviar ajustes** / Cancelar. Desabilitar durante o envio; mostrar *toast* de sucesso; atualizar estado local otimista e reconciliar com o retorno.
4. Erros tratados: `unauthorized` (volta ao gate), `rate_limited`, `comment_required`, rede.

Fluxo "Aprovar": confirmação com 1 toque (opcional: *toast* com "Desfazer" por 5s — v2).

**Histórico:** lista abaixo (mais recente primeiro) com decisão, texto, nome e data/hora. O cliente vê apenas o que ele próprio enviou.

**Reenvio de nova versão (admin):** quando você altera um post que já tinha retorno, `revision` incrementa e o status volta a `pending`; o histórico antigo permanece com a revisão em que foi feito (mostrar "Revisão 1", "Revisão 2").

### 11.11 Páginas do cliente
- **`Unavailable`:** layout neutro: "Este link não está disponível." + texto "Entre em contato com quem enviou o link." (nunca diferenciar motivos).
- **`Gate`:** logo/avatar + nome do cliente + campo de senha (com mostrar/ocultar) + botão. Mensagens: senha incorreta; "Muitas tentativas. Tente novamente em alguns minutos."; erro de rede. Enter envia. `autocomplete="current-password"`.
- **`ClientFeed`:** carrega `getFeed`; se `unauthorized`, volta ao Gate. Skeletons enquanto carrega. Botão "Sair" discreto (chama `client_logout`).

---

## 12. Admin — telas e comportamentos

### 12.1 Rotas
```
/#/admin/login
/#/admin                         Dashboard
/#/admin/clients/new
/#/admin/clients/:id             Workspace (abas: Feed · Publicações · Aprovações · Configurações)
/#/admin/clients/:id/posts/new?type=image|carousel|reel|story
/#/admin/clients/:id/posts/:postId
/#/admin/inbox                   Todas as aprovações (não lidas primeiro)
```
`AdminGuard`: usa `supabase.auth.getSession()` + `onAuthStateChange`; se não houver sessão ou `is_admin()` for falso → redireciona para login (e faz `signOut` se não for admin).

### 12.2 Login
E-mail + senha (`signInWithPassword`). Mensagem genérica em falha. Sem "criar conta" nem "esqueci a senha" público (recuperação pelo painel Supabase).

### 12.3 Dashboard
- Cabeçalho: título, botão **Novo cliente**, link para **Caixa de entrada** com badge de não lidas.
- Filtros: abas por status (Todos · Publicados · Não publicados · Arquivados), busca por nome.
- **Card de cliente:** avatar, nome, @usuário, selo de status, contadores (`pendentes · ajustes · aprovados`), "última atividade", ações rápidas: **Abrir**, **Copiar link**, **Alterar status** (menu).
- Dados: `clients` + `admin_client_counters()`.
- Realtime: assinar `reviews` (INSERT) e atualizar contadores + *toast* "Novo retorno de {cliente}".

### 12.4 Formulário de cliente (`ClientForm`)
Campos: nome, @usuário (validação `^[a-z0-9._]{1,30}$`), categoria, bio (contador 150), link, **avatar** (upload + recorte circular 1:1), seguidores, seguindo, slug (auto + editável), status, observações internas.
- **Senha:** seção própria — gerar/definir (chama `admin_set_client_password`), botão **Copiar link**, **Copiar mensagem**, **Revogar sessões**, **Destravar login**.
- Trocar status:
  - `não publicado` → rascunho; cliente não acessa.
  - `publicado` → exige que exista senha definida (bloquear com aviso caso contrário).
  - `arquivado` → igual a não publicado para o cliente; some do dashboard por padrão (aba "Arquivados").
- Confirmar antes de arquivar/excluir. **Excluir cliente** (apaga posts e **arquivos** do Storage): exigir digitar o nome do cliente para confirmar.

### 12.5 Workspace do cliente
- **Aba Feed:** renderiza o **mesmo** `ProfileHeader + MonthFilter + PostGrid + StoryViewer` do cliente (modo `adminPreview`: sem `ApprovalPanel` ativo, mostrando o histórico de reviews e botão "Editar" em cada post). Botão "Ver como cliente" abre `/#/c/:slug` em nova aba.
- **Aba Publicações:** tabela/lista com miniatura, tipo, data planejada, visível?, status de aprovação, revisão, ações (Editar, Duplicar, Ocultar/Mostrar, Excluir). Filtros: tipo, status de aprovação, mês. Ação em lote: "Tornar visíveis" selecionados.
- **Aba Aprovações:** reviews do cliente, não lidas em destaque; botão "Marcar como lida"; clicar abre o post.
- **Aba Configurações:** `ClientForm`.

### 12.6 Editor de post (`PostEditor`)
Layout: formulário à esquerda, **`PhonePreview` ao vivo** à direita (mostra exatamente como ficará: tile na grade + visualização do post).

Campos comuns: **tipo** (imagem / carrossel / Reels / story), **data planejada** (obrigatória) + hora (opcional), **legenda** (contador `n/2200`, não aplica a story), localização (opcional), **visível ao cliente** (switch).

Por tipo:

| Tipo | Mídia | Extras |
|---|---|---|
| **Imagem única** | 1 imagem | Proporção (1:1, 4:5, 1.91:1) com aviso se a imagem não bate |
| **Carrossel** | 2–20 itens (imagem/vídeo), **arrastar para reordenar** (dnd-kit), remover, trocar | Proporção única para todos; miniatura da grade = 1º slide |
| **Reels** | 1 vídeo (9:16) | **Capa** (upload ou frame do vídeo) + `CoverCropper` (recorte da grade); "Nome do áudio" (padrão "Áudio original") |
| **Story** | 1 imagem ou vídeo (9:16) | Duração (imagem): 1–15s |

Comportamentos:
- **Salvar rascunho** (mantém `is_visible=false`) e **Salvar e publicar para o cliente** (`is_visible=true`).
- Ao editar um post que já recebeu retorno: caixa "Reenviar para aprovação" (padrão **marcada**) → `revision += 1`, `approval_status = 'pending'`.
- **Upload com progresso** por arquivo, cancelar/repetir em caso de erro, aviso ao sair com upload em andamento (`beforeunload`).
- Validações: carrossel com 1 item → sugerir imagem única; Reels sem capa → usar frame; vídeo > limite → bloquear com mensagem clara.
- Duplicar post: copia metadados e **referencia novos arquivos** (copiar no Storage via `copy`) para evitar apagar mídia compartilhada ao excluir um deles.

### 12.7 Caixa de entrada (`ReviewInbox`)
Lista cronológica de reviews (todas ou por cliente): cliente, post (miniatura), decisão, comentário, nome de quem enviou, data/hora, ação "Abrir post" e "Marcar como lida". Filtros: não lidas, ajustes, aprovados. Atualiza via Realtime.

---

## 13. Roteamento e navegação

```tsx
// App.tsx
<HashRouter>
  <Routes>
    <Route path="/" element={<Navigate to="/admin" replace />} />

    <Route path="/admin/login" element={<AdminLogin />} />
    <Route element={<AdminGuard />}>
      <Route path="/admin" element={<Dashboard />} />
      <Route path="/admin/inbox" element={<Inbox />} />
      <Route path="/admin/clients/new" element={<ClientNew />} />
      <Route path="/admin/clients/:id" element={<ClientWorkspace />} />
      <Route path="/admin/clients/:id/posts/new" element={<PostEdit />} />
      <Route path="/admin/clients/:id/posts/:postId" element={<PostEdit />} />
    </Route>

    <Route path="/c/:slug" element={<ClientEntry />} />        {/* gate → feed */}
    <Route path="/c/:slug/p/:postId" element={<ClientEntry />} />

    <Route path="*" element={<Unavailable />} />
  </Routes>
</HashRouter>
```
- `ClientEntry`: executa `gate(slug)` → `Unavailable` ou `Gate`; se já houver token válido, vai direto para o feed.
- Em **rotas do cliente**, não renderizar nenhum elemento do admin (nem mesmo links), mesmo que haja sessão de admin no navegador.

---

## 14. Build, deploy e operação

### 14.1 `package.json` (dependências principais)
```
react, react-dom, react-router-dom
@supabase/supabase-js
@tanstack/react-query
tailwindcss, postcss, autoprefixer
lucide-react                         # ícones
@dnd-kit/core, @dnd-kit/sortable     # reordenar carrossel
tus-js-client                        # upload resumível de vídeos
date-fns (opcional)
vite, typescript, @vitejs/plugin-react
vitest, @testing-library/react       # testes de utilitários e componentes críticos
```

### 14.2 `vite.config.ts`
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  base: '/NOME-DO-REPOSITORIO/',          // ou '/' se usar domínio próprio
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: { sourcemap: false },
});
```
`.env.example`:
```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY_PUBLICA
```
`src/config/env.ts` deve **lançar erro claro** se alguma variável faltar.

### 14.3 GitHub Actions

`.github/workflows/deploy.yml`
```yaml
name: Deploy to GitHub Pages
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm test --if-present
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```
(Confirmar as versões atuais das *actions* no momento de implementar.)

`.github/workflows/keepalive.yml`
```yaml
name: Supabase keep-alive
on:
  schedule: [{ cron: '0 12 */3 * *' }]   # a cada 3 dias
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -sS -X POST "${{ secrets.VITE_SUPABASE_URL }}/rest/v1/rpc/ping" \
            -H "apikey: ${{ secrets.VITE_SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" -d '{}'
```

**Configuração do Pages:** Repo → Settings → Pages → *Source: GitHub Actions*. Cadastrar os dois *secrets* em Settings → Secrets and variables → Actions.

### 14.4 Backups e manutenção
- Exportar dump SQL do banco **mensalmente** (painel Supabase ou `pg_dump`) e guardar fora do Supabase.
- Os arquivos do Storage **não** estão no dump de SQL: manter também os originais do material no seu drive.
- Rotina mensal: conferir espaço do Storage, limpar posts de clientes arquivados antigos, revisar sessões ativas.

---

## 15. Design e UX (visual "Instagram-like")

- **Tipografia:** pilha de sistema `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
- **Cores (claro):** fundo `#FFFFFF`, texto `#262626`, secundário `#737373`, borda `#DBDBDB`, link `#00376B`, ação azul `#0095F6`, aprovado `#2E9E5B`, ajustes `#E8890C`.
- **Cores (escuro):** fundo `#000000`, superfície `#121212`, texto `#F5F5F5`, secundário `#A8A8A8`, borda `#262626`. Respeitar `prefers-color-scheme` + alternância manual (guardar em `localStorage`).
- **Largura máxima do perfil:** ~935px no desktop (centralizado); mobile first (testar a partir de 360px).
- **Tokens CSS** como variáveis em `:root`/`.dark`, usados pelo Tailwind via `theme.extend.colors`.
- **Estados:** *skeleton* para perfil e grade, estado vazio por filtro, erro com "Tentar novamente", *toasts* para ações.
- **Animações sutis:** abertura de modal (fade/scale curto), tile com leve `hover` de escurecer, respeitando `prefers-reduced-motion`.
- **Acessibilidade:** contraste AA, foco visível, `alt` nas imagens (legenda curta ou "Publicação de {cliente}"), `aria-label` nos botões de ícone, alvos de toque ≥ 44px, HUD operável por teclado, anel de stories com texto alternativo.
- **Idioma:** pt-BR em toda a interface.

---

## 16. Plano de execução por fases

> **Ordem:** interface primeiro (Fases 1–2, sem banco), depois infraestrutura e integração (Fases 3–8), depois acabamento (9–10).
> Cada fase termina com **critérios de aceite** objetivos. Só marque `[x]` quando todos estiverem cumpridos **e** registre no Diário (22.2).

### Fase 1 — Protótipo visual do cliente (dados fictícios)
**Objetivo:** o usuário abre o protótipo e **vê e testa** tudo o que o cliente verá, sem nenhum backend.

**Tarefas**
- [x] **1.0 Versão rápida em arquivo único (HTML)** *(concluída em 18/11/2026; link e ajustes no Diário)* para validar visual e fluxo imediatamente (perfil, grade, modal de post, carrossel, player de Reels com HUD, stories, aprovação local, filtro de mês). Serve como referência visual; a evolução oficial é o projeto Vite abaixo.
- [~] 1.1 Scaffold Vite + React + TS + Tailwind, alias `@`, tokens de cor claro/escuro (seção 15). *(Etapa 1 da Fase 5: `npm install` e `npm run dev` funcionaram no PC do usuário em 18/11/2026, com os 4 OK do diagnóstico; falta confirmar `npm run build`)*
- [~] 1.2 Camada de providers (10.0) + `MockProvider` + `seed.ts` com todos os tipos de post. *(bloco 2a feito em 19/11/2026: lado do cliente (`ClientDataProvider`); a interface `AdminDataProvider` e o vídeo de exemplo entram com a Etapa 3 e o 2d; testado em Node com `localStorage` simulado, falta testar no PC)*
- [~] 1.3 `HashRouter` com rotas do cliente (`/c/:slug`, `/c/:slug/p/:postId`) e `Unavailable`. *(2a: rotas e `ClientEntry` feitos; falta teste no PC)*
- [x] 1.4 `Gate` *(feito no protótipo em arquivo único em 18/11/2026; **refeito no Vite no bloco 2a, aguardando teste no PC**)* (senha `demo1234`; testar: senha errada, bloqueio simulado após 5 falhas, cliente `unpublished` → "indisponível").
- [ ] 1.5 `ProfileHeader`, `Avatar` com anel de gradiente (visto/não visto), `ProfileTabs`.
- [ ] 1.6 `PostGrid`/`GridTile` (3 colunas, 3:4, `object-position`, ícones de carrossel/Reels, selo de status).
- [ ] 1.7 `MonthFilter` (mês atual por padrão, ‹ ›, "Ver todos", persistência na URL, estado vazio).
- [ ] 1.8 `PostViewer` (modal desktop / tela cheia mobile, navegação entre posts, deep link, foco/acessibilidade) + `Caption`.
- [ ] 1.9 `Carousel` (swipe, setas, bolinhas, contador).
- [ ] 1.10 `ReelPlayer` + `PlayerHUD` + `useVideoPlayer` (play/pause, seek arrastável, buffer, tempo, volume/mudo, velocidade, tela cheia, atalhos).
- [ ] 1.11 `StoryViewer` + `useStoryTimer` (barras, toque, segurar, vídeo, visto/não visto).
- [ ] 1.12 `ApprovalPanel` (3 estados, caixa de ajustes obrigatória, nome opcional, histórico) gravando no `MockProvider`.
- [ ] 1.13 Responsividade (360px → desktop), tema claro/escuro, skeletons e estados vazios.
- [ ] 1.14 (Opcional) Publicar o protótipo no GitHub Pages para abrir no celular, **sem** dados reais.

**Aceite:** abrir `/#/c/demo-marca-abc123` → senha → perfil com anel de stories; filtro começa no mês atual e navega ‹ › (mês vazio mostra estado vazio; "Ver todos" lista tudo); abrir imagem, carrossel (5 slides) e Reels (play/pause/seek/volume funcionando); stories avançam sozinhos e por toque; aprovar e pedir ajuste (texto obrigatório) atualizam o selo e o histórico; funciona em celular (≥ 360px) e desktop.

**Pontos para o usuário validar ao final da fase:** aparência geral, proporções da grade, HUD do player, comportamento dos stories, textos, selo de status na grade (manter ou não), botões decorativos "Seguir/Mensagem" (manter ou não).

### Fase 2 — Painel admin sobre o protótipo (dados locais)
**Objetivo:** criar clientes e posts **na interface**, vendo o resultado no perfil simulado, ainda com dados locais.

**Tarefas**
- [~] 2.1 `AdminLogin` + `AdminGuard` com **login de mentira** (`admin@demo` / `demo1234`) via `MockProvider`. *(retroativo: feito; login de demonstração, sessão guardada na aba)*
- [~] 2.2 Dashboard: lista, busca, abas por status, cards com contadores (pendentes/ajustes/aprovados). *(busca, abas por status, contadores, badge de não lidas, menu para alterar status; feito)*
- [~] 2.3 `ClientForm` (criar/editar): dados do perfil, avatar (upload local + recorte circular), seguidores/seguindo, slug com sufixo aleatório, status. *(feito, incluindo o recorte circular do avatar com arrastar e zoom)*
- [~] 2.4 Senha: gerar/definir, **copiar link**, **copiar mensagem**, revogar sessões, destravar (simulados). *(feito: gerar, copiar link/mensagem, revogar sessões, destravar, tudo simulado)*
- [~] 2.5 Regra "publicar exige senha definida" + confirmações (arquivar/excluir digitando o nome). *(feito: publicar sempre pede a senha em modal, D18; confirma ao arquivar; excluir cliente exige digitar o nome)*
- [~] 2.6 Workspace do cliente com abas Feed (mesmo componente do cliente em modo `adminPreview`), Publicações, Aprovações, Configurações. *(feito: abas Feed, Publicações, Aprovações, Configurações; o Feed é uma grade editável, não o componente do cliente em modo `adminPreview`, ver P9)*
- [~] 2.7 `PostEditor` para os 4 tipos (imagem, carrossel com reordenação dnd-kit, Reels, story) + `PhonePreview` ao vivo. *(feito: 4 tipos e preview ao vivo; carrossel reordena arrastando (pointer events, sem dnd-kit) ou pelos botões ‹ ›; story aceita imagem ou vídeo)*
- [~] 2.8 `CoverCropper` (moldura 3:4 sobre a capa 9:16) + escolha de frame do vídeo. *(feito: moldura 3:4 arrastável e escolha de frame do vídeo)*
- [~] 2.9 Lista de publicações: filtros, duplicar, ocultar/mostrar, excluir, ação em lote. *(feito: filtros por tipo/status/mês, duplicar, ocultar/mostrar, excluir, tornar visíveis em lote)*
- [~] 2.10 "Reenviar para aprovação" (`revision`, volta a `pending`, histórico por revisão). *(feito: `rv` sobe, volta a pendente, histórico guarda a revisão)*
- [~] 2.11 `ReviewInbox` (não lidas, marcar como lida) — recebendo as aprovações feitas na Fase 1 (mesmo `localStorage`). *(feito: filtros, não lidas, marcar como lida; recebe as aprovações feitas no lado do cliente)*

> **Status em 18/11/2026:** implementado no HTML único e testado por script (navegador automatizado: 12 verificações, sem erros de JS). **Falta o aceite do usuário** abrindo o arquivo. Por isso as tarefas estão `[~]`, não `[x]`.

- [~] 2.12 Página inicial = login do admin (e-mail e senha, sem criar conta). *(feito no HTML)*
- [~] 2.13 Exportar e importar dados (backup JSON). *(feito no HTML)*
- [~] 2.14 Aba **Métricas** no workspace + resumo no card do dashboard, total e por tipo. *(feito no HTML)*
- [~] 2.15 Perfil do cliente: publicações pelo filtro de mês e contagem de stories. *(feito no HTML)*

**Aceite:** criar um cliente, definir senha, publicar; criar um post de cada tipo (carrossel com 5 itens reordenados; Reels com capa e recorte ajustado refletindo na grade); abrir o link do cliente em outra aba, entrar com a senha, aprovar/pedir ajuste e ver o retorno aparecer no admin; "Resetar dados de exemplo" funciona.

> **Limitação conhecida nesta fase:** arquivos enviados ficam só na sessão do navegador (não persistem). É esperado e será resolvido na Fase 6.

### Fase 3 — Contas e ferramentas
**Tarefas**
- [x] 3.1 Criar conta/projeto no Supabase (região mais próxima do Brasil disponível). *(projeto `aprovacao-conteudo`, Free, sa-east-1)*
- [x] 3.2 Anotar `Project URL` e `anon key` (hoje: **API Keys → Publishable key**). **Não** copiar `service_role`/Secret key para lugar nenhum do projeto. *(URL `https://hxqczylwfsypdreydgzt.supabase.co`; chave `sb_publishable_ZgtV_TApeN2Iudsdgb4CtQ_7NDh69oe`, pública)*
- [~] 3.3 Criar repositório no GitHub (público) e ativar Pages com *Source: GitHub Actions*. *(repo `aprove` criado pelo usuário, ainda vazio; falta confirmar Pages em *GitHub Actions*; HTML do protótipo não vai agora, ver D26)*
- [x] 3.4 Instalar Node LTS, Git e (opcional) Supabase CLI. *(Node LTS e Git instalados no Windows, segundo o usuário; versões ainda não registradas; Supabase CLI não instalado, é opcional)*
- [x] 3.5 Definir o nome definitivo do repositório (afeta o `base` do Vite). *(`aprove` → `base: '/aprove/'`)*
- [~] 3.6 Verificar limites do plano Supabase (tamanho por arquivo, storage, pausa por inatividade) e registrar no Diário. *(arquivo 50 MB e pausa por inatividade confirmados; uso atual anotado; falta anotar as quotas totais de banco, Storage e egress)*
- [x] 3.7 Confirmar **Authentication → Sign In / Providers → Allow new users to sign up = desligado** (guia 3.3). *(desligado pelo usuário em 18/11/2026, D27)*

**Aceite:** acesso ao painel Supabase; repo criado; Pages habilitado; limites anotados. *(quase completo: falta confirmar Pages em *GitHub Actions* e anotar as quotas totais, 8.4)*

### Fase 4 — Supabase: schema, RLS, RPCs, Storage
**Tarefas**
- [x] 4.1 Rodar migrações `001`→`007` na ordem (SQL Editor ou CLI) e versionar em `supabase/migrations/`. *(aplicadas no Supabase real em 18/11/2026; a `007` é nova, ver 6.8 e D24)*
- [x] 4.2 Criar usuário admin, desligar *sign up*, inserir em `admins`. *(admin criado e 1 linha em `admins` conferida; *sign up* desligado, ver 3.7)*
- [x] 4.3 Conferir bucket `media` e políticas. *(listagem anônima do bucket retornou `[]`; itens 14 e 31 do teste: upload negado para anônimo e não-admin)*
- [x] 4.4 Criar cliente de teste + senha (RPC) e post de teste. *(coberto pelo `security_checks.sql`, que cria e apaga clientes e posts de teste; clientes reais entram na Fase 5)*
- [x] 4.5 Testes de segurança de banco (17.2, itens de banco/REST). *(`supabase/tests/security_checks.sql`: 39 PASS no Supabase real após a `007`; 1ª execução teve FAIL no item 28 e gerou a `007`. Conferência REST manual: `GET /rest/v1/clients` com a publishable key → `42501 permission denied`; listagem do bucket → `[]`)*

**Aceite:** com a `anon key`, `GET /rest/v1/clients` retorna vazio/negado; `client_login` correto devolve token; `client_get_feed` devolve só posts visíveis; token de um cliente não acessa outro.

### Fase 5 — Integração do admin: Auth real, clientes reais, deploy
**Tarefas**
- [~] 5.1 `env.ts`, `supabase.ts`, `SupabaseProvider` (parte admin: auth + clientes). *(`env.ts` e `supabase.ts` criados na Etapa 1; faltam os providers e a parte de auth/clientes)*
- [ ] 5.2 Trocar `VITE_DATA_SOURCE` para `supabase` no admin; login real (`signInWithPassword`) e `AdminGuard` com `is_admin()`.
- [ ] 5.3 Dashboard e `ClientForm` ligados ao banco (contadores via `admin_client_counters`, slug único tratando erro `23505`).
- [ ] 5.4 Upload de avatar real (Storage) + senha real (`admin_set_client_password`), revogar sessões, destravar.
- [ ] 5.5 Troca de status refletindo em `client_gate`; excluir cliente apagando arquivos.
- [ ] 5.6 `robots.txt` + meta `noindex` + CSP.
- [~] 5.7 Workflows `deploy.yml` e `keepalive.yml`; *secrets* cadastrados. *(workflows escritos na Etapa 1 conforme 14.3; faltam: cadastrar os 2 *secrets*, Pages em *GitHub Actions* e o primeiro push)*

**Aceite:** push em `main` publica o site; login admin funciona no domínio do Pages; usuário não-admin é barrado; criar/editar/arquivar/excluir cliente persiste de verdade.

### Fase 6 — Posts e uploads reais
**Tarefas**
- [ ] 6.1 `lib/media.ts` (dimensões, resize, poster de vídeo, duração).
- [ ] 6.2 `lib/storage.ts` (upload simples + TUS com progresso, remoção, `copy`).
- [ ] 6.3 `MediaUploader` real (fila, progresso, cancelar/repetir, aviso ao sair com upload em andamento).
- [ ] 6.4 `SupabaseProvider` (posts, mídias, capas, recorte da grade, revisões).
- [ ] 6.5 Duplicar com cópia de arquivos; excluir post/mídia apagando arquivos.
- [ ] 6.6 Teste com vídeo real próximo do limite de tamanho.

**Aceite:** um post de cada tipo persistido; Reels com capa e recorte corretos após recarregar; excluir remove os arquivos; falha de rede no upload permite retomar.

### Fase 7 — Acesso real do cliente
**Tarefas**
- [ ] 7.1 `SupabaseProvider` (parte cliente): `client_gate`, `client_login`, `client_get_feed`, `client_logout`, token em `localStorage`.
- [ ] 7.2 `ClientEntry`/`Gate` reais com bloqueio por tentativas e mensagens corretas.
- [ ] 7.3 Garantir que rotas do cliente não renderizam nada do admin.
- [ ] 7.4 Revisar CSP e URLs de mídia públicas no ambiente real.

**Aceite:** `não publicado`/`arquivado` mostram a mesma página de erro; `publicado` pede senha; sessão expira/é derrubada ao trocar senha ou status; filtro por mês correto com datas reais.

### Fase 8 — Aprovações reais + caixa de entrada
**Tarefas**
- [ ] 8.1 `client_submit_review` integrado ao `ApprovalPanel` (atualização otimista + reconciliação, tratamento de `unauthorized`, `rate_limited`, `comment_required`).
- [ ] 8.2 Admin: selos e contadores reais, aba Aprovações, `ReviewInbox`, Realtime, "marcar como lida".
- [ ] 8.3 Reenvio de nova revisão (volta a `pending`, mantém histórico por revisão).

**Aceite:** cliente sem conta aprova e pede ajuste; admin vê em tempo real; "Não aprovar" sem texto é bloqueado no front **e** no banco; cliente não vê reviews de outros clientes.

### Fase 9 — Polimento, acessibilidade, performance, segurança, QA
**Tarefas**
- [ ] 9.1 Auditoria de acessibilidade (teclado, leitor de tela, contraste).
- [ ] 9.2 Performance: Lighthouse mobile ≥ 90 (Performance/Acessibilidade) na tela do perfil; imagens `lazy`; grid com ~200 posts fluido.
- [ ] 9.3 Checklist completo de segurança (17.2).
- [ ] 9.4 QA cross-browser/dispositivo (17.3).
- [ ] 9.5 Revisão de textos, mensagens de erro e estados vazios.

**Aceite:** 17.2 e 17.3 100% OK.

### Fase 10 — Go-live
**Tarefas**
- [ ] 10.1 (Opcional) Domínio próprio no Pages + HTTPS; ajustar `base` e CSP.
- [ ] 10.2 Cadastrar cliente real e fazer um ciclo completo de aprovação.
- [ ] 10.3 Documentar rotina de backup (14.4).
- [ ] 10.4 Registrar a data do go-live no Diário e marcar o Painel.

---

## 17. Testes

### 17.1 Unitários (Vitest)
- `dates.ts`: `todayMonthKey` na virada de mês/fuso, `addMonths` (dez→jan, jan→dez), `formatMonthLabel`.
- `slug.ts`: acentos, espaços, caracteres especiais, unicidade do sufixo.
- `caption.ts`: hashtags com acento, menções, URLs, quebras de linha, tentativa de HTML (`<script>`) tratada como texto.
- Filtro de mês: posts na borda (último/primeiro dia do mês).
- `useStoryTimer`: avanço, pausa, retomada.

### 17.2 Segurança (itens de banco: Fase 4 · restante: Fase 9 · obrigatório antes do go-live)
- [x] Com a `anon key`, `select` em `clients`, `posts`, `post_media`, `reviews`, `client_credentials`, `client_sessions`, `login_attempts` → **nada** retorna.
- [x] `client_gate` devolve resposta **idêntica** para slug inexistente, `unpublished` e `archived`.
- [x] 5 senhas erradas → `locked`; senha correta durante o bloqueio também falha até expirar ou até o admin destravar.
- [x] Mudar cliente para `unpublished`/`archived` → `client_get_feed` com token antigo retorna `unauthorized`.
- [x] Trocar senha → tokens antigos deixam de funcionar.
- [x] Token do cliente A **não** lê nem envia review de post do cliente B.
- [x] Post com `is_visible=false` **não** aparece no feed nem aceita review.
- [x] `client_submit_review` com `changes_requested` e comentário vazio → erro.
- [x] Chamar `admin_*` e `is_admin` como anônimo → negado.
- [x] Usuário Supabase Auth que **não** está em `admins` não lê/escreve nada.
- [x] Upload no bucket com anon → negado; listagem do bucket com anon → negada.
- [ ] Legenda com `<img onerror=...>` é exibida como texto.
- [ ] Repositório sem `service_role` (rodar busca por `service_role` e por `eyJ` suspeitos).

### 17.3 QA manual (matriz)
| Cenário | Desktop Chrome | Desktop Safari | iOS Safari | Android Chrome |
|---|---|---|---|---|
| Gate + senha | ☐ | ☐ | ☐ | ☐ |
| Grade 3:4 + filtro de mês | ☐ | ☐ | ☐ | ☐ |
| Post imagem | ☐ | ☐ | ☐ | ☐ |
| Carrossel (swipe/setas) | ☐ | ☐ | ☐ | ☐ |
| Reels: play/pause/seek/volume | ☐ | ☐ | ☐ | ☐ |
| Reels: tela cheia | ☐ | ☐ | ☐ | ☐ |
| Stories (toque/segurar/auto) | ☐ | ☐ | ☐ | ☐ |
| Aprovar / Não aprovar com texto | ☐ | ☐ | ☐ | ☐ |
| Tema escuro | ☐ | ☐ | ☐ | ☐ |
| Upload de vídeo grande (admin) | ☐ | ☐ | — | — |

Casos extras: conexão lenta (3G simulado), vídeo sem áudio, vídeo vertical e horizontal, legenda de 2200 caracteres com emojis, cliente sem posts no mês, cliente com 0 stories (sem anel), rotação do celular.

---

## 18. Riscos e armadilhas conhecidas

| Risco | Impacto | Ação |
|---|---|---|
| Limite de tamanho de arquivo do Storage no plano gratuito | Reels pesados não sobem | Comprimir (ffmpeg/HandBrake), checar limite na Fase 3, plano pago se necessário |
| Projeto gratuito pausa por inatividade | Site "quebra" após dias sem uso | `keepalive.yml` + checagem periódica |
| Autoplay com som bloqueado | Reels "não toca" | Iniciar mudo + aviso para ativar som |
| HEVC/.mov não toca em alguns navegadores | Vídeo preto | Exigir H.264/AAC no admin, avisar na validação |
| iOS Safari e tela cheia/`dvh` | Layout cortado | Usar `100dvh`, `playsInline`, testar em aparelho real |
| Fuso horário em datas | Post no mês errado | Datas como `date` + manipulação por string |
| Caminhos de mídia expostos | Vazamento | UUID + plano v2 com URLs assinadas |
| Trava por cliente (DoS leve) | Cliente legítimo bloqueado | Mensagem clara + botão "Destravar" no admin |
| Mudanças do Instagram (proporção da grade, limites) | Simulação desatualizada | Constantes centralizadas em `config/instagram.ts` |
| Repo público | Código visível | Nenhum segredo no código; segurança no banco |
| GitHub desativa workflows agendados após 60 dias sem atividade em repositório público | `keepalive.yml` para e o Supabase pausa | Fazer um commit pequeno ou reativar em *Actions* de vez em quando |
| Supabase não concede mais GRANT de tabela ao `authenticated` por padrão | Admin recebe `42501` mesmo com RLS correto | Migração `007` (D24); em tabelas novas, lembrar do GRANT |
| Windows: `curl` do PowerShell é outro comando; `\` não quebra linha | Comandos do guia falham | Usar CMD com `curl`, ou `curl.exe` numa linha só, ou `Invoke-RestMethod` |

---

## 19. Pontos que assumi (confirme ou corrija)

1. **Cada story é um item separado de aprovação** (D7).
2. **Seguidores/seguindo/“publicações”** são valores fictícios editáveis (publicações = contagem real de posts visíveis).
3. **Ícones de curtir/comentar etc.** são decorativos (sem interação).
4. **Cliente pode mudar a decisão** e todas ficam no histórico.
5. **Filtro de mês** usa a **data planejada** do post, não a data de upload.
6. **Mídias em bucket público com URLs imprevisíveis** na v1 (assinadas na v2).
7. **Um único admin** (você). Se um dia tiver equipe, adicionar linhas em `admins` já resolve a permissão.
8. O cliente **vê o selo de status** (aprovado/ajustes/pendente) na grade — pode ser desligado.
9. Link do cliente inclui um **sufixo aleatório** além do nome (camada extra de proteção).

---

## 20. Backlog (v2 e além)

- Notificações: e-mail (Edge Function + Resend) e/ou Telegram/WhatsApp quando chegar retorno.
- Comentários **pinados em cima da imagem** (clicar e anotar o ponto exato).
- Comparação lado a lado entre revisões (antes/depois).
- URLs assinadas e bucket privado (seção 8.3).
- Transcodificação/compressão de vídeo no navegador (ffmpeg.wasm) ou em Edge Function.
- Calendário editorial (visão mensal em grade com arrastar para reagendar).
- Destaques ("Highlights") no perfil e post fixado.
- Link de aprovação **por post** com senha própria.
- Exportar relatório de aprovações (PDF/CSV) por mês.
- Expiração automática do link (data limite) e *watermark* opcional no preview.
- Multi-admin / papéis (designer, atendimento).
- PWA (instalar no celular) e modo offline para o admin.
- Versionamento de mídia com histórico de arquivos por post.
- Card do cliente com não lidas separadas por tipo ("✓ 2 aprovados · ✎ 1 ajuste", em verde e laranja) e mesmo destaque no selo da aba Aprovações (adiado pelo usuário em 18/11/2026).

---

## 21. Glossário rápido

- **RLS (Row Level Security):** regras do Postgres que decidem quais linhas cada usuário pode ver/alterar.
- **RPC:** função do Postgres chamada pela API do Supabase (`supabase.rpc('nome', args)`).
- **SECURITY DEFINER:** a função roda com os poderes do dono, permitindo acessar tabelas que o chamador não acessa — por isso cada uma valida token/admin internamente.
- **anon key / publishable key:** chave pública do Supabase (pode ficar no front). O painel atual a chama de *Publishable key* (`sb_publishable_...`); a *Secret key* equivale à `service_role`. **service_role key:** chave total (nunca no front/repo).
- **TUS:** protocolo de upload resumível (retoma de onde parou).
- **HUD:** camada de controles sobre o vídeo.

---

## 22. Diário de bordo e memória do projeto (documento vivo)

> Atualizar **a cada tarefa** (regra 0.2). Não apagar registros; marcar como resolvidos.

### 22.1 Próximo passo
**(19/11/2026)** Usuário testar o **bloco 2a** no PC: extrair o zip por cima do projeto, `npm run dev`, abrir `/#/c/demo-marca-abc123` (senha `demo1234`), `npm run build`, commit e push. Se tudo certo, **bloco 2b** (1.5 a 1.7). Pendências menores: P16, P17, P22, P11; conferir se o `keepalive.yml` aparece na aba Actions.

*(texto anterior, de 19/11, resolvido: Etapa 1 concluída)*

### 22.2 Diário de bordo
| Data | Fase/Tarefa | Resultado | O que foi feito | O que falhou / ressalvas | Arquivos / links |
|---|---|---|---|---|---|
| 18/11/2026 | Planejamento | ✅ | Plano criado (v1) e reordenado para "interface primeiro" (v2) | — | `CONTINUIDADE_PLANO_DE_DESENVOLVIMENTO.md` |
| 18/11/2026 | 1.0 Protótipo em arquivo único (Inter, modo claro) | ✅ | Perfil, anel de stories, grade 3:4 com bolinhas de status, filtro de mês, post, carrossel, Reels com HUD, stories, aprovação com histórico | Vídeo do Reels é simulado (canvas); dados não persistem; sem tela de senha nem admin | `prototipo-aprovacao.html` · https://claude.ai/artifact/TS5jfcFXJAjCf5cZjc5bcW |
| 18/11/2026 | 1.0 Ajustes após feedback do usuário | ✅ | (a) botão **pausar** ao lado do ✕ nos stories (também barra de espaço); (b) **setas ‹ ›** no centro lateral do story; (c) corrigido hover do botão "Voltar ao mês atual" | Ver bug de hover em 22.4 | mesmo arquivo |
| 18/11/2026 | Documentação | ⚠️ | Diário atualizado só depois de o usuário perguntar | A regra 0.2 exige atualizar **ao fim de cada tarefa**, antes de responder; não foi feito na primeira entrega | este arquivo |
| 18/11/2026 | 1.4 Tela de senha no protótipo | ✅ | Gate com senha `demo1234`, mensagem de senha incorreta, bloqueio simulado após 5 erros, página "link indisponível" (`#/c/inativo`) e botão Sair | Bloqueio é só visual (não expira); sessão é em memória, recarregar pede a senha de novo | `prototipo-aprovacao.html` |
| 18/11/2026 | Reconciliação (registro retroativo) | ⚠️ | O HTML já tinha um admin básico que o Diário não citava (login demo, dashboard com abas e contadores, formulário de cliente, gerar senha, copiar link/mensagem, regra "publicar exige senha"). Segundo o usuário, a sessão anterior (outra conta) acabou no meio do trabalho. Registrado como 2.1 a 2.5 parciais | Não havia upload de avatar, revogar/destravar nem confirmações | `Aprovação de conteúdo · Protótipo.html` |
| 18/11/2026 | 2.1 a 2.5 completar | ✅ | Upload de avatar (reduzido a 300px), slug editável com validação e unicidade, busca, alterar status no card, revogar sessões e destravar (simulados), confirmar ao arquivar, excluir cliente digitando o nome, "Resetar dados de exemplo" | Sem recorte circular do avatar (P8) | `Aprovação de conteúdo · Protótipo.html` |
| 18/11/2026 | 2.6 Workspace do cliente | ✅ | Abas Feed, Publicações, Aprovações e Configurações; rotas `#/admin/c/:id`; seletor de mês; faixa de stories; "Ver como cliente" | Feed é grade editável, não reaproveita o componente do cliente (P9) | `Aprovação de conteúdo · Protótipo.html` |
| 18/11/2026 | 2.7 e 2.8 Editor de post e recorte da capa | ✅ | Editor dos 4 tipos com preview ao vivo (grade e post), upload de imagens (redimensiona a 1080px), carrossel de 2 a 20 itens com reordenar/remover, avisos de proporção, vídeo MP4 com limite de 50 MB e aviso para .mov, capa por upload/exemplo/frame do vídeo, recorte 3:4 arrastável refletido na grade (admin e cliente), duração do story, nome do áudio | Reordenar por botões, sem dnd-kit (P10); vídeo enviado não persiste (P1) | `Aprovação de conteúdo · Protótipo.html` |
| 18/11/2026 | 2.9 a 2.11 Lista, reenvio e caixa de entrada | ✅ | Filtros, duplicar, ocultar/mostrar, excluir, lote; reenvio com `rv` e volta a pendente; caixa de entrada com não lidas, filtros e marcar como lida; retornos do cliente chegam como não lidos | — | `Aprovação de conteúdo · Protótipo.html` |
| 18/11/2026 | Persistência e ajustes do lado do cliente | ✅ | Estado em `localStorage` (D16); rascunhos ocultos para o cliente; story respeita a duração configurada; Reels com vídeo real quando enviado; avatar enviado aparece no perfil | — | `Aprovação de conteúdo · Protótipo.html` |
| 18/11/2026 | Teste automatizado (smoke) | ✅ | Navegador automatizado: login, dashboard, workspace, 4 editores, recorte, validação do carrossel, salvar post, aprovar como cliente e ver não lida na caixa de entrada; sem erros de JS | Não substitui teste manual em celular e desktop | script descartável |
| 18/11/2026 | 2.3/2.5 Publicar pede senha + card no celular | ✅ | Trocar para "Publicado" abre um modal pedindo a senha (já preenchida se existir, com botão Gerar e validação de 8 caracteres), no dashboard e ao salvar o formulário; cancelar volta ao status anterior. No celular o seletor de status fica no canto superior direito do card (selo de status escondido para compactar) e o cabeçalho do dashboard quebra linha | Testado por script em 390px de largura (modal, cancelar, Enter, senha gravada); falta validar em celular real | `Aprovação de conteúdo · Protótipo.html` |
| 18/11/2026 | Reconciliação | ✅ | Última linha do Diário (publicar pede senha) conferida com o HTML recebido: tudo registrado | — | — |
| 18/11/2026 | P2 Story em vídeo | ✅ | Editor de story aceita imagem ou vídeo (frame vira capa; duração segue o vídeo; aviso se >60 s ou fora de 9:16). Visualizador toca o vídeo, barra segue `currentTime`, avança no fim, pausa (botão, segurar, caixa de ajustes), botão de som, voltar reinicia | Vídeo não persiste após recarregar (P1); o editor avisa | `Aprovação de conteúdo · Protótipo.html` |
| 18/11/2026 | P8 Recorte circular do avatar | ✅ | Modal ao enviar a foto: arrastar, zoom, máscara circular, saída 300x300 JPEG; Esc/Cancelar fecham | — | mesmo arquivo |
| 18/11/2026 | P10 Arrastar para reordenar carrossel | ✅ | Itens arrastáveis por pointer events (mouse e toque), destaque do alvo; botões ‹ › mantidos | Sem dnd-kit (só no Vite) | mesmo arquivo |
| 18/11/2026 | Teste automatizado das 3 entregas | ✅ | Navegador headless: arrastar item 1 para o fim, subir webm no story, salvar, tocar e pausar no visualizador do cliente, modal do avatar com zoom e arraste; sem erros de JS | Não substitui teste em celular real | script descartável |
| 18/11/2026 | Reconciliação | ✅ | Diário da v6 conferido com o HTML recebido (tudo registrado) | — | — |
| 18/11/2026 | 2.12 Raiz = login do admin | ✅ | Sem hash, o site abre o login (e-mail e senha, sem criar conta); cliente só por `#/c/:slug`; o link de demonstração do cliente fica como atalho na tela de login | O bug era o fallback `SL()` para o cliente demo (E5) | `Aprovação de conteúdo · Protótipo.html` |
| 18/11/2026 | 2.13 Exportar/Importar | ✅ | Dois botões no dashboard; backup JSON com clientes, posts, retornos e avatares; importar valida, confirma e substitui | Vídeos enviados não entram no arquivo (P1); o arquivo tem as senhas do protótipo | mesmo arquivo |
| 18/11/2026 | 2.14 Métricas | ✅ | Aba Métricas (cartões + tabela por tipo e total) e linha de resumo no card do cliente | Definições em D21, a confirmar com o usuário | mesmo arquivo |
| 18/11/2026 | 2.15 Contagens no perfil | ✅ | Publicações seguem o filtro de mês; novo contador de stories | — | mesmo arquivo |
| 18/11/2026 | Teste automatizado | ✅ | Headless: raiz mostra login, senha errada, exportar baixa o arquivo, importar restaura (e rejeita arquivo inválido), métricas (9 avaliados, 89% de 1ª, 1 reprovado), perfil com 6 publicações/4 stories no mês e 10/5 em todos; sem erros de JS | Falta teste em celular real | script descartável |
| 18/11/2026 | Decisão sobre a caixa de entrada | ✅ | Confirmado que a caixa já lista aprovações e ajustes (ambos entram como não lidos, filtros Todas/Não lidas/Ajustes/Aprovadas). Usuário decidiu **manter como está** por enquanto; a separação visual no card ficou no backlog | — | — |
| 18/11/2026 | Reconciliação | ✅ | Diário da v7 conferido com o que foi entregue (tudo registrado; a decisão de manter a caixa de entrada também) | — | — |
| 18/11/2026 | 4.1 Migrações em arquivos | ✅ | Os 6 blocos SQL do plano extraídos para `supabase/migrations/001` a `006` (sem retocar o conteúdo) e aplicados em Postgres 16 local com stubs de `auth`, `storage` e dos papéis | Não foi rodado no Supabase real | `supabase/migrations/*.sql` |
| 18/11/2026 | 4.5 Teste de segurança do banco | ✅ | Script `security_checks.sql` (39 verificações: anônimo sem acesso às tabelas e às funções admin, gate idêntico, bloqueio de 5 erros, isolamento entre clientes, rascunho oculto, não-admin barrado, troca de senha e despublicação derrubam sessões, upload no bucket negado); cria e apaga os próprios dados | Listagem do bucket por anônimo não é testada (o Storage bloqueia apagar objetos por SQL); conferir à mão | `supabase/tests/security_checks.sql` |
| 18/11/2026 | Validação do próprio teste | ✅ | Abri uma brecha de propósito (anon lendo `clients`) e o teste acusou FAIL; sem a brecha, 39 PASS; dados de teste removidos | — | — |
| 18/11/2026 | 3.x Guia das Fases 3 e 4 | ✅ | Passo a passo de contas, limites, desligar cadastro, rodar migrações, criar admin, rodar o teste e conferência pela API | — | `docs/PASSO_A_PASSO_FASES_3_E_4.md` |
| 18/11/2026 | 3.1 a 3.2 Projeto Supabase criado pelo usuário | ⚠️ | Projeto `aprovacao-conteudo` criado (plano Free, região sa-east-1 São Paulo, ambiente main/Production). Usuário não achou "API" nem "Project URL" em Settings: o painel agora usa **API Keys** (chave *publishable*) e a URL é `https://<Project ID>.supabase.co` | O guia (3.2 e 4.4) citava o painel antigo; corrigido | `docs/PASSO_A_PASSO_FASES_3_E_4.md` |
| 18/11/2026 | 4.1 Migrações 001 a 006 no Supabase real | ⚠️ | Aplicadas pelo SQL Editor. Aviso de RLS no `001`: escolhida a opção segura (a `002` liga o RLS de qualquer modo) | (a) Rodar o `001` de novo deu `42710 type client_status already exists`: inofensivo, o `001` não é repetível. (b) `006` falhou com `42883 function public.client_gate(text) does not exist`: o `004` colado tinha só `client_get_feed` (cópia incompleta); diagnosticado com consulta a `pg_proc`, resolvido rodando o `004` inteiro (170 linhas, 7 funções) | `supabase/migrations/004_rpc_client.sql` |
| 18/11/2026 | 4.2 Admin criado | ✅ | Usuário criado em Authentication → Users e inserido em `public.admins`; `select * from public.admins` mostrou 1 linha | O `insert` responde só "Success. No rows returned" (não informa quantas linhas); a conferência é pelo `select` | — |
| 18/11/2026 | 4.3/4.5 Teste de segurança no Supabase real (1ª execução) | ⚠️ | Itens 1 a 27 PASS | Item 28 FAIL: `42501 permission denied for table clients` ao ler `clients` como usuário logado não-admin. Causa: o `authenticated` não tem GRANT nas tabelas (o Supabase não concede mais por padrão); no Postgres local os papéis tinham GRANT de fábrica, por isso lá passou | `supabase/tests/security_checks.sql` |
| 18/11/2026 | 6.8 Migração 007 e 2ª execução do teste | ✅ | Criada `007_grants_admin_tables.sql` (GRANT em `clients`, `posts`, `post_media`, `reviews` ao `authenticated`; RLS decide). Teste repetido: **39 de 39 PASS** | — | `supabase/migrations/007_grants_admin_tables.sql` |
| 18/11/2026 | 4.4 Conferência REST manual | ✅ | Com a publishable key: `GET /rest/v1/clients` → `42501 permission denied for table clients`; `POST /storage/v1/object/list/media` → `[]` | O ambiente do Claude não alcança o Supabase (rede bloqueada), então a conferência foi feita pelo usuário. No Windows, `curl` do PowerShell falhou (é alias de `Invoke-WebRequest`), o `\` não quebra linha e o JSON com `\"` quebrou; funcionou no **CMD** com `curl` numa linha só | — |
| 18/11/2026 | 3.2 URL e chave pública registradas | ✅ | Project ID `hxqczylwfsypdreydgzt` → URL `https://hxqczylwfsypdreydgzt.supabase.co`; Publishable key `sb_publishable_ZgtV_TApeN2Iudsdgb4CtQ_7NDh69oe` (pública, vai no build). Secret key **não** foi copiada | — | este arquivo |
| 18/11/2026 | 3.5 Nome do repositório | ✅ | `aprove`; site `https://igorjdscarvalho.github.io/aprove/`; `base` do Vite `/aprove/`; repo público (D23) | Criação do repo e Pages em *GitHub Actions* ainda não confirmadas | — |
| 18/11/2026 | 3.6 Limites do plano | ⚠️ | Arquivo máx. 50 MB (confere com a `003`); projeto grátis pausa por inatividade; uso atual (Settings → Usage): banco 0,027 GB, Storage 0 GB, egress 0 GB; plano Free, ciclo 29/10 a 29/11/2026 | A tela Usage mostra uso, não limite: **quotas totais ainda não anotadas** (8.4). Usuário confundiu "50 MB por arquivo" com limite total | — |
| 18/11/2026 | 3.7 Cadastro público desligado | ✅ | Usuário desligou *Allow new users to sign up*; explicado que a opção vale para a API do Supabase, não para o site (que nem tem tela de cadastro); o login do admin e os clientes (link + senha) não são afetados (D27) | — | — |
| 18/11/2026 | 3.4 Node LTS e Git | ✅ | Usuário instalou os dois no Windows. Explicado: Node roda o Vite e o `npm`; Git guarda o histórico e envia ao GitHub | Versões não registradas; o ambiente do Claude não instala pacotes (npm bloqueado), então o `npm run build` e o teste local serão feitos no computador do usuário | — |
| 18/11/2026 | 3.3 Repositório e decisão sobre o protótipo | ✅ | Repo `aprove` já está criado (vazio). Decisão D26: o HTML não vai ao Pages agora; sobe junto com a Fase 5 | Pages em *GitHub Actions* ainda não confirmado | — |
| 18/11/2026 | 6.8 Migração 007 (registro completo) | ✅ | Conferido que a `007` está documentada em: estrutura do repo (seção 5), 6.8, D24, 4.1/4.5, diário, E8, riscos (18) e histórico | O guia `docs/PASSO_A_PASSO_FASES_3_E_4.md` ainda não tem a `007` (P16) | `supabase/migrations/007_grants_admin_tables.sql` |
| 18/11/2026 | 3.4 Versões registradas | ✅ | `node -v` v26.13.0, `npm -v` 11.20.0, `git --version` 2.56.1.windows.1; compatíveis com as dependências da Etapa 1 | Parte A do guia ainda não executada | — |
| 18/11/2026 | Decisão da Fase 5 | ✅ | Constatado que o projeto Vite ainda não existia (só o HTML de 79 KB) e que a Fase 5 do plano o pressupõe. Usuário escolheu **Vite em etapas** (D28) | — | — |
| 18/11/2026 | 1.1 / 5.1 / 5.7 Etapa 1: esqueleto | ⚠️ | Criado o projeto: `package.json`, `vite.config.ts` (`base '/aprove/'`), `tsconfig*.json`, Tailwind 3 com tokens claro/escuro (seção 15), `index.html` (pt-BR, `noindex`), `robots.txt`, `src/config/env.ts` (erro claro se faltar variável), `src/lib/supabase.ts`, página de diagnóstico, `deploy.yml`, `keepalive.yml`, `.gitignore`/`.env.example`. Pacote entregue com `supabase/`, `prototipo/` e `docs/`; guia `docs/ETAPA_1_ESQUELETO.md` | **Não executado**: sem npm/rede aqui, só a sintaxe do TS/TSX foi conferida (0 erros) e a varredura de segredos (nenhum). Versões das dependências não consultadas no npm (faixas `^`). Falta o usuário rodar `npm install`, `npm run dev` e `npm run build` | `aprove-etapa-1.zip` |
| 18/11/2026 | 1.1 Etapa 1 Parte A (passos 3 a 7) | ✅ | No Windows (CMD): `node -v` v26.13.0, `npm -v` 11.20.0, Git 2.56.1; `.env.local` criado; `npm install` (147 pacotes, 22 s); `npm run dev` abriu `http://localhost:5173/aprove/` com **as 4 linhas em OK** (site, ping do Supabase, anônimo sem acesso a `clients`, `client_gate`) | `npm install` avisou 4 vulnerabilidades e o *install-scripts* do esbuild (P22). `npm run build` e a Parte B (secrets, Pages, push) ainda não feitos | — |
| 18/11/2026 | Passagem para nova conversa | ✅ | A conversa estava perto do limite; continuidade atualizada (v12), zip regerado com os docs atuais e prompt de continuação entregue ao usuário (arquivos a anexar: continuidade, zip e protótipo) | — | `aprove-etapa-1.zip`, este arquivo |
| 19/11/2026 | Retomada em nova conversa | ✅ | Lidos o `.md` avulso (v12) e o zip; confirmado que o avulso é o mais novo (o do zip está em v11) e que o protótipo HTML é idêntico nos dois. Usuário confirmou a ordem: **terminar a Etapa 1 (build + Parte B) antes da Etapa 2**, um passo por vez, no CMD, com confirmação de escopo antes de etapa grande | Nada de código alterado neste turno; resultado do `npm run build` ainda não recebido | este arquivo |
| 19/11/2026 | 1.1 Etapa 1 Parte A (passo 8) `npm run build` | ✅ | No CMD: `tsc --noEmit` sem erros e `vite build` com 80 módulos, `built in 1.39s` (CSS 6,58 kB; JS 144 kB + 254 kB). Etapa 1 completa no PC | Parte B (secrets, Pages, push) ainda não feita | — |
| 19/11/2026 | 5.7 Parte B passo 1: secrets | ✅ | Usuário cadastrou `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em Settings → Secrets and variables → Actions; sem erro (relato do usuário, sem print) | Falta Pages em *GitHub Actions* e o primeiro push | — |
| 19/11/2026 | 3.3 / 5.7 Pages em *GitHub Actions* | ✅ | Usuário trocou *Source* para **GitHub Actions** (Settings → Pages). A página passou a listar workflows sugeridos (Next.js etc.): é normal e **deve ser ignorado**, o projeto usa o próprio `deploy.yml`. P18 resolvido | Falta o primeiro push | — |
| 19/11/2026 | 5.7 Parte B: identidade do Git | ✅ | `git config --global user.name`/`user.email` estavam vazios; configurados (nome = usuário do GitHub, e-mail do usuário) e conferidos. Usuário perguntou se o site depende do PC ligado: **não**; o PC só envia o código, o site roda no GitHub Pages e os dados no Supabase | Falta `git init`, commit e push | — |
| 19/11/2026 | 5.7 Parte B: commit e 1º push | ⚠️ | `git init`, `git add .` (32 arquivos, sem `node_modules`/`dist`/`.env.local`) e commit `1fb4b80` ok; login no GitHub pelo navegador ok | Push recusado: `GH007 Your push would publish a private email address` (ver E12). Alternativa: usar o e-mail noreply do GitHub, refazer o autor do commit e repetir o push | — |
| 19/11/2026 | 5.7 Parte B: push corrigido | ✅ | `user.email` trocado para o e-mail noreply do GitHub, `git commit --amend --reset-author --no-edit` e `git push -u origin main` concluído (usuário relatou `branch 'main' set up to track 'origin/main'`). Código no GitHub | Falta ver o workflow *Deploy to GitHub Pages* verde na aba Actions e abrir o site | — |
| 19/11/2026 | 5.7 Deploy no ar / Etapa 1 concluída | ✅ | Workflow *Deploy to GitHub Pages* ficou verde; `https://igorjdscarvalho.github.io/aprove/` abre com os **4 itens OK** (relato do usuário). Etapa 1 da Fase 5 concluída: build, secrets, Pages e push feitos | `keepalive.yml` ainda não observado rodando (conferir na aba Actions); P16, P17, P22, P11 seguem abertos | https://igorjdscarvalho.github.io/aprove/ |
| 19/11/2026 | Retomada: o que vem depois do passo 8 | ✅ | Usuário relatou o deploy no Pages com os 4 OK (a Etapa 1 inteira); conferido que o Diário já tinha isso registrado. Proposta: Etapa 2 em blocos (D29). Usuário deixou a ordem a critério do plano | — | este arquivo |
| 19/11/2026 | Esclarecimento: telas do HTML x projeto Vite | ✅ | Usuário perguntou por que "criar telas" se o HTML já as tem. Explicado: é **portar** do protótipo para o projeto real (o HTML tem dados fictícios e login de mentira e não vai ao Pages, D26) | Eu havia escrito Gate/Unavailable a partir do plano; comparei com o protótipo e alinhei texto, largura (340 px), posição (12vh) e botão azul | `src/pages/client/*` |
| 19/11/2026 | 1.2 a 1.4 Bloco 2a | ⚠️ | Criados: `types/domain.ts`, `config/instagram.ts`, `lib/dates.ts`, `lib/mediaSrc.ts`, `providers/types.ts`, `providers/mock/seed.ts` (2 clientes, 21 posts visíveis: 8 imagens, 4 carrosséis, 5 Reels, 4 stories; mês anterior, atual e próximo; 1 rascunho oculto), `providers/mock/MockProvider.ts` (gate, login com bloqueio de 5 erros em 15 min, sessão de 7 dias, feed só com posts visíveis, enviar aprovação, logout), `providers/index.ts`, `pages/client/{ClientEntry,Gate,Unavailable,ClientFeed}.tsx`, `pages/Diagnostico.tsx` (movido do `App.tsx`), `components/ui/{Spinner,Footer}.tsx`, novo `App.tsx` com rotas `/c/:slug` e `/c/:slug/p/:postId`. `ClientFeed` é provisório (contagem por tipo + Sair); perfil e grade são o bloco 2b | **Não rodado no PC.** Aqui: lógica do `MockProvider` testada em Node (gate idêntico, 5 erros → `locked`, login, feed sem rascunho, ajuste sem texto → `comment_required`, aprovar muda o status, logout → `unauthorized`); `tsc` sem erros nos arquivos `.ts`; os `.tsx` só tiveram a sintaxe conferida (sem os tipos do React instalados) e nenhum nome não usado ou indefinido. O `npm run build` real decide (P23) | zip `aprove-etapa-2a.zip` |
|  |  |  |  |  |  |

### 22.3 O que deu certo (padrões a repetir)
| Data | Contexto | O que funcionou | Por que funcionou |
|---|---|---|---|
| 18/11/2026 | Protótipo | Dados fictícios gerados em código (SVG com gradiente) e estado em memória | Dispensa arquivos externos e permite testar todos os tipos de post sem backend |
| 18/11/2026 | Protótipo | Player com HUD escrito contra uma interface mínima (`currentTime`, `duration`, `paused`, `volume`, `muted`, `play`, `pause`) | O mesmo HUD controla o vídeo simulado e um `<video>` real escolhido pelo usuário |
| 18/11/2026 | Admin | Estado em `localStorage` + imagens redimensionadas no navegador | Mesmo dado para admin e cliente em abas diferentes, sem backend, e cabe na cota |
| 18/11/2026 | Qualidade | Rodar o HTML num navegador automatizado antes de entregar | Pegou o bug E2, que a leitura do código não mostrava |
| 18/11/2026 | Pointer events | Arrastar do carrossel e do recorte do avatar com `setPointerCapture` + `touch-action:none` | Mesmo código para mouse e toque, sem biblioteca |
| 18/11/2026 | Backup | Formato com marcador `app` e versão `v`, validado na importação, com confirmação antes de substituir | Evita importar arquivo errado e perder dados por engano |
| 18/11/2026 | Postgres local como bancada | Postgres 16 local + stubs mínimos do Supabase para validar SQL antes do projeto real | Pegou erros de sintaxe e permissão sem depender de conta; o teste ainda precisa ser repetido no Supabase |
| 18/11/2026 | Teste que testa o teste | Injetar uma brecha de propósito e ver o FAIL | Prova que o teste não passa por acaso |
| 18/11/2026 | Supabase real | Rodar o mesmo `security_checks.sql` no projeto real, mesmo com 39 PASS local | Achou o que o Postgres local escondia (falta de GRANT ao `authenticated`); o teste local não substitui o real |
| 18/11/2026 | Diagnóstico de migração | Consultar `pg_proc` (funções) e `information_schema.tables` (tabelas) para saber o que já existe no banco | Mostrou na hora que o `004` não tinha sido aplicado por inteiro, sem adivinhar |
| 18/11/2026 | Entregar SQL como arquivo | Enviar `004` e `security_checks.sql` como arquivo para copiar com Ctrl+A | Evita cópia cortada de visualizadores |
| 18/11/2026 | Configuração de segurança | Explicar o **motivo** da configuração (cadastro desligado vale para a API, não para a tela) antes de pedir que ela fosse mexida | O usuário entendeu e fez sozinho; sem a explicação parecia item irrelevante, já que o site não tem cadastro |
| 18/11/2026 | Etapa 1 no PC do usuário | Página de **diagnóstico** (ping, anônimo bloqueado, `client_gate`) + comandos de CMD um passo por vez, pedindo o resultado de cada um | Em um olhar prova que build, roteador, variáveis e Supabase funcionam juntos, sem eu poder executar nada aqui |
| 19/11/2026 | Provider testado fora do navegador | Rodar o `MockProvider` em Node com `tsx` e um `localStorage` simulado | Valida a lógica (bloqueio, sessão, rascunho oculto) sem precisar do React nem do PC do usuário |
| 19/11/2026 | Alinhar com o que o usuário aprovou | Comparar o CSS e os textos do protótipo antes de entregar a tela portada | Evita entregar uma tela "parecida" que muda o que o usuário já validou |
|  |  |  |  |

### 22.4 O que não deu certo (evitar / alternativa adotada)
| Data | Contexto | O que foi tentado | Sintoma / erro | Causa | Alternativa adotada | Status |
|---|---|---|---|---|---|---|
| 18/11/2026 | Filtro de mês (botão ativo "Voltar ao mês atual") | Estilo `hover` genérico dos botões do filtro | Ao passar o mouse, o fundo ficava claro e o texto continuava branco (ilegível) | A regra genérica `.mf button:hover` tinha especificidade maior que `.chip.on` e sobrescrevia o fundo escuro | Regra específica `.chip.on:hover` mantendo fundo escuro e texto branco | resolvido |
| 18/11/2026 | Processo (E1) | Regra 0.2 sem gatilho: o diário não foi atualizado ao entregar o protótipo | O usuário precisou perguntar se o `.md` estava sendo atualizado | A regra dizia "atualizar", mas não havia ritual nem verificação de fim de turno | Seção 0.5: ritual de fim de turno, verificação final e reconciliação no início do turno | resolvido (processo) |
| 18/11/2026 | Editor de post (E2) | Abrir `#/admin/c/1/p/new?type=reel` depois de `...?type=image` | O editor continuava no tipo anterior | A chave do estado do editor era só `cliente:new`, igual para todos os tipos | A chave inclui o tipo quando o post é novo | resolvido |
| 18/11/2026 | Processo (E3) | Admin básico entregue na sessão anterior sem registro no Diário | O MD ficou atrás do código | A sessão anterior (outra conta) acabou no meio e o ritual 0.5 não foi concluído | Reconciliação no início do turno (0.5) e registro retroativo | resolvido (processo) |
| 18/11/2026 | Teste automatizado (E4) | Recarregar a página no teste depois de enviar um vídeo ao story | O vídeo sumia e o teste falhava | Vídeo enviado é `blob:` e não é salvo no `localStorage` (P1) | Testar navegando só pela hash, sem recarregar | resolvido |
| 18/11/2026 | Rota inicial (E5) | Função `SL()` devolvia o slug do cliente demo quando não havia `#/c/...` | Abrir o site mostrava a tela de senha do Studio Aurora em vez do login do admin | Fallback pensado só para a demo | Raiz sempre vai para o admin; cliente só com `#/c/` | resolvido |
| 18/11/2026 | Guia Supabase (E6) | Guia descrevia "Settings → API" com "Project URL" e "anon key" | Usuário não encontrou esses itens | O painel do Supabase mudou de nomes (API Keys, publishable key) e eu escrevi de memória sem conferir a tela atual | Guia reescrito com o painel atual; pedir print quando o usuário travar em passos de interface de terceiros | resolvido |
| 18/11/2026 | `006_grants.sql` (E7) | Rodar o `006` no Supabase | `42883 function public.client_gate(text) does not exist` | O `004` não estava aplicado por inteiro: o usuário colou só a função `client_get_feed` (cópia incompleta). O SQL do `006` estava certo | Rodar o `004` completo (usa `create or replace`, é repetível); conferir com `pg_proc` antes do `006` | resolvido |
| 18/11/2026 | Teste de segurança no Supabase real (E8) | Rodar `security_checks.sql` | Item 28: `42501 permission denied for table clients` | O Supabase não dá mais GRANT de tabela ao `authenticated` por padrão; as migrações só tinham GRANT de função (`006`). Só aparecia fora do Postgres local | Migração `007` (6.8, D24) | resolvido |
| 18/11/2026 | Migração `001` (E9) | Rodar o `001` pela segunda vez | `42710 type client_status already exists` | As migrações 001 a 006 não são repetíveis (só `004`, `005`, `007` usam `create or replace`/`grant`). Nada foi quebrado: o erro ocorre no primeiro `create type` | Não rodar de novo; para saber o que já existe, usar as consultas de diagnóstico | resolvido |
| 18/11/2026 | Guia 4.4 no Windows (E10) | Comando `curl` com `\` para quebrar linha e `-d "{\"a\":1}"`, escrito para bash | PowerShell: `curl` é alias de `Invoke-WebRequest` (erro de unidade `https`); `\` não continua a linha; JSON com `\"` chegou quebrado (`Body is not valid JSON`) | Guia escrito para Linux/macOS, sem conferir o sistema do usuário (Windows) | Usar o **CMD** com `curl` numa linha só e `-d "{\"prefix\":\"\",\"limit\":10}"`; atualizar o guia (P16) | resolvido (guia a atualizar) |
| 18/11/2026 | Orientação sobre o `insert` em `admins` (E11) | Eu disse que o resultado informaria "1 linha inserida" ou "0 linhas" | O Supabase respondeu só "Success. No rows returned" | Informação errada minha: o SQL Editor não mostra a contagem de linhas de um `insert` | Conferir sempre com um `select` depois do `insert` | resolvido |
| 19/11/2026 | Primeiro push (E12) | `git push -u origin main` com `user.email` = e-mail pessoal | `remote: error: GH007: Your push would publish a private email address` | A conta tem *Keep my email addresses private* ligado; o commit levava o e-mail real | Usar o e-mail `ID+usuario@users.noreply.github.com` (Settings → Emails), `git config --global user.email`, `git commit --amend --reset-author --no-edit` e repetir o push. Eu devia ter avisado antes de sugerir o e-mail pessoal, já que o repo é público | resolvido (19/11/2026) |
| 19/11/2026 | Checagem de `.tsx` no ambiente do Claude (E13) | `npx esbuild` para validar a sintaxe | O comando travou 300 s (o `npx` tentou baixar o pacote e a rede é bloqueada) | `npx` sem pacote local tenta o registro do npm | Chamar o binário já instalado (`/opt/npm-tools/node_modules/.bin/esbuild`) lendo o arquivo por stdin, sempre com `timeout` | resolvido |
|  |  |  |  |  |  |  |

### 22.5 Problemas conhecidos em aberto
| # | Descrição | Impacto | Fase afetada | Status (aberto/resolvido) | Observações |
|---|---|---|---|---|---|
| P1 | Vídeos enviados no admin não persistem após recarregar (imagens persistem no `localStorage`, reduzidas a 1080px) | Baixo (esperado) | 2 | aberto | Resolvido pela Fase 6; após recarregar o Reels volta ao vídeo simulado e o story em vídeo mostra só o frame (o editor avisa) |
| P2 | Stories no protótipo só têm imagem (5 s); story em vídeo ainda não foi prototipado | Médio | 1 | resolvido (18/11/2026) | Story em vídeo no HTML (barra segue o vídeo, pausa, som, avança no fim). Refazer no Vite (11.9) |
| P3 | Vídeo do Reels no protótipo é simulado; áudio/volume só são reais com "Testar com meu vídeo" | Baixo | 1 | aberto | Resolvido com mídia real (Fase 6) |
| P4 | Tela de senha (1.4) no protótipo em arquivo único | Baixo | 1 | resolvido (18/11/2026) | Refazer no projeto Vite com o `MockProvider` |
| P5 | Usuário só testou o celular; falta validar o desktop (modal em 2 colunas) | Médio | 1 | aberto | Pedir feedback do desktop |
| P6 | Cota do `localStorage` (cerca de 5 MB): muitas imagens grandes podem estourar | Baixo | 2 | aberto | O app avisa e segue só em memória; Supabase Storage resolve na Fase 6 |
| P7 | Admin sem login real: a sessão fica só na aba (`sessionStorage`) | Baixo (esperado) | 2 | aberto | Auth real na Fase 5 |
| P8 | Avatar sem recorte circular (só reduz a 300px) | Baixo | 2 | resolvido (18/11/2026) | Modal com arrastar e zoom, saída 300x300 |
| P9 | Aba Feed do workspace é grade editável, não o componente do cliente em modo `adminPreview` | Médio | 2 | aberto | Resolver no projeto Vite, com componente compartilhado (seção 9) |
| P10 | Carrossel reordena por botões ‹ ›, sem arrastar (dnd-kit) | Baixo | 2 | resolvido (18/11/2026) | Arrastar com pointer events no HTML; no Vite usar dnd-kit |
| P11 | Admin e cliente ainda não testados em celular real e no desktop pelo usuário | Médio | 1-2 | aberto | Pedir validação |
| P12 | O backup exportado contém as senhas dos clientes em texto (só no protótipo) | Baixo | 2 | aberto | Guardar o arquivo com cuidado; no Supabase só existe hash (D4) |
| P13 | Definições das métricas (D21) escolhidas sem confirmação do usuário | Baixo | 2 | aberto | Pedir validação |
| P14 | SQL validado só em Postgres local com stubs, não no Supabase real | Médio | 4 | resolvido (18/11/2026) | `security_checks.sql` rodado no Supabase real: 39 PASS após a `007`. A diferença esperada apareceu (GRANT ao `authenticated`) |
| P15 | Cadastro público (*Allow new users to sign up*) não confirmado como desligado | Alto (segurança) | 3 | resolvido (18/11/2026) | Desligado pelo usuário (D27, 3.7) |
| P16 | `docs/PASSO_A_PASSO_FASES_3_E_4.md` ainda sem a `007`, com comandos para bash (o usuário usa Windows) e com o painel de limites incompleto | Baixo | 3-4 | aberto | Atualizar: tabela de migrações (007), seção 4.4 para CMD, 3.4 com "Settings → Usage" |
| P17 | Quotas totais do plano Free (banco, Storage, egress) não anotadas | Médio | 3, 6 | aberto | Conferir em Supabase Plans/Billing e registrar em 8.4 |
| P18 | Node LTS, Git, repositório `aprove` e Pages (*GitHub Actions*) | Médio | 3, 5 | resolvido (19/11/2026) | Node, Git e repo ok (18/11/2026); falta confirmar Pages em *GitHub Actions* e registrar as versões |
| P19 | `keepalive.yml` ainda não existe; projeto pode pausar após ~7 dias parado | Médio | 5 | aberto | Criar na Fase 5 (5.7) chamando `ping()`; lembrar da regra de 60 dias do GitHub (seção 18) |
| P20 | Código da Etapa 1: `npm install`, `npm run dev` (4 OK) e `npm run build` (sem erros, 19/11/2026) funcionaram no PC do usuário | Baixo | 5 | resolvido (19/11/2026) | Resta a Parte B (deploy) |
| P21 | Versões das dependências em faixas `^` sem consulta ao npm | Baixo | 5 | parcial | Usuário no Windows: Node v26.13.0, npm 11.20.0, Git 2.56.1 (18/11/2026), compatíveis com Vite 5 e Tailwind 3; o workflow usa Node 22 (sem impacto). O `package-lock.json` gerado no primeiro `npm install` fixa as versões e deve ir ao Git |
| P22 | `npm install` mostrou: **4 vulnerabilities (3 moderate, 1 high)** e o aviso do npm 11 *install-scripts* (esbuild 0.21.5 com postinstall não coberto por `allowScripts`). Nada quebrou. **Não** usar `npm audit fix --force` (sobe versões maiores e quebra o projeto) | Baixo | 5 | aberto | Provavelmente só ferramentas de desenvolvimento (Vite 5/esbuild). Rodar `npm audit` e avaliar; se o esbuild acusar erro, usar `npm install-scripts approve esbuild`. Reavaliar ao atualizar para Vite mais novo |
| P23 | Bloco 2a sem teste no PC: os `.tsx` não foram checados com os tipos reais do React/Router (só sintaxe e nomes) | Médio | 2 | aberto | O `npm run build` (`tsc --noEmit`) no PC decide; qualquer erro de tipo volta para correção |

### 22.6 Histórico de mudanças do plano
| Versão | Data | Mudança | Motivo |
|---|---|---|---|
| v1 | 18/11/2026 | Plano inicial (Supabase primeiro) | — |
| v3 | 18/11/2026 | Adicionada a seção 0.5 (trava anti-esquecimento) | Diário foi esquecido uma vez; usuário pediu orientação para nunca mais passar batido |
| v2 | 18/11/2026 | Fases reordenadas: protótipo visual → admin sobre protótipo → infraestrutura/integração; adicionada camada de providers (10.0); documento passa a ser vivo (0.2, seção 22) | Usuário quer ver a interface antes de investir no backend e manter registro do que deu certo/errado |
| v4 | 18/11/2026 | Admin completo no protótipo HTML (Fase 2 em `[~]`); decisões D15 a D17; registro retroativo do admin básico | Sessão anterior terminou no meio; usuário pediu seguir pelo HTML e registrar tudo |
| v13 | 19/11/2026 | Etapa 1 concluída; Etapa 2 em blocos 2a a 2e (D29); bloco 2a entregue (1.2 a 1.4 em `[~]`); P23 | Usuário deixou a ordem a critério do plano; telas portadas do protótipo, não redesenhadas |
| v12 | 18/11/2026 | Etapa 1 rodando no PC; versões registradas; P20 parcial, P22 novo; prompt de continuação | Usuário testou a Parte A e a conversa chegou perto do limite |
| v11 | 18/11/2026 | Fase 5 em etapas (D28); Etapa 1 do esqueleto entregue (1.1, 5.1 e 5.7 parciais); P20 e P21 | Usuário escolheu "Vite em etapas" |
| v10 | 18/11/2026 | Cadastro público desligado (D27, P15 resolvido), Node e Git instalados, repo `aprove` criado, decisão de não publicar o protótipo (D26); registro completo da `007`; E11 | Usuário confirmou as pendências da Fase 3 |
| v9 | 18/11/2026 | Fase 4 concluída no Supabase real; nova migração `007` (D24, 6.8); repositório `aprove` (D23); limite de 50 MB confirmado (D25); lições E7 a E10; pendências P15 a P19 | Usuário rodou as Fases 3 e 4 e trouxe os resultados e erros |
| v8 | 18/11/2026 | Fases 3 e 4 preparadas: `supabase/migrations/`, `supabase/tests/security_checks.sql` e `docs/PASSO_A_PASSO_FASES_3_E_4.md` | Usuário escolheu preparar o Supabase |
| v7 | 18/11/2026 | Login do admin na raiz, exportar/importar, métricas, contagens do perfil; decisões D19 a D22; RF-A9 a A11 e RF-C9 | Pedido do usuário |
| v6 | 18/11/2026 | Story em vídeo, recorte do avatar e arrastar no carrossel (P2, P8, P10 resolvidos no HTML) | Pendências da Fase 1-2 escolhidas pelo usuário como foco da sessão |
| v5 | 18/11/2026 | Decisão D18: publicar sempre pede senha; seletor de status no canto do card no mobile | Pedido do usuário após testar o protótipo |
