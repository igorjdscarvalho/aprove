# Passo a passo: Fase 3 (contas) e Fase 4 (banco no Supabase)

Este guia complementa a seção 16 do `CONTINUIDADE_PLANO_DE_DESENVOLVIMENTO.md`. Os arquivos SQL estão em `supabase/migrations/` e o teste de segurança em `supabase/tests/security_checks.sql`.

> **Regra de ouro:** a chave `service_role` do Supabase **nunca** vai para o repositório, para o front-end nem para este chat. Só a `anon key` e a `Project URL` são públicas por design.

---

## Fase 3: contas e ferramentas (feito por você)

### 3.1 Projeto no Supabase
1. Entre em https://supabase.com, crie a conta e clique em **New project**.
2. Nome sugerido: `aprovacao-conteudo`.
3. **Região:** escolha a mais próxima do Brasil disponível (South America / São Paulo, se aparecer).
4. Defina a **senha do banco** e guarde no seu gerenciador de senhas. Não é a senha do admin do site.
5. Aguarde o projeto ficar pronto.

### 3.2 Anotar a URL e a chave pública
Em **Project Settings → API**, anote:
- **Project URL** (`https://xxxx.supabase.co`)
- **anon public key**

Ignore a `service_role`. Não copie, não cole em lugar nenhum.

### 3.3 Desligar cadastro público
Em **Authentication → Sign In / Providers**, desative **Allow new users to sign up**. Assim só você cria o login do admin.

### 3.4 Conferir os limites do plano (registrar no Diário do MD, item 3.6)
Anote o que o painel mostrar hoje:
- **Tamanho máximo por arquivo** (Storage → Settings). Define se Reels de 50 MB sobem. Se o limite for menor, ajuste `file_size_limit` na migração `003` e `VIDEO_MAX_MB` no front.
- **Espaço total do Storage** e do banco.
- Se o projeto **pausa por inatividade** (o workflow `keepalive.yml` da Fase 5 evita isso).

### 3.5 GitHub e ferramentas
1. Crie o repositório (público) e defina o **nome definitivo** (ele entra no `base` do Vite).
2. Em **Settings → Pages**, escolha **Source: GitHub Actions**.
3. Instale Node LTS e Git no seu computador (só será necessário a partir da Fase 5, quando migrarmos para o Vite).

---

## Fase 4: banco de dados (feito por você, no painel do Supabase)

### 4.1 Rodar as migrações, nesta ordem
No painel, abra **SQL Editor → New query**. Para cada arquivo de `supabase/migrations/`, cole o conteúdo inteiro e clique em **Run**. Espere dar sucesso antes de passar ao próximo.

| Ordem | Arquivo | O que faz |
|---|---|---|
| 1 | `001_schema.sql` | Tabelas, tipos e gatilhos |
| 2 | `002_rls_admin.sql` | Função `is_admin()`, segurança por linha e Realtime das aprovações |
| 3 | `003_storage.sql` | Bucket `media` e políticas |
| 4 | `004_rpc_client.sql` | Funções que o cliente (sem conta) chama |
| 5 | `005_rpc_admin.sql` | Funções do admin (senha, destravar, contadores) |
| 6 | `006_grants.sql` | Permissões: o anônimo só executa o que é necessário |

Se alguma migração falhar, **pare**, copie a mensagem de erro e me envie. Não rode as seguintes.

### 4.2 Criar o admin (uma única vez)
1. **Authentication → Users → Add user → Create new user**: seu e-mail e uma senha forte; marque **Auto Confirm User**.
2. No **SQL Editor**, rode (trocando pelo seu e-mail):
   ```sql
   insert into public.admins(user_id)
   select id from auth.users where email = 'SEU_EMAIL_AQUI';
   ```
3. Confira com `select * from public.admins;`: deve aparecer 1 linha.

Esse e-mail e essa senha são os do login da tela inicial do site.

### 4.3 Rodar o teste de segurança
1. Abra `supabase/tests/security_checks.sql`, cole tudo no SQL Editor e execute.
2. O resultado é uma tabela com uma linha por verificação. **Todas devem começar com PASS.**
3. O script cria e apaga os próprios dados de teste (slugs `zz-sectest-*`). Pode rodar de novo quando quiser, por exemplo depois de cada mudança no banco.

### 4.4 Conferência manual pela API (opcional)
No terminal, com sua Project URL e anon key:
```bash
curl -s "https://SEU-PROJETO.supabase.co/rest/v1/clients?select=*" \
  -H "apikey: SUA_ANON_KEY" -H "Authorization: Bearer SUA_ANON_KEY"
```
O esperado é erro de permissão ou lista vazia, nunca dados de clientes.

Teste também a listagem do bucket sem login (deve ser negada) e confira em **Storage** que o bucket `media` existe e está como público.

### 4.5 O que me trazer de volta
- Resultado do teste de segurança (cole a tabela).
- Limites anotados no 3.4.
- A **Project URL** e a **anon key** (podem ser compartilhadas) e o nome definitivo do repositório.
- Qualquer erro de migração, com a mensagem completa.

---

## Observação sobre como isto foi verificado
As migrações e o teste de segurança foram executados em um Postgres 16 local, com stubs simples dos esquemas `auth` e `storage` e dos papéis `anon` e `authenticated`: as 6 migrações aplicaram sem erro e os 39 itens do teste deram PASS. Também confirmei que o teste **falha** quando abro uma brecha de propósito. **Isso não substitui rodar no Supabase de verdade** (passo 4.3): lá podem existir diferenças, como colunas extras em `auth.users` ou proteções do Storage.
