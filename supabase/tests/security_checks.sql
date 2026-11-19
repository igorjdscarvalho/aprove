-- Testes de segurança do banco (itens de banco da seção 17.2 do plano).
-- Como usar: cole TUDO no SQL Editor do Supabase e execute (roda como o dono do banco).
-- O script cria dados de teste (slugs "zz-sectest-*" e e-mails "sectest-*"), troca de papel
-- (anon / authenticated) para simular cada situação, mostra PASS/FAIL por item e apaga os dados.
-- Pré-requisito: migrações 001 a 006 já executadas. Pode ser repetido quantas vezes quiser.

do $$
declare
  r text := '';
  pw text := 'senha-teste-123';
  a uuid; b uuid; c uuid; d uuid;
  adm uuid := gen_random_uuid(); usr uuid := gen_random_uuid();
  pa uuid; pah uuid; pb uuid;
  tka text; tkb text; tka2 text;
  j jsonb; j2 jsonb; j3 jsonb;
  cnt bigint; t text; i int;
begin
  delete from public.clients where slug like 'zz-sectest-%';
  delete from auth.users where email like 'sectest-%';

  begin
    -- ===== dados de teste (como dono) =====
    insert into public.clients(slug,name,username,status) values ('zz-sectest-a','Teste A','teste.a','published') returning id into a;
    insert into public.clients(slug,name,username,status) values ('zz-sectest-b','Teste B','teste.b','published') returning id into b;
    insert into public.clients(slug,name,username,status) values ('zz-sectest-c','Teste C','teste.c','unpublished') returning id into c;
    insert into public.clients(slug,name,username,status) values ('zz-sectest-d','Teste D','teste.d','archived') returning id into d;
    insert into public.client_credentials(client_id,password_hash)
      select id, extensions.crypt(pw, extensions.gen_salt('bf',4)) from public.clients where slug like 'zz-sectest-%';
    insert into public.posts(client_id,type,scheduled_date,is_visible) values (a,'image',current_date,true) returning id into pa;
    insert into public.posts(client_id,type,scheduled_date,is_visible) values (a,'image',current_date,false) returning id into pah;
    insert into public.posts(client_id,type,scheduled_date,is_visible) values (b,'image',current_date,true) returning id into pb;
    insert into auth.users(id,email) values (adm,'sectest-admin@example.com'),(usr,'sectest-user@example.com');
    insert into public.admins(user_id) values (adm);

    -- ===== ANÔNIMO =====
    set local role anon;

    foreach t in array array['admins','clients','client_credentials','posts','post_media','reviews','client_sessions','login_attempts'] loop
      begin
        execute format('select count(*) from public.%I', t) into cnt;
        r := r || case when cnt = 0 then 'PASS' else 'FAIL' end || ' - anon não lê ' || t || ' (linhas: ' || cnt || E')\n';
      exception when insufficient_privilege then
        r := r || 'PASS - anon sem acesso a ' || t || E'\n';
      end;
    end loop;

    foreach t in array array['public.is_admin()','public.admin_unlock_client(gen_random_uuid())','public.admin_revoke_sessions(gen_random_uuid())','public.admin_client_counters()'] loop
      begin
        execute 'select ' || case when t like '%counters%' then '* from ' else '' end || t;
        r := r || 'FAIL - anon executou ' || t || E'\n';
      exception when insufficient_privilege then
        r := r || 'PASS - anon não executa ' || t || E'\n';
      when others then
        r := r || 'FAIL - ' || t || ' erro inesperado: ' || sqlerrm || E'\n';
      end;
    end loop;
    begin
      perform public.admin_set_client_password(a, 'qualquer-senha-123');
      r := r || E'FAIL - anon executou admin_set_client_password\n';
    exception when insufficient_privilege then
      r := r || E'PASS - anon não executa admin_set_client_password\n';
    end;

    begin
      insert into storage.objects(bucket_id,name) values ('media','zz-sectest/anon.png');
      r := r || E'FAIL - anon conseguiu enviar arquivo ao bucket media\n';
    exception when insufficient_privilege then
      r := r || E'PASS - anon não envia arquivo ao bucket media\n';
    when others then
      r := r || 'FAIL - upload anon: erro inesperado ' || sqlstate || ' ' || sqlerrm || E'\n';
    end;

    -- gate idêntico para inexistente, não publicado e arquivado
    j  := public.client_gate('zz-sectest-nao-existe');
    j2 := public.client_gate('zz-sectest-c');
    j3 := public.client_gate('zz-sectest-d');
    r := r || case when j = j2 and j2 = j3 and j->>'available' = 'false' then 'PASS' else 'FAIL' end
         || E' - client_gate idêntico para inexistente, não publicado e arquivado\n';
    r := r || case when public.client_gate('zz-sectest-a')->>'available' = 'true' then 'PASS' else 'FAIL' end
         || E' - client_gate libera cliente publicado\n';

    -- login e sessões
    j := public.client_login('zz-sectest-a', 'senha-errada');
    r := r || case when j->>'error' = 'invalid_password' then 'PASS' else 'FAIL' end || E' - senha errada recusada\n';
    j := public.client_login('zz-sectest-c', pw);
    r := r || case when j->>'error' = 'unavailable' then 'PASS' else 'FAIL' end || E' - login em cliente não publicado recusado\n';
    tka := public.client_login('zz-sectest-a', pw)->>'token';
    tkb := public.client_login('zz-sectest-b', pw)->>'token';
    r := r || case when tka is not null and tkb is not null and tka <> tkb then 'PASS' else 'FAIL' end || E' - login correto devolve token\n';

    -- feed: só posts visíveis e só do próprio cliente
    j := public.client_get_feed(tka);
    r := r || case when jsonb_array_length(j->'posts') = 1
                    and (select count(*) from jsonb_array_elements(j->'posts') e where e->>'id' = pah::text or e->>'id' = pb::text) = 0
              then 'PASS' else 'FAIL' end || E' - feed do cliente A traz só o post visível dele (sem rascunho e sem post de B)\n';
    r := r || case when public.client_get_feed('token-invalido')->>'error' = 'unauthorized' then 'PASS' else 'FAIL' end || E' - feed com token inválido é negado\n';

    -- reviews
    r := r || case when public.client_submit_review(tka, pb, 'approved', '', 'x')->>'error' = 'not_found' then 'PASS' else 'FAIL' end
         || E' - token de A não envia review em post de B\n';
    r := r || case when public.client_submit_review(tka, pah, 'approved', '', 'x')->>'error' = 'not_found' then 'PASS' else 'FAIL' end
         || E' - post oculto não aceita review\n';
    r := r || case when public.client_submit_review(tka, pa, 'changes_requested', '   ', 'x')->>'error' = 'comment_required' then 'PASS' else 'FAIL' end
         || E' - pedir ajuste sem comentário é recusado\n';
    r := r || case when (public.client_submit_review(tka, pa, 'approved', '', 'Fulano')->>'ok')::boolean then 'PASS' else 'FAIL' end
         || E' - aprovar o próprio post funciona\n';
    j := public.client_get_feed(tka);
    r := r || case when j->'posts'->0->>'approval_status' = 'approved' and jsonb_array_length(j->'posts'->0->'reviews') = 1 then 'PASS' else 'FAIL' end
         || E' - status e histórico atualizados no feed\n';

    -- bloqueio após 5 senhas erradas
    for i in 1..5 loop perform public.client_login('zz-sectest-a', 'errada-' || i); end loop;
    j := public.client_login('zz-sectest-a', pw);
    r := r || case when j->>'error' = 'locked' then 'PASS' else 'FAIL' end || E' - 5 erros bloqueiam, até com a senha certa\n';

    -- ===== AUTENTICADO, mas NÃO admin =====
    reset role;
    perform set_config('request.jwt.claim.sub', usr::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', usr, 'role', 'authenticated')::text, true);
    set local role authenticated;

    select count(*) into cnt from public.clients;
    r := r || case when cnt = 0 then 'PASS' else 'FAIL' end || ' - usuário que não é admin não lê clients (linhas: ' || cnt || E')\n';
    begin
      insert into public.clients(slug,name,username) values ('zz-sectest-x','X','x');
      r := r || E'FAIL - usuário que não é admin conseguiu inserir cliente\n';
    exception when insufficient_privilege then
      r := r || E'PASS - usuário que não é admin não insere cliente\n';
    end;
    begin
      perform public.admin_set_client_password(a, 'qualquer-senha-123');
      r := r || E'FAIL - não-admin trocou senha de cliente\n';
    exception when others then
      r := r || case when sqlerrm = 'forbidden' then 'PASS' else 'FAIL' end || E' - não-admin não troca senha de cliente\n';
    end;
    begin
      insert into storage.objects(bucket_id,name) values ('media','zz-sectest/user.png');
      r := r || E'FAIL - não-admin conseguiu enviar arquivo ao bucket media\n';
    exception when insufficient_privilege then
      r := r || E'PASS - não-admin não envia arquivo ao bucket media\n';
    when others then
      r := r || 'FAIL - upload não-admin: erro inesperado ' || sqlstate || ' ' || sqlerrm || E'\n';
    end;

    -- ===== ADMIN =====
    reset role;
    perform set_config('request.jwt.claim.sub', adm::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
    set local role authenticated;

    select count(*) into cnt from public.clients where slug like 'zz-sectest-%';
    r := r || case when cnt = 4 then 'PASS' else 'FAIL' end || E' - admin lê os clientes\n';
    select count(*) into cnt from public.admin_client_counters();
    r := r || case when cnt >= 4 then 'PASS' else 'FAIL' end || E' - admin_client_counters funciona para admin\n';
    perform public.admin_unlock_client(a);

    -- ===== ANÔNIMO de novo: efeitos das ações do admin =====
    reset role;
    set local role anon;
    tka2 := public.client_login('zz-sectest-a', pw)->>'token';
    r := r || case when tka2 is not null then 'PASS' else 'FAIL' end || E' - admin destrava o login e a senha certa volta a funcionar\n';

    -- trocar senha derruba sessões
    reset role;
    set local role authenticated;
    perform public.admin_set_client_password(b, 'nova-senha-123');
    reset role;
    set local role anon;
    r := r || case when public.client_get_feed(tkb)->>'error' = 'unauthorized' then 'PASS' else 'FAIL' end || E' - trocar a senha derruba o token antigo\n';
    r := r || case when public.client_login('zz-sectest-b', pw)->>'error' = 'invalid_password' then 'PASS' else 'FAIL' end || E' - senha antiga deixa de valer\n';
    r := r || case when (public.client_login('zz-sectest-b', 'nova-senha-123')->>'ok')::boolean then 'PASS' else 'FAIL' end || E' - senha nova vale\n';

    -- despublicar derruba acesso
    reset role;
    set local role authenticated;
    update public.clients set status = 'unpublished' where id = a;
    reset role;
    set local role anon;
    r := r || case when public.client_get_feed(tka2)->>'error' = 'unauthorized' then 'PASS' else 'FAIL' end || E' - despublicar derruba o token do cliente\n';
    r := r || case when public.client_gate('zz-sectest-a')->>'available' = 'false' then 'PASS' else 'FAIL' end || E' - client_gate de cliente despublicado\n';

  exception when others then
    r := r || 'FAIL - erro inesperado no teste: ' || sqlstate || ' ' || sqlerrm || E'\n';
  end;

  -- ===== limpeza (como dono) =====
  reset role;
  delete from public.clients where slug like 'zz-sectest-%';
  delete from auth.users where email like 'sectest-%';
  perform set_config('sectest.result', r, false);
end $$;

select n as item,
       line as resultado
from regexp_split_to_table(current_setting('sectest.result'), E'\n') with ordinality as x(line, n)
where line <> ''
order by n;
