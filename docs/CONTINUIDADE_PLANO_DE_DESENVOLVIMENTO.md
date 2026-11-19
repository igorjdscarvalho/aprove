# CONTINUIDADE — Plano de Desenvolvimento

**Projeto:** Plataforma de aprovação de conteúdo para Instagram (simulador de perfil + fluxo de aprovação por cliente)
**Stack:** GitHub Pages (front estático) + Supabase (Auth, Postgres, Storage, Edge Functions opcionais)
**Versão do documento:** v33 — **Última atualização:** 19/11/2026 (commit `d75646e` da E5 enviado a `origin/main`; Pages acionado, workflow sem confirmação)
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
| **3** | Contas e ferramentas (Supabase, GitHub, Node) | `[~]` (projeto Supabase, URL/chave pública, cadastro desligado, repo, Node/Git e Pages em GitHub Actions confirmados; falta anotar as quotas totais do plano) |
| **4** | Supabase: schema, RLS, RPCs, Storage | `[x]` (migrações 001 a 007 aplicadas no Supabase real; admin criado; `security_checks.sql` com 39 PASS; conferência REST manual ok) |
| **5** | Integração admin: Auth real, clientes reais, deploy automático | `[~]` (E1 aceita; E2 entregue e usuário confirmou que os fluxos/deploy estão funcionando; P26 mantém itens admin residuais sem validação item a item; D30) |
| **6** | Posts e uploads reais (imagem, carrossel, Reels, stories) | `[x]` (E3 aceita pelo usuário; build e validações locais confirmados; deploy autorizado) |
| **7** | Acesso real do cliente: gate, senha, sessão, feed do banco | `[x]` (E4 aceita pelo usuário; gate, bloqueio, rotas e CSP considerados validados) |
| **8** | Aprovações reais + caixa de entrada em tempo real | `[x]` (E4 aceita pelo usuário; ciclo de aprovação, inbox/Realtime, marcar como lida, métricas e reenvio validados) |
| **9** | Polimento, acessibilidade, performance, segurança, QA | `[x]` (E5 aceita pelo usuário em 19/11/2026; ele confirmou que as validações deram certo) |
| **10** | Go-live e rotina de manutenção | `[~]` (E5 aceita; commit/push enviados; confirmar workflow/URL publicada e registrar go-live) |

Os checklists detalhados de cada fase ficam na seção 16 (marcar lá também).

**Próximo passo imediato:** E5 aceita pelo usuário. Commit `d75646e` (`Entrega E5: acabamento e go-live`) enviado para `origin/main`; o push acionou o GitHub Pages. `npm run build` passou (`tsc`, Vite 5.4.21, 139 módulos). Falta apenas confirmar a conclusão verde do workflow e a versão E5 no site publicado; a consulta direta retornou página inacessível/cache miss neste ambiente. Depois da confirmação (o usuário relatou que está tudo no ar), registrar a data final de go-live e fechar a Fase 10.4. O usuário já confirmou as validações E5.

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
| D29 | **Etapa 2 em cinco blocos**: 2a providers + `MockProvider` + rotas + Gate/Unavailable (1.2 a 1.4); 2b perfil, avatar com anel, abas, grade, filtro de mês (1.5 a 1.7); 2c visualizador, legenda, carrossel (1.8, 1.9); 2d player de Reels com HUD e stories (1.10, 1.11); 2e painel de aprovação, responsividade, tema, skeletons (1.12, 1.13). As telas **não são redesenhadas**: são portadas do protótipo HTML (referência visual). Até a integração feita no patch v20/D33, o lado do cliente usava o `MockProvider`; o seed é recalculado por mês corrente e fica em `localStorage` (`mock:state`, versão 3) | Usuário deixou a ordem a critério do plano; blocos pequenos podem ser testados no PC, já que o ambiente do Claude não roda `npm` | Sim |
| D30 | **APROVADA pelo usuário em 19/11/2026: plano acelerado em 5 entregas** (seção 16.0), em vez de 16 entregas pequenas. E1 cliente completo no Vite (2c+2d+2e); E2 admin real (Fase 5); E3 posts e uploads reais (Fase 6) + workspace; E4 cliente real + aprovações + caixa de entrada (Fases 7 e 8); E5 acabamento e go-live (Fases 9 e 10). Mudanças de escopo: o admin **não** passa por `AdminDataProvider` mock (vai direto ao Supabase, que já tem o teste de segurança com 39 PASS); a ordem "interface primeiro" (D11) fica valendo só para o lado do cliente; carrossel reordena por arrastar com pointer events (sem `dnd-kit`); 1.14 cancelado (D26); duplicar com cópia de arquivos e ação em lote vão para a E5 | Usuário quer terminar mais rápido, com no máximo ~5 entregas. Cada entrega fica maior e o teste do usuário mais longo, e o ambiente do Claude não roda `npm`: espera-se uma rodada de correção (patch) por entrega | Sim |
| D30 | **APROVADA pelo usuário em 19/11/2026: plano acelerado em 5 entregas** (seção 16.0), em vez de 16 entregas pequenas. E1 cliente completo no Vite (2c+2d+2e); E2 admin real (Fase 5); E3 posts e uploads reais (Fase 6) + workspace; E4 cliente real + aprovações + caixa de entrada (Fases 7 e 8); E5 acabamento e go-live (Fases 9 e 10). Mudanças de escopo: o admin **não** passa por `AdminDataProvider` mock (vai direto ao Supabase, que já tem o teste de segurança com 39 PASS); a ordem "interface primeiro" (D11) fica valendo só para o lado do cliente; carrossel reordena por arrastar com pointer events (sem `dnd-kit`); 1.14 cancelado (D26); duplicar com cópia de arquivos e ação em lote vão para a E5 | Usuário quer terminar mais rápido, com no máximo ~5 entregas. Cada entrega fica maior e o teste do usuário mais longo; os tipos e o bundle podem ser conferidos aqui, mas as chamadas ao Supabase e o aceite visual dependem do PC do usuário. Maior risco: E3 (uploads, vídeo, TUS) | Sim |
| D31 | **Stories no desktop:** painel de aprovação translúcido com desfoque; setas menores e discretas, com chevrons centralizados; clicar na área externa fecha o visualizador; ícone X com traço mais forte. No mobile o painel continua opaco na parte inferior | Pedido visual do usuário após validar a E1 | Sim |
| D32 | Login do admin usa o e-mail e a senha da conta criada em **Supabase Authentication → Users**, e essa conta precisa estar associada à tabela `public.admins`. `demo1234` é somente a senha fictícia do cliente Studio Aurora via `MockProvider`; não serve no login do admin | Esclarecimento solicitado pelo usuário para distinguir as duas telas de login | Não |
| D33 | A rota pública escolhe o `SupabaseClientProvider` para slugs reais e mantém o `MockProvider` somente para os dois slugs de demonstração. O token Supabase fica em `localStorage` com a chave `supabase:cli_token:<slug>`, separada do token mock; gate, login, feed, logout e envio de aprovação usam as RPCs existentes | O link real copiado no admin abria a rota pública, que ainda consultava somente o seed local e tratava todo slug novo como indisponível | Sim |
| D34 | O envio de arquivos E3 usa upload simples até 6 MB e protocolo TUS manual em blocos de 6 MB acima disso, com progresso, retomada pelo offset do servidor, retry e cache local da sessão de upload. Uploads usam a sessão Supabase Auth do admin; arquivos substituídos/removidos são limpos após salvar ou cancelar | O projeto não tinha cliente TUS instalado; manter poucas dependências e suportar arquivos até 50 MB no Storage existente | Sim |
| D35 | Caixa de entrada e métricas E4 ficam no workspace de cada cliente; o dashboard oferece atalho direto para clientes com retornos não lidos. O Realtime do workspace filtra `reviews` por `client_id`, enquanto o dashboard atualiza os contadores globais | Mantém a navegação contextual e limita as consultas de retornos ao cliente aberto; o escopo prevê inbox por cliente ou geral | Sim |

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
const tokenKey = (slug: string) => `supabase:cli_token:${slug.toLowerCase()}`;

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

**Importante:** este é o login real do admin. Use as credenciais da conta administrativa criada em **Supabase Authentication → Users** (já associada a `public.admins`). A senha `demo1234` pertence apenas ao perfil fictício Studio Aurora no fluxo de cliente com `MockProvider`; não funciona aqui. A senha do projeto/banco Supabase também não é a senha do site.

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
1. **Mensalmente**, exportar um dump SQL pelo painel Supabase se o plano oferecer download; caso contrário, usar `pg_dump` com a conexão do banco. Guardar o arquivo criptografado fora do Supabase e fora do repositório. Nunca compartilhar a senha/conexão no chat.
2. O dump SQL **não** contém os objetos do Storage. Manter cópia dos arquivos originais em um drive separado e organizado por cliente; comparar periodicamente se os arquivos importantes ainda existem.
3. **Mensalmente**, revisar uso/quota do banco, Storage e egress em `Settings → Usage` e `Plans & Billing`, sessões ativas e clientes arquivados. Apagar dados antigos só após confirmar retenção com o cliente e verificar que o backup existe.
4. **Trimestralmente**, testar a restauração do dump em um projeto separado ou ambiente de recuperação, sem sobrescrever o projeto de produção.

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

### 16.0 Plano acelerado em 5 entregas (D30) — **APROVADO pelo usuário (19/11/2026)**

> Agrupa as fases restantes (1.8 em diante, 5, 6, 7, 8, 9, 10) em **5 entregas**. As fases e os critérios de aceite abaixo (seção 16) **continuam valendo**; o que muda é como o trabalho é empacotado. Estado: **E1 e E3 aceitas; E2 entregue e fluxos/deploy confirmados pelo usuário (P26 guarda itens residuais); parte da E4 (gate/login/feed/logout/aprovação no cliente) já foi integrada e validada nos fluxos básicos; caixa de entrada/Realtime e métricas do admin são o próximo trabalho E4**.

| Entrega | Escopo | Tarefas cobertas | Quando está pronta (aceite) | Risco |
|---|---|---|---|---|
| **E1 · Cliente completo no Vite** (antigos 2c + 2d + 2e) | `PostViewer` + `Caption`, `Carousel`, `ReelPlayer` + `PlayerHUD`, `StoryViewer` + `ApprovalPanel`, responsividade, temas e skeletons; painel de aprovação dos stories refinado em D31 | 1.8 a 1.13 (1.14 cancelado, D26) | Aceite da Fase 1: fluxo completo do cliente e avaliação visual do usuário | **Validada pelo usuário em 19/11/2026** |
| **E2 · Admin real** (Fase 5) | Login real (`signInWithPassword`) + `AdminGuard` com `is_admin()`; dashboard (busca, abas por status, contadores via `admin_client_counters`); `ClientForm` com avatar real (recorte circular + Storage); senha real (`admin_set_client_password`), modal de senha ao publicar (D18), revogar sessões, destravar; arquivar/excluir com confirmação e remoção de arquivos; `noindex` + CSP. **Sem `AdminDataProvider` mock**: vai direto ao Supabase | 5.1 a 5.6 | Aceite da Fase 5: criar/editar/arquivar/excluir cliente persiste de verdade; `client_gate` reflete o status | **Implementada; usuário disse que os fluxos existentes estão funcionando; P26 ainda acompanha verificações administrativas residuais.** |
| **E3 · Posts e uploads reais** (Fase 6) + workspace do cliente | `lib/media`, `lib/storage` (upload simples + TUS resumível com progresso); `MediaUploader`; editor dos 4 tipos com prévia de perfil, `CoverCropper` (recorte 3:4 e frame do vídeo); carrossel reordenável por pointer events; workspace Feed (**reusa os componentes do cliente em modo `adminPreview`, resolve P9**), Publicações e Configurações; filtros, ocultar/mostrar, excluir com arquivos e reenviar para aprovação (`revision`). Prévia do celular é integrada ao editor, sem componente separado. | 6.1 a 6.4, exclusão de 6.5; duplicação segue para E5; 6.6 | **Aceita pelo usuário em 19/11/2026**, após build corrigido e validação dos fluxos E3 | Entregue; aceite do usuário |
| **E4 · Cliente real + aprovações + caixa de entrada** (Fases 7 e 8) | Provider Supabase do cliente (`client_gate`, `client_login`, `client_get_feed`, `client_logout`, token por slug) e `ApprovalPanel` real (`client_submit_review`; `unauthorized`, `rate_limited`, `comment_required`) — fluxo básico já validado; admin: selos/contadores reais, aba Aprovações por cliente, `ReviewInbox` com Realtime e "marcar como lida", Métricas por tipo/total (RF-A11, D21), reenvio mantendo histórico | 7.1 a 7.4, 8.1 a 8.3 | Aceites das Fases 7 e 8. **Marco: produto usável com cliente real** (ciclo completo admin → link → cliente aprova → admin vê) | **Aceita pelo usuário em 19/11/2026**; commit `65ed136` enviado para `origin/main`, deploy automático acionado; workflow sem confirmação |
| **E5 · Acabamento e go-live** (Fases 9 e 10) | Acessibilidade, Lighthouse mobile ≥ 90, checklist de segurança 17.2, QA 17.3, revisão de textos; duplicar com cópia de arquivos e ação em lote (6.5); pendências P11, P17, P22; rotina de backup (14.4); primeiro ciclo com cliente real; registrar a data do go-live | 6.5 (duplicar/lote), 9.1 a 9.5, 10.1 a 10.4 | Usuário confirmou E5 validada; commit `d75646e` enviado a `origin/main` em 19/11/2026 e deploy Pages acionado; workflow/URL final aguardam confirmação | Baixo |

**Regras para não perder velocidade nem qualidade**
1. Uma entrega = alterações na pasta compartilhada do projeto + **roteiro de teste numerado** (10 a 15 itens) + lista de arquivos novos/alterados. Não gerar zip quando o código já está na pasta do projeto; o usuário faz o commit **depois da validação** para não registrar algo que ainda precise de patch.
2. Cada entrega é montada por dentro em subpartes (a, b, c) e revisada estaticamente; build, integração com o Supabase e aceite visual ficam no computador do usuário quando essa for a preferência combinada.
3. O `npm run build` no PC segue sendo o teste de tipos real (P23). O usuário cola o erro, eu corrijo. **Correção de erro = patch** (E3.1, E3.2…), **não conta como entrega nova**.
4. Este `.md` continua sendo atualizado a cada entrega **e a cada patch** (0.5).
5. Tempo de teste por entrega sobe de 15–30 min para **45–90 min**.

**Estimativa do plano acelerado:** 5 entregas + cerca de 3 a 5 patches. Tempo do usuário: cerca de **8 a 12 h** (antes: 15 a 25 h, 17 a 20 entregas). Produto usável ao fim da **E4**. Estimativa, não compromisso; E3 é a que mais pode escapar.

**O que se perde em troca da velocidade:** menos pontos de verificação (um erro pode aparecer só no fim de uma entrega grande e é mais difícil de isolar); o admin não passa por uma etapa com dados fictícios antes de tocar o banco; duplicar com cópia e lote só chegam na E5.

#### Roteiro de validação da E4 no PC do usuário

Use um cliente de teste publicado, com senha conhecida e posts visíveis dos quatro tipos. Não faça as tentativas de bloqueio no link de um cliente ativo: o RPC limita o cliente por 15 minutos; o admin pode destravar o perfil de teste ao final.

1. Na pasta do projeto, rode `npm run build`. Se houver erro, pare e envie a saída completa; não faça commit ainda.
2. Rode `npm run dev`, entre no admin e abra o espaço do cliente de teste. Confirme as abas Feed, Publicações, Aprovações, Métricas e Configurações e os selos/contadores reais.
3. Abra o link público em outra janela (de preferência anônima). Confira que aparece apenas a experiência do cliente, sem cabeçalho/links do admin, mesmo com a sessão administrativa ativa no navegador normal.
4. No link público, confirme senha errada, senha correta, feed com posts reais e logout. No perfil de teste, envie cinco senhas erradas; a tentativa seguinte deve mostrar bloqueio. Depois use **Destravar** no admin para liberar o teste. (O RPC responde `locked` quando o contador já registra cinco erros.)
5. Deixe o workspace do admin aberto na aba Aprovações. Em outra janela, aprove um post pendente pelo link público. Confirme que o selo/status do workspace e os contadores do dashboard atualizam sem recarregar (Realtime).
6. Em outro post pendente, tente enviar pedido de ajuste sem comentário; o envio deve ser impedido. Escreva um comentário e envie; confira no admin decisão, texto, nome (se informado), data/hora e thumbnail.
7. Na inbox, teste Todas, Não lidas, Ajustes e Aprovadas; use **Abrir post** e confirme que o editor abre o item correspondente.
8. Marque um retorno como lido. Confirme que some de Não lidas, que o badge da aba Aprovações diminui e que a contagem no dashboard também atualiza.
9. Mantenha o dashboard aberto e envie outro retorno do cliente; confirme que o contador do card do cliente se atualiza em tempo real e que o atalho **Ver retornos** abre a aba certa.
10. Edite um post que já tenha avaliações, mantenha **Reenviar para aprovação** marcado e salve. A revisão deve aumentar, o status voltar a Pendente e o histórico anterior permanecer na inbox/visualização do post.
11. No link do cliente, confirme que a nova revisão aparece como pendente e envie uma nova resposta; confira que o novo item fica no topo do histórico/inbox sem apagar os anteriores.
12. Na aba Métricas, confira total e linhas Imagem, Carrossel, Reels e Story: avaliados, aprovados na primeira resposta, conteúdos com algum pedido de ajuste, quantidade de pedidos, média de ajustes por reprovado e reenvios. Oculte um rascunho e confirme que ele não entra nos cálculos; reexiba depois se necessário.
13. Confira gate indisponível para cliente não publicado/arquivado e mídia carregando no Pages publicado; CSP e rotas devem manter as URLs de mídia e o WebSocket Supabase funcionando. O status do deploy E3 ainda não foi confirmado; relate se o workflow publicado estiver vermelho.
14. Se um passo falhar, envie o número, mensagem/print e diga se ocorreu no build, admin local, link local ou site publicado. Não faça commit/push até fechar a rodada de validação/correção.

#### Roteiro de validação da E5 no PC do usuário

Use um cliente de teste e mantenha um post original que possa comparar com as cópias. A ação em lote altera a visibilidade para o cliente; confirme que está no perfil de teste antes de usá-la.

1. No GitHub, abra **Actions → Deploy to GitHub Pages** e confira a execução do commit E4 `65ed136`. O push acionou o workflow, mas o status ainda não foi confirmado aqui. Se estiver vermelho, envie uma captura antes de tratar o site como atualizado.
2. O `npm run build` já passou nesta sessão: `tsc --noEmit` e Vite 5.4.21 (139 módulos). Repita apenas se mudar arquivos depois dessa validação; se aparecer erro, pare e envie a saída completa, sem commit.
3. Rode `npm run dev`, entre no admin e abra **Publicações** do cliente de teste. Duplique uma imagem e um carrossel; depois, se houver exemplos, duplique também um Reel e um story.
4. Confirme que cada cópia aparece como rascunho oculto e pendente, mantendo legenda, data, ordem e demais detalhes do post original.
5. Abra as cópias no editor/prévia e confirme que as mídias carregam. Oculte ou exclua somente uma cópia de teste e confira que o post original continua intacto e visível como antes.
6. Em **Publicações**, selecione dois rascunhos. Desmarque um e confira que a contagem selecionada acompanha a seleção; teste **Limpar seleção**.
7. Selecione novamente alguns rascunhos e clique em **Tornar visíveis**. Cancele a confirmação: nada deve mudar. Repita e confirme; só os selecionados devem passar a visíveis. Confira no link público do cliente de teste.
8. Troque os filtros de tipo, avaliação e mês; a seleção antiga deve ser limpa e **Selecionar rascunhos filtrados** deve considerar apenas os rascunhos exibidos.
9. Confira com teclado: navegue por Tab/Shift+Tab, veja o foco visível, acione os controles com Enter/Espaço e confirme que os botões de ícone têm nomes compreensíveis no leitor de tela.
10. Em largura de 360–390 px e em desktop, confira as telas de perfil, publicação, carrossel, Reel, story, inbox e editor; não deve haver conteúdo essencial cortado nem rolagem horizontal indevida. Verifique tema claro/escuro e alvos de toque.
11. No Chrome DevTools, rode Lighthouse em **modo mobile** contra `npm run preview` após o build. Registre Performance e Accessibility; a meta do plano é ≥ 90 em ambas. Se não atingir, envie os resultados para ajustar antes do deploy.
12. No campo de legenda/comentário, use `<img src=x onerror=alert(1)>`: deve aparecer como texto e não executar. A busca por Secret key/JWT já foi feita nos arquivos rastreados e não encontrou valores; não cole credenciais no chat.
13. Rode `npm audit` e envie o resumo por severidade e os pacotes apontados. Não rode `npm audit fix --force` nem cole tokens/credenciais do resultado.
14. No painel Supabase, confira **Settings → Usage** para uso atual e **Plans & Billing** para as quotas totais; registre banco, Storage, egress e eventual MAU em 8.4 (P17).
15. Faça uma cópia de segurança conforme 14.4 e confirme onde guardou o dump e os arquivos originais do Storage; não envie senhas, strings de conexão ou o conteúdo do dump.
16. Teste o fluxo em Chrome desktop, Safari desktop/iOS e Chrome Android que estiverem disponíveis. Anote itens não testados. Depois do aceite e deploy E5, abra o site publicado, confirme login admin, link público e uma aprovação ponta a ponta; só então registrar a data do go-live. Se algo falhar, envie o número, mensagem e print.

### Fase 1 — Protótipo visual do cliente (dados fictícios)
**Objetivo:** o usuário abre o protótipo e **vê e testa** tudo o que o cliente verá, sem nenhum backend.

**Tarefas**
- [x] **1.0 Versão rápida em arquivo único (HTML)** *(concluída em 18/11/2026; link e ajustes no Diário)* para validar visual e fluxo imediatamente (perfil, grade, modal de post, carrossel, player de Reels com HUD, stories, aprovação local, filtro de mês). Serve como referência visual; a evolução oficial é o projeto Vite abaixo.
- [~] 1.1 Scaffold Vite + React + TS + Tailwind, alias `@`, tokens de cor claro/escuro (seção 15). *(Etapa 1 da Fase 5: `npm install` e `npm run dev` funcionaram no PC do usuário em 18/11/2026, com os 4 OK do diagnóstico; falta confirmar `npm run build`)*
- [~] 1.2 Camada de providers (10.0) + `MockProvider` + `seed.ts` com todos os tipos de post. *(bloco 2a feito em 19/11/2026: lado do cliente (`ClientDataProvider`); a interface `AdminDataProvider` e o vídeo de exemplo entram com a Etapa 3 e o 2d; testado em Node com `localStorage` simulado, falta testar no PC)*
- [x] 1.3 `HashRouter` com rotas do cliente (`/c/:slug`, `/c/:slug/p/:postId`) e `Unavailable`. *(2a, testado no PC em 19/11/2026; o deep link do post só passa a abrir o post no 2c)*
- [x] 1.4 `Gate` *(feito no protótipo em arquivo único em 18/11/2026; **refeito no Vite no bloco 2a e testado no PC em 19/11/2026**)* (senha `demo1234`; testar: senha errada, bloqueio simulado após 5 falhas, cliente `unpublished` → "indisponível").
- [x] 1.5 `ProfileHeader`, `Avatar` com anel de gradiente (visto/não visto), `ProfileTabs`. *(2b testado no PC em 19/11/2026, "deu tudo certinho"; o anel só abre os stories no 2d)*
- [x] 1.6 `PostGrid`/`GridTile` (3 colunas, 3:4, `object-position`, ícones de carrossel/Reels, selo de status). *(2b testado no PC em 19/11/2026; clicar no tile só abre o post no 2c)*
- [x] 1.7 `MonthFilter` (mês atual por padrão, ‹ ›, "Ver todos", persistência na URL, estado vazio). *(2b testado no PC em 19/11/2026; `?m=AAAA-MM` ou `?m=all`; limite de ±36 meses)*
- [x] 1.8 `PostViewer` (modal desktop / tela cheia mobile, navegação entre posts, deep link, foco/acessibilidade) + `Caption`. *(E1 validada pelo usuário em 19/11/2026)*
- [x] 1.9 `Carousel` (swipe, setas, bolinhas, contador). *(E1 validada pelo usuário em 19/11/2026)*
- [x] 1.10 `ReelPlayer` + `PlayerHUD` + `useVideoPlayer` (play/pause, seek arrastável, tempo, volume/mudo, atalhos). *(E1 validada pelo usuário em 19/11/2026; velocidade/tela cheia e alguns detalhes opcionais ficam fora, ver 22.7)*
- [x] 1.11 `StoryViewer` + `useStoryTimer` (barras, toque, segurar, visto/não visto; mídia de vídeo real será exercitada na Fase 6). *(E1 validada pelo usuário em 19/11/2026; refinamento visual desktop entregue em D31)*
- [x] 1.12 `ApprovalPanel` (3 estados, caixa de ajustes obrigatória, nome opcional, histórico) gravando no `MockProvider`. *(E1 validada pelo usuário em 19/11/2026)*
- [x] 1.13 Responsividade (360px → desktop), tema claro/escuro, skeletons e estados vazios. *(E1 validada pelo usuário em 19/11/2026)*
- [-] 1.14 (Opcional, cancelado por D26) Publicar o protótipo no GitHub Pages para abrir no celular, **sem** dados reais.

**Aceite:** abrir `/#/c/demo-marca-abc123` → senha → perfil com anel de stories; filtro começa no mês atual e navega ‹ › (mês vazio mostra estado vazio; "Ver todos" lista tudo); abrir imagem, carrossel (5 slides) e Reels (play/pause/seek/volume funcionando); stories avançam sozinhos e por toque; aprovar e pedir ajuste (texto obrigatório) atualizam o selo e o histórico; funciona em celular (≥ 360px) e desktop.

**Pontos para o usuário validar ao final da fase:** aparência geral, proporções da grade, HUD do player, comportamento dos stories, textos, selo de status na grade (manter ou não), botões decorativos "Seguir/Mensagem" (manter ou não).

#### Roteiro de validação da E1 (concluído; referência)

O usuário confirmou que a E1 está validada em 19/11/2026. Para reproduzir o diagnóstico após a E2, abra `http://localhost:5173/aprove/#/diagnostico`; o login administrativo agora ocupa a raiz. As aprovações da E1 usam dados fictícios do `MockProvider` no `localStorage`; não alteram o Supabase. O Reels é simulado; vídeo enviado de verdade será exercitado na Fase 6.

1. **Diagnóstico:** em `/#/diagnostico`, confirme as quatro linhas como `OK`: site/roteador; resposta `ping()` do Supabase; leitura anônima de `clients` bloqueada ou sem linhas; `client_gate` retorna `available: false` para o slug inexistente.
2. **Entrada do cliente:** abra o link de demonstração mostrado na página (ou `http://localhost:5173/aprove/#/c/demo-marca-abc123`) e entre com a senha `demo1234`. Confirme que aparece o perfil Studio Aurora. Abra também o link indisponível Café Brasa (`#/c/cafe-brasa-x9k2m1`).
3. **Perfil e filtro:** confira abas Publicações/Reels, grade e selos; avance e volte o mês, teste `Ver todos` e o mês sem publicações. O rascunho com a legenda `RASCUNHO` deve ficar oculto.
4. **Imagem e legenda:** abra uma imagem, confira a legenda e feche o visualizador; teste navegação entre publicações, fechar com Escape/Voltar e a rota de deep link do post.
5. **Carrossel:** abra o carrossel de cinco itens; avance/volte pelas setas, bolinhas e gesto lateral (se houver tela de toque disponível). O contador deve acompanhar o slide.
6. **Reels:** na aba Reels, abra um vídeo e teste play/pausa, seek na barra, mudo e volume. Nesta etapa a animação é simulada, sem arquivo de vídeo real.
7. **Stories e aprovação:** toque no avatar com anel; confira avanço, navegação e pausa ao segurar. Em um post pendente, aprove e confirme selo verde. Em outro post pendente, peça ajuste com comentário e confirme selo laranja; tente enviar comentário vazio e confirme que o envio é impedido.
8. **Responsividade e tema:** confira em desktop e largura de 360 px; não deve haver rolagem horizontal. Alterne tema claro/escuro e confirme que a escolha continua após recarregar.
9. **Resultado registrado:** usuário confirmou que estava tudo certo; E1 aceita. O desktop pediu ajustes nos stories, entregues em D31 antes da E2.

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
- [~] 5.1 `env.ts`, `supabase.ts`, integração admin Auth + clientes. *(E2 implementada; aguarda teste de login e dados no Supabase do usuário)*
- [~] 5.2 Login real (`signInWithPassword`) e `AdminGuard` com `is_admin()`. *(implementados; validação manual pendente)*
- [~] 5.3 Dashboard e formulário ligados ao banco (contadores via `admin_client_counters`, slug único tratando erro `23505`). *(implementados; validação manual pendente)*
- [~] 5.4 Avatar recortado e upload real (Storage), senha real (`admin_set_client_password`), revogar sessões, destravar. *(implementados; validação manual pendente)*
- [~] 5.5 Troca de status verificada por `client_gate`; exclusão com confirmação e limpeza de arquivos. *(implementados; validação manual pendente)*
- [x] 5.6 `robots.txt` + meta `noindex` + CSP. *(meta e robots já existiam; CSP de produção gerada pelo Vite e conferida no build de 19/11/2026)*
- [~] 5.7 Workflows `deploy.yml` e `keepalive.yml`; *secrets* cadastrados. *(secrets, Pages em GitHub Actions, push e deploy verde confirmados; falta observar uma execução de `keepalive.yml`, P19)*

**Aceite:** push em `main` publica o site; login admin funciona no domínio do Pages; usuário não-admin é barrado; criar/editar/arquivar/excluir cliente persiste de verdade.

#### Roteiro de validação da E2 no PC do usuário

Rode `npm run build`; depois `npm run dev` e abra `http://localhost:5173/aprove/`. Use a conta de admin existente no Supabase. Os dados criados abaixo ficam no banco real, então use um perfil de teste e exclua-o ao final se não precisar mais dele. Não envie senha do admin por chat.

1. **Login e proteção:** sem sessão, `/#/admin` deve voltar à tela de login. Entre na raiz com o e-mail e a senha da conta criada em Supabase Authentication → Users, associada a `public.admins`. Não há botão de cadastro. `demo1234` é só para o cliente fictício Studio Aurora, não para o admin.
2. **Dashboard:** confirme que clientes reais aparecem, que busca encontra nome/@usuário/slug e que as abas Todos/Publicados/Não publicados/Arquivados filtram corretamente. Verifique os contadores de pendentes, ajustes e aprovados.
3. **Criar cliente de teste:** crie um cliente não publicado com nome, @usuário, bio, categoria e slug; salve, atualize a página e confirme que os dados persistem.
4. **Avatar:** escolha uma foto, arraste/ajuste o zoom no recorte circular, salve e confira que o avatar aparece após recarregar.
5. **Senha e publicação:** mude o cliente de Não publicado para Publicado. Deve abrir o modal de senha; cancelar mantém o status anterior; senha menor que 8 caracteres não pode ser salva. Gere/defina uma senha e conclua.
6. **Status no banco:** no card do cliente, **Testar link** deve informar `client_gate ... disponível` quando publicado. Arquive pelo formulário ou pelo card e teste de novo: deve informar indisponível. Publique novamente apenas se for manter o cliente.
7. **Controles de acesso:** no formulário, teste Copiar link/mensagem, Revogar sessões e Destravar login. Confirme as mensagens de retorno.
8. **Edição e exclusão:** edite um campo e confira persistência. Exclua o cliente de teste digitando o nome completo; confirme que some do dashboard.
9. **Saída:** Sair deve voltar ao login. Se um item falhar, envie o número e o texto completo/print. O patch v20 liga os links reais às RPCs do cliente; confira a seção seguinte. Os dois slugs de demonstração continuam usando o `MockProvider`.

#### Patch v20 — validação do link público no PC

**Resultado (19/11/2026):** usuário concluiu os passos abaixo e informou que todos passaram. Gate, senha, sessão após atualizar, logout e estado arquivado foram validados. P27 fechado. O cliente real ainda pode não ter publicações: elas entram na E3.

1. Na pasta do projeto, rode `npm run build`; se passar, rode `npm run dev`.
2. Abra o link copiado do cliente publicado no admin, mas troque o domínio por `http://localhost:5173/aprove/` e preserve o final `#/c/SEU-SLUG`. Alternativamente, use o endereço mostrado no formulário acrescentando essa mesma rota.
3. A página deve mostrar o nome/avatar do cliente real e pedir senha; não deve exibir “Este link não está disponível”.
4. Digite uma senha errada uma vez: deve aparecer “Senha incorreta”. Depois use a senha definida no Supabase.
5. A senha correta deve abrir o perfil daquele cliente. Uma grade vazia é esperada até a E3 persistir posts reais.
6. Atualize a página: a sessão deve continuar aberta. Clique em **Sair**: deve voltar ao gate de senha.
7. No admin, arquive o perfil e use **Testar link**: deve informar indisponível. Atualize também o link público: ele deve mostrar a mesma página indisponível. Publique o perfil novamente para continuar usando.
8. Se estiver testando o site publicado no GitHub Pages, primeiro faça commit e push do patch e espere o workflow de deploy ficar verde; o servidor local não atualiza o site publicado. Envie o número do passo e o erro/print se algo falhar.

### Fase 6 — Posts e uploads reais
**Tarefas**
- [x] 6.1 `lib/media.ts` (dimensões, resize, poster de vídeo, duração); validado pelo usuário na E3.
- [x] 6.2 `lib/storage.ts` (upload simples + TUS com progresso, remoção, `copy`); protocolo TUS manual sobre o endpoint do Supabase, validado pelo usuário na E3.
- [x] 6.3 `MediaUploader` real (fila, progresso, interromper/retomar, aviso ao sair com upload em andamento); validado pelo usuário na E3.
- [x] 6.4 Provider de posts do Supabase (posts, mídias, capas, recorte da grade, revisões); validado pelo usuário na E3.
- [x] 6.5 Excluir post/mídia apagando arquivos; duplicar com cópia independente no Storage e tornar rascunhos visíveis em lote estão implementados. E5 aceita pelo usuário em 19/11/2026; deploy final pendente.
- [x] 6.6 Teste com vídeo real próximo do limite de tamanho; usuário aceitou a E3 em 19/11/2026.

**Aceite:** um post de cada tipo persistido; Reels com capa e recorte corretos após recarregar; excluir remove os arquivos; falha de rede no upload permite retomar.

#### Roteiro manual E3 — a executar no computador do usuário
1. Na pasta do projeto, rode `npm run build`. Se houver erro, pare e envie o texto completo; não faça commit ainda.
2. Rode `npm run dev`, entre no admin e abra **Abrir** no cliente de teste. Use um cliente publicado para confirmar o feed público; rascunhos ocultos não devem aparecer.
3. Crie uma **Imagem única** com legenda, localização, proporção 4:5 e data. Salve e confirme que volta à lista sem erro.
4. Recarregue o espaço do cliente e edite a imagem; confira arquivo, legenda, data e status. Publique para o cliente e confirme a imagem no Feed e no link público daquele cliente.
5. Crie um **Carrossel** com duas imagens e um vídeo (se tiver), arraste itens para outra ordem, salve, reabra e confirme ordem/miniatura; abra no Feed e avance os slides/vídeo.
6. Crie um **Reels** MP4, escolha um frame ou envie capa, ajuste o recorte 3:4 e salve. Recarregue e confirme capa, crop, reprodução e posição na grade/Reels.
7. Crie um **Story** de imagem e outro de vídeo. Ajuste a duração da imagem; confirme reprodução do vídeo e navegação pelos stories no Feed.
8. Salve uma publicação como rascunho/oculta; ela deve aparecer no admin com “Rascunho oculto”, mas não no feed nem no link do cliente. Use **Mostrar** e confirme que passa a aparecer.
9. Confira filtros por tipo, status e mês na aba Publicações; depois use ocultar/mostrar para alternar uma publicação existente.
10. Em uma publicação com histórico de avaliação, edite e deixe **Reenviar para aprovação** ligado. Confirme que a revisão aumenta, o status volta a Pendente e o histórico anterior permanece; repita sem marcar para conferir que o estado é mantido.
11. Exclua um post de teste e confirme que desaparece da lista/feed e que suas mídias/capas deixam de abrir no Storage público.
12. Envie um vídeo maior que 6 MB; observe progresso. Interrompa o envio e tente salvar novamente para confirmar a retomada. Depois faça um envio de vídeo próximo de 50 MB, se tiver um arquivo disponível.
13. Se qualquer passo falhar, anote número do passo, mensagem/print e se aconteceu no build, no admin ou no link público. Não precisa testar pelo site publicado antes de commit/push; o teste local usa os dados reais do Supabase.

### Fase 7 — Acesso real do cliente
**Tarefas**
- [x] 7.1 Provider Supabase do cliente: `client_gate`, `client_login`, `client_get_feed`, `client_logout`, token isolado por slug em `localStorage`. *(gate, sessão, logout e feed com posts reais validados pelo usuário)*
- [x] 7.2 `ClientEntry`/`Gate` para clientes reais com bloqueio por tentativas e mensagens corretas. *(validado pelo usuário como parte do aceite E4)*
- [x] 7.3 Garantir que rotas do cliente não renderizam nada do admin. *(rotas cliente/admin validadas pelo usuário como parte do aceite E4)*
- [x] 7.4 Revisar CSP e URLs de mídia públicas no ambiente real. *(CSP, rotas e mídia considerados corretos no aceite E4 do usuário)*

**Aceite:** `não publicado`/`arquivado` mostram a mesma página de erro; `publicado` pede senha; sessão expira/é derrubada ao trocar senha ou status; filtro por mês correto com datas reais.

### Fase 8 — Aprovações reais + caixa de entrada
**Tarefas**
- [x] 8.1 `client_submit_review` integrado ao `ApprovalPanel` (atualização otimista + reconciliação, tratamento de `unauthorized`, `rate_limited`, `comment_required`). *(integração e teste com posts reais aceitos pelo usuário em 19/11/2026)*
- [x] 8.2 Admin: selos e contadores reais, aba Aprovações, `ReviewInbox`, Realtime, "marcar como lida". *(aceita pelo usuário em 19/11/2026)*
- [x] 8.3 Reenvio de nova revisão (volta a `pending`, mantém histórico por revisão). *(aceito pelo usuário em 19/11/2026)*

**Aceite:** cliente sem conta aprova e pede ajuste; admin vê em tempo real; "Não aprovar" sem texto é bloqueado no front **e** no banco; cliente não vê reviews de outros clientes.

### Fase 9 — Polimento, acessibilidade, performance, segurança, QA
**Tarefas**
- [x] 9.1 Auditoria de acessibilidade. *(E5 aceita pelo usuário em 19/11/2026; validação não detalhada item a item no chat.)*
- [x] 9.2 Performance/Lighthouse mobile e grid. *(E5 aceita pelo usuário em 19/11/2026; pontuações não informadas.)*
- [x] 9.3 Checklist de segurança (17.2). *(E5 aceita pelo usuário em 19/11/2026; a busca rastreada de chave/JWT também não encontrou valores.)*
- [x] 9.4 QA cross-browser/dispositivo (17.3). *(E5 aceita pelo usuário em 19/11/2026; matriz individual não informada.)*
- [x] 9.5 Revisão de textos, mensagens de erro e estados vazios. *(E5 aceita pelo usuário em 19/11/2026.)*

**Aceite:** 17.2 e 17.3 100% OK.

### Fase 10 — Go-live
**Tarefas**
- [ ] 10.1 (Opcional) Domínio próprio no Pages + HTTPS; ajustar `base` e CSP.
- [x] 10.2 Cadastrar cliente real e fazer um ciclo completo de aprovação. *(E5 aceita pelo usuário em 19/11/2026.)*
- [x] 10.3 Documentar e configurar a rotina de backup (14.4). *(E5 aceita pelo usuário em 19/11/2026.)*
- [~] 10.4 Registrar a data do go-live no Diário e marcar o Painel. *(Aplicação validada pelo usuário; concluir após o deploy final do Pages.)*

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
- [x] Busca nos arquivos rastreados por valores de Secret key/JWT: nenhum padrão encontrado (a busca não imprime valores). A `.env.local` fica fora do repositório e deve continuar ignorada pelo Git.

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
**(19/11/2026)** E4 foi aceita e enviada a `origin/main` no commit `65ed136`; o push acionou Pages, mas o status do workflow não foi confirmado. E5, última entrega do D30, está implementada no workspace e documentada para validação manual. Próximo passo: o usuário roda build e roteiro E5 no PC; corrigir eventuais falhas; depois do aceite, commit/push e confirmar o Pages. P29 fechado; P30 acompanha o workflow E4; P31 acompanha build/QA/aceite E5; P26 segue como lembrete de fluxos administrativos residuais da E2.

**Estimativa de término (informada ao usuário em 19/11/2026):** falta cerca de 35% do trabalho, em 17 a 20 entregas (cada uma = 1 rodada de entrega + 15 a 30 min de teste do usuário): 2b a 2e (4), admin real (3), posts e uploads reais, Fase 6 (4), Fases 7 e 8 (3), Fases 9 e 10 (3). Em tempo do usuário, 15 a 25 horas (1 a 2 semanas dedicando tempo, 3 a 4 semanas com pouco tempo por dia). Produto usável com cliente real ao fim da Fase 8 (cerca de 14 entregas). Estimativa sujeita a mudar, em especial nas Fases 6 e 9.

*(a estimativa acima é do plano em blocos; a do plano acelerado está em 16.0: 5 entregas + 3 a 5 patches, 8 a 12 h do usuário, produto usável ao fim da E4)*

*(texto anterior, de 19/11: aguardando teste do 2a, resolvido)*

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
| 19/11/2026 | 1.2 a 1.4 Bloco 2a: build e commit no PC | ✅ | Usuário rodou `npm run build` (sem erros de tipo, 92 módulos, JS 144 kB + 270 kB) e fez o commit `8949190` (17 arquivos). Os avisos "LF will be replaced by CRLF" do Git no Windows são inofensivos | Falta o `git push` e o teste no navegador (senha, bloqueio, link indisponível, Sair) | — |
| 19/11/2026 | 1.4 Bloco 2a testado no navegador | ✅ | Usuário confirmou: senha, erro, link indisponível e Sair funcionaram. Push feito | — | — |
| 19/11/2026 | Estimativa de término | ✅ | Usuário perguntou quanto falta (quer finalizar logo). Resposta: ~35% restante, 17 a 20 entregas, 15 a 25 h; caminho mais curto = produto usável ao fim da Fase 8 (ver 22.1) | Estimativa, não compromisso | — |
| 19/11/2026 | 1.5 a 1.7 Bloco 2b | ⚠️ | Portados do protótipo: `ProfileHeader` (usuário, publicações e stories do filtro, seguidores/seguindo compactos), `Avatar` (anel gradiente/cinza/sem anel), `ProfileTabs` (Publicações/Reels), `MonthFilter` (‹ ›, Ver todos / Voltar ao mês atual, limite ±36 meses, estado na URL `?m=`), `PostGrid`/`GridTile` (3 colunas, 3:4, recorte `object-position`, ícones, bolinha de status, legenda, estado vazio). Novos: `hooks/useMonthFilter.ts`, `lib/{format,posts,storiesSeen}.ts`, `components/ig/*`; `ClientFeed` agora é o perfil real (recebe `slug`). Estados, textos e CSS conferidos com o protótipo | Ainda não rodado no PC. Aqui: lógica testada em Node (mês atual 8 publicações/4 stories/2 Reels; mês anterior 6/0; mês futuro vazio; todos 17/4; miniaturas; `12,4 mil`); sintaxe dos `.tsx` ok; `tsc` com tipos provisórios só acusou o `key` de lista, que vem da falta dos tipos reais. Clicar no tile e no anel ainda não faz nada (2c e 2d) | `aprove-etapa-2b.zip` |
| 19/11/2026 | 1.5 a 1.7 Bloco 2b testado | ✅ | Usuário executou o 2b no PC e relatou que "deu tudo certinho" (perfil, abas, filtro de mês, grade). 1.5, 1.6 e 1.7 passam a `[x]` | Relato do usuário, sem detalhe item a item; clicar no tile e no anel segue pendente por escopo (1.8 e 1.11) | — |
| 19/11/2026 | Plano acelerado (D30) | ⚠️ | Usuário pediu um plano paralelo mais rápido, com no máximo ~5 entregas. Lidos o `.md` (v14), o zip (docs, `src/`, migrações) e o protótipo; conferido que `.md` e protótipo do zip são idênticos aos anexos. Escrita a seção **16.0** (E1 cliente completo no Vite; E2 admin real; E3 posts e uploads reais; E4 cliente real + aprovações + caixa de entrada; E5 acabamento e go-live), com regras, estimativa e custos. Registrada a **D30 como proposta** | **Aguarda o OK do usuário**; nenhum código novo neste turno. Risco principal: entregas grandes sem `npm` aqui (ver P24) | este arquivo |
| 19/11/2026 | **E1** Cliente completo no Vite (1.8 a 1.13) | ⚠️ | Usuário aprovou o plano (D30). Criados `PostViewer`, `Caption`, `Carousel`, `ReelPlayer`, `PlayerHUD`, `StoryViewer`, `ApprovalPanel`, `ProfileSkeleton`, `ToastHost`; hooks `useVideoPlayer`, `useStoryTimer`, `useModal`, `useIsMobile`; libs `caption`, `simVideo`, `playerSource`, `theme`, `toast`; `ClientFeed` integra tudo; rota única `/c/:slug/*` para o deep link `p/:postId`; tema auto/claro/escuro no rodapé. Verificado aqui: `tsc --noEmit` sem erros e **55 testes automatizados em navegador (Chromium) sem falhas**, desktop e celular, sem erros de console | `vite build` **não** rodou aqui (o `node_modules` do zip é de Windows); teste visual só por capturas; vídeo real (`<video>`) só será exercitado na Fase 6; falta teste do usuário no PC | `aprove-E1.zip` |
| 19/11/2026 | Reconciliação e validação parcial da E1 | ⚠️ | Usuário confirmou que os arquivos da E1 estão na pasta correta. Neste ambiente, `npm run build` passou: `tsc --noEmit` e Vite 5.4.21, 122 módulos; Node v26.13.0, npm 11.20.0, Git 2.56.1. `.env.local` existe e tem URL/chave pública configuradas (valores não exibidos). `npm run dev` anunciou pronto em `127.0.0.1:5173/aprove/` | Não foi possível concluir o teste visual: o navegador CUA teve timeout ao abrir `localhost`; a tentativa HTTP local foi barrada por política de socket; o host Supabase não resolveu por DNS neste ambiente. Não é falha confirmada da aplicação. A validação manual e as quatro linhas de diagnóstico ficam a cargo do usuário. Os arquivos da E1 continuam sem commit | `docs/CONTINUIDADE_PLANO_DE_DESENVOLVIMENTO.md`; arquivos E1 já presentes na pasta |
| 19/11/2026 | Aceite da E1 e refinamentos dos stories (D31) | ✅ | Usuário confirmou que a E1 estava correta e considerou o fluxo validado. No StoryViewer, o painel de aprovação desktop passou a translúcido e desfocado (comentário sem caixa opaca); setas menores com chevrons centralizados e discretos; clique fora fecha; X usa traço forte | O usuário ainda poderá pedir ajuste visual depois de ver o patch; build final passou | `src/components/ig/StoryViewer.tsx`, `src/components/ig/ApprovalPanel.tsx`, `src/components/ig/icons.tsx`, `src/index.css` |
| 19/11/2026 | **E2 · Admin real (Fase 5, 5.1–5.6)** | ⚠️ | Entraram login Supabase com `signInWithPassword`, `AdminGuard` consultando `is_admin()`, dashboard com busca/filtros/contadores, formulário real de cliente, slug único tratado (`23505`), corte circular do avatar e upload ao Storage, senha bcrypt por `admin_set_client_password`, revogar/destravar, confirmação para publicar, arquivar/excluir e remover avatar/mídias, verificação real `client_gate`, `noindex` e CSP de produção. A raiz agora é o login; diagnóstico foi preservado em `/#/diagnostico`. `npm run build` passou: Vite 5.4.21, 129 módulos. Conferido no `dist/index.html`: noindex, CSP, host Supabase configurado, `wss:` e favicon com `/aprove/` | Não foi possível autenticar/CRUD contra o Supabase neste ambiente (restrição de rede/DNS). O usuário precisa seguir o roteiro E2; o fluxo público do cliente permanece no `MockProvider` até E4 | `src/components/admin/`, `src/pages/admin/`, `src/providers/admin/`, `src/App.tsx`, `src/components/ig/`, `src/index.css`, `vite.config.ts`, `index.html`, este arquivo |
| 19/11/2026 | Esclarecimento sobre credenciais | ✅ | Conferido em `AdminLogin.tsx`: `signInWithPassword`; o acesso ainda valida `is_admin()`. Registrado que é a conta real de Supabase Auth associada a `public.admins`; `demo1234` é só do cliente fictício Studio Aurora no `MockProvider` | — | `src/pages/admin/AdminLogin.tsx`, `src/providers/mock/seed.ts`, este arquivo |
| 19/11/2026 | Patch v20: link público de cliente real | ⚠️ | Usuário relatou que um link recém-copiado para cliente publicado mostrava “Este link não está disponível”. Causa localizada: `ClientEntry` usava o `MockProvider`, cujo seed não contém clientes reais. Implementado `SupabaseClientProvider` com gate, login, feed, logout e aprovação via RPC; o token real usa chave `supabase:cli_token:<slug>` separada da chave mock. As rotas de demonstração continuam mock. Roteiro manual adicionado abaixo do roteiro E2; aguardando teste do usuário (sem build/teste executado nesta correção) | O feed pode ficar vazio até a E3 criar posts reais. A validação real depende do PC e do Supabase do usuário | `src/providers/supabase/SupabaseClientProvider.ts`, `src/pages/client/ClientEntry.tsx`, `src/pages/client/ClientFeed.tsx`, `src/providers/mock/seed.ts`, `src/providers/types.ts`, `src/providers/index.ts`, este arquivo |
| 19/11/2026 | Validação manual do patch v20 | ✅ | Usuário informou que todas as verificações passaram: build, gate do cliente real, senha incorreta/correta, perfil, sessão após atualizar, logout e link indisponível quando arquivado. P27 fechado; próxima ação é commit/push para `main`, deploy automático pelo GitHub Pages e checagem do link em produção | O feed sem posts é esperado até a E3. P26 continua aberto para filtros/contadores, avatar, revogar/destravar e exclusão do admin | roteiro “Patch v20” na seção 16; este arquivo |
| 19/11/2026 | Commit/push E1+E2+patch v20 | ✅ | Usuário concluiu o commit `4f5f371` (`Integra clientes reais ao Supabase`) e o push; `git status` confirmou `main...origin/main` sem alterações pendentes. Push deve acionar o workflow de deploy do GitHub Pages | Ainda falta conferir o workflow verde e testar o link de cliente no site publicado; não foi confirmado que o deploy terminou | commit `4f5f371`, GitHub Actions |
|  |  |  |  |  |  |

| 19/11/2026 | E3 · Posts, uploads e workspace | ⚠️ | Criados `lib/media.ts` e `lib/storage.ts` (simples + TUS), provider Supabase de posts, editor dos quatro tipos com prévia, crop/frame de capa, reordenação, workspace Feed/Publicações/Configurações, filtros, visibilidade, exclusão, histórico/reenvio de revisão; PostViewer e StoryViewer têm `adminPreview`; corrigidos estado antigo do editor, miniatura de carrossel com vídeo e limpeza de mídia nova no salvamento/cancelamento. Roteiro manual E3 incluído na seção 16 | **Não** foram executados `npm run build`, testes, navegador nem chamadas ao Supabase neste turno, conforme preferência do usuário; validar no PC antes de commit/push. P28 aberto; D34 registra TUS manual; duplicação segue E5 | `src/lib/media.ts`, `src/lib/storage.ts`, `src/providers/admin/SupabasePostProvider.ts`, `src/components/admin/`, `src/pages/admin/ClientWorkspacePage.tsx`, `src/pages/admin/PostEditorPage.tsx`, `src/App.tsx`, `src/components/ig/`, `src/lib/posts.ts`, este arquivo |

| 19/11/2026 | Build E3 e patch E3.1 | ⚠️ | Primeiro `npm run build` do usuário mostrou dois TS2345 em `PostEditorPage.tsx`: o valor inicial `IG.STORY_DEFAULT_SECONDS` fez `useState` inferir o tipo literal `5`, mas o banco e o slider usam números entre 1 e 15. Alterado para `useState<number>(...)` | O build ainda precisa ser repetido pelo usuário; nenhum erro de integração/runtime foi reportado ainda | `src/pages/admin/PostEditorPage.tsx`, este arquivo |
| 19/11/2026 | Aceite da E3 e autorização de deploy/E4 | ✅ | Usuário informou que está tudo certo após a correção E3.1 e autorizou seguir com deploy e E4. O build corrigido e os fluxos E3 passam a ser aceitos; commit `f750615` enviado com sucesso para `origin/main`, acionando GitHub Pages | O workflow foi acionado, mas seu status não foi confirmado: `gh` não está instalado; GitHub web retornou cache miss e o Computer Use encerrou por não reconhecer a URL atual com confiança. Isso não confirma falha do deploy | commit `f750615`; próximo trabalho: confirmar Pages e iniciar E4 |
| 19/11/2026 | Aceite e deploy E4; início da E5 | ✅ | Usuário confirmou que a E4 está certinha e autorizou o deploy e seguir para a última entrega. Commit `65ed136` (inbox/Realtime, marcar como lida, métricas, atalhos, provider admin e continuidade) enviado para `origin/main`; o push concluiu e acionou o Pages. E5 iniciada conforme D30 | Não foi possível confirmar o status final do workflow; `gh` não está instalado e a página Actions retornou cache miss. Escrita inicial no índice Git foi bloqueada (`.git/index.lock`) pelas permissões do workspace e concluída usando elevação autorizada | `65ed136`; E4 files; este arquivo |
| 19/11/2026 | E5 · acabamento, duplicar e ação em lote | ⚠️ | Implementados duplicação de posts com cópia independente de capa/mídias/poster e novos IDs; cópia fica oculta e pendente. Implementada seleção de rascunhos e atualização em lote com confirmação. Ajustados nomes acessíveis, cores de contraste, alvos de toque e imagens lazy. Guia Supabase atualizado para `007`, Publishable key e Windows; backup mensal/trimestral documentado; roteiro E5 com 16 verificações entregue. `git diff --check` passou; busca rastreada não encontrou Secret key/JWT e o código-fonte não usa `dangerouslySetInnerHTML`, `innerHTML` ou `eval` | **Não** foram executados build, Lighthouse, npm audit, teste de navegador, chamadas ao Supabase nem validação cross-browser, conforme preferência do usuário; build/aceite E5 pendentes. P16 resolvido; P31 aberto | `SupabasePostProvider.ts`, `ClientWorkspacePage.tsx`, componentes `ig/` e `ReviewInbox.tsx`, `AdminDashboard.tsx`, `PASSO_A_PASSO_FASES_3_E_4.md`, este arquivo |
| 19/11/2026 | Build e tentativa de validação visual E5/E4 | ⚠️ | `npm run build` passou (`tsc --noEmit`, Vite 5.4.21, 139 módulos). O site publicado abriu no Chrome e renderizou o painel admin com uma sessão que já estava ativa; nenhuma ação de escrita foi feita. `npm run preview -- --host 127.0.0.1` iniciou | Chrome local retornou `ERR_CONNECTION_TIMED_OUT`; `Invoke-WebRequest` foi bloqueado/expirou no loopback. A automação encerrou a tentativa de abrir GitHub Actions por não conseguir confirmar a URL atual. Não foi possível exercitar duplicação/lote E5 no browser, confirmar workflow E4, rodar Lighthouse, audit ou QA cross-browser. P30/P31 seguem pendentes, com build resolvido | `package.json`; este arquivo |

### 22.3 O que deu certo (padrões a repetir)
| Data | Contexto | O que funcionou | Por que funcionou |
|---|---|---|---|
| 18/11/2026 | Protótipo | Dados fictícios gerados em código (SVG com gradiente) e estado em memória | Dispensa arquivos externos e permite testar todos os tipos de post sem backend |
| 18/11/2026 | Protótipo | Player com HUD escrito contra uma interface mínima (`currentTime`, `duration`, `paused`, `volume`, `muted`, `play`, `pause`) | O mesmo HUD controla o vídeo simulado e um `<video>` real escolhido pelo usuário |
| 18/11/2026 | Admin | Estado em `localStorage` + imagens redimensionadas no navegador | Mesmo dado para admin e cliente em abas diferentes, sem backend, e cabe na cota |
| 19/11/2026 | Duplicação E5 | Criar registro novo oculto/pendente e IDs de mídia próprios; copiar capa, arquivo e poster para caminhos exclusivos; remover cópias parciais se o salvamento falhar | Mantém o original independente e evita expor uma publicação duplicada antes da revisão |
| 19/11/2026 | Ação em lote E5 | Atualizar visibilidade em uma única operação filtrada por `client_id` e IDs selecionados; pedir confirmação antes de publicar rascunhos | Limita a alteração ao cliente aberto e dá ao usuário chance de cancelar |
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
| 19/11/2026 | E1 no Windows | `npm run build` executado na pasta do projeto (TypeScript + Vite); o roteiro manual fica separado por fluxo do cliente | Distingue um build bem-sucedido do aceite visual/Supabase, que depende do navegador e da rede do usuário |
| 19/11/2026 | Fase 5 / admin real | Conferir os GRANTs e RPCs existentes (`is_admin`, `admin_client_counters`, `admin_set_client_password`, `client_gate`) antes de ligar o formulário ao banco | Reduz a chance de criar uma API paralela ou expor as tabelas sensíveis `admins`/`client_credentials` |
| 19/11/2026 | Provider testado fora do navegador | Rodar o `MockProvider` em Node com `tsx` e um `localStorage` simulado | Valida a lógica (bloqueio, sessão, rascunho oculto) sem precisar do React nem do PC do usuário |
| 19/11/2026 | Alinhar com o que o usuário aprovou | Comparar o CSS e os textos do protótipo antes de entregar a tela portada | Evita entregar uma tela "parecida" que muda o que o usuário já validou |
| 19/11/2026 | Integração incremental do link real | Reutilizar os contratos RPC já existentes e injetar o provider selecionado na tela de cliente | Gate, feed e aprovação podem mudar para dados reais sem duplicar as telas da E1; os slugs de demonstração continuam independentes. O usuário confirmou o gate/senha/sessão em 19/11 |
| 19/11/2026 | Upload E3 | Usar upload simples para arquivos pequenos e TUS para arquivos maiores que 6 MB; manter paths enviados no editor até salvar/cancelar | Barra de progresso e retomada sem dependência nova; a validação de rede real ainda precisa ser feita pelo usuário |
| 19/11/2026 | Workspace E3 | Reutilizar `ProfileHeader`, `PostGrid`, `PostViewer` e `StoryViewer` em `adminPreview`, ligando-os ao provider real de posts | Evita manter uma tela de visualização diferente para o admin e para o cliente; preview não envia avaliações nem marca stories como vistos |
| 19/11/2026 | E4 · Realtime e métricas | Reutilizar a tabela `reviews`/publication Realtime e os contadores RPC existentes; agregar métricas a partir do histórico já carregado por post | Evita migração nova; mantém a inbox isolada por cliente e as definições de D21 explícitas e conferíveis |
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
| 19/11/2026 | Validação manual da E1 neste ambiente | Abrir `localhost:5173/aprove/` no navegador automatizado e consultar o Supabase configurado | CUA: `ERR_CONNECTION_TIMED_OUT`; acesso HTTP local: socket bloqueado por permissões; chamadas Supabase: host não resolvido por DNS | Restrições de rede/socket do ambiente do agente; sem evidência de bug do projeto | O usuário confirmou depois que a E1 estava correta; aceite registrado. Para E2, entregar roteiro para execução na máquina do usuário | resolvido pelo aceite do usuário |
| 19/11/2026 | Build E2 (tentativa inicial) | Referenciar `slugSuffix.current` ao montar o slug automático | TypeScript: `Property 'current' does not exist on type 'string'` | `slugSuffix` foi criado como valor imutável com `useMemo`, não como `useRef` | Usar `slugSuffix` diretamente; build seguinte passou | resolvido |
| 19/11/2026 | Link público após E2 | Copiar e abrir o link de um cliente real publicado | A rota mostrava “Este link não está disponível” apesar do `client_gate` indicar disponível no admin | `ClientEntry` ainda chamava somente o `MockProvider`; o seed contém apenas slugs de demonstração, então o cliente real parecia inexistente | Ligar clientes reais ao `SupabaseClientProvider` e às RPCs existentes; manter mock apenas para slugs de demonstração | resolvido (usuário validou gate, senha, sessão, logout e arquivamento em 19/11/2026) |
| 19/11/2026 | Revisão estática da E3 | O primeiro rascunho do editor ainda chamava `setVisibleAfterSave`, embora a visibilidade já viesse dos botões Salvar rascunho/Publicar | Referência a estado inexistente, detectada antes de build ou execução | Restou uma linha de carregamento da versão anterior do editor | Removida a chamada; a visibilidade continua sendo enviada pelo botão usado ao salvar. Build não executado por preferência do usuário | corrigido antes da validação manual |
|  |  |  |  |  |  |  |

| 19/11/2026 | Primeiro build E3 | `npm run build` | TS2345: `number` não podia ser atribuído a `SetStateAction<5>` nas linhas do carregamento e do slider de duração do story | TypeScript inferiu o estado a partir da constante inicial literal `5` | Tipar explicitamente o estado como `useState<number>(IG.STORY_DEFAULT_SECONDS)`; usuário repetiu o build e confirmou que está tudo certo | resolvido pela E3.1 (19/11/2026) |
| 19/11/2026 | Confirmar workflow do deploy E3 | Abrir o GitHub Actions após o push | `gh` CLI não está instalado; a página GitHub Actions não carregou via ferramenta web; Computer Use foi interrompido por não determinar a URL ativa com confiança | Limitação de acesso/verificação deste turno; o push para `origin/main` foi bem-sucedido e o deploy foi acionado | Tentar confirmar Actions quando a interface estiver acessível; não tratar o workflow como falho sem resultado | pendente |

| 19/11/2026 | Git E4 no workspace | `git add` no sandbox padrão, depois commit/push | `fatal: Unable to create .../.git/index.lock: Permission denied` | `.git` tem permissão de leitura no sandbox gerenciado, embora a pasta do projeto permita escrita; Git precisa gravar o índice e os objetos do commit | Usar `git` com elevação autorizada pelo usuário para staging/commit/push; commit `65ed136` e push terminaram sem erro | resolvido (19/11/2026) |
| 19/11/2026 | Conferência do workflow E4 | `gh run list` e abertura da página Actions | `gh` não está instalado; a busca web recebeu `Cache miss` ao carregar GitHub Actions | Não há leitor de Actions/API conectado neste ambiente e o cache da web não forneceu a página | Manter P30 aberto; usuário pode conferir Actions no GitHub e informar o status, sem presumir deploy verde | pendente |
| 19/11/2026 | Atualização do guia Supabase | Primeira tentativa de substituir o trecho inteiro do comando API | O contexto do comando tinha diferenças de barras/linhas e o patch foi rejeitado sem alterar o arquivo | A forma antiga era um bloco bash e não batia com o conteúdo real | Aplicar alterações em trechos menores; atualização do guia concluída | resolvido (19/11/2026) |

### 22.5 Problemas conhecidos em aberto
| # | Descrição | Impacto | Fase afetada | Status (aberto/em validação/resolvido) | Observações |
|---|---|---|---|---|---|
| P1 | Vídeos enviados no admin não persistiam após recarregar (limitação do protótipo) | Baixo (esperado) | 2 | resolvido (19/11/2026) | E3 grava vídeos reais no Storage e mantém metadados no Supabase; usuário validou os fluxos da E3 |
| P2 | Stories no protótipo só têm imagem (5 s); story em vídeo ainda não foi prototipado | Médio | 1 | resolvido (18/11/2026) | Story em vídeo no HTML (barra segue o vídeo, pausa, som, avança no fim). Refazer no Vite (11.9) |
| P3 | Vídeo do Reels no protótipo era simulado; áudio/volume só eram reais com "Testar com meu vídeo" | Baixo | 1 | resolvido (19/11/2026) | E3 integra `<video>` real ao Reels; usuário aceitou upload e reprodução real |
| P4 | Tela de senha (1.4) no protótipo em arquivo único | Baixo | 1 | resolvido (18/11/2026) | Refazer no projeto Vite com o `MockProvider` |
| P5 | Usuário só testou o celular; falta validar o desktop (modal em 2 colunas) | Médio | 1 | aberto | Pedir feedback do desktop |
| P6 | Cota do `localStorage` (cerca de 5 MB): muitas imagens grandes podem estourar | Baixo | 2 | resolvido (19/11/2026) | E3 envia mídias para o Supabase Storage, em vez de persistir arquivos grandes no `localStorage`; usuário aceitou a E3 |
| P7 | Admin sem login real: a sessão fica só na aba (`sessionStorage`) | Baixo (esperado) | 2 | resolvido (19/11/2026) | E2 usa Supabase Auth persistente e `AdminGuard` via `is_admin()` |
| P8 | Avatar sem recorte circular (só reduz a 300px) | Baixo | 2 | resolvido (18/11/2026) | Modal com arrastar e zoom, saída 300x300 |
| P9 | Aba Feed do workspace era grade diferente do feed do cliente | Médio | 2 | resolvido (19/11/2026) | E3 usa os componentes do cliente em `adminPreview` no workspace Vite |
| P10 | Carrossel reordena por botões ‹ ›, sem arrastar (dnd-kit) | Baixo | 2 | resolvido (19/11/2026) | HTML já usava pointer events; E3 também implementa arrastar com pointer events no editor Vite, sem adicionar `dnd-kit` |
| P11 | Admin e cliente ainda não testados em celular real e no desktop pelo usuário | Médio | 1-2 | resolvido (19/11/2026) | Usuário confirmou a validação final da E5 e disse que está tudo certo |
| P12 | O backup exportado contém as senhas dos clientes em texto (só no protótipo) | Baixo | 2 | aberto | Guardar o arquivo com cuidado; no Supabase só existe hash (D4) |
| P13 | Definições das métricas (D21) escolhidas sem confirmação do usuário | Baixo | 2 | aberto | Pedir validação |
| P14 | SQL validado só em Postgres local com stubs, não no Supabase real | Médio | 4 | resolvido (18/11/2026) | `security_checks.sql` rodado no Supabase real: 39 PASS após a `007`. A diferença esperada apareceu (GRANT ao `authenticated`) |
| P15 | Cadastro público (*Allow new users to sign up*) não confirmado como desligado | Alto (segurança) | 3 | resolvido (18/11/2026) | Desligado pelo usuário (D27, 3.7) |
| P16 | `docs/PASSO_A_PASSO_FASES_3_E_4.md` estava sem a `007`, com comandos bash e painel de quotas incompleto | Baixo | 3-4 | resolvido (19/11/2026) | Tabela inclui 007; guia usa Project Settings → API Keys/Publishable key e comando `curl.exe` de uma linha; separa consumo `Usage` das quotas totais em Plans & Billing |
| P17 | Quotas totais do plano Free (banco, Storage, egress) não anotadas | Médio | 3, 6 | resolvido por aceite E5 (19/11/2026) | Usuário confirmou encerramento da E5; números individuais não foram enviados nesta conversa |
| P18 | Node LTS, Git, repositório `aprove` e Pages (*GitHub Actions*) | Médio | 3, 5 | resolvido (19/11/2026) | Node/Git/repo conferidos; Pages em GitHub Actions ativado; workflow de deploy ficou verde e o site abriu com as quatro verificações OK, segundo o usuário |
| P19 | Confirmar que o workflow agendado `keepalive.yml` executa no GitHub Actions | Médio | 5 | aberto | O arquivo existe, chama `ping()` a cada 3 dias e tem `workflow_dispatch`; ainda falta observar uma execução. Repositório público pode desativar workflows após 60 dias sem atividade |
| P20 | Código da Etapa 1: `npm install`, `npm run dev` (4 OK) e `npm run build` (sem erros, 19/11/2026) funcionaram no PC do usuário | Baixo | 5 | resolvido (19/11/2026) | Parte B concluída: secrets, Pages, push e deploy publicados; workflow verde informado pelo usuário |
| P21 | Versões das dependências em faixas `^` sem consulta ao npm | Baixo | 5 | parcial | Usuário no Windows: Node v26.13.0, npm 11.20.0, Git 2.56.1 (18/11/2026), compatíveis com Vite 5 e Tailwind 3; o workflow usa Node 22 (sem impacto). O `package-lock.json` gerado no primeiro `npm install` fixa as versões e deve ir ao Git |
| P22 | `npm install` mostrou: **4 vulnerabilities (3 moderate, 1 high)** e o aviso do npm 11 *install-scripts* (esbuild 0.21.5 com postinstall não coberto por `allowScripts`). Nada quebrou. **Não** usar `npm audit fix --force` (sobe versões maiores e quebra o projeto) | Baixo | 5 | resolvido por aceite E5 (19/11/2026) | Usuário confirmou encerramento da E5; resumo individual do `npm audit` não foi enviado; manter as versões travadas e não usar `--force` |
| P23 | Bloco 2a sem teste no PC: os `.tsx` não foram checados com os tipos reais do React/Router | Baixo | 2 | resolvido (19/11/2026) | `npm run build` passou e o 2a funcionou no navegador. Vale para cada bloco: o build no PC é o teste de tipos real |
| P24 | Plano acelerado (D30): entregas maiores aumentam a chance de erro de tipo ou integração só aparecer durante a validação manual | Médio | 2-10 | aberto (risco) | E4 foi aceita; executar o build e roteiro E5 no PC antes do deploy final |
| P25 | Aceite manual da E1 aguardava teste no computador do usuário | Médio | 1 | resolvido (19/11/2026) | Usuário confirmou que a E1 estava correta; refinamentos visuais desktop de stories foram aplicados em D31 |
| P26 | Validação item a item de alguns fluxos administrativos da E2 não foi registrada | Médio | 5 | aberto | Usuário informou que está tudo funcionando; manter como lembrete porque filtros/contadores, avatar, revogar/destravar e exclusão não foram relatados individualmente. Não bloqueia E3 |
| P27 | Link público de cliente real mostrava indisponível até a integração do provider Supabase | Alto | 7-8 | resolvido (19/11/2026) | Causa registrada na 22.4. Patch v20 usa as RPCs existentes; o usuário validou gate, senha, sessão após atualizar, logout e estado arquivado. Feed sem posts é esperado até a E3 |
| P28 | Build e validação real da E3 | Alto | 6 | resolvido (19/11/2026) | Primeiro build apontou TS2345 em `storySeconds`; E3.1 tipou o estado como `number`. O usuário informou que o build seguinte e a validação da entrega passaram |
| P29 | Build e validação manual da E4 (Realtime, aprovação real, marcar como lida, métricas, CSP/rotas e bloqueio por tentativas) | Alto | 7-8 | resolvido (19/11/2026) | Usuário confirmou “tá tudo certinho” e autorizou o deploy E4 e início da E5 |
| P30 | Status do workflow GitHub Pages após deploy E5 (`d75646e`) | Médio | 5 | em validação | Commit e push de E5 concluídos; workflow foi acionado. Web Actions retornou cache miss e URL Pages não ficou acessível pela ferramenta web; usuário relata que está no ar, falta observar confirmação direta do workflow/versão |
| P31 | Build, testes manuais, Lighthouse, segurança e aceite E5 | Alto | 9-10 | resolvido por confirmação do usuário (19/11/2026) | Usuário disse que a E5 deu certo e autorizou o deploy; `npm run build` também passou (`139 módulos`) |

### 22.6 Histórico de mudanças do plano
| Versão | Data | Mudança | Motivo |
|---|---|---|---|
| v1 | 18/11/2026 | Plano inicial (Supabase primeiro) | — |
| v3 | 18/11/2026 | Adicionada a seção 0.5 (trava anti-esquecimento) | Diário foi esquecido uma vez; usuário pediu orientação para nunca mais passar batido |
| v2 | 18/11/2026 | Fases reordenadas: protótipo visual → admin sobre protótipo → infraestrutura/integração; adicionada camada de providers (10.0); documento passa a ser vivo (0.2, seção 22) | Usuário quer ver a interface antes de investir no backend e manter registro do que deu certo/errado |
| v4 | 18/11/2026 | Admin completo no protótipo HTML (Fase 2 em `[~]`); decisões D15 a D17; registro retroativo do admin básico | Sessão anterior terminou no meio; usuário pediu seguir pelo HTML e registrar tudo |
| v16 | 19/11/2026 | **D30 aprovado**; **E1 entregue** (1.8 a 1.13 em `[~]`, 1.14 cancelado); detalhes de comportamento em 11.5 a 11.10 seguidos, com os desvios de 22.7 | Usuário disse "pode" ao plano acelerado |
| v17 | 19/11/2026 | Confirmada a E1 já extraída na pasta do projeto; build passou neste ambiente; adicionado roteiro numerado para teste manual do usuário; aceite permanece pendente por bloqueio local/Supabase no ambiente do agente | Usuário esclareceu que fará as validações e pediu uma lista de como checar |
| v18 | 19/11/2026 | E1 validada pelo usuário; refinamento de stories (D31); E2 Auth/dashboard/formulário real entregues; CSP de produção gerada; roteiro E2; build passou e validação remota do Supabase pendente | Usuário pediu os ajustes finais dos stories e autorizou seguir para a próxima parte |
| v19 | 19/11/2026 | Esclarecido que o login admin usa Supabase Auth e que `demo1234` pertence apenas ao cliente fictício; detalhe registrado em D32, seção 12.2, roteiro E2 e Diário | Usuário perguntou se o login ainda era fictício |
| v20 | 19/11/2026 | Corrigido o fluxo do link público real com `SupabaseClientProvider` (gate, login, feed, logout e envio de aprovação); preservadas as rotas mock de demonstração; adicionado roteiro de validação e aberto P27 até aceite manual | Usuário testou o link de cliente publicado e encontrou a tela de indisponível |
| v21 | 19/11/2026 | Usuário validou o patch v20: link público, senha, sessão, logout e indisponibilidade do cliente arquivado. P27 fechado; próximo passo atualizado para commit/push e deploy automático antes de iniciar E3; P26 permanece aberto para os itens restantes do admin | Usuário informou que todas as validações do link passaram e perguntou se o próximo passo é deploy |
| v22 | 19/11/2026 | Commit `4f5f371` com E1+E2+patch v20 enviado para `origin/main`; working tree limpo. Próximo passo: confirmar GitHub Actions verde e link público atualizado antes da E3 | Usuário informou “Foi”; Git confirmou branch sincronizada com `origin/main` |
| v23 | 19/11/2026 | E3 implementada no workspace: upload simples/TUS, processamento de imagens/vídeos, provider Supabase de posts, editor dos quatro tipos, Feed adminPreview, filtros/visibilidade/exclusão e reenvio de revisão; roteiro manual E3 adicionado; P9/P10 resolvidos no Vite, P28 aberto; estado obsoleto removido e miniatura de carrossel com vídeo corrigida | Usuário informou que os fluxos existentes estão funcionando e autorizou iniciar E3; pediu que as validações sejam feitas por ele no computador |
| v24 | 19/11/2026 | Corrigido o erro TS2345 do primeiro build E3: o estado `storySeconds` passa a ser `number`, compatível com `post.story_seconds` e o slider de 1–15 s. P28 atualizado; aguardando novo `npm run build` do usuário | Usuário enviou os dois erros de tipo da primeira validação E3 |
| v25 | 19/11/2026 | Usuário confirmou E3 funcionando após E3.1 e autorizou deploy seguido da E4. Fase 6 e critérios E3 aceitos; P1/P3/P6/P28 resolvidos; 7.1 e 8.1 real validados. Próximo passo: commit/push do E3 e confirmação do Pages; depois E4 | Usuário informou “Tudo certo, podemos seguir com o deploy e ir para E4” |
| v26 | 19/11/2026 | Commit `f750615` da E3 enviado com sucesso para `origin/main`; deploy automático acionado. Status do GitHub Actions ainda não foi confirmado por limitação da CLI/web/Computer Use. E4 está autorizada e é a próxima implementação | Push concluído; tentativa de abrir Actions pelo Computer Use foi interrompida porque a ferramenta não reconheceu a URL ativa com confiança |
| v27 | 19/11/2026 | E4 implementada no workspace para validação: inbox por cliente com Realtime e marcar como lida; métricas D21; atalho de retornos no dashboard; status 7.2–7.4 e 8.2–8.3 seguem em validação manual. Adicionado roteiro numerado E4; D35 registra decisão de inbox contextual | O usuário esclareceu que fará as validações no próprio computador; build e acesso real ao Supabase não foram executados nesta rodada |
| v28 | 19/11/2026 | Usuário aceitou a E4 e autorizou o deploy; fases 7 e 8 marcadas como aceitas. E5 autorizada como última entrega do plano acelerado; P29 fechado | Usuário disse que está tudo certinho e quer partir para E5 |
| v29 | 19/11/2026 | Commit `65ed136` da E4 enviado com sucesso para `origin/main`, acionando o workflow do Pages; E5 iniciada. O status Actions não foi confirmado. Falha inicial no `git add` por permissão de escrita em `.git` contornada com a permissão Git autorizada | O deploy E4 foi autorizado pelo usuário; o ambiente permitiu escrever arquivos do projeto, mas exigiu elevação para escrever no índice Git |
| v30 | 19/11/2026 | Implementada E5 no workspace: cópia independente de posts/mídias e ação em lote; refinamentos de acessibilidade e lazy loading; guia Supabase e backup atualizados; roteiro com 16 validações. Build, Lighthouse, npm audit, Supabase e aceite do usuário aguardam validação; P16 resolvido, P30/P31 abertos | Usuário confirmou que E4 está certa, autorizou o deploy E4 e o início da última entrega; validações ficam a cargo do usuário |
| v31 | 19/11/2026 | Validação solicitada pelo usuário: `npm run build` passou (`tsc --noEmit`, Vite 5.4.21, 139 módulos); Chrome abriu a página publicada em `/#/admin` com sessão preexistente, sem alterar dados. `npm run preview` iniciou, mas Chrome deu `ERR_CONNECTION_TIMED_OUT` e requisição local foi bloqueada/expirou; a automação foi encerrada pela proteção de URL ao tentar abrir Actions | Não foi possível validar E5 visualmente porque seu código ainda não está publicado e o preview local não ficou acessível no browser. P30 workflow e P31 QA E5 permanecem pendentes; build está resolvido |
| v32 | 19/11/2026 | Usuário confirmou que a E5 deu certo, está tudo no ar e terminou; ao saber que o código E5 ainda não tinha sido enviado, autorizou explicitamente o deploy final. Build E5 já passou; fase 9 e aceite E5 registrados como concluídos; fase 10 aguarda push/Pages e data final de go-live | O E5 estava apenas no workspace, sem commit/push; autorização clara do usuário: fazer o deploy se ainda não tiver sido feito |
| v33 | 19/11/2026 | Commit `d75646e` da E5 criado e enviado com sucesso a `origin/main`; push acionou GitHub Pages. Build passou e usuário já tinha confirmado aceite E5. Atualizados estados para fase 10 aguardar confirmação final do workflow/URL e registro de go-live | Usuário apontou corretamente que E5 ainda não tinha deploy e autorizou publicá-la |
| v15 | 19/11/2026 | Bloco 2b concluído (1.5 a 1.7 em `[x]`); **plano acelerado em 5 entregas proposto** (seção 16.0, D30, P24); admin sem etapa mock; duplicar/lote para a E5; sem `dnd-kit` | Usuário quer terminar mais rápido, com no máximo ~5 entregas |
| v14 | 19/11/2026 | Bloco 2a concluído; bloco 2b entregue (1.5 a 1.7 em `[~]`); 1.3 e 1.4 `[x]`; estimativa de término; P23 resolvido | Usuário confirmou o 2a e pediu para seguir |
| v13 | 19/11/2026 | Etapa 1 concluída; Etapa 2 em blocos 2a a 2e (D29); bloco 2a entregue (1.2 a 1.4 em `[~]`); P23 | Usuário deixou a ordem a critério do plano; telas portadas do protótipo, não redesenhadas |
| v12 | 18/11/2026 | Etapa 1 rodando no PC; versões registradas; P20 parcial, P22 novo; prompt de continuação | Usuário testou a Parte A e a conversa chegou perto do limite |
| v11 | 18/11/2026 | Fase 5 em etapas (D28); Etapa 1 do esqueleto entregue (1.1, 5.1 e 5.7 parciais); P20 e P21 | Usuário escolheu "Vite em etapas" |
| v10 | 18/11/2026 | Cadastro público desligado (D27, P15 resolvido), Node e Git instalados, repo `aprove` criado, decisão de não publicar o protótipo (D26); registro completo da `007`; E11 | Usuário confirmou as pendências da Fase 3 |
| v9 | 18/11/2026 | Fase 4 concluída no Supabase real; nova migração `007` (D24, 6.8); repositório `aprove` (D23); limite de 50 MB confirmado (D25); lições E7 a E10; pendências P15 a P19 | Usuário rodou as Fases 3 e 4 e trouxe os resultados e erros |
| v8 | 18/11/2026 | Fases 3 e 4 preparadas: `supabase/migrations/`, `supabase/tests/security_checks.sql` e `docs/PASSO_A_PASSO_FASES_3_E_4.md` | Usuário escolheu preparar o Supabase |
| v7 | 18/11/2026 | Login do admin na raiz, exportar/importar, métricas, contagens do perfil; decisões D19 a D22; RF-A9 a A11 e RF-C9 | Pedido do usuário |
| v6 | 18/11/2026 | Story em vídeo, recorte do avatar e arrastar no carrossel (P2, P8, P10 resolvidos no HTML) | Pendências da Fase 1-2 escolhidas pelo usuário como foco da sessão |
| v5 | 18/11/2026 | Decisão D18: publicar sempre pede senha; seletor de status no canto do card no mobile | Pedido do usuário após testar o protótipo |

### 22.7 Desvios da E1 em relação às seções 11.5 a 11.10 (19/11/2026)
- **Teclado:** `Shift+←/→` troca de publicação; `←/→` sozinhos agem dentro da mídia (slides do carrossel, ±5 s no Reels); na imagem única, `←/→` também trocam de publicação.
- **Celular:** o `ApprovalPanel` rola junto com a página (não é barra fixa no rodapé); nos stories ele é a barra inferior. Barra fixa fica como refinamento da E5, se o usuário sentir falta.
- **Player:** entregues play/pause, progresso arrastável, tempo, mudo, volume, atalhos, autoplay mudo e preferências em `player_prefs`. **Ficam de fora** (opcionais): velocidade, tela cheia, buffer e dica de tempo ao passar o mouse.
- **Vídeo real:** `ReelPlayer` já usa `<video>` quando o post tem arquivo; sem arquivo usa o vídeo simulado (canvas). O caminho do `<video>` só será exercitado na Fase 6.
- **"Alterar decisão":** só reabre os botões; não muda nada no banco até haver um novo envio (o protótipo mudava o status para pendente na hora).
- **Story:** toque curto (< 250 ms) navega; segurar pausa e **não** navega ao soltar (o protótipo navegava).
- **Deep link:** abrir um post empurra uma entrada no histórico (Voltar fecha); trocar de post usa `replace`. Id inexistente mostra "Publicação não encontrada" e volta ao perfil.
- **Tema:** botão "Tema: automático/claro/escuro" no rodapé, guardado em `localStorage` (`theme`).
