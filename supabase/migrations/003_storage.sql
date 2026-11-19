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
