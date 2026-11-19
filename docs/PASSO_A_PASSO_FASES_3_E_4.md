# Passo a passo: Fase 3 (contas) e Fase 4 (banco no Supabase)

Este guia complementa a seção 16 do `CONTINUIDADE_PLANO_DE_DESENVOLVIMENTO.md`. Os arquivos SQL estão em `supabase/migrations/` e o teste de segurança em `supabase/tests/security_checks.sql`.

> **Regra de ouro:** a **Secret key** do Supabase (antiga `service_role`) **nunca** vai para o repositório, para o front-end nem para este chat. A **Publishable key** e a Project URL são as credenciais públicas usadas pelo front-end.

---

## Fase 3: contas e ferramentas (feito por você)

### 3.1 Projeto no Supabase
1. Entre em https://supabase.com, crie a conta e clique em **New project**.
2. Nome sugerido: `aprovacao-conteudo`.
3. **Região:** escolha a mais próxima do Brasil disponível (South America / São Paulo, se aparecer).
4. Defina a **senha do banco** e guarde no seu gerenciador de senhas. Não é a senha do admin do site.
5. Aguarde o projeto ficar pronto.

### 3.2 Anotar a URL e a chave pública
Em **Project Settings → API Keys**, anote a **Project URL** (`https://xxxx.supabase.co`) e use a chave pública **Publishable key** (`sb_publishable_...`). Não use nem compartilhe a **Secret key** (`sb_secret_...`), equivalente à antiga `service_role`; ela não deve entrar no front-end, no repositório ou no chat. Guarde URL e Publishable key apenas no `.env.local` do projeto.

### 3.3 Desligar cadastro público
Em **Authentication → Sign In / Providers**, desative **Allow new users to sign up**. Assim só você cria o login do admin.

### 3.4 Conferir os limites do plano (registrar no Diário do MD, item 3.6)
Anote o que o painel mostrar hoje. **Settings → Usage** mostra consumo atual, não as quotas totais do plano. Consulte também **Plans & Billing** para registrar o limite total de banco, Storage e egress; os nomes dos menus podem mudar.
- **Tamanho máximo por arquivo** (Storage → Settings). Define se Reels de 50 MB sobem. O limite aplicado no banco deve coincidir com `VIDEO_MAX_MB` no front. Se precisar mudar isso depois de aplicar as migrações, altere o bucket/política no Supabase ou crie uma nova migração; editar e reaplicar a `003` não atualiza o banco existente.
- **Espaço total do Storage** e do banco.
- **Egress** (tráfego de saída) e eventual limite de MAU.
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
| 7 | `007_grants_admin_tables.sql` | Permissões explícitas de leitura/escrita das tabelas para o admin autenticado |

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
No **CMD** do Windows (ou PowerShell, usando `curl.exe` para não chamar o alias `curl`), substitua o domínio e a Publishable key e rode tudo em uma linha:
```cmd
curl.exe -i "https://SEU-PROJETO.supabase.co/rest/v1/clients?select=*" -H "apikey: SUA_PUBLISHABLE_KEY" -H "Authorization: Bearer SUA_PUBLISHABLE_KEY"
```
O esperado é erro de permissão (`42501`) ou lista vazia, nunca dados de clientes. Teste também a listagem do bucket sem login: deve ser negada ou vazia. Confira em **Storage** que o bucket `media` existe e está como público.

### 4.5 O que me trazer de volta
- Resultado do teste de segurança (cole a tabela).
- Limites anotados no 3.4.
- Confirmação de que Project URL e Publishable key foram configuradas no `.env.local` (não cole valores de chaves no chat) e o nome definitivo do repositório.
- Qualquer erro de migração, com a mensagem completa.

---

## Observação sobre como isto foi verificado
As migrações `001` a `007` e `supabase/tests/security_checks.sql` foram executadas no Supabase real; os 39 itens deram PASS após a migração `007`. A conferência REST também foi feita no projeto: a consulta anônima a `clients` respondeu `42501 permission denied`, e a listagem do bucket sem autenticação veio vazia. Esses resultados ficam registrados na seção 4.5 do arquivo de continuidade.
