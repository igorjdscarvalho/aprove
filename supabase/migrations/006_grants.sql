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
