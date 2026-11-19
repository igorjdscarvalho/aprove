-- O Supabase não concede mais permissão de tabela ao papel `authenticated` por padrão.
-- Sem isso o admin (que é um usuário `authenticated`) não lê nem edita nada,
-- e o RLS nem chega a ser avaliado ("permission denied for table ...").
--
-- Segurança: quem decide quem entra continua sendo o RLS (002_rls_admin.sql).
-- As policies exigem is_admin(), então usuário logado que NÃO é admin continua vendo 0 linhas.
-- Não liberamos client_credentials, client_sessions, login_attempts nem admins:
-- essas tabelas só são tocadas por funções security definer.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.clients,
  public.posts,
  public.post_media,
  public.reviews
to authenticated;
